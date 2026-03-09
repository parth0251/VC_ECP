# Phase 4: Frontend Foundation & State Management

**Goal:** Initialize the React/Vite app and set up complex state management for the configurator.

---

## Overview

Phase 4 initializes the complete frontend application and implements its central nervous system — the Zustand store (`useConfiguratorStore.js`). The store is the single source of truth for the entire configuration session. It tracks all selections across the full flow (Model → Engine → Transmission → Trim → Exterior → Interior → Wheels → Packages), and every time a selection changes, it automatically triggers asynchronous calls to the backend validate and price APIs, then uses the responses to lock out incompatible options and update the displayed price in real-time.

---

## Step 1: Initialize the React + Vite App

```bash
npm create vite@latest ecp-frontend -- --template react
cd ecp-frontend
```

Install all required dependencies as specified:

```bash
# State management and routing
npm install react-router-dom zustand axios

# 3D visualization (installed now, used in Phase 5)
npm install @react-three/fiber @react-three/drei three
```

---

## Step 2: Folder Structure

```
src/
├── components/
│   ├── steps/
│   │   ├── StepModel.jsx
│   │   ├── StepEngine.jsx
│   │   ├── StepTransmission.jsx
│   │   ├── StepTrim.jsx
│   │   ├── StepExterior.jsx
│   │   ├── StepInterior.jsx
│   │   ├── StepWheels.jsx
│   │   ├── StepPackages.jsx
│   │   └── StepReview.jsx
│   └── shared/
│       ├── OptionCard.jsx
│       └── PriceSummary.jsx
├── pages/
│   ├── ConfiguratorPage.jsx
│   └── SavedConfigurationsPage.jsx
├── services/
│   └── api.js
├── store/
│   └── useConfiguratorStore.js
├── App.jsx
└── main.jsx
```

---

## Step 3: Axios API Service

**File: `src/services/api.js`**

All backend calls go through this single module. Components and the store import from here — never raw `fetch` or inline Axios calls.

```js
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' }
});

// ── Model / Option fetches ────────────────────────────────────────────────

export const fetchModels = () =>
  client.get('/models').then(r => r.data.data);

export const fetchEngines       = (modelId) => client.get(`/models/${modelId}/engines`).then(r => r.data.data);
export const fetchTransmissions = (modelId) => client.get(`/models/${modelId}/transmissions`).then(r => r.data.data);
export const fetchTrims         = (modelId) => client.get(`/models/${modelId}/trims`).then(r => r.data.data);
export const fetchColors        = (modelId) => client.get(`/models/${modelId}/colors`).then(r => r.data.data);
export const fetchInteriors     = (modelId) => client.get(`/models/${modelId}/interiors`).then(r => r.data.data);
export const fetchWheels        = (modelId) => client.get(`/models/${modelId}/wheels`).then(r => r.data.data);
export const fetchPackages      = (modelId) => client.get(`/models/${modelId}/packages`).then(r => r.data.data);

// ── Configuration endpoints ───────────────────────────────────────────────

/**
 * POST /api/configure/validate
 * Returns { isValid, allowed, disabled, forced, conflicts }
 */
export const validateSelection = (currentSelections, targetSelection, signal) =>
  client.post('/configure/validate', { currentSelections, targetSelection }, { signal })
    .then(r => r.data.data);

/**
 * POST /api/configure/price
 * Returns the full PriceBreakdown object
 */
export const fetchPrice = (selections, overrides = {}, signal) =>
  client.post('/configure/price', { selections, overrides }, { signal })
    .then(r => r.data.data);

/**
 * POST /api/configure/save
 * Persists the ConfigurationSnapshot — returns configurationId and price_at_selection
 */
export const saveConfiguration = (selections, clientComputedPrice) =>
  client.post('/configure/save', { selections, clientComputedPrice })
    .then(r => r.data.data);

/**
 * GET /api/configurations
 * Returns the list of saved ConfigurationSnapshots
 */
export const fetchSavedConfigurations = () =>
  client.get('/configurations').then(r => r.data.data);
```

---

## Step 4: The Zustand Store — `useConfiguratorStore.js`

This is the most important file in the frontend. The store manages the full configuration state and coordinates all async interactions with the backend.

**File: `src/store/useConfiguratorStore.js`**

```js
import { create } from 'zustand';
import * as api from '../services/api';

// Holds a reference to the active AbortController so previous
// in-flight validate/price requests can be cancelled on new selections.
let activeAbortController = null;

const useConfiguratorStore = create((set, get) => ({

  // ── State: Selections ──────────────────────────────────────────────────
  // Tracks every selected component ID across the full configuration flow.
  // Flow: Model → Engine → Transmission → Trim → Exterior → Interior → Wheels → Packages
  selections: {
    modelId:         null,
    engineId:        null,
    transmissionId:  null,
    trimId:          null,
    exteriorColorId: null,
    interiorId:      null,
    wheelId:         null,
    packageIds:      []
  },

  // ── State: Available Options ───────────────────────────────────────────
  // All fetchable option lists for the currently selected model
  availableOptions: {
    engines:       [],
    transmissions: [],
    trims:         [],
    colors:        [],
    interiors:     [],
    wheels:        [],
    packages:      []
  },

  // ── State: Compatibility ───────────────────────────────────────────────
  // Updated after every selection by the /validate API response
  compatibility: {
    disabled: [],   // IDs the user cannot select given current state
    forced:   [],   // IDs auto-included by INCLUDE rules
    conflicts: []   // Detailed conflict descriptions for tooltip display
  },

  // ── State: Pricing ─────────────────────────────────────────────────────
  // Updated after every selection by the /price API response
  pricing: {
    breakdown: null,
    total:     0,
    isStale:   false
  },

  // ── State: UI ──────────────────────────────────────────────────────────
  ui: {
    currentStep:  1,
    totalSteps:   9,
    isLoading:    false,
    isSaving:     false,
    error:        null
  },

  // ══════════════════════════════════════════════════════════════════════
  // Actions
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Called once when the user lands on the configurator.
   * Loads all available VehicleModels to display on Step 1.
   */
  loadModels: async () => {
    set(state => ({ ui: { ...state.ui, isLoading: true, error: null } }));
    try {
      const models = await api.fetchModels();
      set(state => ({
        availableOptions: { ...state.availableOptions, models },
        ui: { ...state.ui, isLoading: false }
      }));
    } catch (err) {
      set(state => ({ ui: { ...state.ui, isLoading: false, error: err.message } }));
    }
  },

  /**
   * Called when the user selects a VehicleModel (Step 1).
   * Resets all downstream selections and loads all option categories for the model.
   */
  selectModel: async (modelId) => {
    // Reset the entire selection state when model changes
    set(state => ({
      selections: {
        modelId,
        engineId:        null,
        transmissionId:  null,
        trimId:          null,
        exteriorColorId: null,
        interiorId:      null,
        wheelId:         null,
        packageIds:      []
      },
      compatibility: { disabled: [], forced: [], conflicts: [] },
      pricing:       { breakdown: null, total: 0, isStale: false },
      ui:            { ...state.ui, isLoading: true, error: null, currentStep: 2 }
    }));

    try {
      // Load all option categories in parallel for the selected model
      const [engines, transmissions, trims, colors, interiors, wheels, packages] = await Promise.all([
        api.fetchEngines(modelId),
        api.fetchTransmissions(modelId),
        api.fetchTrims(modelId),
        api.fetchColors(modelId),
        api.fetchInteriors(modelId),
        api.fetchWheels(modelId),
        api.fetchPackages(modelId)
      ]);
      set(state => ({
        availableOptions: { ...state.availableOptions, engines, transmissions, trims, colors, interiors, wheels, packages },
        ui: { ...state.ui, isLoading: false }
      }));
    } catch (err) {
      set(state => ({ ui: { ...state.ui, isLoading: false, error: err.message } }));
    }
  },

  /**
   * The core selection action used for all component choices after model selection.
   * Flow: optimistic set → cancel previous request → call /validate → call /price
   *
   * @param {string} category  - Selection key (e.g. 'engineId', 'wheelId', 'packageIds')
   * @param {string} id        - The UUID of the selected option
   * @param {string} type      - Component type string for the validate payload (e.g. 'Engine')
   */
  selectOption: async (category, id, type) => {
    const current = get().selections;

    // Cancel any previous in-flight validate/price request
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();
    const signal = activeAbortController.signal;

    // Build the new selection state optimistically (before API confirmation)
    let updatedSelections;
    if (category === 'packageIds') {
      const alreadySelected = current.packageIds.includes(id);
      updatedSelections = {
        ...current,
        packageIds: alreadySelected
          ? current.packageIds.filter(pkgId => pkgId !== id)
          : [...current.packageIds, id]
      };
    } else {
      updatedSelections = { ...current, [category]: id };
    }

    set(state => ({
      ui: { ...state.ui, isLoading: true, error: null },
      pricing: { ...state.pricing, isStale: true }
    }));

    try {
      // Step 1: POST /api/configure/validate
      // Passes current selections + the new target through compatibility.js
      const compatResult = await api.validateSelection(
        current,
        { type, id },
        signal
      );

      if (!compatResult.isValid) {
        // Selection blocked — do not apply it, surface the conflict
        set(state => ({
          compatibility: {
            disabled:  compatResult.disabled,
            forced:    compatResult.forced,
            conflicts: compatResult.conflicts
          },
          ui: {
            ...state.ui,
            isLoading: false,
            error: compatResult.conflicts[0]?.reason ?? 'This option is not compatible with your current selections.'
          }
        }));
        return;
      }

      // Step 2: Commit the selection and update compatibility state
      set({
        selections:    updatedSelections,
        compatibility: {
          disabled:  compatResult.disabled,
          forced:    compatResult.forced,
          conflicts: compatResult.conflicts
        }
      });

      // Step 3: POST /api/configure/price
      // Recalculate the price with the now-committed selections
      const priceResult = await api.fetchPrice(updatedSelections, {}, signal);

      set(state => ({
        pricing: {
          breakdown: priceResult,
          total:     priceResult.total,
          isStale:   false
        },
        ui: { ...state.ui, isLoading: false }
      }));

    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        // Request was superseded by a newer selection — silent exit
        return;
      }
      set(state => ({
        ui: { ...state.ui, isLoading: false, error: err.message }
      }));
    }
  },

  /**
   * POST /api/configure/save
   * Sends the final selections and client-computed price to the backend.
   * The backend re-validates and re-prices before persisting the ConfigurationSnapshot.
   */
  saveConfiguration: async () => {
    const { selections, pricing } = get();
    set(state => ({ ui: { ...state.ui, isSaving: true, error: null } }));

    try {
      const result = await api.saveConfiguration(selections, pricing.total);
      set(state => ({ ui: { ...state.ui, isSaving: false } }));
      return result; // { configurationId, price_at_selection, createdAt }
    } catch (err) {
      set(state => ({
        ui: { ...state.ui, isSaving: false, error: err.message }
      }));
      throw err;
    }
  },

  // ── Step Navigation ────────────────────────────────────────────────────
  nextStep: () => set(state => ({
    ui: { ...state.ui, currentStep: Math.min(state.ui.currentStep + 1, state.ui.totalSteps) }
  })),

  prevStep: () => set(state => ({
    ui: { ...state.ui, currentStep: Math.max(state.ui.currentStep - 1, 1) }
  })),

  goToStep: (step) => set(state => ({
    ui: { ...state.ui, currentStep: step }
  })),

  // ── Utility ────────────────────────────────────────────────────────────
  clearError: () => set(state => ({ ui: { ...state.ui, error: null } }))

}));

export default useConfiguratorStore;
```

---

## Step 5: React Router Setup

**File: `src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ConfiguratorPage       from './pages/ConfiguratorPage';
import SavedConfigurationsPage from './pages/SavedConfigurationsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Navigate to="/configure" replace />} />
        <Route path="/configure"     element={<ConfiguratorPage />} />
        <Route path="/configurations" element={<SavedConfigurationsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**File: `src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Step 6: ConfiguratorPage — Step Router

**File: `src/pages/ConfiguratorPage.jsx`**

```jsx
import useConfiguratorStore from '../store/useConfiguratorStore';
import StepModel        from '../components/steps/StepModel';
import StepEngine       from '../components/steps/StepEngine';
import StepTransmission from '../components/steps/StepTransmission';
import StepTrim         from '../components/steps/StepTrim';
import StepExterior     from '../components/steps/StepExterior';
import StepInterior     from '../components/steps/StepInterior';
import StepWheels       from '../components/steps/StepWheels';
import StepPackages     from '../components/steps/StepPackages';
import StepReview       from '../components/steps/StepReview';
import PriceSummary     from '../components/shared/PriceSummary';

const STEPS = [
  StepModel, StepEngine, StepTransmission, StepTrim,
  StepExterior, StepInterior, StepWheels, StepPackages, StepReview
];

export default function ConfiguratorPage() {
  const currentStep = useConfiguratorStore(s => s.ui.currentStep);
  const StepComponent = STEPS[currentStep - 1];

  return (
    <div className="configurator-page">
      <div className="step-area">
        <StepComponent />
      </div>
      <aside className="price-sidebar">
        <PriceSummary />
      </aside>
    </div>
  );
}
```

---

## Step 7: Shared `OptionCard` Component

The `OptionCard` reads the `compatibility.disabled` array from the store and renders the option as grayed-out and non-interactive when it is blocked.

**File: `src/components/shared/OptionCard.jsx`**

```jsx
import useConfiguratorStore from '../../store/useConfiguratorStore';

export default function OptionCard({ option, isSelected, onSelect }) {
  const disabled = useConfiguratorStore(s => s.compatibility.disabled);
  const isDisabled = disabled.includes(option.id);

  return (
    <div
      className={`option-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
      style={{ opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
      onClick={() => { if (!isDisabled) onSelect(option.id); }}
    >
      {option.image_url && <img src={option.image_url} alt={option.name} />}
      <p className="option-name">{option.name}</p>
      {option.price > 0 && (
        <p className="option-price">+${Number(option.price).toLocaleString()}</p>
      )}
      {isDisabled && (
        <span className="disabled-tooltip">Not compatible with current selections</span>
      )}
    </div>
  );
}
```

---

## Step 8: `PriceSummary` Component

**File: `src/components/shared/PriceSummary.jsx`**

```jsx
import useConfiguratorStore from '../../store/useConfiguratorStore';

export default function PriceSummary() {
  const { breakdown, total, isStale } = useConfiguratorStore(s => s.pricing);
  const isLoading = useConfiguratorStore(s => s.ui.isLoading);

  return (
    <div className="price-summary">
      <h3>Configuration Price</h3>
      {isLoading && <p className="loading-text">Recalculating…</p>}
      {breakdown && (
        <ul className="price-breakdown">
          <li><span>Base Price</span>     <span>${breakdown.base.toLocaleString()}</span></li>
          {breakdown.engine > 0       && <li><span>Engine</span>       <span>+${breakdown.engine.toLocaleString()}</span></li>}
          {breakdown.transmission > 0 && <li><span>Transmission</span><span>+${breakdown.transmission.toLocaleString()}</span></li>}
          {breakdown.trim > 0         && <li><span>Trim</span>         <span>+${breakdown.trim.toLocaleString()}</span></li>}
          {breakdown.exterior > 0     && <li><span>Exterior</span>     <span>+${breakdown.exterior.toLocaleString()}</span></li>}
          {breakdown.interior > 0     && <li><span>Interior</span>     <span>+${breakdown.interior.toLocaleString()}</span></li>}
          {breakdown.wheels > 0       && <li><span>Wheels</span>       <span>+${breakdown.wheels.toLocaleString()}</span></li>}
          {breakdown.packages > 0     && <li><span>Packages</span>     <span>+${breakdown.packages.toLocaleString()}</span></li>}
          {breakdown.dealerDiscount !== 0 && <li><span>Dealer Discount</span><span>${breakdown.dealerDiscount.toLocaleString()}</span></li>}
          {breakdown.regionalTax > 0  && <li><span>Regional Tax</span> <span>+${breakdown.regionalTax.toLocaleString()}</span></li>}
        </ul>
      )}
      <div className={`price-total ${isStale ? 'stale' : ''}`}>
        <strong>Total</strong>
        <strong>${total.toLocaleString()}</strong>
      </div>
    </div>
  );
}
```

---

## Step 9: Example Step Component — `StepEngine.jsx`

All step components follow the same pattern: read available options and current selections from the store, render `OptionCard` for each, and call `selectOption` on click.

**File: `src/components/steps/StepEngine.jsx`**

```jsx
import useConfiguratorStore from '../../store/useConfiguratorStore';
import OptionCard from '../shared/OptionCard';

export default function StepEngine() {
  const engines       = useConfiguratorStore(s => s.availableOptions.engines);
  const selectedId    = useConfiguratorStore(s => s.selections.engineId);
  const selectOption  = useConfiguratorStore(s => s.selectOption);
  const nextStep      = useConfiguratorStore(s => s.nextStep);
  const isLoading     = useConfiguratorStore(s => s.ui.isLoading);
  const error         = useConfiguratorStore(s => s.ui.error);

  return (
    <div className="step step-engine">
      <h2>Step 2 — Choose Your Engine</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="options-grid">
        {engines.map(engine => (
          <OptionCard
            key={engine.id}
            option={engine}
            isSelected={engine.id === selectedId}
            onSelect={(id) => selectOption('engineId', id, 'Engine')}
          />
        ))}
      </div>
      <div className="step-nav">
        <button onClick={nextStep} disabled={!selectedId || isLoading}>
          Next: Transmission →
        </button>
      </div>
    </div>
  );
}
```

---

## Vite Environment Configuration

**File: `.env`**

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Deliverables Checklist

- [ ] Vite + React project initialized
- [ ] `react-router-dom`, `zustand`, `axios` installed
- [ ] `@react-three/fiber`, `@react-three/drei`, `three` installed (for Phase 5)
- [ ] Folder structure: `components/`, `pages/`, `services/`, `store/` created
- [ ] `src/services/api.js` — Axios instance with all API call functions
- [ ] `src/store/useConfiguratorStore.js` — Zustand store created
- [ ] Store state: `selections`, `availableOptions`, `compatibility`, `pricing`, `ui`
- [ ] `loadModels` action fetches and stores all VehicleModels
- [ ] `selectModel` action resets all downstream selections and loads all option categories
- [ ] `selectOption` action triggers `POST /api/configure/validate` on every selection
- [ ] `selectOption` commits selection only if `isValid: true` from backend
- [ ] `selectOption` triggers `POST /api/configure/price` after a valid selection is committed
- [ ] AbortController cancels superseded in-flight requests on rapid selections
- [ ] `compatibility.disabled` array correctly blocks incompatible options in `OptionCard`
- [ ] `saveConfiguration` action calls `POST /api/configure/save`
- [ ] `src/App.jsx` with React Router routes for `/configure` and `/configurations`
- [ ] `ConfiguratorPage.jsx` renders the correct step component based on `ui.currentStep`
- [ ] `OptionCard.jsx` grays out disabled options and ignores click events on them
- [ ] `PriceSummary.jsx` displays real-time itemized breakdown from store
- [ ] `StepEngine.jsx` (and all step components) read from store and call `selectOption`
