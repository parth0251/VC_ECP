# Phase 1: Backend Foundation & Database Schema

**Goal:** Initialize the Node app, configure Sequelize schemas, and establish the data layer.

---

## Overview

Phase 1 lays the entire data foundation that every subsequent phase depends on. The objective is to produce a fully versioned, seeded PostgreSQL database with all relational entities, constraints, and realistic sample data — before writing a single line of business logic. Every schema decision made here propagates forward, so correctness matters more than speed.

---

## Step 1: Initialize the Node.js Project

Create a new directory and initialize the project.

```bash
mkdir ecp-backend
cd ecp-backend
npm init -y
```

Install all required dependencies:

```bash
# Runtime dependencies
npm install express sequelize pg pg-hstore dotenv

# Development dependencies
npm install --save-dev sequelize-cli nodemon
```

Create the `.env` file at the project root:

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecp_development
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## Step 2: Sequelize Configuration with Connection Pooling

Create the Sequelize config file that reads environment variables and configures connection pooling for high-traffic environments.

**File: `config/database.js`**

```js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    dialect:  'postgres',
    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000
    },
    logging: console.log
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'ecp_test',
    host:     process.env.DB_HOST,
    dialect:  'postgres',
    logging:  false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'ecp_production',
    host:     process.env.DB_HOST,
    dialect:  'postgres',
    pool: {
      max:     20,
      min:     5,
      acquire: 30000,
      idle:    10000
    },
    logging: false
  }
};
```

**File: `src/db.js`** — Sequelize instance used across the app:

```js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

module.exports = sequelize;
```

> **Critical Rule:** `sequelize.sync()` must never appear anywhere in the codebase — not in development, not in test setup. All schema changes are managed exclusively through Sequelize migration files.

---

## Step 3: Project Folder Structure

```
ecp-backend/
├── config/
│   └── database.js
├── src/
│   ├── db.js
│   ├── models/
│   │   ├── index.js
│   │   ├── VehicleModel.js
│   │   ├── Engine.js
│   │   ├── Transmission.js
│   │   ├── Trim.js
│   │   ├── Color.js
│   │   ├── Interior.js
│   │   ├── Wheel.js
│   │   ├── Package.js
│   │   ├── Rule.js
│   │   └── ConfigurationSnapshot.js
│   ├── engine/              ← Phase 2
│   ├── services/            ← Phase 3
│   ├── controllers/         ← Phase 3
│   └── routes/              ← Phase 3
├── migrations/
├── seeders/
├── .env
├── .sequelizerc
└── package.json
```

**File: `.sequelizerc`** — tells sequelize-cli where everything lives:

```js
const path = require('path');
module.exports = {
  config:         path.resolve('config', 'database.js'),
  'models-path':  path.resolve('src', 'models'),
  'migrations-path': path.resolve('migrations'),
  'seeders-path': path.resolve('seeders')
};
```

---

## Step 4: Migration Files

Each migration file must implement both `up()` and `down()` methods completely. A migration that cannot be reversed is a deployment liability.

---

### Migration 001 — `create-vehicle-models`

```bash
npx sequelize-cli migration:generate --name create-vehicle-models
```

```js
// migrations/001-create-vehicle-models.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VehicleModels', {
      id: {
        type:          Sequelize.UUID,
        defaultValue:  Sequelize.UUIDV4,
        primaryKey:    true,
        allowNull:     false
      },
      name: {
        type:      Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type:      Sequelize.STRING,
        allowNull: false,
        unique:    true
      },
      base_price: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      is_active: {
        type:         Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('VehicleModels');
  }
};
```

---

### Migration 002 — `create-engines`

```js
// migrations/002-create-engines.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Engines', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false
      },
      modelId: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'VehicleModels', key: 'id' },
        onDelete:   'CASCADE'
      },
      name:        { type: Sequelize.STRING,         allowNull: false },
      price:       { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      horsepower:  { type: Sequelize.INTEGER },
      torque:      { type: Sequelize.INTEGER },
      fuel_type: {
        type: Sequelize.ENUM('petrol', 'diesel', 'electric', 'hybrid'),
        allowNull: false
      },
      description: { type: Sequelize.TEXT },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
      updatedAt:   { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Engines');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Engines_fuel_type";');
  }
};
```

---

### Migration 003 — `create-transmissions`

```js
// migrations/003-create-transmissions.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transmissions', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false
      },
      modelId: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'VehicleModels', key: 'id' },
        onDelete:   'CASCADE'
      },
      name:        { type: Sequelize.STRING,         allowNull: false },
      price:       { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      type: {
        type: Sequelize.ENUM('automatic', 'manual', 'semi-automatic'),
        allowNull: false
      },
      description: { type: Sequelize.TEXT },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
      updatedAt:   { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Transmissions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Transmissions_type";');
  }
};
```

---

### Migration 004 — `create-trims`

```js
// migrations/004-create-trims.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Trims', {
      id: {
        type:         Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey:   true,
        allowNull:    false
      },
      modelId: {
        type:       Sequelize.UUID,
        allowNull:  false,
        references: { model: 'VehicleModels', key: 'id' },
        onDelete:   'CASCADE'
      },
      name:        { type: Sequelize.STRING,         allowNull: false },
      price:       { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      level:       { type: Sequelize.INTEGER,        allowNull: false },
      description: { type: Sequelize.TEXT },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
      updatedAt:   { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Trims');
  }
};
```

---

### Migration 005 — `create-options` (Color, Interior, Wheel)

```js
// migrations/005-create-options.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {

    // Exterior Colors
    await queryInterface.createTable('Colors', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      modelId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'VehicleModels', key: 'id' }, onDelete: 'CASCADE'
      },
      name:      { type: Sequelize.STRING,         allowNull: false },
      price:     { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      hex_code:  { type: Sequelize.STRING(7) },
      image_url: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // Interiors
    await queryInterface.createTable('Interiors', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      modelId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'VehicleModels', key: 'id' }, onDelete: 'CASCADE'
      },
      name:      { type: Sequelize.STRING,         allowNull: false },
      price:     { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      material:  { type: Sequelize.STRING },
      image_url: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // Wheels
    await queryInterface.createTable('Wheels', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      modelId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'VehicleModels', key: 'id' }, onDelete: 'CASCADE'
      },
      name:             { type: Sequelize.STRING,         allowNull: false },
      price:            { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      diameter_inches:  { type: Sequelize.INTEGER },
      image_url:        { type: Sequelize.STRING },
      createdAt:        { type: Sequelize.DATE, allowNull: false },
      updatedAt:        { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Wheels');
    await queryInterface.dropTable('Interiors');
    await queryInterface.dropTable('Colors');
  }
};
```

---

### Migration 006 — `create-packages`

Packages have a many-to-many relationship with sub-features via a junction table.

```js
// migrations/006-create-packages.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Packages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      modelId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'VehicleModels', key: 'id' }, onDelete: 'CASCADE'
      },
      name:        { type: Sequelize.STRING,         allowNull: false },
      price:       { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      description: { type: Sequelize.TEXT },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
      updatedAt:   { type: Sequelize.DATE, allowNull: false }
    });

    // Junction table: Package ↔ sub-features (many-to-many)
    await queryInterface.createTable('PackageFeatures', {
      PackageId: {
        type: Sequelize.UUID,
        references: { model: 'Packages', key: 'id' },
        onDelete: 'CASCADE'
      },
      featureName: { type: Sequelize.STRING, allowNull: false },
      createdAt:   { type: Sequelize.DATE, allowNull: false },
      updatedAt:   { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PackageFeatures');
    await queryInterface.dropTable('Packages');
  }
};
```

---

### Migration 007 — `create-rules`

The `Rule` table is the constraint graph edge table. It uses `dependentComponentType`/`Id` and `targetComponentType`/`Id` exactly as specified, enabling any component-to-component rule without future schema changes.

```js
// migrations/007-create-rules.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rules', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      modelId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'VehicleModels', key: 'id' }, onDelete: 'CASCADE'
      },
      // The component that TRIGGERS the rule (e.g. Trim: "Sport")
      dependentComponentType: { type: Sequelize.STRING, allowNull: false },
      dependentComponentId:   { type: Sequelize.UUID,   allowNull: false },
      // The component that is AFFECTED by the rule (e.g. Wheel: "Standard 18")
      targetComponentType:    { type: Sequelize.STRING, allowNull: false },
      targetComponentId:      { type: Sequelize.UUID,   allowNull: false },
      // INCLUDE = force-add target when dependent is selected
      // EXCLUDE = block target when dependent is selected
      ruleType: {
        type: Sequelize.ENUM('INCLUDE', 'EXCLUDE'),
        allowNull: false
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Rules');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Rules_ruleType";');
  }
};
```

---

### Migration 008 — `create-configuration-snapshots`

This is the financial audit table. Foreign keys use `RESTRICT` — a snapshot record must never be silently deleted.

```js
// migrations/008-create-configuration-snapshots.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ConfigurationSnapshots', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      modelId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'VehicleModels', key: 'id' },
        onDelete: 'RESTRICT'   // ← never allow cascade on audit data
      },
      // Full serialized selection state stored as JSON
      selectionPayload: {
        type:      Sequelize.JSONB,
        allowNull: false
      },
      // Stamped at save time — never recomputed after the fact
      price_at_selection: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      is_finalized: {
        type:         Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ConfigurationSnapshots');
  }
};
```

---

## Step 5: Sequelize Models

**File: `src/models/VehicleModel.js`**

```js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class VehicleModel extends Model {
    static associate(models) {
      VehicleModel.hasMany(models.Engine,       { foreignKey: 'modelId', onDelete: 'CASCADE' });
      VehicleModel.hasMany(models.Transmission, { foreignKey: 'modelId', onDelete: 'CASCADE' });
      VehicleModel.hasMany(models.Trim,         { foreignKey: 'modelId', onDelete: 'CASCADE' });
      VehicleModel.hasMany(models.Color,        { foreignKey: 'modelId', onDelete: 'CASCADE' });
      VehicleModel.hasMany(models.Interior,     { foreignKey: 'modelId', onDelete: 'CASCADE' });
      VehicleModel.hasMany(models.Wheel,        { foreignKey: 'modelId', onDelete: 'CASCADE' });
      VehicleModel.hasMany(models.Package,      { foreignKey: 'modelId', onDelete: 'CASCADE' });
      VehicleModel.hasMany(models.Rule,         { foreignKey: 'modelId', onDelete: 'CASCADE' });
      VehicleModel.hasMany(models.ConfigurationSnapshot, {
        foreignKey: 'modelId',
        onDelete: 'RESTRICT'   // ← audit table — never cascade delete
      });
    }
  }

  VehicleModel.init({
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:        { type: DataTypes.STRING, allowNull: false },
    slug:        { type: DataTypes.STRING, allowNull: false, unique: true },
    base_price:  { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    description: { type: DataTypes.TEXT },
    is_active:   { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { sequelize, modelName: 'VehicleModel' });

  return VehicleModel;
};
```

**File: `src/models/Rule.js`**

```js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Rule extends Model {
    static associate(models) {
      Rule.belongsTo(models.VehicleModel, { foreignKey: 'modelId' });
    }
  }

  Rule.init({
    id:                     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    modelId:                { type: DataTypes.UUID, allowNull: false },
    dependentComponentType: { type: DataTypes.STRING, allowNull: false },
    dependentComponentId:   { type: DataTypes.UUID,   allowNull: false },
    targetComponentType:    { type: DataTypes.STRING, allowNull: false },
    targetComponentId:      { type: DataTypes.UUID,   allowNull: false },
    ruleType: {
      type:      DataTypes.ENUM('INCLUDE', 'EXCLUDE'),
      allowNull: false
    }
  }, { sequelize, modelName: 'Rule' });

  return Rule;
};
```

**File: `src/models/ConfigurationSnapshot.js`**

```js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ConfigurationSnapshot extends Model {
    static associate(models) {
      ConfigurationSnapshot.belongsTo(models.VehicleModel, {
        foreignKey: 'modelId',
        onDelete:   'RESTRICT'
      });
    }
  }

  ConfigurationSnapshot.init({
    id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    modelId:            { type: DataTypes.UUID, allowNull: false },
    selectionPayload:   { type: DataTypes.JSONB, allowNull: false },
    price_at_selection: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    is_finalized:       { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { sequelize, modelName: 'ConfigurationSnapshot' });

  return ConfigurationSnapshot;
};
```

---

## Step 6: Seeder Scripts

### Seeder 001 — Vehicle Models

```js
// seeders/001-seed-vehicle-models.js
'use strict';
const { v4: uuidv4 } = require('uuid');

// Export IDs so downstream seeders can reference them
const MODEL_S_ID = uuidv4();
const MODEL_X_ID = uuidv4();
module.exports.MODEL_S_ID = MODEL_S_ID;
module.exports.MODEL_X_ID = MODEL_X_ID;

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('VehicleModels', [
      {
        id: MODEL_S_ID, name: 'Model S', slug: 'model-s',
        base_price: 89990.00,
        description: 'Tri-Motor All-Wheel Drive long-range sedan.',
        is_active: true,
        createdAt: new Date(), updatedAt: new Date()
      },
      {
        id: MODEL_X_ID, name: 'Model X', slug: 'model-x',
        base_price: 104990.00,
        description: 'Plaid All-Wheel Drive full-size SUV.',
        is_active: true,
        createdAt: new Date(), updatedAt: new Date()
      }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('VehicleModels', null, {});
  }
};
```

### Seeder 007 — Rules (3–4 Levels of Interdependency)

This seeder demonstrates the layered constraint chain described in the spec:
**Trim → Package → Color restriction** and **Engine → Transmission exclusion**.

```js
// seeders/007-seed-rules.js
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // These IDs reference the records created in seeders 002–006
    // In a real seeder these would be looked up or shared via a constants file

    await queryInterface.bulkInsert('Rules', [

      // Level 1: V8 Engine EXCLUDES Manual Transmission
      {
        id: uuidv4(), modelId: '<MODEL_S_ID>',
        dependentComponentType: 'Engine',       dependentComponentId: '<V8_ENGINE_ID>',
        targetComponentType:    'Transmission', targetComponentId:    '<MANUAL_TRANSMISSION_ID>',
        ruleType: 'EXCLUDE',
        createdAt: new Date(), updatedAt: new Date()
      },

      // Level 2: Sport Trim INCLUDES Sport Handling Package
      {
        id: uuidv4(), modelId: '<MODEL_S_ID>',
        dependentComponentType: 'Trim',    dependentComponentId: '<SPORT_TRIM_ID>',
        targetComponentType:    'Package', targetComponentId:    '<SPORT_HANDLING_PKG_ID>',
        ruleType: 'INCLUDE',
        createdAt: new Date(), updatedAt: new Date()
      },

      // Level 3: Sport Handling Package EXCLUDES Standard 18" Wheels
      {
        id: uuidv4(), modelId: '<MODEL_S_ID>',
        dependentComponentType: 'Package', dependentComponentId: '<SPORT_HANDLING_PKG_ID>',
        targetComponentType:    'Wheel',   targetComponentId:    '<STANDARD_18_WHEEL_ID>',
        ruleType: 'EXCLUDE',
        createdAt: new Date(), updatedAt: new Date()
      },

      // Level 4: Sport Handling Package EXCLUDES Matte White Exterior Color
      {
        id: uuidv4(), modelId: '<MODEL_S_ID>',
        dependentComponentType: 'Package', dependentComponentId: '<SPORT_HANDLING_PKG_ID>',
        targetComponentType:    'Color',   targetComponentId:    '<MATTE_WHITE_COLOR_ID>',
        ruleType: 'EXCLUDE',
        createdAt: new Date(), updatedAt: new Date()
      }

    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Rules', null, {});
  }
};
```

---

## Step 7: NPM Scripts

Add the following to `package.json`:

```json
{
  "scripts": {
    "start":        "node src/app.js",
    "dev":          "nodemon src/app.js",
    "migrate":      "sequelize-cli db:migrate",
    "migrate:undo": "sequelize-cli db:migrate:undo:all",
    "db:seed":      "sequelize-cli db:seed:all",
    "db:seed:undo": "sequelize-cli db:seed:undo:all",
    "db:reset":     "npm run migrate:undo && npm run migrate && npm run db:seed"
  }
}
```

---

## Deliverables Checklist

- [ ] Node.js project initialized with Express, Sequelize, pg, dotenv
- [ ] `config/database.js` with connection pooling configured for all environments
- [ ] `src/db.js` Sequelize instance exported for use across the app
- [ ] `.sequelizerc` pointing to correct paths
- [ ] Migration 001 — `VehicleModels` table with `base_price`
- [ ] Migration 002 — `Engines` table with `modelId` FK and `ON DELETE CASCADE`
- [ ] Migration 003 — `Transmissions` table with `modelId` FK
- [ ] Migration 004 — `Trims` table with `level` ordering column
- [ ] Migration 005 — `Colors`, `Interiors`, `Wheels` tables
- [ ] Migration 006 — `Packages` + `PackageFeatures` junction table
- [ ] Migration 007 — `Rules` table with `dependentComponentType/Id` and `targetComponentType/Id`
- [ ] Migration 008 — `ConfigurationSnapshots` with `price_at_selection` and `ON DELETE RESTRICT`
- [ ] All migrations have complete `up()` and `down()` methods
- [ ] All Sequelize models defined with correct associations
- [ ] Seeder scripts for 2 vehicle models (Model S, Model X) with realistic data
- [ ] Rule seeder demonstrating 4 levels of constraint chain
- [ ] `npm run db:reset` runs cleanly against a blank database
- [ ] Zero uses of `.sync()` anywhere in the codebase
