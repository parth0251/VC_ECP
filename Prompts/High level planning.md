# Enterprise Car Configuration Platform (ECP) - Rebuild Prompts

To recreate this project from scratch, use the following prompts. They are designed to guide an AI agent (or yourself) through the entire architecture, starting from high-level objectives down to a structured 5-phase implementation plan.

---

## High-Level Prompt (The "Mega Prompt")
*Use this prompt to set the overall system context and rules before starting the phases.*

> **System Context & Constraints**
> You are an expert Full-Stack Architect tasked with building an **Enterprise Car Configuration Platform (ECP)** inspired by Tesla and BMW configurators. 
> 
> **Tech Stack:**
> - **Backend:** Node.js, Express, PostgreSQL, Sequelize.
> - **Frontend:** React (Vite), React-Three-Fiber (for 3D), Zustand (state management).
> 
> **Core Architecture Rules:**
> 1. Strict separation of concerns: Business logic (Pricing & Compatibility) must reside in a pure `src/engine/` folder separate from Controllers.
> 2. Database changes must strictly use Sequelize migrations (No `.sync()`).
> 3. Validation: Use standard validation (e.g., Zod/Joi) for all API inputs.
> 4. Flow: Model -> Engine -> Transmission -> Trim -> Exterior -> Interior -> Wheels -> Packages -> Review & Save.
> 5. The Pricing mechanism must be ACID compliant and calculate incremental updates (Base + Engine + Trim + Options).
> 
> Acknowledge these constraints. I will guide you through the development in 5 distinct phases.

---

## Phase 1: Backend Foundation & Database Schema
*Goal: Initialize the Node app, configure Sequelize schemas, and establish the data layer.*

> **Phase 1: Backend Foundation & PostgreSQL Database Architecture**
> 1. Initialize a new Node.js project for the backend. Install Express, Sequelize, pg, and dotenv.
> 2. Set up the Sequelize configuration with connection pooling for PostgreSQL to handle high-traffic environments.
> 3. Create strictly versioned Sequelize migration files (`up` and `down` methods) and models for the following relational entities. Ensure NO `.sync()` methods are used anywhere in the codebase:
>    - `VehicleModel`: e.g., Sedan, SUV (Must include `base_price`).
>    - Core Components: `Engine`, `Transmission`, `Trim`. These must have associated prices and a `modelId` foreign key.
>    - Options: `Color` (Exterior), `Interior`, `Wheel`, `Package`. Group these intelligently (e.g., packages having many-to-many relationships with smaller sub-features).
>    - `Rule`: The engine constraint table. Columns should define `dependentComponentType`/`Id`, `targetComponentType`/`Id`, and the `ruleType` (e.g., "INCLUDE", "EXCLUDE"). For instance, "If Trim=Sport, Exclude Standard Wheels".
>    - `ConfigurationSnapshot`: To save the user configurations. It must serialize the entire selection payload and strictly enforce a `price_at_selection` field for financial audit accuracy.
> 4. Constraints & Relationships: Apply `ON DELETE CASCADE` appropriately for deeply nested configurations, but restrict deletion on audit tables like `ConfigurationSnapshot`. Use `STRING` for IDs in JSON responses but potentially `UUID`s for primary keys in Postgres.
> 5. Seeder Scripts: Write robust Sequelize seeders. Provide realistic, hierarchical sample data for at least two vehicle models (e.g., Model s, Model X). Create a sophisticated web of `Rule` entries for options that demonstrate 3-4 levels of complex interdependencies (e.g., A Trim requiring a Package, which then limits the available External Colors).
> Provide all setup code, model schemas, relationships, and migration files.

---

## Phase 2: Core Business Logic (Pricing & Compatibility Engine)
*Goal: Build pure functions to process constraints, dependencies, and dynamic pricing.*

> **Phase 2: Business Logic Engine**
> Following the architectural mandate, create a `src/engine/` directory on the backend.
> 1. Implement `compatibility.js`: A specialized engine to evaluate configuration rules. It must accept a current state of selections and a target selection, evaluating inclusions and exclusions. It should reject invalid combinations (e.g., "V8 Engine cannot have Manual Transmission").
> 2. Implement `pricing.js`: A deterministic, real-time pricing calculator. It should take the base model price and aggregate the cost of the selected Engine, Trim, Exterior, Interior, Wheels, and Packages, applying any regional or dealer-specific rules if provided.
> 3. Write purely testable functions independent of Express request/response objects.
> Provide the implementation for these engine modules.

---

## Phase 3: REST API & Controller Layer
*Goal: Bridge the database and the engine to the frontend via secure, validated API endpoints.*

> **Phase 3: API Architecture & Endpoints**
> Set up the Express routing and controller layer. Implement the Service-Controller-Route pattern.
> 1. Define routes to fetch available options per category (Models, Engines, Trims, etc.).
> 2. Create a `/api/configure/validate` endpoint that receives the current user selection, passes it through the `compatibility.js` engine, and returns arrays of `allowed` and `disabled` subsequent options based on rules.
> 3. Create a `/api/configure/price` endpoint to return the dynamically calculated price.
> 4. Create a `/api/configure/save` endpoint to securely save the final `ConfigurationSnapshot`, strictly demanding validation of the final price and selected parts.
> Provide the routing setup, controllers, and validation middlewares.

---

## Phase 4: Frontend Foundation & State Management
*Goal: Initialize the React/Vite app and set up complex state management for the configurator.*

> **Phase 4: Frontend Framework & Zustand Store**
> 1. Initialize a React application using Vite. Install React Router, Zustand, and Axios.
> 2. Set up the folder structure (`components`, `pages`, `services`, `store`).
> 3. Create a Zustand store (`useConfiguratorStore.js`) to handle the robust configuration state. It must track the selected Model, Engine, Trim, Colors, etc.
> 4. Implement actions inside the store to update selections. Whenever a selection updates, trigger an asynchronous call to the backend validate/pricing APIs and update the UI state to lock out incompatible options and update the displayed price.
> Provide the setup for the Vite app and the fully implemented Zustand store.

---

## Phase 5: UI Implementation & 3D Visualization
*Goal: Build the interactive user interface and integrate the 3D car model viewer.*

> **Phase 5: User Interface UI & 3D Integration**
> 1. Build a multi-step configuration UI (Step 1: Model, Step 2: Engine, up to Review & Save). Display options dynamically. Gray out or disable options marked as restricted by the backend validation.
> 2. Install `@react-three/fiber` and `@react-three/drei`. Create a `Configurator3DPage.jsx` component.
> 3. Build a 3D scene that dynamically loads different geometries or materials based on the Zustand store state (e.g., change the car color when the user selects a new exterior paint, or swap wheel nodes).
> 4. Create a `SavedConfigurationsPage.jsx` where users can view their past snapshots.
> Provide the React components for the UI flow and the core Three.js visualization component.
