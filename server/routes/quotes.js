const express = require('express');
const router = express.Router();
const { getClient } = require('../db');
const { v4: uuidv4 } = require('uuid');

// POST /api/quotes
router.post('/', async (req, res) => {
    const { modelId, market, config, price, configType = 'classic' } = req.body;

    if (!modelId || !price) {
        return res.status(400).json({ error: 'modelId and price are required' });
    }

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // 1. Create a configuration record first
        const configResult = await client.query(`
            INSERT INTO configurations (
                session_id, model_id, total_price, status, config_type
            ) VALUES ($1, $2, $3, 'quoted', $4)
            RETURNING id
        `, [
            uuidv4(), // session_id
            modelId,  // model_id
            price,    // total_price
            configType
        ]);

        const configId = configResult.rows[0].id;

        // 2. Add the custom selected items (like color) to configuration_items
        if (config && config.colorName) {
            await client.query(`
                INSERT INTO configuration_items (
                    configuration_id, option_type, option_id, option_name, price_at_selection
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                configId,
                'exterior', // option_type
                0, // option_id (custom 3D color)
                config.colorName,
                price // price at selection
            ]);
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
                m.image_url as model_image
            FROM quotes q
            JOIN configurations c ON q.configuration_id = c.id
            JOIN models m ON c.model_id = m.id
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

module.exports = router;
