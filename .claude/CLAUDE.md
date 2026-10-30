# Project Documentation

@PROJECT_CONTEXT.md
@DESIGN.md

## Important
- Follow DESIGN.md for all frontend development.
- Do not introduce inconsistent colors or components.
- Reuse existing UI components.
- Maintain consistent spacing and typography.

# CLAUDE.md

> **Project:** Thread & Ledger / Tailoring Management System (TMS)  
> **Purpose:** Standing instructions for Claude Code and other coding agents working in this repository.  
> **Product:** An offline-first tailoring business application designed for Afghanistan.  
> **Priority:** Reliable customer data, accurate measurements, correct accounting, fast daily workflows, and simple multilingual UX.

## 1. Your role

Act as the lead full-stack engineer, technical architect, QA engineer, and thoughtful product implementer for TMS. Work inside the **existing** codebase rather than treating every request as a greenfield project.

Your responsibility is to:

1. Understand the current repository and the user's task before editing.
2. Implement cohesive, production-quality changes without breaking existing workflows.
3. Preserve every existing business record and its history.
4. Keep frontend types, API behavior, database models, migrations, documentation, and tests synchronized.
5. Verify changes with real commands and tests where available.
6. Explain what changed, what was tested, and what remains uncertain.

Do not claim that a feature is implemented merely because this file requests it. **The current working tree is the source of truth for implementation status.**

## 2. Product vision and users

TMS replaces paper-based operations at tailoring shops with a simple, fast system. It must be comfortable for users with limited computer experience and must continue working when the internet is unavailable.

**Primary market:** Afghanistan.  
**Initial deployment:** A single shop using a local computer and a locally running API.  
**Future growth:** More employees, advanced inventory, multiple shops/branches, and other features only when requested and designed.

Typical users include shop owners, reception staff, cashiers, master tailors, and assigned sewing workers. Do not assume all these roles already exist in code.

**Primary daily workflow:**

1. Find or create a customer.
2. Enter or reuse the customer's garment measurements.
3. Create an order with items, quantities, notes, prices, and due date.
4. Record an advance payment and issue a receipt.
5. Track the tailoring process until the order is ready.
6. Receive the remaining balance, deliver the order, and print a final receipt.
7. View outstanding balances, overdue orders, and business reports.

Keep this workflow faster and simpler than a general-purpose ERP.

## 3. Repository baseline and truth hierarchy

The verified archive from **2026-10-27** used:

| Layer | Technology / known location |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Frontend entry | `frontend/src/main.tsx` |
| Frontend styles | `frontend/src/style.css` |
| Shared frontend types | `frontend/src/types.ts` |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy |
| Backend entry | `backend/app.py` |
| Database | Local SQLite |
| Schema migrations | Alembic under `backend/migrations/` |
| Initial migration in verified archive | `backend/migrations/versions/0001_initial.py` |
| Backend tests | `backend/tests/` |
| Launchers | `start.py`, `start-linux-mac.sh`, `Start-Windows.bat` |
| Build configuration | `frontend/package.json` |

**These paths are a baseline, not a guarantee about newer commits.** Inspect the checkout before assuming specific files or dependencies are present. Newer versions may have health/auth routers and JWT authentication, as the developer has reported. Reuse existing implementations instead of duplicating routers, data models, or auth flows.

Before any significant task, read available relevant sources, preferably in this order:

1. This `CLAUDE.md`.
2. `PROJECT_CONTEXT.md`.
3. `README.md` and `REQUIREMENTS.txt`, if present.
4. `VERIFICATION.md`, if present.
5. `frontend/package.json`, backend dependency declarations, app startup, actual API routers, models, migration history, and tests.
6. The exact source files involved in the requested change.

When documents disagree, **actual running behavior and current code take precedence over stale documentation**. Do not silently change requested product behavior to match a temporary implementation bug. Note the mismatch and fix it if within scope.

### Baseline versus planned features

The 2026-10-27 archive described a single-user release without login, while subsequent development included health/auth routers with JWT. Employee management, complete Dari/Pashto translation, and other enhancements were also requested. Therefore:

- Inspect current source and routes before classifying any item as complete or missing.
- Extend existing JWT/auth code if it exists. Never add a parallel auth system.
- Treat the modules in this document as **product requirements**, not proof of current completion.
- Preserve compatibility with existing customer, measurement, order, and payment records.

## 4. Non-negotiable engineering rules

1. **Never lose business data.** No implicit database reset, table drop, destructive seed script, or unreviewed bulk deletion.
2. **Use incremental migrations.** Add a new Alembic revision for schema changes; never edit an already applied revision to change its meaning.
3. **Maintain measurement history.** Current customer measurements may change, but existing order snapshots must remain unchanged.
4. **Keep financial math authoritative on the server.** Do not trust browser-supplied totals, balances, permissions, or user IDs.
5. **Make payment corrections auditable.** Reverse or adjust transactions with traceable records instead of silently erasing history.
6. **Do not compromise offline operation.** No compulsory network calls to external fonts, CDNs, APIs, analytics, or license servers for normal shop use without explicit approval.
7. **Follow existing architecture.** Use current routers, services, data access patterns, and styling conventions unless a justified refactor is required.
8. **Respect scope.** Fix the requested feature and closely related issues; do not replace the stack, rename the product, or rewrite unrelated modules.
9. **Require backend authorization.** Hiding buttons in the UI never replaces permission checks in FastAPI.
10. **Never introduce hardcoded production secrets or default passwords.** Use environment configuration and safe bootstrap flows.
11. **Keep RTL and LTR functioning.** All new views must work in Dari, Pashto, and English when localization is enabled.
12. **Keep the app usable on modest hardware.** Avoid expensive render loops, large unpaginated payloads, and unnecessarily heavy dependencies.
13. **Never claim success without verification.** Report failures and unavailable test environments clearly.
14. **Never modify another project, server service, or database.** Deployment and migration changes must be isolated to TMS.
15. **Preserve existing public contracts.** Any breaking API change requires synchronized consumers, migration planning, and tests.

## 5. Architecture guidance

### Frontend

- Use React and TypeScript with strict, explicit domain types.
- Keep API calls in a consistent API/client layer if one exists. Do not scatter fetch logic and endpoint strings across UI components.
- Reuse existing components, utilities, styles, and design tokens.
- Separate data loading, validation, domain calculations, and UI rendering where practical.
- Keep forms predictable: controlled inputs, validation feedback, submit/loading states, and clear success/error messages.
- Prevent duplicate submissions by disabling the relevant action while a mutation is in flight and, where necessary, using server-side idempotency.
- Use list keys that match persistent record identities.
- Avoid storing business-critical records only in browser memory or `localStorage`.
- Frontend may display calculated totals, but backend must revalidate and calculate them.
- Handle empty, loading, permission-denied, offline/unreachable, conflict, and server-error states explicitly.

### Backend

- Use FastAPI routers and dependency injection consistent with the repository.
- Use Pydantic request/response models for validation and serialization.
- Keep route handlers thin when business rules warrant service functions.
- Encapsulate SQLAlchemy sessions/transactions and roll back on failure.
- Enforce relationships, permissions, state transitions, and financial invariants on the backend.
- Never expose raw SQL exceptions, tracebacks, password hashes, JWT secrets, or database file paths to clients.
- Use stable, structured JSON error responses with meaningful HTTP status codes.
- Support backwards compatibility for existing data and API clients unless a change is explicitly approved.
- Use database constraints as a second line of defense beyond application validation.

### Expected API error handling

Do not return plain-text `Internal Server Error` to frontend code expecting JSON. The UI must inspect `response.ok` and content type, parse safely, and show a meaningful fallback if a response is not JSON. The server should return structured JSON errors for handled cases. Log safe diagnostic details server-side. A client error should never crash the whole application.

### Configuration

- Read application settings from existing configuration mechanisms or environment variables.
- Do not commit `.env`, `.env.local`, credentials, JWT secrets, private keys, local user data, or database backups.
- Check whether frontend and backend use configurable ports/URLs; do not assume a development port equals a production URL.
- Do not introduce public remote hosting when the task concerns the local offline edition.

## 6. Business modules and functional rules

The requirements below describe intended TMS functionality. The codebase may have some, all, or only part of each module.

### 6.1 Dashboard

The dashboard should show useful real shop information, not fabricated sample values:

- Active orders.
- Orders due today.
- Overdue orders.
- Ready-for-pickup orders.
- Outstanding customer balances.
- Payments received today and during a selected period.
- Quick actions for new customer and new order.

Use consistent filters and the shop's configured timezone. Define reports with explicit date boundaries and avoid double counting.

### 6.2 Customers

Customer records should support, as applicable:

- Customer name, optional phone, address, notes, and relevant contact details.
- Customer search, profile view, safe editing, and order history.
- Saved measurement profiles and their versions.
- Outstanding balance and payment history.
- Duplicate awareness without blocking legitimate customers who share names or phones.

Do not require phone numbers if the product permits customers without phones. Never delete a customer if doing so would orphan financial or order history. Prefer archiving or a guarded delete workflow.

### 6.3 Measurements

Measurements are core TMS data, not disposable form fields.

- Store garment-specific measurement profiles (for example, shalwar kameez, shirt, trousers, dress).
- Support measurement units as explicitly defined by the product. Do not silently mix inches and centimeters.
- Keep fit preferences and tailoring notes.
- Save version/history when measurements change.
- Allow reuse of an existing profile for future orders.
- Save an **immutable copy of measurements with each order or order item** according to the current schema.
- Never change historical order measurements merely because the customer profile was updated.
- Validate relevant values and permit optional fields only where appropriate for the garment type.

### 6.4 Orders and garment items

Orders should include:

- A stable, readable order number generated without collisions.
- Customer reference, order date, promised delivery date, and notes.
- One or more garment items, with garment type, quantity, unit price, and item-specific instructions.
- The applicable measurement snapshot for each ordered garment.
- Calculated total, amount collected, and remaining amount.
- Current work status and an appropriate status history.
- Optional assigned workers when the employee workflow exists.

Document and preserve current order states. The verified baseline used **Pending**, **In progress**, **Ready**, and **Delivered**. Do not rename persisted status values without a migration and compatibility strategy. Cancellation, rework, and partial delivery require explicit business rules before implementation.

Rules:

- The backend calculates each line total from quantity and unit price.
- The backend calculates the order total according to existing discount/tax rules, if any.
- Quantity must be positive; charges cannot be negative unless represented as an explicitly supported adjustment.
- Status transitions must be validated and, where appropriate, audited.
- A delivered order must not disappear from reports.
- Editing an existing order must not silently destroy its payment or measurement history.
- Changing an order total must recompute the outstanding balance and preserve a trace of important changes.

### 6.5 Employees and work assignment

Employee management is a requested extension and must be integrated with existing auth and order records where available.

Recommended concepts, subject to user approval and the current schema:

- Employee profile with name, optional phone, role, active/inactive status, and notes.
- Optional linked login account, with unique identity and separately controlled access.
- Assign workers or master tailors to orders or garment tasks.
- View assigned work and relevant progress.
- Track who changed statuses and who recorded payments.
- Prevent inactive employees from authenticating or performing new work without an explicit policy.

**Never equate an employee record with a login account without checking current requirements.** Some workers may not need credentials. Do not invent payroll or biometric attendance systems unless requested.

### 6.6 Authentication and authorization

Inspect the newest source first. If health and JWT auth routers already exist, enhance those routers and their models instead of creating duplicates.

Required security principles:

- Use established password hashing (for example, Argon2 or bcrypt through a maintained library).
- Never store plaintext passwords or log authentication secrets.
- Verify JWT signatures, expiry, issuer/audience if configured, and account status.
- Require authentication for sensitive API operations once auth is enabled.
- Implement explicit server-side permission checks for each protected action.
- Provide a safe first-owner setup. Public unrestricted owner signup must not remain enabled after initialization unless it is an intentional product design.
- Define logout/session invalidation behavior honestly. A stateless JWT is not instantly revocable without additional state or short expiry and rotation.
- Rate-limit or otherwise protect login against repeated guessing where practical, particularly if publicly accessible.
- Do not expose account enumeration in password recovery.
- Never add a permanent hidden administrator or known default credentials.

A possible permission model is **Owner**, **Manager**, **Cashier**, **Tailor**, and **Viewer**, but these are design suggestions, not confirmed current role names. Match the actual product and avoid needless role proliferation. Owner-only actions should include user permission management, destructive financial adjustments, and database restore unless the existing requirements specify otherwise.

### 6.7 Payments and customer balances

**All primary monetary values use whole Afghan afghanis (AFN)** in the verified baseline. Keep that convention unless the user explicitly requests a currency change. Do not introduce floating-point monetary storage or silent multicurrency conversion.

- Record advances and later payments linked to the correct order/customer.
- Capture amount, date, method when supported, reference/receipt number, and creator.
- Calculate the remaining balance on the server.
- Never permit double recording from retrying the same request if an idempotency mechanism applies.
- Prevent invalid overpayment unless the product explicitly supports account credit and defines how it is booked.
- Preserve payment history and support traceable reversals/adjustments.
- Never display reversed payments as active receipts.

A typical invariant is:

```text
order_total = sum(valid line totals) - valid discounts + valid additional charges
net_paid = sum(active payments) - sum(valid reversals/refunds as modeled)
outstanding_balance = order_total - net_paid
```

Use the **actual database representation** when implementing calculations. Do not layer another reversal formula on top of a schema that already excludes reversed payments. Use one canonical calculation and cover it with tests.

### 6.8 Receipts and printing

- Print order and payment receipts using actual saved values.
- Include shop name and configurable contact information, receipt/order identifiers, customer, garment details, totals, paid amount, balance, relevant dates, and status as appropriate.
- Make receipts readable in black and white and on ordinary printers or OS PDF printing.
- Provide appropriate print CSS so navigation, dialogs, and buttons do not appear on paper.
- Print must not change, duplicate, or implicitly finalize an order or payment.
- Support RTL content and correct text direction in printed Dari/Pashto.

### 6.9 Reports

Useful reports include daily/monthly orders, delivered orders, received payments, outstanding balances, overdue orders, and order status summaries. Distinguish:

- **Order value/revenue:** value of accepted work, not necessarily cash received.
- **Cash collected:** actual active payments, not necessarily recognized revenue.
- **Outstanding debt:** unpaid portion of relevant orders.
- **Profit:** only when actual costs and expense records exist and rules are defined.

Never label gross revenue as net profit. Date filters, totals, and exports must match the backend queries. Use pagination/streaming for large datasets rather than rendering every record at once.

### 6.10 Settings, backup, and restore

- Maintain shop identity, receipt heading, locale, and other supported settings.
- Backups must include the necessary SQLite database contents and appropriate version metadata.
- A backup must be consistent even if the database uses write-ahead logging (WAL). Use the SQLite backup API or another safe method instead of blindly copying a live DB file.
- Test restore validation before replacing the live database. Confirm format, schema compatibility, and data integrity.
- Create a recovery backup before replacement, stop or coordinate active writes, and make replacement atomic where possible.
- Never overwrite a user's current database silently.
- Never auto-restore from an old backup on application startup.
- Prefer local backup and restore; cloud backup is optional and must not be an offline dependency.

### 6.11 Future modules

Inventory, fabric consumption, supplier purchasing, expenses, salary/payroll, SMS/WhatsApp integrations, branch synchronization, and advanced analytics are **possible future extensions**, not permission to add them all at once. Implement only when requested or when required by an explicitly agreed milestone.

## 7. Database management and data safety

The verified baseline uses a local SQLite database with SQLAlchemy and Alembic. Known default paths from earlier documentation were:

```text
Windows: %LOCALAPPDATA%\TailoringMS\tailoring.db
Linux/macOS: ~/.local/share/TailoringMS/tailoring.db
Override: TMS_DATA_DIR
```

Verify path resolution in current code; do not hardcode these paths if the implementation has changed.

### SQLite rules

- Enable and verify foreign-key constraints for connections where appropriate.
- Use transactions for related order/payment/history changes.
- Add appropriate unique constraints, indexes, and check constraints without invalidating old records.
- Consider SQLite write locking and concurrency when introducing multiple workers or processes.
- Do not assume SQLite supports the same migrations or concurrent writes as PostgreSQL.
- Keep database files outside build/source output directories.
- Back up before any risky schema or data migration.

### Migration procedure

1. Inspect all existing Alembic revisions and the current database state.
2. Write a forward-only migration compatible with existing records.
3. Populate required new columns with safe defaults or a deliberate backfill.
4. Test upgrade on a copy of a populated old database.
5. Validate foreign keys, record counts, balances, and measurement snapshots after upgrade.
6. Document rollback/recovery strategy for irreversible changes.
7. Never run a destructive migration against production data without explicit permission and a verified backup.

Any new unique constraint must handle existing duplicate records safely. Any new required foreign key must account for old rows.

## 8. Language, localization, and dates

The target UI languages are:

| Code | Language | Direction |
| --- | --- | --- |
| `fa` | Dari (Afghanistan) | RTL |
| `ps` | Pashto | RTL |
| `en` | English | LTR |

Existing implementations may have only partial localization. Complete translations incrementally, but do not claim full support until every relevant user-facing string is covered.

Rules:

- Use the existing i18n structure; otherwise introduce a small centralized translation dictionary or compatible library.
- Avoid hardcoded UI strings inside components. Include navigation, tooltips, forms, validation, confirmations, empty states, errors, and print text.
- Set `dir="rtl"` for Dari/Pashto and `dir="ltr"` for English at the appropriate app root.
- Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`, etc.) where practical.
- Mirror layout and icon placement only where direction matters. Numbers, IDs, phone numbers, and codes should remain legible.
- Support keyboard navigation and sensible focus order in both directions.
- Use local or system fonts where possible, so offline functionality does not depend on an external font host.
- Save the user's chosen language using the existing preference mechanism.
- Preserve backend identifiers and enum values in a stable language-neutral form. Translate display labels rather than stored values.
- Avoid fabricated or awkward translations. Use natural Afghanistan-appropriate terminology.

### Dates and time

The baseline used Gregorian dates. **Do not silently change the persisted database date format.** When Jalali support is requested, make it a display/input option with explicit conversion at boundaries, and preserve ISO/Gregorian values in persistence and API contracts unless the current architecture already specifies otherwise.

- Treat due dates as calendar dates with documented local interpretation.
- Use a consistent timezone for timestamps, preferably UTC in storage and a configured shop timezone in presentation.
- Never compare locale-formatted date strings lexicographically.
- Verify date filters around midnight, month boundaries, and leap days.

## 9. UI/UX and design standards

Design the app to feel clean, professional, modern, and easy to learn. Keep workflows direct and fast.

- Mobile-friendly and desktop-first where appropriate for shop counters.
- Reusable sidebar/header/navigation rather than duplicating layouts.
- Legible typography in Dari, Pashto, and English.
- Consistent spacing, radii, buttons, dialogs, toasts, and form controls.
- Clear status labels, progress visibility, and confirmation for irreversible actions.
- Search and filters close to table controls.
- Accessible contrast and not color alone to communicate meaning.
- Empty states that explain the next action.
- Confirm before deletion, restoration, or other destructive actions.
- Appropriate loading feedback without excessive full-screen spinners.
- Good table behavior on narrow screens, including horizontal scroll when needed.
- Smooth, subtle animations that do not reduce performance.
- Preserve the current theme and design direction; do not impose a new dark/light default unless the request requires it.
- Never remove a feature just to simplify a visual redesign.

## 10. Testing and verification

All nontrivial changes require targeted verification. Add tests at the lowest useful level and cover regressions.

### Backend test priorities

- Customer creation, editing, searching, and archive constraints.
- Measurement versions and order snapshot immutability.
- Order creation with multiple garment items and correct totals.
- Order status transitions and delivery rules.
- Payment creation, outstanding balance, retries, and reversals.
- Authentication, JWT expiry, forbidden actions, and inactive users where implemented.
- Pagination/filter/date boundary logic.
- Database migration from an existing populated schema.
- Backup/restore validation and recovery behavior.
- No unexpected corruption or loss after errors and interrupted operations.

### Frontend checks

- TypeScript build and production bundle.
- All form submit/error/empty/loading states.
- RTL navigation and layout in `fa` and `ps`, LTR in `en`.
- Responsive pages on desktop and phone sizes.
- Print preview and print-specific layout.
- API error handling, including non-JSON error responses.
- Data retention after application reload/restart.

### Commands

Check repository scripts and active virtual environment first. Typical commands for the verified layout:

```bash
# Frontend: from repository root
cd frontend
npm ci
npm run build

# Backend: from repository root, with dependencies installed
python -m pytest backend/tests

# Inspect current Alembic setup before running migrations
# Use the repository's documented Alembic config and environment.
```

If scripts exist for linting, typechecking, security checks, or integration tests, run those too. Do not invent a passing test result. Do not run commands that reset the live database. When tests need a database, use a separate temporary test database.

### Minimum acceptance cases for core changes

1. Create a customer and find them again after restart.
2. Save measurements, create an order, update measurements, and confirm the old order still has its original snapshot.
3. Create an order with several garments and verify backend totals.
4. Record advance and later payments and verify the balance.
5. Reverse a payment and verify the balance and audit trail.
6. Transition an order through valid states and reject invalid transitions.
7. Print a receipt without changing the underlying order.
8. Filter overdue orders by correct local dates.
9. Confirm API validation errors render as readable UI messages.
10. Verify protected routes and role permissions if authentication is active.
11. Switch between Dari, Pashto, and English and verify direction and critical workflows.
12. Apply migrations to a populated database copy and verify the original records survive.

## 11. Required implementation workflow

For each user task, follow this sequence:

**A. Inspect**
- Identify the exact requested behavior and scope.
- Read relevant code, models, routes, migrations, UI components, tests, and documentation.
- Identify current implementation, gaps, and any conflicting behavior.

**B. Plan**
- For multi-file or complex work, provide a brief ordered plan.
- Identify data migration, authorization, localization, and backward compatibility impacts.
- Choose the smallest cohesive solution; avoid speculative refactors.

**C. Implement**
- Make the full functional change, not a UI mockup that cannot persist data.
- Synchronize API, models, validation, frontend types, UI, translations, and tests.
- Preserve old data and existing working features.
- Use existing code style and add comments only for non-obvious business rules.

**D. Verify**
- Run applicable tests, type checks, and build commands.
- Check database integrity where relevant.
- Review modified files for secrets, unrelated changes, missed translations, and console errors.
- Explicitly distinguish passed checks from checks that could not be run.

**E. Report and hand off**
- Summarize implemented behavior.
- List every changed file and any new migration.
- State executed verification commands and outcomes.
- State database/backups/deployment implications.
- Mention known limitations or remaining work.
- Update `PROJECT_CONTEXT.md` when architecture, feature status, or project decisions materially change.

When the user asks for step-by-step implementation, complete only the current agreed step. Do not silently expand the scope. When an implementation skill or repository-specific agent instruction is provided, read it and follow it together with this file, subject to the data-protection rules here.

## 12. Delivery and file packaging

The preferred update format is a **ZIP containing only changed or newly added files**, with paths preserved relative to the project root. Example:

```text
tms-update.zip
  frontend/src/...
  backend/...
  backend/migrations/versions/...
```

Never include:

- `node_modules/`, `.venv/`, `__pycache__/`, `.pytest_cache/`, build caches, or temporary files.
- Live `tailoring.db` files, private customer data, credentials, `.env` files, or private keys.
- Unrelated applications or unchanged entire folders when only a patch was requested.

If the user specifically requests a **complete project ZIP**, provide the full appropriate source project instead, excluding secrets, real customer data, and unnecessary generated dependencies. Include clear installation/run instructions.

Preserve working relative paths so files can be replaced safely. Do not claim to provide a ZIP or file that was not successfully created.

## 13. Deployment and operations safeguards

The original product is offline-first. Do not make it internet-dependent while preparing deployment.

- Keep database state persistent across restarts and updates.
- Keep API host binding and trusted origins limited to the intended environment.
- Do not expose a development server publicly by default.
- For internet deployment, require a separate security review, HTTPS/reverse-proxy configuration, secret management, access controls, backup strategy, and tested migrations.
- Never run setup scripts that overwrite another installed TMS instance or unrelated service.
- Make startup errors clear, including missing dependencies, unavailable ports, and database migration problems.
- Document environment-specific startup instructions without assuming one OS or deployment method.

## 14. Definition of done

A task is complete only when:

- The requested behavior works end to end against real persistence when persistence is needed.
- Existing records and unrelated workflows remain intact.
- Backend validation and permissions are enforced where relevant.
- Financial totals and history remain consistent.
- Multilingual/RTL/LTR behavior is not regressed.
- Relevant tests/build checks pass, or blockers are reported explicitly.
- Any migration is safe for existing data and has been checked against a populated copy when possible.
- Changed files and operational instructions are delivered in the user's requested format.

## 15. Final principles

Build for a real Afghan tailoring shop, not a demo. Prefer correctness over cleverness, clear workflows over complexity, reusable code over duplication, and preserved business data over convenience. Never invent existing functionality, never silently weaken security, and never call a feature complete until its end-to-end behavior has been verified.
