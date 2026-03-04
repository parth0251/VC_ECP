const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * GET /api/catalog/:modelId
 * Returns the full options catalog for a given model:
 * engines, transmissions, trims, exterior, interior, wheels, packages.
 */
router.get('/:modelId', async (req, res, next) => {
    try {
        const { modelId } = req.params;

        // Verify model exists
        const modelResult = await query('SELECT * FROM models WHERE id = $1', [modelId]);
        if (modelResult.rowCount === 0) {
            return res.status(404).json({ error: 'Model not found' });
        }

        // Fetch all catalog data in parallel
        const [engines, transmissions, trims, exteriorOptions, interiorOptions, wheels, packages, rules] =
            await Promise.all([
                query(`
          SELECT e.* FROM engines e
          INNER JOIN model_engines me ON me.engine_id = e.id
          WHERE me.model_id = $1
          ORDER BY e.id
        `, [modelId]),

                query(`
          SELECT t.* FROM transmissions t
          INNER JOIN model_transmissions mt ON mt.transmission_id = t.id
          WHERE mt.model_id = $1
          ORDER BY t.id
        `, [modelId]),

                query(`
          SELECT t.* FROM trims t
          INNER JOIN model_trims mt ON mt.trim_id = t.id
          WHERE mt.model_id = $1
          ORDER BY t.id
        `, [modelId]),

                query('SELECT * FROM exterior_options ORDER BY category, id'),
                query('SELECT * FROM interior_options ORDER BY category, id'),
                query('SELECT * FROM wheels ORDER BY size, id'),
                query('SELECT * FROM packages ORDER BY id'),
                query('SELECT * FROM rules WHERE is_active = true ORDER BY id'),
            ]);

        res.json({
            model: modelResult.rows[0],
            engines: engines.rows,
            transmissions: transmissions.rows,
            trims: trims.rows,
            exteriorOptions: exteriorOptions.rows,
            interiorOptions: interiorOptions.rows,
            wheels: wheels.rows,
            packages: packages.rows,
            rules: rules.rows,
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
