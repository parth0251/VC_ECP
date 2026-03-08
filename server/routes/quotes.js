const express = require('express');
const router = express.Router();
const { getClient } = require('../db');
const { v4: uuidv4 } = require('uuid');

// Helper: insert a configuration_item row
async function insertConfigItem(client, configId, optionType, optionName, price) {
    if (!optionName) return;
    await client.query(`
        INSERT INTO configuration_items (
            configuration_id, option_type, option_id, option_name, price_at_selection
        ) VALUES ($1, $2, $3, $4, $5)
    `, [configId, optionType, 0, optionName, price || 0]);
}

// POST /api/quotes
router.post('/', async (req, res) => {
    const { modelId, market, config, price, configType = 'classic' } = req.body;

    if (!modelId || !price) {
        return res.status(400).json({ error: 'modelId and price are required' });
    }

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // 1. Create a configuration record
        const configResult = await client.query(`
            INSERT INTO configurations (
                session_id, model_id, total_price, status, config_type
            ) VALUES ($1, $2, $3, 'quoted', $4)
            RETURNING id
        `, [
            uuidv4(),
            modelId,
            price,
            configType
        ]);

        const configId = configResult.rows[0].id;

        // 2. Save ALL selected configuration items
        if (config) {
            await insertConfigItem(client, configId, 'exterior', config.colorName, 0);
            await insertConfigItem(client, configId, 'engine', config.engine, 0);
            await insertConfigItem(client, configId, 'transmission', config.transmission, 0);
            await insertConfigItem(client, configId, 'trim', config.trim, 0);
            await insertConfigItem(client, configId, 'exterior_acc', config.exterior, 0);
            await insertConfigItem(client, configId, 'interior', config.interior, 0);
            await insertConfigItem(client, configId, 'wheels', config.wheels, 0);

            // Save packages (multiple items)
            if (config.packages && Array.isArray(config.packages)) {
                for (const pkgName of config.packages) {
                    await insertConfigItem(client, configId, 'package', pkgName, 0);
                }
            }

            // Save color hex for rendering
            if (config.color) {
                await insertConfigItem(client, configId, 'color_hex', config.color, 0);
            }
        }

        // 3. Create the Quote record
        const quoteNumber = 'QT-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000);

        const quoteResult = await client.query(`
            INSERT INTO quotes (
                configuration_id, quote_number, total_price, status
            ) VALUES ($1, $2, $3, 'active')
            RETURNING id, quote_number
        `, [
            configId,
            quoteNumber,
            price
        ]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Quote created successfully',
            id: quoteResult.rows[0].id,
            quoteNumber: quoteResult.rows[0].quote_number,
            configurationId: configId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating quote:', error);
        res.status(500).json({ error: 'Failed to create quote', details: error.message });
    } finally {
        client.release();
    }
});

// GET /api/quotes
router.get('/', async (req, res) => {
    const client = await getClient();
    try {
        const result = await client.query(`
            SELECT 
                q.id as quote_id, 
                q.quote_number, 
                q.total_price as quote_price, 
                q.created_at,
                c.id as config_id,
                c.status,
                c.config_type,
                m.name as model_name,
                m.image_url as model_image,
                ci.option_name as color_name
            FROM quotes q
            JOIN configurations c ON q.configuration_id = c.id
            JOIN models m ON c.model_id = m.id
            LEFT JOIN configuration_items ci ON ci.configuration_id = c.id AND ci.option_type = 'exterior'
            ORDER BY q.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ error: 'Failed to fetch quotes' });
    } finally {
        client.release();
    }
});

// GET /api/quotes/:id — Full detail for a single quote
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const client = await getClient();
    try {
        // Get quote + config + model info
        const quoteResult = await client.query(`
            SELECT 
                q.id as quote_id,
                q.quote_number,
                q.total_price as quote_price,
                q.status as quote_status,
                q.created_at,
                c.id as config_id,
                c.config_type,
                c.total_price as config_total,
                m.id as model_id,
                m.name as model_name,
                m.base_price as model_base_price,
                m.image_url as model_image
            FROM quotes q
            JOIN configurations c ON q.configuration_id = c.id
            JOIN models m ON c.model_id = m.id
            WHERE q.id = $1
        `, [id]);

        if (quoteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const quote = quoteResult.rows[0];

        // Get all configuration items for this config
        const itemsResult = await client.query(`
            SELECT option_type, option_name, price_at_selection
            FROM configuration_items
            WHERE configuration_id = $1
            ORDER BY option_type
        `, [quote.config_id]);

        // Organize items by type
        const configItems = {};
        for (const item of itemsResult.rows) {
            if (item.option_type === 'package') {
                if (!configItems.packages) configItems.packages = [];
                configItems.packages.push(item.option_name);
            } else {
                configItems[item.option_type] = item.option_name;
            }
        }

        res.json({
            ...quote,
            config_items: configItems
        });

    } catch (error) {
        console.error('Error fetching quote detail:', error);
        res.status(500).json({ error: 'Failed to fetch quote detail' });
    } finally {
        client.release();
    }
});

module.exports = router;
