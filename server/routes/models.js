const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * GET /api/models
 * Returns all available vehicle models.
 */
router.get('/', async (req, res, next) => {
    try {
        const result = await query('SELECT id, name, base_price, description, image_url FROM models ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/models/:id
 * Returns a single model with its available options.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const modelResult = await query('SELECT * FROM models WHERE id = $1', [id]);

        if (modelResult.rowCount === 0) {
            return res.status(404).json({ error: 'Model not found' });
        }

        res.json(modelResult.rows[0]);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
