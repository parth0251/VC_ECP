---
trigger: always_on
---

Rule: Enterprise Car Configuration Platform (ECP) Core Mandates

**1. Source of Truth**

* The file Enterprise Car Configuration Platform3.md` is the **Definitive Source of Truth**.
* The agent **MUST** cross-reference this file before writing, modifying, or deleting any code.
* If a requested task contradicts the PRD, the agent must flag the conflict to the user before proceeding.

**2. Tech Stack Constraints**

* **Backend:** Node.js with Express (Modular "modules/" folder pattern).
* **ORM:** Sequelize.
* **Database:** PostgreSQL.
* **Frontend:** React (Vite) with feature-based architecture.
* **Auth:** JWT with Access/Refresh token logic and Role-Based Access Control (RBAC).
* **Validation:** Zod or Joi for all request/input validation.

**3. Architectural Standards**

* **No .sync():** Database changes must strictly use Sequelize Migration files.
* **Logic Isolation:** Business logic (Pricing Engine, Compatibility Engine) must reside in `src/engine/` as pure, testable functions, separate from Controllers and Routes.
* **Code Quality:** Use Service-Controller-Route pattern. No "dummy" shortcuts or hardcoded configurations.
* **Audit Ready:** Every configuration snapshot must include `price_at_selection` to ensure historical accuracy.

**4. Operational Behavior**

* **Plan First:** For complex tasks, the agent must present an "Implementation Plan" and wait for user approval before writing files.
* **Incremental Context:** When performing tasks, the agent must index the relevant directory to ensure it follows existing naming conventions and patterns.