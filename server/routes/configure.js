const express = require('express');
const router = express.Router();
const { evaluateRules } = require('../engine/rules');
const { calculatePricing } = require('../engine/pricing');

/**
 * POST /api/configure/validate
 * Validates a configuration against the rule engine.
 *
 * Body: { config: {...}, market: "US-CA", catalog: {...} }
 */
router.post('/validate', (req, res, next) => {
    try {
        const { config, market, catalog } = req.body;

        if (!config) {
            return res.status(400).json({ error: 'config is required' });
        }

        const result = evaluateRules(config, market || 'US-GEN', catalog || {});
        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/configure/price
 * Computes pricing breakdown for a configuration.
 *
 * Body: { config: {...}, catalog: {...} }
 */
router.post('/price', (req, res, next) => {
    try {
        const { config, catalog } = req.body;

        if (!config) {
            return res.status(400).json({ error: 'config is required' });
        }

        const result = calculatePricing(config, catalog || {});
        res.json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
