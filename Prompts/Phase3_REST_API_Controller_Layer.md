# Phase 3: REST API & Controller Layer

**Goal:** Bridge the database and the engine to the frontend via secure, validated API endpoints.

---

## Overview

Phase 3 wires together the database layer (Phase 1) and the business logic engine (Phase 2) through a clean HTTP API. The architecture follows the **Service-Controller-Route pattern**: Routes handle URL mapping, Controllers handle request/response serialization, and Services handle all database access and engine orchestration. No database calls appear in Controllers. No business logic appears in Routes.

Three core configuration endpoints are built in this phase:
- `/api/configure/validate` — runs selections through `compatibility.js`
- `/api/configure/price` — runs selections through `pricing.js`
- `/api/configure/save` — atomically validates, prices, and persists a `ConfigurationSnapshot`

---

## Directory Structure

```
src/
├── routes/
│   ├── index.js
│   ├── modelRoutes.js
│   └── configureRoutes.js
├── controllers/
│   ├── modelController.js
│   └── configureController.js
├── services/
│   ├── optionService.js
│   └── configurationService.js
├── middleware/
│   └── validate.js
├── engine/                  ← Phase 2 (unchanged)
└── app.js
```

---

## Step 1: Express App Setup

**File: `src/app.js`**

```js
'use strict';
const express = require('express');
const routes  = require('./routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all routes under /api
app.use('/api', routes);

// Global error handler
app.use((err, req, res, next) => {
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal Server Error';
  res.status(status).json({ status: 'error', message });
});

module.exports = app;
```

**File: `src/server.js`**

```js
'use strict';
require('dotenv').config();
const app      = require('./app');
const sequelize = require('./db');

const PORT = process.env.PORT || 3001;

async function start() {
  await sequelize.authenticate();
  console.log('PostgreSQL connection established.');
  app.listen(PORT, () => console.log(`ECP backend running on port ${PORT}`));
}

start();
```

---

## Step 2: Route Files

**File: `src/routes/index.js`**

```js
'use strict';
const express        = require('express');
const modelRoutes    = require('./modelRoutes');
const configureRoutes = require('./configureRoutes');

const router = express.Router();

router.use('/models',    modelRoutes);
router.use('/configure', configureRoutes);

module.exports = router;
```

**File: `src/routes/modelRoutes.js`**

```js
'use strict';
const express    = require('express');
const controller = require('../controllers/modelController');

const router = express.Router();

// Fetch all available vehicle models
router.get('/', controller.getAllModels);

// Fetch available options per category for a specific model
router.get('/:modelId/engines',       controller.getEngines);
router.get('/:modelId/transmissions', controller.getTransmissions);
router.get('/:modelId/trims',         controller.getTrims);
router.get('/:modelId/colors',        controller.getColors);
router.get('/:modelId/interiors',     controller.getInteriors);
router.get('/:modelId/wheels',        controller.getWheels);
router.get('/:modelId/packages',      controller.getPackages);

module.exports = router;
```

**File: `src/routes/configureRoutes.js`**

```js
'use strict';
const express    = require('express');
const controller = require('../controllers/configureController');
const { validateBody } = require('../middleware/validate');
const {
  validateSelectionSchema,
  priceSelectionSchema,
  saveConfigurationSchema
} = require('../middleware/validate');

const router = express.Router();

// POST /api/configure/validate
// Passes current selection through compatibility.js, returns allowed and disabled options
router.post('/validate', validateBody(validateSelectionSchema), controller.validate);

// POST /api/configure/price
// Returns dynamically calculated price for the current selection state
router.post('/price', validateBody(priceSelectionSchema), controller.price);

// POST /api/configure/save
// Atomically validates, prices, and persists a ConfigurationSnapshot
router.post('/save', validateBody(saveConfigurationSchema), controller.save);

module.exports = router;
```

---

## Step 3: Zod Validation Middleware

**File: `src/middleware/validate.js`**

```js
'use strict';
const { z } = require('zod');

// Reusable validation wrapper — returns a middleware function for any Zod schema
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

// ── Schema Definitions ─────────────────────────────────────────────────────

// Shared selection shape — used across all three configure endpoints
const SelectionSchema = z.object({
  modelId:          z.string().uuid(),
  engineId:         z.string().uuid().optional(),
  transmissionId:   z.string().uuid().optional(),
  trimId:           z.string().uuid().optional(),
  exteriorColorId:  z.string().uuid().optional(),
  interiorId:       z.string().uuid().optional(),
  wheelId:          z.string().uuid().optional(),
  packageIds:       z.array(z.string().uuid()).optional().default([])
});

// POST /api/configure/validate
const validateSelectionSchema = z.object({
  currentSelections: SelectionSchema,
  targetSelection: z.object({
    type: z.enum(['Engine', 'Transmission', 'Trim', 'Color', 'Interior', 'Wheel', 'Package']),
    id:   z.string().uuid()
  }).optional()
});

// POST /api/configure/price
const priceSelectionSchema = z.object({
  selections: SelectionSchema,
  overrides: z.object({
    dealerDiscountFlat:    z.number().nonnegative().optional(),
    dealerDiscountPercent: z.number().min(0).max(100).optional(),
    regionalTaxPercent:    z.number().min(0).max(100).optional()
  }).optional().default({})
});

// POST /api/configure/save
const saveConfigurationSchema = z.object({
  selections:          SelectionSchema,
  clientComputedPrice: z.number().positive()
});

module.exports = {
  validateBody,
  validateSelectionSchema,
  priceSelectionSchema,
  saveConfigurationSchema
};
```

---

## Step 4: Service Layer

The Service layer is the only place that reads from the database. It uses `{ raw: true }` on all Sequelize queries to return plain JavaScript objects — never Sequelize model instances — so they can be passed safely into the engine functions.

**File: `src/services/optionService.js`**

```js
'use strict';
const {
  VehicleModel, Engine, Transmission, Trim,
  Color, Interior, Wheel, Package, Rule
} = require('../models');

async function getAllModels() {
  return VehicleModel.findAll({
    where: { is_active: true },
    raw:   true,
    attributes: ['id', 'name', 'slug', 'base_price', 'description']
  });
}

async function getEnginesForModel(modelId) {
  return Engine.findAll({ where: { modelId }, raw: true });
}

async function getTransmissionsForModel(modelId) {
  return Transmission.findAll({ where: { modelId }, raw: true });
}

async function getTrimsForModel(modelId) {
  return Trim.findAll({ where: { modelId }, raw: true, order: [['level', 'ASC']] });
}

async function getColorsForModel(modelId) {
  return Color.findAll({ where: { modelId }, raw: true });
}

async function getInteriorsForModel(modelId) {
  return Interior.findAll({ where: { modelId }, raw: true });
}

async function getWheelsForModel(modelId) {
  return Wheel.findAll({ where: { modelId }, raw: true });
}

async function getPackagesForModel(modelId) {
  return Package.findAll({ where: { modelId }, raw: true });
}

async function getRulesForModel(modelId) {
  return Rule.findAll({ where: { modelId }, raw: true });
}

/**
 * Load prices for all selected components in one batch.
 * Returns plain objects ready for calculatePrice().
 */
async function getPricesForSelections(selections, options = {}) {
  const queries = [];

  const engineQ       = selections.engineId       ? Engine.findByPk(selections.engineId,        { raw: true, ...options }) : Promise.resolve(null);
  const transmissionQ = selections.transmissionId ? Transmission.findByPk(selections.transmissionId, { raw: true, ...options }) : Promise.resolve(null);
  const trimQ         = selections.trimId         ? Trim.findByPk(selections.trimId,             { raw: true, ...options }) : Promise.resolve(null);
  const colorQ        = selections.exteriorColorId ? Color.findByPk(selections.exteriorColorId,  { raw: true, ...options }) : Promise.resolve(null);
  const interiorQ     = selections.interiorId     ? Interior.findByPk(selections.interiorId,     { raw: true, ...options }) : Promise.resolve(null);
  const wheelQ        = selections.wheelId        ? Wheel.findByPk(selections.wheelId,           { raw: true, ...options }) : Promise.resolve(null);
  const packagesQ     = selections.packageIds?.length
    ? Package.findAll({ where: { id: selections.packageIds }, raw: true, ...options })
    : Promise.resolve([]);

  const [engine, transmission, trim, exterior, interior, wheels, packages] = await Promise.all([
    engineQ, transmissionQ, trimQ, colorQ, interiorQ, wheelQ, packagesQ
  ]);

  return { engine, transmission, trim, exterior, interior, wheels, packages };
}

module.exports = {
  getAllModels,
  getEnginesForModel,
  getTransmissionsForModel,
  getTrimsForModel,
  getColorsForModel,
  getInteriorsForModel,
  getWheelsForModel,
  getPackagesForModel,
  getRulesForModel,
  getPricesForSelections
};
```

**File: `src/services/configurationService.js`**

```js
'use strict';
const sequelize              = require('../db');
const { VehicleModel, ConfigurationSnapshot } = require('../models');
const optionService          = require('./optionService');
const { evaluateCompatibility } = require('../engine/compatibility');
const { calculatePrice }        = require('../engine/pricing');

const PRICE_TOLERANCE = 0.01; // Accept a delta of up to 1 cent

/**
 * Run compatibility.js against the given selections and rules,
 * returning allowed and disabled option arrays for each category.
 */
async function validateSelections(currentSelections, targetSelection) {
  const rules = await optionService.getRulesForModel(currentSelections.modelId);
  const result = evaluateCompatibility(currentSelections, targetSelection, rules);

  // Augment result with full allowed/disabled arrays for all option categories
  // (the engine returns IDs; the service resolves them to full objects if needed)
  return result;
}

/**
 * Calculate the real-time price for a given selection state.
 */
async function getPriceForSelections(selections, overrides = {}) {
  const model      = await VehicleModel.findByPk(selections.modelId, { raw: true });
  const components = await optionService.getPricesForSelections(selections);
  return calculatePrice(parseFloat(model.base_price), components, overrides);
}

/**
 * Atomically validate, price, and persist a ConfigurationSnapshot.
 * Uses a Sequelize transaction to guarantee ACID compliance.
 * The price_at_selection is always stamped from the server — never from the client.
 */
async function saveConfiguration(selections, clientComputedPrice) {
  const t = await sequelize.transaction();

  try {
    // Step 1: Server-side compatibility re-validation
    const rules = await optionService.getRulesForModel(selections.modelId, { transaction: t });
    const compatResult = evaluateCompatibility(selections, null, rules);

    if (!compatResult.isValid) {
      await t.rollback();
      const err = new Error('Configuration is invalid — compatibility rules violated.');
      err.statusCode = 422;
      throw err;
    }

    // Step 2: Server-side price re-computation
    const model      = await VehicleModel.findByPk(selections.modelId, { raw: true, transaction: t });
    const components = await optionService.getPricesForSelections(selections, { transaction: t });
    const breakdown  = calculatePrice(parseFloat(model.base_price), components);

    // Step 3: Validate the price the client submitted vs the server-computed price
    const delta = Math.abs(breakdown.total - clientComputedPrice);
    if (delta > PRICE_TOLERANCE) {
      await t.rollback();
      const err = new Error(`Price mismatch detected. Expected ${breakdown.total}, received ${clientComputedPrice}.`);
      err.statusCode = 409;
      throw err;
    }

    // Step 4: Persist the ConfigurationSnapshot with price_at_selection from server
    const snapshot = await ConfigurationSnapshot.create({
      modelId:            selections.modelId,
      selectionPayload:   selections,
      price_at_selection: breakdown.total,
      is_finalized:       true
    }, { transaction: t });

    await t.commit();

    return {
      configurationId:    snapshot.id,
      price_at_selection: snapshot.price_at_selection,
      createdAt:          snapshot.createdAt
    };

  } catch (err) {
    await t.rollback();
    throw err;
  }
}

module.exports = { validateSelections, getPriceForSelections, saveConfiguration };
```

---

## Step 5: Controllers

Controllers are intentionally thin. They validate input (via middleware), delegate to the Service layer, and serialize the response.

**File: `src/controllers/modelController.js`**

```js
'use strict';
const optionService = require('../services/optionService');

const getAllModels     = async (req, res, next) => {
  try {
    const models = await optionService.getAllModels();
    res.status(200).json({ status: 'success', data: models });
  } catch (err) { next(err); }
};

const getEngines = async (req, res, next) => {
  try {
    const data = await optionService.getEnginesForModel(req.params.modelId);
    res.status(200).json({ status: 'success', data });
  } catch (err) { next(err); }
};

const getTransmissions = async (req, res, next) => {
  try {
    const data = await optionService.getTransmissionsForModel(req.params.modelId);
    res.status(200).json({ status: 'success', data });
  } catch (err) { next(err); }
};

const getTrims = async (req, res, next) => {
  try {
    const data = await optionService.getTrimsForModel(req.params.modelId);
    res.status(200).json({ status: 'success', data });
  } catch (err) { next(err); }
};

const getColors = async (req, res, next) => {
  try {
    const data = await optionService.getColorsForModel(req.params.modelId);
    res.status(200).json({ status: 'success', data });
  } catch (err) { next(err); }
};

const getInteriors = async (req, res, next) => {
  try {
    const data = await optionService.getInteriorsForModel(req.params.modelId);
    res.status(200).json({ status: 'success', data });
  } catch (err) { next(err); }
};

const getWheels = async (req, res, next) => {
  try {
    const data = await optionService.getWheelsForModel(req.params.modelId);
    res.status(200).json({ status: 'success', data });
  } catch (err) { next(err); }
};

const getPackages = async (req, res, next) => {
  try {
    const data = await optionService.getPackagesForModel(req.params.modelId);
    res.status(200).json({ status: 'success', data });
  } catch (err) { next(err); }
};

module.exports = { getAllModels, getEngines, getTransmissions, getTrims, getColors, getInteriors, getWheels, getPackages };
```

**File: `src/controllers/configureController.js`**

```js
'use strict';
const configurationService = require('../services/configurationService');

/**
 * POST /api/configure/validate
 * Passes selection through compatibility.js.
 * Returns allowed and disabled option arrays.
 */
const validate = async (req, res, next) => {
  try {
    const { currentSelections, targetSelection } = req.validatedBody;
    const result = await configurationService.validateSelections(currentSelections, targetSelection);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

/**
 * POST /api/configure/price
 * Returns the dynamically calculated price breakdown.
 */
const price = async (req, res, next) => {
  try {
    const { selections, overrides } = req.validatedBody;
    const breakdown = await configurationService.getPriceForSelections(selections, overrides);
    res.status(200).json({ status: 'success', data: breakdown });
  } catch (err) { next(err); }
};

/**
 * POST /api/configure/save
 * Validates, re-prices, and persists the ConfigurationSnapshot.
 * price_at_selection is always the server-computed value.
 */
const save = async (req, res, next) => {
  try {
    const { selections, clientComputedPrice } = req.validatedBody;
    const result = await configurationService.saveConfiguration(selections, clientComputedPrice);
    res.status(201).json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

module.exports = { validate, price, save };
```

---

## Step 6: Full API Reference

| Method | Endpoint | Description | Body Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/models` | All active VehicleModels with base_price | — |
| `GET` | `/api/models/:modelId/engines` | Engines for a model | — |
| `GET` | `/api/models/:modelId/transmissions` | Transmissions for a model | — |
| `GET` | `/api/models/:modelId/trims` | Trims for a model | — |
| `GET` | `/api/models/:modelId/colors` | Exterior Colors for a model | — |
| `GET` | `/api/models/:modelId/interiors` | Interiors for a model | — |
| `GET` | `/api/models/:modelId/wheels` | Wheels for a model | — |
| `GET` | `/api/models/:modelId/packages` | Packages for a model | — |
| `POST` | `/api/configure/validate` | Evaluate selection via `compatibility.js` | `currentSelections`, `targetSelection` |
| `POST` | `/api/configure/price` | Calculate price via `pricing.js` | `selections`, optional `overrides` |
| `POST` | `/api/configure/save` | Save `ConfigurationSnapshot` (ACID) | `selections`, `clientComputedPrice` |

---

## Deliverables Checklist

- [ ] `src/app.js` configured with `express.json()` and global error handler
- [ ] `src/routes/modelRoutes.js` — all 8 GET routes for option categories
- [ ] `src/routes/configureRoutes.js` — `/validate`, `/price`, `/save` routes
- [ ] `src/middleware/validate.js` — Zod schemas for all three configure endpoints
- [ ] Validation middleware returns `422` with field-level error detail on bad input
- [ ] `src/services/optionService.js` — all DB queries use `{ raw: true }`
- [ ] `src/services/configurationService.js` — `validateSelections`, `getPriceForSelections`, `saveConfiguration`
- [ ] `saveConfiguration` wraps in `sequelize.transaction()` with rollback on any failure
- [ ] `saveConfiguration` re-runs `evaluateCompatibility` server-side — never trusts client state
- [ ] `saveConfiguration` re-runs `calculatePrice` server-side — stamps `price_at_selection` from server
- [ ] `saveConfiguration` returns `409` when `clientComputedPrice` deviates beyond tolerance
- [ ] `src/controllers/modelController.js` — thin controllers delegating to `optionService`
- [ ] `src/controllers/configureController.js` — thin controllers delegating to `configurationService`
- [ ] No database calls inside controllers
- [ ] No business logic inside routes
