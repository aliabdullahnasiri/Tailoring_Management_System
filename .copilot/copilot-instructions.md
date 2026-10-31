# copoilot-instructions.md

> **Project:** Thread & Ledger / Tailoring Management System (TMS)  
> **Document role:** Persistent technical and product context for human developers, Claude Code, and other coding agents  
> **Version:** 1.0  
> **Updated:** 2026-10-30  
> **Market:** Afghanistan  
> **Delivery model:** Offline-first, initially one tailoring shop on one local computer  
> **Companion documents:** `CLAUDE.md` (engineering rules), `DESIGN.md` (UI/UX system)

---

## 1. Executive summary

TMS is a practical business management application for Afghan tailoring shops. It replaces customer notebooks, loose measurement papers, manually numbered orders, and informal payment records with an organized local system. The application should remain quick, understandable, and reliable for shop owners with limited technical experience.

**Primary promise:** A tailor can find a customer, reuse measurements, register an order, record an advance, follow the work, deliver the clothes, and know the remaining balance without complicated accounting or an internet connection.

**Core business workflow:**

1. Search for an existing customer or register a new one.
2. Choose or create a garment-specific measurement profile.
3. Create an order with one or more garment items, individual quantities, prices, and notes.
4. Save immutable measurement snapshots for the items in the order.
5. Set promised delivery date; optionally record an advance payment.
6. Track status from acceptance through production and readiness.
7. Record additional payments, hand over garments, and issue a receipt.
8. Review overdue orders, outstanding balances, collected payments, and reports.
9. Back up and restore shop data without losing historical integrity.

**Design principle:** Make the most common shop tasks easy first. Expand into inventory, payroll, and advanced production management only when their end-to-end implementation is ready.

## 2. Source of truth and implementation-status policy

This context combines the **inspected project baseline dated 2026-10-27**, the product requirements discussed in this project, and later developer-reported work. It is *not* a fresh inspection of the latest repository branch on 2026-10-30.

Follow this hierarchy:

1. Explicit user request for the current task.
2. Data-preservation and security constraints in `CLAUDE.md`.
3. Actual current repository code, migrations, tests, and verified runtime behavior.
4. Product decisions and verified facts in this document.
5. Target design patterns in `DESIGN.md`.
6. Proposed roadmap features, which are **not** evidence that code already exists.

### Status vocabulary

| Status | Meaning |
| --- | --- |
| `BASELINE VERIFIED` | Present in the previously inspected 2026-10-27 archive or described by its inspected source and README. |
| `DEVELOPER REPORTED` | User has said the feature was subsequently implemented, but it was not reverified against a current checkout here. |
| `PARTIAL / UNVERIFIED` | Some groundwork exists, but completeness cannot be claimed. |
| `PLANNED` | Requested in the PRD/design roadmap, without evidence of end-to-end implementation. |
| `DECISION PENDING` | Requires an explicit product/architecture decision before implementation. |

**Mandatory rule for agents:** Before acting on a module, compare this document with the actual working tree. Update the status only after inspecting the implementation and, ideally, testing it. Never duplicate an existing authentication system, database model, or route merely because an older document called it planned.

## 3. Product scope and supported operating model

### Initial scope

- One local tailoring business.
- A small number of daily operators; initial release was single-user.
- Persistent local database.
- Customers, garment measurements, orders, payments, receipts, reports, settings, backup/restore.
- Ability to operate without internet after installation.
- Low-cost computers, practical printers, and unreliable connections.
- Simple workflow for shops producing Afghan clothing, shirts, trousers, suits, dresses, and related garments.

### Growth direction

- Secure login, owner and employee accounts, role-based access.
- Full Dari and Pashto UI alongside English.
- Detailed tailor assignments and production steps.
- Inventory, fabric consumption, supplier purchasing.
- Tailor wages, employees, payroll, and expenses.
- Partial delivery, more detailed customer ledger.
- Jalali/Gregorian date display preference.
- Multiple branches, optional currency expansion, and more complex integrations **only through separately approved scope and migration design**.

### Out of scope by default

- Public internet hosting or a cloud dependency.
- Full accounting/general ledger, tax filing, or audited profit without sufficient cost data.
- Native mobile apps, ecommerce, WhatsApp automation, SMS delivery, or cloud sync.
- Mandatory license server or online activation.
- Multi-tenant architecture or cross-branch synchronization.
- New framework or database migration that replaces the verified stack.

Do not present an out-of-scope capability as an existing project feature.

## 4. Known technology and repository baseline

The following was recorded from the earlier inspected archive, not guaranteed unchanged in newer branches:

| Layer | Baseline |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Primary frontend entry | `frontend/src/main.tsx` |
| Frontend stylesheet | `frontend/src/style.css` |
| Frontend domain types | `frontend/src/types.ts` |
| Backend | Python FastAPI, Pydantic, SQLAlchemy |
| Backend entry | `backend/app.py` |
| Database | SQLite persisted on the user's computer |
| Migrations | Alembic, `backend/migrations/` |
| Initial revision | `backend/migrations/versions/0001_initial.py` |
| Backend tests | `backend/tests/` |
| Known test files | `backend/tests/test_app.py`, `backend/tests/test_server.py` |
| Frontend commands | Defined in `frontend/package.json` |
| Known launchers | `start.py`, `start-linux-mac.sh`, `Start-Windows.bat` |
| Packaged browser assets | `frontend/dist/` in the inspected archive |

**Do not assume** Tailwind CSS, React Router, TanStack Query, Redux, PostgreSQL, Electron, Docker, or a separate services directory is installed. Read `frontend/package.json`, dependency files, and the current source before choosing libraries or creating folders. Use existing conventions unless a requested feature truly requires a change.

### Current architectural intent

```text
User at tailoring shop
        |
        v
React + TypeScript interface (local browser / application shell)
        |
        v
Local FastAPI server (validation, authorization, business rules)
        |
        v
SQLAlchemy database access
        |
        v
Persistent SQLite database on the local computer
```

The UI displays information and gathers input. The backend owns persistence, business validations, status transitions, permissions, and authoritative financial totals. The database must not reside in transient build output or the application installer's temporary directory.

### Known local data directory convention

- Windows: `%LOCALAPPDATA%\\TailoringMS\\tailoring.db`
- Linux/macOS baseline: `~/.local/share/TailoringMS/tailoring.db`
- Configurable override: `TMS_DATA_DIR` when supported by the current app.

Verify the effective path through the actual current configuration before modifying a database or writing restore logic. Do not assume every OS already follows exactly the same directory convention.

## 5. Current implementation inventory

| Area | Historical evidence and current interpretation | Status |
| --- | --- | --- |
| Customer directory, details and search | Existing core flow in inspected release | `BASELINE VERIFIED` |
| Measurement profiles and versions | Existing profile reuse and history | `BASELINE VERIFIED` |
| Orders with garment items | Quantity, price, due date and measurement snapshot | `BASELINE VERIFIED` |
| Basic order statuses | Pending, In progress, Ready, Delivered in baseline | `BASELINE VERIFIED` |
| Advance / subsequent payments | Existing payment and balance flow | `BASELINE VERIFIED` |
| Payment reversals | Reversible/auditable payment records described by baseline | `BASELINE VERIFIED` |
| Receipt printing | Order/payment receipt flow | `BASELINE VERIFIED` |
| Dashboard | Basic shop overview and alerts | `BASELINE VERIFIED` |
| Basic reports | Order/payment/date-range reporting | `BASELINE VERIFIED` |
| Shop settings | Basic local configuration | `BASELINE VERIFIED` |
| Backup and validated restore | Existing local-first workflow | `BASELINE VERIFIED` |
| Health router | Developer reported later FastAPI implementation | `DEVELOPER REPORTED` |
| Auth routers with JWT | Developer reported later implementation; inspect actual flows | `DEVELOPER REPORTED` |
| Signup, signin, logout, token renewal and RBAC | Determine which pieces actually exist and pass tests | `PARTIAL / UNVERIFIED` |
| Employee management | Requested development work; implementation not confirmed | `PLANNED` |
| Full Dari/Pashto translation | Navigation/RTL preview existed; all screens unverified | `PARTIAL / UNVERIFIED` |
| English UI | Complete baseline English version | `BASELINE VERIFIED` |
| Theme switching and premium visual redesign | Design target in `DESIGN.md`; newer state unverified | `PARTIAL / UNVERIFIED` |
| Fabric management | Traceable shop/customer fabric lots, assignments, consumption, waste, returns, and transaction ledger | `PARTIAL / UNVERIFIED` |
| Advanced production / tailors / inventory | Detailed PRD requirements; production, workers, and general inventory remain unverified | `PLANNED` |
| Expense accounting / payroll / multibranch | Roadmap items, not baseline-confirmed | `PLANNED` |
| Jalali date display/entry | Future localization enhancement | `PLANNED` |

**Important distinction:** The order-status baseline is deliberately simpler than the expanded eight-stage production plan. Do not silently rename persisted status values or break existing filters when enhancing production tracking.

## 6. Full product modules and ownership

The product PRD describes **12 functional areas**. Their presence here is a functional destination, not a directive to show twelve unfinished sidebar links.

| # | Module | Primary responsibility | Delivery classification |
| --- | --- | --- | --- |
| 1 | Dashboard | Today's work, urgent orders, key shop numbers | Core |
| 2 | Customers | Customer identity, contacts, history and balance | Core |
| 3 | Measurements | Garment-specific reusable measurement profiles | Core, may be nested |
| 4 | Orders | Order intake, garment items, pricing, due dates, status | Core |
| 5 | Production | Cutting, sewing, fitting, finishing, quality progress | Expansion |
| 6 | Tailors | Skill, assignments, per-garment work and wages | Expansion |
| 7 | Inventory | Fabric, accessories, purchases, stock movements | Expansion |
| 8 | Finance & Payments | Customer receipts and debts; later expenses/cashbooks | Payments core, rest expansion |
| 9 | Delivery | Pickup, handover, partial delivery and settlement | Core handover, later expansion |
| 10 | Reports | Orders, payments, balances, due dates, later costs | Core with expansion |
| 11 | Employees | Staff records, access rights, salaries, work status | Expansion |
| 12 | Settings | Shop details, language, users, data safety, printing | Core with expansion |

### Recommended navigation progression

Initial compact navigation can remain **Dashboard, Customers, Orders, Payments, Reports, Settings**, with Measurements and Delivery accessible inside the relevant customer/order workflow. As modules become functional, group them under Workspace, Operations, Business and System, as specified in `DESIGN.md`. Do not add dead navigation destinations.

## 7. Domain workflows and business rules

### 7.1 Customer management

- A customer requires a name. Phone and WhatsApp numbers are optional unless current product configuration says otherwise.
- Optional fields can include father's name, address/area, customer type and notes.
- Support customers sharing names and, in legitimate cases, phone numbers. Detect possible duplicates without silently merging accounts.
- Profiles should connect measurements, order history, payments, balance and activity.
- Customers with existing orders or financial history cannot be hard-deleted casually. Use explicit archive/guarded deletion where supported.

### 7.2 Garment measurements

- A customer may have several profiles, e.g. Afghan shalwar kameez, waistcoat, suit, shirt, trousers or women's dress.
- Different garment types need different fields, not one massive form.
- Store the measurement unit explicitly when supporting centimeters/inches. Convert only through verified conversion logic and preserve unit meaning.
- Capture style attributes such as collar, sleeves, pockets, fit, buttons and special instructions.
- Every editing action that changes a saved profile must preserve prior versions.
- Orders must retain a **historical snapshot** of measurements. A new measurement version must never mutate existing order snapshots.
- Template customization and model/reference photos are product expansion items; respect current schema and storage practices before adding them.

### 7.3 Orders and order items

- Generate unique order identifiers without race conditions.
- Support multiple garment rows per order; each item has quantity, unit price, optional assigned tailor, instructions and applicable measurement snapshot.
- The server calculates total: `sum(item.quantity * item.unit_price)` plus or minus explicitly modeled authorized adjustments.
- The default verified status vocabulary is Pending, In progress, Ready, Delivered. Map new detailed production stages through an additive, backwards-compatible design.
- The promised delivery date must be visible in the order list and detail view.
- Urgent orders, tailoring reference images, partial delivery and advanced status history are expanded requirements unless verified in current code.
- Cancellation and refunds must record reason and proper financial effects. Do not erase order history.

### 7.4 Production and tailor assignment (expansion)

- A garment may progress through cutting, sewing, fitting/corrections, finishing, ready, and handover stages.
- Assignment is per item where appropriate rather than assuming one tailor owns an entire multi-item order.
- Track start, completion, due dates and rework without fabricating elapsed durations.
- Keep workflow transitions validated by the server; never treat a color-coded UI status as authoritative.
- A finished garment and a paid tailor wage are **different events**.

### 7.5 Financial behavior

Initial baseline accounting is **AFN only using whole-number integers**. The client must not invent financial totals. The backend must calculate order totals, payments received, reversals, and outstanding balances.

**Example:** 3 garments × 1,200 AFN = 3,600 AFN. A 2,000 AFN advance leaves 1,600 AFN due. A later 1,000 AFN payment leaves 600 AFN due.

- Do not use binary floating-point money calculations.
- Validate positive payment amounts and prevent unauthorized overpayments, unless explicit credit/refund policy exists.
- Record each real payment exactly once; protect against double-submit/double-post where needed.
- A correction/reversal should be traceable to its original payment, user and date where available.
- Distinguish **order value**, **cash collected**, and **outstanding balance**. These are not interchangeable.
- Do not label order revenue minus customer payments as profit.
- Full net profit requires complete cost/expense treatment and must not be presented as accurate before that accounting is implemented.
- Multicurrency AFN/USD/PKR is a roadmap item, not assumed present. Introduce explicit currency per record and rate rules only through a planned schema migration.

### 7.6 Inventory and fabric (expansion)

- Track fabric and accessories with actual stock movements: purchases increase stock; issue/consumption decreases it.
- Differentiate shop-owned materials from customer-provided fabric.
- Use a defined unit for every stock item (meter, gaz, piece, pack). Never add quantities across incompatible units without explicit conversion.
- Prevent accidental double deduction. Record returns and corrections as traceable movements.
- Prevent negative stock by default unless a specific workflow approves it.
- Purchasing stock and subsequently consuming it must not create duplicate expense/profit entries.
- Stock valuation/accounting policy needs a separate explicit decision before net-profit claims.

### 7.7 Wages and employees (expansion)

- Staff and tailors should share consistent identity records where practical, avoiding duplicate employee profiles.
- Support role, contact, active/inactive state, employment date and assignments as applicable.
- Wage types may include per-piece, fixed salary, and fixed plus piecework.
- Track wages **earned**, **approved**, **paid**, and **remaining** separately.
- Payroll advances, bonuses, deductions, attendance and leave need their own validated and auditable rules.
- Users with disabled accounts must not retain access through old valid tokens.

### 7.8 Delivery and receipts

- The simple delivery flow records readiness, customer pickup and final balance.
- For future partial delivery, maintain delivered vs pending quantity **per order item**, never mark the entire order delivered after only some garments are handed over.
- A delivery can occur with an outstanding balance only if shop policy and authorized permissions allow it.
- Receipts include shop details, order/reference number, customer, garments, total, paid, due, delivery date and relevant payment record.
- Printing must work on ordinary black-and-white printers and through OS print-to-PDF where available.
- Reprinting must not create a new payment or modify the order.

### 7.9 Reporting

- Daily orders, monthly orders, overdue orders, ready orders, collected payments and customer balances are core.
- Clearly label chosen date range, currency and whether a number is money received or revenue booked.
- Report queries should use the shop's local date boundaries and efficient aggregation, not full client-side scans of all records.
- Advanced expense, inventory cost, wage, and net-profit reports require the underlying modules and validated business formulas first.

## 8. Authentication, users, and permissions

The original baseline was single-user and did **not** require login. The developer subsequently reported adding FastAPI health and authentication routers with JWT. Their exact current implementation must be inspected; no parallel auth stack should be created.

### Target security contract

- Provide safe first-owner/bootstrap registration for an uninitialized local installation.
- Store passwords only with a strong adaptive hash; never log or return passwords.
- Generate JWTs with protected secrets and appropriate expiration and verification.
- Validate user status/role on backend protected actions, not merely on UI visibility.
- Use explicit permission checks for refunds, reversals, destructive operations, backup restore, payroll, and employee administration.
- Close/revoke access correctly when staff are disabled or roles change.
- Do not embed permanent admin credentials in source code or release builds.
- Handle missing/invalid/expired authentication with structured JSON errors and sensible UI recovery.
- For offline deployment, startup and access must not require contacting a public identity service.

### Suggested roles, subject to implementation

| Role | Typical scope |
| --- | --- |
| Owner / Administrator | All business operations and sensitive settings |
| Manager | Orders, staff assignments, reports, permitted finance |
| Receptionist | Customers, measurements, new orders, permitted status updates |
| Cashier | Payments, receipts, customer balances |
| Tailor / Worker | Assigned work, relevant measurements and own task status |

Treat this as a permissions-design proposal, not a claim of existing endpoints or a complete access matrix.

## 9. Language, direction, date, and location rules

### UI languages

| Language | Locale | Direction | Purpose |
| --- | --- | --- | --- |
| Dari | `fa-AF` | RTL | Local shop experience |
| Pashto | `ps-AF` | RTL | Local shop experience |
| English | `en` | LTR | Full baseline and bilingual operators |

- The 2026-10-27 release had complete English UI and partial RTL/Dari/Pashto previews; newer completeness has not been checked.
- Every visible label, error, toast, print label, empty state and modal should be localized once complete language support is implemented.
- Keep identifiers and enum values stable in the backend. Translate at the display layer.
- Mirror layout and navigation direction appropriately, while preserving readable order IDs, phone numbers and prices.
- Use locally bundled or system-available fonts so the application works without internet.
- Save language choice without destroying unsaved forms or interfering with database records.

### Dates and time

- Historical baseline persists Gregorian dates. Do not rewrite the database in Jalali format.
- A Jalali/Gregorian selector is an enhancement. Convert selected dates at UI/API boundaries while retaining an unambiguous canonical storage format.
- Use the shop's configured local calendar day for operational reports. Afghanistan operates on UTC+04:30; avoid assuming the machine always has the correct timezone.
- Do not compare formatted local date strings to calculate due dates.

## 10. Product design system and screen experience

`DESIGN.md` is the authoritative UI/UX target document. The implementation should reuse existing style architecture, not assume a new CSS framework.

**Target design qualities:** calm, premium, quick, compact, responsive, and accessible. Avoid excessive animations, cluttered dashboards, and unnecessarily complex forms.

### Standard UI behavior

- Consistent navigation shell, sidebar and header.
- Light and dark themes with persistent selection; a dark initial preference is recommended in `DESIGN.md`, unless a current user setting or approved baseline takes priority.
- Distinct primary actions, searchable tables, helpful filters, sensible empty states.
- Detail views for customer and order rather than overloading table rows.
- Proper loading, validation, disabled, success, permission error and server-unavailable states.
- Responsive designs for desktop, tablet and phone; support horizontal table scroll where needed.
- Keyboard-friendly interactions, explicit focus state and adequate contrast.
- Print layout independent of on-screen dark theme.

### UI screen map

```text
Application shell
├── Dashboard
├── Customers
│   ├── Customer list + search
│   ├── Add/Edit customer
│   └── Customer details
│       ├── Overview
│       ├── Measurements and versions
│       ├── Orders
│       └── Payments / balance
├── Orders
│   ├── Order list + filters
│   ├── New/Edit order
│   └── Order details / status / receipt / delivery
├── Payments
│   ├── Payment history
│   └── New payment / adjustments / outstanding balances
├── Reports
└── Settings
    ├── Shop / print / language / theme
    └── Backup and restore

Expansion when implemented:
├── Production and tailor work queue
├── Inventory and material movements
├── Finance and expenses
├── Employees, wages and role management
└── Advanced delivery and reporting
```

Keep deep links and existing page routing intact. Do not force expanded modules into the navigation before they work.

## 11. Database integrity and migration policy

**Data safety outranks convenience.** The app stores business records that cannot be reconstructed easily if lost.

- Keep SQLite foreign keys enforced, transactional changes atomic, and records consistent.
- Never delete the application database to fix a migration error.
- Never edit the meaning of a migration already applied in customer databases.
- Write new additive Alembic revisions with a safe upgrade path.
- Back up a populated database copy before changing schema or restore workflows.
- Test migrations against an existing populated database, not only an empty new one.
- Preserve customer identities, measurement history, immutable order snapshots, payment/reversal audit history, and receipt references.
- Use server-side constraints for core relationships and money/state validation.
- Keep soft-delete/archival semantics consistent with the current system; do not introduce silent cascading deletes.
- Protect local database backups from accidentally being committed to version control or included in ZIP deliveries.

### Restore safety

1. Confirm a backup is recognized and passes integrity checks.
2. Explain to the operator that restoring may replace the *current TMS dataset*.
3. Make a restorable snapshot of current shop data before proceeding.
4. Restore atomically if the current design permits it; avoid partial replacement.
5. Validate database integrity, schema compatibility and core row relationships.
6. Provide clear success/failure feedback and a route to recover the pre-restore snapshot.

Never overwrite another application's databases or unrelated customer installations.

## 12. API contracts and reliability

- Keep current FastAPI route paths and JSON payloads compatible where practical.
- Use Pydantic models for input validation and explicit output types.
- Apply all permissions, state transitions and financial calculations on the server.
- Reject invalid quantities, impossible balances, malformed dates, and unauthorized actions with meaningful HTTP status codes.
- Return consistent JSON for handled API errors. Do not send raw tracebacks or secrets.
- The frontend must check HTTP status and content type before parsing; non-JSON `Internal Server Error` responses must show a graceful error, not crash the app with `Unexpected token 'I'`.
- Prevent duplicate write actions from retries or repeated button clicks as appropriate to the endpoint.
- Keep normal operational flows working with local API connectivity only; no surprise external network requirement.
- For large lists, use indexed queries and pagination/filtering rather than loading every record into React state.

## 13. Deployment, operations, and environment

### Development

Start by reading `README.md`, actual frontend scripts, backend dependency declarations, startup configuration and migration setup. The below are useful baseline commands, not guarantees that every checkout requires exactly these steps.

```bash
# Frontend, from the repository root
cd frontend
npm ci
npm run build

# Backend tests, from the repository root with dependencies installed
python -m pytest backend/tests

# Local Linux/macOS launcher, if present
sh start-linux-mac.sh
```

For Windows, inspect `Start-Windows.bat` and `start.py` before instructing an operator to run them. Use documented local install commands and isolated virtual environments. Do not assume that the repository already provides a packaged desktop executable.

### Operational constraints

- API is localhost-oriented in the original release. Do not expose it to public internet without an explicit deployment/security task.
- Startup, local storage and core workflows must work without cloud connections.
- Updates must not erase current database files or settings.
- The runtime must use the persistent data directory rather than `frontend/dist` or temporary installer locations.
- Do not alter another project, system service, port mapping, database, or reverse proxy unless the user explicitly requests a scoped, reviewed deployment change.

## 14. Suggested implementation sequence

The order below is a recommended roadmap, not evidence that these tasks remain incomplete. **Recheck the current source before taking any step.**

| Priority | Workstream | Key result |
| --- | --- | --- |
| P0 | Repository audit | Confirm which routes, modules, UI translations and tests exist today |
| P0 | Core regressions | Customer, measurements, order, payment, receipts and backup tests all pass |
| P0 | Authentication hardening | Reuse existing JWT/router; protect endpoints and secure owner bootstrap |
| P0 | Employee management foundations | Staff records, status, role model and guarded administrative flows |
| P0 | Language coverage | Complete Dari/Pashto/English across core screens and error states |
| P0 | UI integration | Apply `DESIGN.md` tokens/components without breaking current behavior |
| P1 | Production assignments | Per-item responsibility, progress tracking and overdue visibility |
| P1 | Advanced deliveries | Partial handover and related balance/control rules |
| P1 | Inventory | Purchases, unit-aware stock movement and consumption per order |
| P1 | Payroll and expenses | Auditable earnings, payouts and operating costs |
| P1 | Reports | Reconcile new financial/operational figures with underlying records |
| P2 | Date enhancement | Jalali display/input toggle with canonical persistence |
| P2 | Branch and sync design | Separate architectural proposal before implementation |

### Step completion criteria

A step is complete only if the relevant UI, API, models, validation, migrations, translations, permissions and tests work together. A screen with sample figures or in-memory-only edits does not qualify.

## 15. Quality assurance and acceptance scenarios

### Must-pass core scenarios

1. Create a customer; close and reopen the application; find the same customer.
2. Save a measurement profile; create an order; edit that customer's profile; verify the older order's snapshot is unchanged.
3. Add multiple garments, with differing quantities/prices, to one order; verify the backend total.
4. Record an advance and later payment; verify collected and outstanding figures.
5. Reverse a payment and confirm correct balance and traceable history.
6. Transition an order through valid states; block invalid or unauthorized transitions.
7. Print and reprint receipts; confirm no duplicate payment or order is created.
8. Identify overdue orders using correct local date boundaries.
9. Back up a populated shop database and restore it successfully in a test environment.
10. Verify the full application still works offline and retains records after restart.

### As relevant to the newer code

11. Check JWT expiration, invalid token handling, protected routes and role restrictions.
12. Disable an employee and ensure previously authorized actions are blocked.
13. Switch English, Dari and Pashto; inspect RTL/LTR, forms, navigation and receipt wording.
14. Exercise dark/light themes on all dialogs and tables.
15. Test server errors returning plain text, invalid JSON, network refusal and timeouts.
16. Apply every new migration to a copy of a populated earlier database.
17. If stock modules exist, verify purchase/add, consumption/deduct, correction/restore and no double deduction.
18. If partial delivery exists, ensure remaining quantity is correct for every order item.

Report tests honestly. Distinguish tests performed, tests that failed, and tests that were not run.

## 16. Agent workflow and handoff format

Whenever Claude or another engineer starts a new task:

1. **Inspect:** Read `CLAUDE.md`, `PROJECT_CONTEXT.md`, `DESIGN.md`, current code, tests and relevant migrations.
2. **Confirm:** State current implementation and identify what is missing or broken.
3. **Scope:** Select the smallest cohesive fix, including its API, UI and database consequences.
4. **Preserve:** Back up data when needed and make migrations safely.
5. **Implement:** Build actual persistent functionality, not disconnected mock screens.
6. **Verify:** Run relevant test/build commands and check errors, permissions, language and data retention.
7. **Handoff:** Report changed files, test results, database implications, remaining risks and next recommended task.
8. **Update context:** Edit the status table and decision log below after a verified milestone.

### Preferred file delivery

- For requested source changes, deliver a ZIP containing **only new/modified files** with their original repository-relative paths.
- If the user explicitly requests the full project, provide a complete source archive instead.
- Exclude `node_modules`, `.venv`, build caches, live databases, user records, secrets, environment files and irrelevant binaries.
- Keep a migration and a frontend change together in the same patch when both are necessary.

### Suggested concise handoff template

```text
Task:
Verified current behavior:
Implemented changes:
Files changed:
Database/migration impact:
Commands run and results:
Manual checks performed:
Known limitations / unverified items:
Next task:
```

## 17. Decisions and unresolved questions

### Established decisions

| Decision | Current position |
| --- | --- |
| Name | Thread & Ledger / Tailoring Management System (TMS) |
| Audience | Tailoring shops in Afghanistan |
| Connectivity | Offline-first; no compulsory internet for core workflows |
| Initial topology | Single local shop with FastAPI + SQLite |
| Frontend | React + TypeScript + Vite |
| Data migration | Alembic; additive and data-preserving |
| Money baseline | Whole AFN units with backend-authoritative arithmetic |
| Measurement history | Version profiles and preserve order snapshots |
| Language target | English, Dari, Pashto, correct LTR/RTL |
| Date baseline | Gregorian persistence; Jalali optional later |
| UI contract | `DESIGN.md`; incremental improvements, no forced rewrite |
| Change delivery | Changed-files-only ZIP by default |

### Decisions to confirm before dependent engineering work

- Exact employee roles and their permission matrix.
- First-owner account bootstrap and account recovery in offline deployments.
- Whether the release is single-computer only or supports multiple computers on a LAN.
- How partial delivery affects balance collection and receipt wording.
- Production-stage customization and compatibility mapping to existing statuses.
- Fabric unit conversions, inventory costing and negative-stock exception policy.
- Salary approval, wage payment and reversal permissions.
- Multicurrency support and exchange-rate source, if requested.
- Multi-branch architecture and conflict resolution, if requested.
- Whether a desktop wrapper or installer is required for a particular release.

Do not manufacture decisions in code when a change could break existing data or business rules; retain safe baseline behavior and describe the pending choice.

## 18. Context update log

| Date | Entry | Evidence / confidence |
| --- | --- | --- |
| 2026-10-27 | Historical working baseline included React/Vite frontend, FastAPI/SQLite/Alembic backend and core tailoring flows. | Prior inspected project archive and context record |
| 2026-10-27 | Developer later reported health and JWT auth routers implemented. | Developer report; current checkout still needs inspection |
| 2026-10-30 | `CLAUDE.md` and `DESIGN.md` created as companion specifications. | Files available in project handoff |
| 2026-10-30 | This expanded `PROJECT_CONTEXT.md` consolidates architecture, functional scope, status caveats, roadmap and safeguards. | Documentation update; no new code audit performed |

**Future log entries:** Record date, Git commit/branch if available, files/routers actually inspected, tests executed and outcomes, and any migration applied. Update statuses only when verified.

## 19. Quick-start checklist for a new development session

- [ ] Read `CLAUDE.md`, this file, `DESIGN.md` and current `README.md`.
- [ ] Inspect actual frontend/backend structure and current Git status.
- [ ] Identify existing JWT/auth and employee modules before adding equivalents.
- [ ] Confirm active database path and create a safe backup before migrations.
- [ ] Understand the task's customer/measurement/order/payment effects.
- [ ] Identify required translations and both text directions.
- [ ] Preserve financial accuracy and measurement snapshots.
- [ ] Implement the task without unrelated rewrites.
- [ ] Run relevant tests, builds, and manual workflow checks.
- [ ] Deliver changed files and factual results; update this document when confirmed facts change.

---

## Final project principle

**TMS is a real operational system, not a design-only demo.** Optimize for reliable records, correct totals, faithful customer measurements, easy order tracking, accessible multilingual interfaces, safe offline use, and incremental implementation. Preserve working data and functionality before adding new features.
