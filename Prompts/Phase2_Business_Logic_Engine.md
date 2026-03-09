# Phase 2: Core Business Logic (Pricing & Compatibility Engine)

**Goal:** Build pure functions to process constraints, dependencies, and dynamic pricing.

---

## Overview

Phase 2 creates the intellectual core of the ECP. Following the architectural mandate, all business logic lives inside the `src/engine/` directory and consists entirely of pure functions. These functions accept plain JavaScript objects and return plain JavaScript objects — with zero dependency on Express request/response objects, Sequelize, or any other I/O library. This purity is what makes the engine independently testable, composable, and reliable.

Two modules are created in this phase:

- **`compatibility.js`** — evaluates configuration rules and determines which options are allowed or disabled for a given selection state.
- **`pricing.js`** — deterministically calculates the full price breakdown for any selection state.

---

## Directory Structure

```
src/
└── engine/
    ├── compatibility.js
    ├── pricing.js
    └── index.js
```

**File: `src/engine/index.js`** — barrel export:

```js
const { evaluateCompatibility } = require('./compatibility');
const { calculatePrice }         = require('./pricing');

module.exports = { evaluateCompatibility, calculatePrice };
```

> **Architectural Rule:** No Sequelize model, no `req`, no `res` object may ever appear inside `src/engine/`. If you find one, it is a bug. The Service layer (Phase 3) is the only layer that reads from the database and passes plain objects into these functions.

---

## `compatibility.js` — The Constraint Engine

### Responsibility

`compatibility.js` accepts the current selection state and the full set of `Rule` records (as plain objects, already loaded from the database by the Service layer), then evaluates which options are allowed and which are disabled for the next user selection.

It directly implements the `Rule` schema defined in Phase 1 — using `dependentComponentType`, `dependentComponentId`, `targetComponentType`, `targetComponentId`, and `ruleType` (`INCLUDE` / `EXCLUDE`).

### Function Signature

```js
/**
 * Evaluate the compatibility of a target selection against all active rules.
 *
 * @param {Object}   currentSelections  - The user's currently confirmed selections.
 *                                        Keys are component types (e.g. 'Engine', 'Trim').
 *                                        Values are the selected component IDs (UUIDs as strings).
 * @param {Object}   targetSelection    - The option the user is attempting to add.
 *                                        Shape: { type: 'Wheel', id: 'uuid' }
 * @param {Array}    rules              - All Rule records for the active modelId (plain objects from DB).
 *
 * @returns {Object} CompatibilityResult
 */
function evaluateCompatibility(currentSelections, targetSelection, rules) { ... }
```

### CompatibilityResult Shape

```js
{
  isValid:         true,            // false if targetSelection is blocked by any EXCLUDE rule
  allowed:         ['uuid', ...],   // IDs that remain selectable
  disabled:        ['uuid', ...],   // IDs that are blocked given the current + target selection
  forced:          ['uuid', ...],   // IDs auto-added by INCLUDE rules
  conflicts: [
    {
      dependentComponentType: 'Engine',
      dependentComponentId:   'uuid',
      targetComponentType:    'Transmission',
      targetComponentId:      'uuid',
      ruleType:               'EXCLUDE',
      reason: 'Engine (V8 Sport) excludes Transmission (Manual)'
    }
  ]
}
```

### Full Implementation

```js
// src/engine/compatibility.js
'use strict';

/**
 * Evaluate the compatibility of a target selection against all active rules.
 */
function evaluateCompatibility(currentSelections, targetSelection, rules) {
  // Build the full active selection set: current confirmed + the proposed target
  const activeSelections = buildActiveSelectionSet(currentSelections, targetSelection);

  const disabled  = new Set();
  const forced    = new Set();
  const conflicts = [];

  // Evaluate every rule whose dependent component is currently selected
  for (const rule of rules) {
    const dependentKey = rule.dependentComponentType;
    const isDepActive  = isComponentSelected(activeSelections, dependentKey, rule.dependentComponentId);

    if (!isDepActive) continue; // this rule's trigger is not active — skip

    if (rule.ruleType === 'EXCLUDE') {
      disabled.add(rule.targetComponentId);

      // If the targetSelection itself is now excluded, record a conflict
      if (
        targetSelection &&
        rule.targetComponentType === targetSelection.type &&
        rule.targetComponentId   === targetSelection.id
      ) {
        conflicts.push({
          dependentComponentType: rule.dependentComponentType,
          dependentComponentId:   rule.dependentComponentId,
          targetComponentType:    rule.targetComponentType,
          targetComponentId:      rule.targetComponentId,
          ruleType:               'EXCLUDE',
          reason: `${rule.dependentComponentType} excludes ${rule.targetComponentType} (ID: ${rule.targetComponentId})`
        });
      }
    }

    if (rule.ruleType === 'INCLUDE') {
      forced.add(rule.targetComponentId);
      // Cascade: re-evaluate rules triggered by this newly forced option
      cascadeIncludes(rule.targetComponentType, rule.targetComponentId, rules, forced, disabled, new Set());
    }
  }

  const isValid = targetSelection
    ? !disabled.has(targetSelection.id)
    : true;

  return {
    isValid,
    allowed:   [],      // populated by the Service layer from the full options list
    disabled:  Array.from(disabled),
    forced:    Array.from(forced),
    conflicts
  };
}

/**
 * Recursively follow INCLUDE chains to find all transitively forced options.
 * Tracks visited nodes to prevent infinite loops on circular rule definitions.
 */
function cascadeIncludes(componentType, componentId, rules, forced, disabled, visited) {
  const visitKey = `${componentType}:${componentId}`;
  if (visited.has(visitKey)) return; // cycle detected — stop this branch
  visited.add(visitKey);

  for (const rule of rules) {
    if (
      rule.dependentComponentType === componentType &&
      rule.dependentComponentId   === componentId
    ) {
      if (rule.ruleType === 'INCLUDE') {
        forced.add(rule.targetComponentId);
        cascadeIncludes(rule.targetComponentType, rule.targetComponentId, rules, forced, disabled, visited);
      }
      if (rule.ruleType === 'EXCLUDE') {
        disabled.add(rule.targetComponentId);
      }
    }
  }
}

/**
 * Check if a component type + ID is present in the active selection set.
 * Handles both single-value selections (Engine) and multi-value (packageIds array).
 */
function isComponentSelected(activeSelections, componentType, componentId) {
  const value = activeSelections[componentType];
  if (Array.isArray(value)) return value.includes(componentId);
  return value === componentId;
}

/**
 * Merge the current confirmed selections with the proposed target selection
 * into a unified lookup map keyed by component type.
 */
function buildActiveSelectionSet(currentSelections, targetSelection) {
  const set = { ...currentSelections };
  if (targetSelection) {
    if (targetSelection.type === 'Package') {
      set['Package'] = [...(set['Package'] || []), targetSelection.id];
    } else {
      set[targetSelection.type] = targetSelection.id;
    }
  }
  return set;
}

module.exports = { evaluateCompatibility };
```

---

## `pricing.js` — The Deterministic Price Calculator

### Responsibility

`pricing.js` accepts the base model price and the prices of all selected components, then aggregates the full cost applying any regional or dealer-specific rules if provided. It always returns an itemized `PriceBreakdown` object — never just a total.

The function signature maps directly to the pricing formula defined in the spec:
**Base + Engine + Trim + Exterior + Interior + Wheels + Packages**

### Function Signature

```js
/**
 * Calculate the full price breakdown for a given configuration.
 *
 * @param {number}  basePrice    - The VehicleModel base_price (as a number).
 * @param {Object}  components   - Selected component objects with their price fields.
 *                                 Each component must be a plain object with a `price` property.
 * @param {Object}  [overrides]  - Optional regional or dealer-specific adjustments.
 *
 * @returns {Object} PriceBreakdown
 */
function calculatePrice(basePrice, components, overrides = {}) { ... }
```

### PriceBreakdown Shape

```js
{
  base:          89990.00,
  engine:         8000.00,
  trim:           5000.00,
  exterior:       1500.00,
  interior:       2000.00,
  wheels:         1200.00,
  packages:       3500.00,   // sum of all selected packages
  subtotal:      111190.00,
  dealerDiscount: -2000.00,  // 0 if no dealer override provided
  regionalTax:    8895.20,   // 0 if no regional override provided
  total:         118085.20
}
```

### Full Implementation

```js
// src/engine/pricing.js
'use strict';

/**
 * Calculate the full itemized price for a vehicle configuration.
 * All arithmetic is performed in integer cents to avoid floating-point drift.
 */
function calculatePrice(basePrice, components, overrides = {}) {
  const {
    engine,
    transmission,
    trim,
    exterior,   // Color
    interior,
    wheels,
    packages = []
  } = components;

  // Convert everything to integer cents for safe arithmetic
  const baseCents         = toCents(basePrice);
  const engineCents       = toCents(engine?.price       ?? 0);
  const transmissionCents = toCents(transmission?.price ?? 0);
  const trimCents         = toCents(trim?.price         ?? 0);
  const exteriorCents     = toCents(exterior?.price     ?? 0);
  const interiorCents     = toCents(interior?.price     ?? 0);
  const wheelsCents       = toCents(wheels?.price       ?? 0);
  const packagesCents     = packages.reduce((sum, pkg) => sum + toCents(pkg?.price ?? 0), 0);

  const subtotalCents = (
    baseCents +
    engineCents +
    transmissionCents +
    trimCents +
    exteriorCents +
    interiorCents +
    wheelsCents +
    packagesCents
  );

  // Apply dealer discount (flat amount in cents, or percentage of subtotal)
  let dealerDiscountCents = 0;
  if (overrides.dealerDiscountFlat) {
    dealerDiscountCents = toCents(overrides.dealerDiscountFlat);
  } else if (overrides.dealerDiscountPercent) {
    dealerDiscountCents = Math.round(subtotalCents * (overrides.dealerDiscountPercent / 100));
  }

  const discountedSubtotalCents = subtotalCents - dealerDiscountCents;

  // Apply regional tax as a percentage of the discounted subtotal
  let regionalTaxCents = 0;
  if (overrides.regionalTaxPercent) {
    regionalTaxCents = Math.round(discountedSubtotalCents * (overrides.regionalTaxPercent / 100));
  }

  const totalCents = discountedSubtotalCents + regionalTaxCents;

  return {
    base:            fromCents(baseCents),
    engine:          fromCents(engineCents),
    transmission:    fromCents(transmissionCents),
    trim:            fromCents(trimCents),
    exterior:        fromCents(exteriorCents),
    interior:        fromCents(interiorCents),
    wheels:          fromCents(wheelsCents),
    packages:        fromCents(packagesCents),
    subtotal:        fromCents(subtotalCents),
    dealerDiscount:  fromCents(-dealerDiscountCents),
    regionalTax:     fromCents(regionalTaxCents),
    total:           fromCents(totalCents)
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a dollar amount (number or string) to integer cents */
function toCents(amount) {
  return Math.round(parseFloat(amount) * 100);
}

/** Convert integer cents back to a 2-decimal-place dollar number */
function fromCents(cents) {
  return parseFloat((cents / 100).toFixed(2));
}

module.exports = { calculatePrice };
```

---

## Unit Tests

Both engine modules must have unit tests that run with **no database connection**. Tests use only plain JavaScript objects as inputs.

### Test File Structure

```
tests/
└── engine/
    ├── compatibility.test.js
    └── pricing.test.js
```

### `compatibility.test.js` — Key Scenarios

```js
// tests/engine/compatibility.test.js
const { evaluateCompatibility } = require('../../src/engine/compatibility');

describe('evaluateCompatibility', () => {

  // Baseline rule fixture: V8 Engine EXCLUDES Manual Transmission
  const v8ExcludesManualRule = {
    dependentComponentType: 'Engine',
    dependentComponentId:   'engine-v8-id',
    targetComponentType:    'Transmission',
    targetComponentId:      'transmission-manual-id',
    ruleType:               'EXCLUDE'
  };

  // INCLUDE rule: Sport Trim forces Sport Handling Package
  const sportTrimIncludesPackage = {
    dependentComponentType: 'Trim',
    dependentComponentId:   'trim-sport-id',
    targetComponentType:    'Package',
    targetComponentId:      'pkg-sport-handling-id',
    ruleType:               'INCLUDE'
  };

  test('returns isValid: true when no rules conflict with target', () => {
    const result = evaluateCompatibility(
      { Engine: 'engine-v4-id' },
      { type: 'Transmission', id: 'transmission-manual-id' },
      [v8ExcludesManualRule]
    );
    expect(result.isValid).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  test('returns isValid: false when EXCLUDE rule blocks the target', () => {
    const result = evaluateCompatibility(
      { Engine: 'engine-v8-id' },
      { type: 'Transmission', id: 'transmission-manual-id' },
      [v8ExcludesManualRule]
    );
    expect(result.isValid).toBe(false);
    expect(result.disabled).toContain('transmission-manual-id');
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].ruleType).toBe('EXCLUDE');
  });

  test('adds targetComponentId to disabled array on EXCLUDE', () => {
    const result = evaluateCompatibility(
      { Engine: 'engine-v8-id' },
      null,
      [v8ExcludesManualRule]
    );
    expect(result.disabled).toContain('transmission-manual-id');
  });

  test('adds targetComponentId to forced array on INCLUDE', () => {
    const result = evaluateCompatibility(
      { Trim: 'trim-sport-id' },
      null,
      [sportTrimIncludesPackage]
    );
    expect(result.forced).toContain('pkg-sport-handling-id');
  });

  test('cascades INCLUDE: A forces B, B forces C', () => {
    const rules = [
      sportTrimIncludesPackage,
      {
        dependentComponentType: 'Package',
        dependentComponentId:   'pkg-sport-handling-id',
        targetComponentType:    'Wheel',
        targetComponentId:      'wheel-20-sport-id',
        ruleType:               'INCLUDE'
      }
    ];
    const result = evaluateCompatibility({ Trim: 'trim-sport-id' }, null, rules);
    expect(result.forced).toContain('pkg-sport-handling-id');
    expect(result.forced).toContain('wheel-20-sport-id');
  });

  test('does not loop infinitely on circular rules', () => {
    const circularRules = [
      { dependentComponentType: 'Engine', dependentComponentId: 'eng-a',
        targetComponentType: 'Trim', targetComponentId: 'trim-b', ruleType: 'INCLUDE' },
      { dependentComponentType: 'Trim', dependentComponentId: 'trim-b',
        targetComponentType: 'Engine', targetComponentId: 'eng-a', ruleType: 'INCLUDE' }
    ];
    expect(() => evaluateCompatibility({ Engine: 'eng-a' }, null, circularRules)).not.toThrow();
  });

  test('returns isValid: true with empty rules array', () => {
    const result = evaluateCompatibility(
      { Engine: 'any-id' },
      { type: 'Wheel', id: 'any-wheel-id' },
      []
    );
    expect(result.isValid).toBe(true);
  });

});
```

### `pricing.test.js` — Key Scenarios

```js
// tests/engine/pricing.test.js
const { calculatePrice } = require('../../src/engine/pricing');

describe('calculatePrice', () => {

  test('returns only base price when no components selected', () => {
    const result = calculatePrice(89990, {});
    expect(result.base).toBe(89990);
    expect(result.total).toBe(89990);
  });

  test('aggregates Base + Engine + Trim + Exterior + Interior + Wheels + Packages', () => {
    const result = calculatePrice(89990, {
      engine:   { price: 8000 },
      trim:     { price: 5000 },
      exterior: { price: 1500 },
      interior: { price: 2000 },
      wheels:   { price: 1200 },
      packages: [{ price: 2000 }, { price: 1500 }]
    });
    expect(result.subtotal).toBe(89990 + 8000 + 5000 + 1500 + 2000 + 1200 + 3500);
    expect(result.total).toBe(result.subtotal);
  });

  test('applies dealer flat discount correctly', () => {
    const result = calculatePrice(89990, { engine: { price: 8000 } }, {
      dealerDiscountFlat: 2000
    });
    expect(result.dealerDiscount).toBe(-2000);
    expect(result.total).toBe(89990 + 8000 - 2000);
  });

  test('applies dealer percentage discount correctly', () => {
    const result = calculatePrice(100000, {}, { dealerDiscountPercent: 5 });
    expect(result.dealerDiscount).toBe(-5000);
    expect(result.total).toBe(95000);
  });

  test('applies regional tax on discounted subtotal, not base', () => {
    const result = calculatePrice(100000, {}, {
      dealerDiscountFlat:  10000,
      regionalTaxPercent:  10
    });
    // Tax should be on 90000, not 100000
    expect(result.regionalTax).toBe(9000);
    expect(result.total).toBe(99000);
  });

  test('returns itemized breakdown with all fields present', () => {
    const result = calculatePrice(89990, {});
    expect(result).toHaveProperty('base');
    expect(result).toHaveProperty('engine');
    expect(result).toHaveProperty('trim');
    expect(result).toHaveProperty('exterior');
    expect(result).toHaveProperty('interior');
    expect(result).toHaveProperty('wheels');
    expect(result).toHaveProperty('packages');
    expect(result).toHaveProperty('subtotal');
    expect(result).toHaveProperty('dealerDiscount');
    expect(result).toHaveProperty('regionalTax');
    expect(result).toHaveProperty('total');
  });

  test('handles null/undefined component prices gracefully', () => {
    const result = calculatePrice(89990, { engine: null, trim: undefined });
    expect(result.engine).toBe(0);
    expect(result.trim).toBe(0);
    expect(result.total).toBe(89990);
  });

  test('no floating-point drift on fractional prices', () => {
    const result = calculatePrice(89990.99, { engine: { price: 0.01 } });
    expect(result.total).toBe(89991.00);
  });

});
```

---

## NPM Test Script

Add to `package.json`:

```json
{
  "scripts": {
    "test":          "jest",
    "test:engine":   "jest tests/engine/",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageThreshold": {
      "global": { "lines": 90 }
    }
  }
}
```

---

## Deliverables Checklist

- [ ] `src/engine/` directory created
- [ ] `src/engine/compatibility.js` implemented with `evaluateCompatibility` function
- [ ] EXCLUDE rules correctly populate the `disabled` array
- [ ] INCLUDE rules correctly populate the `forced` array
- [ ] `cascadeIncludes` follows transitive INCLUDE chains
- [ ] Cycle detection in `cascadeIncludes` prevents infinite loops
- [ ] `src/engine/pricing.js` implemented with `calculatePrice` function
- [ ] Pricing formula: Base + Engine + Trim + Exterior + Interior + Wheels + Packages
- [ ] Dealer flat discount applied correctly
- [ ] Dealer percentage discount applied correctly
- [ ] Regional tax applied on discounted subtotal (not on base price)
- [ ] All arithmetic uses integer cents internally
- [ ] `src/engine/index.js` barrel export created
- [ ] `compatibility.test.js` — minimum 6 test scenarios passing
- [ ] `pricing.test.js` — minimum 8 test scenarios passing
- [ ] `npm test` reports ≥ 90% line coverage on `src/engine/`
- [ ] Zero Express, Sequelize, or I/O imports inside `src/engine/`
