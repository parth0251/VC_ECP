# Phase 5: UI Implementation & 3D Visualization

**Goal:** Build the interactive user interface and integrate the 3D car model viewer.

---

## Overview

Phase 5 completes the user-facing application. It builds the full multi-step configuration UI — with all options dynamically rendered and incompatible choices grayed out based on backend validation — and integrates the 3D car viewer into the experience. The 3D scene is driven entirely by the Zustand store state: selecting a new exterior color, swapping wheel geometry, or changing a trim updates the 3D model in real-time. A `SavedConfigurationsPage.jsx` lets users review all past `ConfigurationSnapshot` records.

Two key components are created in this phase:
- **`Configurator3DPage.jsx`** — the main configurator page embedding the live 3D viewer
- **`SavedConfigurationsPage.jsx`** — the snapshot history page

---

## Step 1: Complete All Step Components

Each step follows the same pattern established in Phase 4: read available options and compatibility state from the Zustand store, render an option for each item, and gray out any IDs present in `compatibility.disabled`.

### Step Component Overview

| Step | Component File | `selectOption` category | type string |
|------|---------------|------------------------|-------------|
| 1 | `StepModel.jsx` | calls `selectModel()` | — |
| 2 | `StepEngine.jsx` | `engineId` | `'Engine'` |
| 3 | `StepTransmission.jsx` | `transmissionId` | `'Transmission'` |
| 4 | `StepTrim.jsx` | `trimId` | `'Trim'` |
| 5 | `StepExterior.jsx` | `exteriorColorId` | `'Color'` |
| 6 | `StepInterior.jsx` | `interiorId` | `'Interior'` |
| 7 | `StepWheels.jsx` | `wheelId` | `'Wheel'` |
| 8 | `StepPackages.jsx` | `packageIds` | `'Package'` |
| 9 | `StepReview.jsx` | calls `saveConfiguration()` | — |

---

### `StepModel.jsx`

```jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useConfiguratorStore from '../../store/useConfiguratorStore';

export default function StepModel() {
  const models       = useConfiguratorStore(s => s.availableOptions.models ?? []);
  const selectedId   = useConfiguratorStore(s => s.selections.modelId);
  const loadModels   = useConfiguratorStore(s => s.loadModels);
  const selectModel  = useConfiguratorStore(s => s.selectModel);
  const isLoading    = useConfiguratorStore(s => s.ui.isLoading);

  useEffect(() => { loadModels(); }, []);

  return (
    <div className="step step-model">
      <h2>Step 1 — Select Your Vehicle</h2>
      {isLoading && <p>Loading models…</p>}
      <div className="options-grid">
        {models.map(model => (
          <div
            key={model.id}
            className={`option-card model-card ${model.id === selectedId ? 'selected' : ''}`}
            onClick={() => selectModel(model.id)}
          >
            <h3>{model.name}</h3>
            <p className="base-price">From ${Number(model.base_price).toLocaleString()}</p>
            <p>{model.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### `StepTransmission.jsx`

```jsx
import useConfiguratorStore from '../../store/useConfiguratorStore';
import OptionCard from '../shared/OptionCard';

export default function StepTransmission() {
  const transmissions = useConfiguratorStore(s => s.availableOptions.transmissions);
  const selectedId    = useConfiguratorStore(s => s.selections.transmissionId);
  const selectOption  = useConfiguratorStore(s => s.selectOption);
  const nextStep      = useConfiguratorStore(s => s.nextStep);
  const prevStep      = useConfiguratorStore(s => s.prevStep);
  const isLoading     = useConfiguratorStore(s => s.ui.isLoading);
  const error         = useConfiguratorStore(s => s.ui.error);

  return (
    <div className="step step-transmission">
      <h2>Step 3 — Select Transmission</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="options-grid">
        {transmissions.map(t => (
          <OptionCard
            key={t.id}
            option={t}
            isSelected={t.id === selectedId}
            onSelect={(id) => selectOption('transmissionId', id, 'Transmission')}
          />
        ))}
      </div>
      <div className="step-nav">
        <button onClick={prevStep}>← Back</button>
        <button onClick={nextStep} disabled={!selectedId || isLoading}>Next: Trim →</button>
      </div>
    </div>
  );
}
```

---

### `StepExterior.jsx`

The exterior color step is displayed alongside the live 3D viewer — selecting a color immediately updates the car's material in the 3D scene.

```jsx
import useConfiguratorStore from '../../store/useConfiguratorStore';

export default function StepExterior() {
  const colors       = useConfiguratorStore(s => s.availableOptions.colors);
  const selectedId   = useConfiguratorStore(s => s.selections.exteriorColorId);
  const disabled     = useConfiguratorStore(s => s.compatibility.disabled);
  const selectOption = useConfiguratorStore(s => s.selectOption);
  const nextStep     = useConfiguratorStore(s => s.nextStep);
  const prevStep     = useConfiguratorStore(s => s.prevStep);

  return (
    <div className="step step-exterior">
      <h2>Step 5 — Choose Exterior Color</h2>
      <div className="color-palette">
        {colors.map(color => {
          const isDisabled = disabled.includes(color.id);
          const isSelected = color.id === selectedId;
          return (
            <div
              key={color.id}
              className={`color-swatch ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              style={{
                backgroundColor: color.hex_code,
                opacity: isDisabled ? 0.3 : 1,
                cursor:  isDisabled ? 'not-allowed' : 'pointer'
              }}
              title={isDisabled ? 'Not available with current selections' : color.name}
              onClick={() => { if (!isDisabled) selectOption('exteriorColorId', color.id, 'Color'); }}
            />
          );
        })}
      </div>
      <div className="step-nav">
        <button onClick={prevStep}>← Back</button>
        <button onClick={nextStep} disabled={!selectedId}>Next: Interior →</button>
      </div>
    </div>
  );
}
```

---

### `StepPackages.jsx`

Packages are multi-select. Clicking a selected package deselects it.

```jsx
import useConfiguratorStore from '../../store/useConfiguratorStore';
import OptionCard from '../shared/OptionCard';

export default function StepPackages() {
  const packages     = useConfiguratorStore(s => s.availableOptions.packages);
  const packageIds   = useConfiguratorStore(s => s.selections.packageIds);
  const selectOption = useConfiguratorStore(s => s.selectOption);
  const nextStep     = useConfiguratorStore(s => s.nextStep);
  const prevStep     = useConfiguratorStore(s => s.prevStep);
  const error        = useConfiguratorStore(s => s.ui.error);

  return (
    <div className="step step-packages">
      <h2>Step 8 — Add Packages</h2>
      <p>You may select multiple packages.</p>
      {error && <p className="error-message">{error}</p>}
      <div className="options-grid">
        {packages.map(pkg => (
          <OptionCard
            key={pkg.id}
            option={pkg}
            isSelected={packageIds.includes(pkg.id)}
            onSelect={(id) => selectOption('packageIds', id, 'Package')}
          />
        ))}
      </div>
      <div className="step-nav">
        <button onClick={prevStep}>← Back</button>
        <button onClick={nextStep}>Next: Review →</button>
      </div>
    </div>
  );
}
```

---

### `StepReview.jsx`

The review step displays the full configuration summary and the `saveConfiguration` action.

```jsx
import useConfiguratorStore from '../../store/useConfiguratorStore';
import { useNavigate } from 'react-router-dom';

export default function StepReview() {
  const selections      = useConfiguratorStore(s => s.selections);
  const pricing         = useConfiguratorStore(s => s.pricing);
  const isSaving        = useConfiguratorStore(s => s.ui.isSaving);
  const error           = useConfiguratorStore(s => s.ui.error);
  const saveConfiguration = useConfiguratorStore(s => s.saveConfiguration);
  const goToStep        = useConfiguratorStore(s => s.goToStep);
  const navigate        = useNavigate();

  const handleSave = async () => {
    try {
      await saveConfiguration();
      navigate('/configurations');
    } catch (err) {
      // error already set in store
    }
  };

  return (
    <div className="step step-review">
      <h2>Step 9 — Review & Save</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="review-grid">
        <ReviewRow label="Engine"       value={selections.engineId}        step={2} onEdit={goToStep} />
        <ReviewRow label="Transmission" value={selections.transmissionId}  step={3} onEdit={goToStep} />
        <ReviewRow label="Trim"         value={selections.trimId}          step={4} onEdit={goToStep} />
        <ReviewRow label="Exterior"     value={selections.exteriorColorId} step={5} onEdit={goToStep} />
        <ReviewRow label="Interior"     value={selections.interiorId}      step={6} onEdit={goToStep} />
        <ReviewRow label="Wheels"       value={selections.wheelId}         step={7} onEdit={goToStep} />
      </div>

      {pricing.breakdown && (
        <div className="final-price">
          <span>Total Configuration Price</span>
          <strong>${pricing.total.toLocaleString()}</strong>
        </div>
      )}

      <div className="step-nav">
        <button onClick={() => goToStep(8)} disabled={isSaving}>← Back to Packages</button>
        <button className="save-btn" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, step, onEdit }) {
  return (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span className="review-value">{value ?? 'Not selected'}</span>
      <button className="edit-link" onClick={() => onEdit(step)}>Edit</button>
    </div>
  );
}
```

---

## Step 2: `Configurator3DPage.jsx`

This is the main page component that combines the multi-step wizard with the live 3D viewer. The 3D scene reads directly from the Zustand store — it has no local state of its own.

**File: `src/pages/Configurator3DPage.jsx`**

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import useConfiguratorStore from '../store/useConfiguratorStore';
import ConfiguratorPage from './ConfiguratorPage';

export default function Configurator3DPage() {
  return (
    <div className="configurator-3d-page">
      {/* Left panel: multi-step wizard */}
      <div className="wizard-panel">
        <ConfiguratorPage />
      </div>

      {/* Right panel: live 3D viewer */}
      <div className="canvas-panel">
        <Canvas
          camera={{ position: [0, 1.5, 5], fov: 45 }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
            <Environment preset="city" />
            <CarModel />
            <OrbitControls
              enablePan={false}
              minDistance={3}
              maxDistance={10}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
```

---

## Step 3: `CarModel` — Store-Driven 3D Component

The `CarModel` component subscribes to the Zustand store and updates the 3D scene whenever the user selects a new exterior color or wheel. It never holds its own state — all values come from the store.

**File: `src/components/three/CarModel.jsx`**

```jsx
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import useConfiguratorStore from '../../store/useConfiguratorStore';
import WheelNodes from './WheelNodes';

// Preload the base car GLTF as early as possible
useGLTF.preload('/models/car-base.glb');

export default function CarModel() {
  const { scene }       = useGLTF('/models/car-base.glb');
  const exteriorColorId = useConfiguratorStore(s => s.selections.exteriorColorId);
  const wheelId         = useConfiguratorStore(s => s.selections.wheelId);
  const availableColors = useConfiguratorStore(s => s.availableOptions.colors ?? []);

  const bodyMaterialRef = useRef(null);
  const targetColorRef  = useRef(new THREE.Color(0xffffff));

  // Find the body mesh in the GLTF scene and grab its material reference
  useEffect(() => {
    scene.traverse((node) => {
      if (node.isMesh && node.name === 'CarBody') {
        bodyMaterialRef.current = node.material;
      }
    });
  }, [scene]);

  // When the user selects a new exterior color, set the target for lerp
  useEffect(() => {
    if (!exteriorColorId) return;
    const selected = availableColors.find(c => c.id === exteriorColorId);
    if (selected?.hex_code) {
      targetColorRef.current.set(selected.hex_code);
    }
  }, [exteriorColorId, availableColors]);

  // Smoothly animate toward the target color on every frame
  useFrame(() => {
    if (bodyMaterialRef.current) {
      bodyMaterialRef.current.color.lerp(targetColorRef.current, 0.08);
    }
  });

  return (
    <group>
      <primitive object={scene} />
      <WheelNodes wheelId={wheelId} />
    </group>
  );
}
```

---

## Step 4: `WheelNodes` — Conditional Geometry Swap

**File: `src/components/three/WheelNodes.jsx`**

```jsx
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';

// Maps each Wheel option ID (from the database) to a GLTF file path
// These IDs correspond to the UUIDs seeded in Phase 1
const WHEEL_MODEL_MAP = {
  'standard-18-uuid': '/models/wheels/standard-18.glb',
  'sport-20-uuid':    '/models/wheels/sport-20.glb',
  'carbon-21-uuid':   '/models/wheels/carbon-21.glb'
};

// Wheel positions: front-left, front-right, rear-left, rear-right
const WHEEL_POSITIONS = [
  [-0.85, 0.05,  1.45],
  [ 0.85, 0.05,  1.45],
  [-0.85, 0.05, -1.45],
  [ 0.85, 0.05, -1.45]
];

export default function WheelNodes({ wheelId }) {
  const modelPath = WHEEL_MODEL_MAP[wheelId];
  if (!modelPath) return null;
  return <WheelGeometry modelPath={modelPath} />;
}

// Inner component is only rendered when a valid modelPath exists
// so useGLTF is only called with a real path
function WheelGeometry({ modelPath }) {
  const { scene } = useGLTF(modelPath);

  return (
    <>
      {WHEEL_POSITIONS.map((position, i) => {
        // Clone the scene so each wheel is an independent object
        const clone = useMemo(() => scene.clone(), [scene]);
        // Mirror left-side wheels on the X axis
        const scaleX = position[0] < 0 ? -1 : 1;
        return (
          <primitive
            key={i}
            object={clone}
            position={position}
            scale={[scaleX, 1, 1]}
          />
        );
      })}
    </>
  );
}
```

---

## Step 5: `SavedConfigurationsPage.jsx`

**File: `src/pages/SavedConfigurationsPage.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSavedConfigurations } from '../services/api';

export default function SavedConfigurationsPage() {
  const [configurations, setConfigurations] = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState(null);
  const navigate                            = useNavigate();

  useEffect(() => {
    fetchSavedConfigurations()
      .then(data => { setConfigurations(data); setIsLoading(false); })
      .catch(err => { setError(err.message); setIsLoading(false); });
  }, []);

  return (
    <div className="saved-configurations-page">
      <header className="page-header">
        <h1>Saved Configurations</h1>
        <button onClick={() => navigate('/configure')}>+ New Configuration</button>
      </header>

      {isLoading && <p>Loading saved configurations…</p>}
      {error     && <p className="error-message">Failed to load: {error}</p>}

      {!isLoading && configurations.length === 0 && (
        <p className="empty-state">
          No saved configurations yet.{' '}
          <button onClick={() => navigate('/configure')}>Start configuring →</button>
        </p>
      )}

      <div className="configurations-list">
        {configurations.map(config => (
          <SnapshotCard key={config.id} config={config} />
        ))}
      </div>
    </div>
  );
}

function SnapshotCard({ config }) {
  // selectionPayload is the full JSONB object saved in Phase 3
  const payload = config.selectionPayload || {};

  return (
    <div className="snapshot-card">
      <div className="snapshot-header">
        <h3>Configuration #{config.id.slice(0, 8)}</h3>
        <span className="snapshot-date">
          {new Date(config.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="snapshot-body">
        <div className="snapshot-selections">
          {payload.engineId        && <p><strong>Engine:</strong>       {payload.engineId}</p>}
          {payload.transmissionId  && <p><strong>Transmission:</strong> {payload.transmissionId}</p>}
          {payload.trimId          && <p><strong>Trim:</strong>         {payload.trimId}</p>}
          {payload.exteriorColorId && <p><strong>Exterior:</strong>     {payload.exteriorColorId}</p>}
          {payload.interiorId      && <p><strong>Interior:</strong>     {payload.interiorId}</p>}
          {payload.wheelId         && <p><strong>Wheels:</strong>       {payload.wheelId}</p>}
        </div>
        <div className="snapshot-price">
          {/* price_at_selection is the audited price from the server at the time of save */}
          <strong>Price at Save</strong>
          <span className="price-value">
            ${Number(config.price_at_selection).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## Step 6: Update App Router

Update `src/App.jsx` to use `Configurator3DPage` as the main configurator route:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Configurator3DPage      from './pages/Configurator3DPage';
import SavedConfigurationsPage from './pages/SavedConfigurationsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Navigate to="/configure" replace />} />
        <Route path="/configure"      element={<Configurator3DPage />} />
        <Route path="/configurations" element={<SavedConfigurationsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Step 7: `vite.config.js`

Ensure `/models/` assets are served as static files:

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  assetsInclude: ['**/*.glb', '**/*.gltf']
});
```

---

## Complete Component Tree

```
App
├── /configure       → Configurator3DPage
│   ├── ConfiguratorPage (wizard panel)
│   │   ├── StepModel
│   │   ├── StepEngine
│   │   ├── StepTransmission
│   │   ├── StepTrim
│   │   ├── StepExterior
│   │   ├── StepInterior
│   │   ├── StepWheels
│   │   ├── StepPackages
│   │   └── StepReview
│   └── Canvas (3D panel)
│       ├── CarModel            ← subscribes to selections.exteriorColorId
│       └── WheelNodes          ← subscribes to selections.wheelId
└── /configurations  → SavedConfigurationsPage
    └── SnapshotCard (per ConfigurationSnapshot)
```

---

## Deliverables Checklist

- [ ] All 9 step components implemented (`StepModel` through `StepReview`)
- [ ] Options displayed dynamically from `availableOptions` in the Zustand store
- [ ] Options in `compatibility.disabled` are grayed out and non-clickable on all steps
- [ ] `StepPackages` supports multi-select toggling via `packageIds` array
- [ ] `StepReview` shows full selection summary with per-step Edit links
- [ ] `StepReview` calls `saveConfiguration()` and navigates to `/configurations` on success
- [ ] `Configurator3DPage.jsx` created with Canvas + wizard panel layout
- [ ] `@react-three/fiber` Canvas with `OrbitControls` and `Environment` from `@react-three/drei`
- [ ] `CarModel.jsx` loads GLTF with `useGLTF` inside `Suspense`
- [ ] `CarModel.jsx` subscribes to `selections.exteriorColorId` from Zustand store
- [ ] Exterior color change animates via `lerp` on `bodyMaterialRef` each frame
- [ ] `WheelNodes.jsx` swaps GLTF geometry based on `selections.wheelId`
- [ ] 3D components hold zero local state — all values sourced from Zustand store
- [ ] `SavedConfigurationsPage.jsx` fetches and renders all saved `ConfigurationSnapshot` records
- [ ] `SnapshotCard` displays `price_at_selection` (the audited server-stamped price)
- [ ] `vite.config.js` configured to proxy `/api` and serve `.glb` assets
- [ ] App router updated to use `Configurator3DPage` for the `/configure` route
