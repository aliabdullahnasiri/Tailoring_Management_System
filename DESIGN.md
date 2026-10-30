# DESIGN.md

> **Project:** Thread & Ledger | Tailoring Management System (TMS)  
> **Document type:** Product UI/UX design system and implementation specification  
> **Version:** 1.0  
> **Last updated:** 2026-10-30  
> **Primary users:** Tailoring shops in Afghanistan  
> **Languages:** Dari (`fa-AF`), Pashto (`ps-AF`), English (`en`)  
> **Platforms:** Offline-first desktop/local web app, with responsive browser layouts

---

## 1. Purpose and authority

This document tells Claude and human developers **how TMS should look and behave**. It is the visual and interaction contract for new screens and improvements to existing screens. Read it together with `CLAUDE.md`, `PROJECT_CONTEXT.md`, `README.md`, and the actual source code.

**Priority when instructions conflict:**
1. User's explicit instruction for the current task.
2. Data integrity, security, and correctness constraints in `CLAUDE.md` and the working code.
3. Existing product behavior and documented requirements.
4. This document's proposed design patterns.

**Do not confuse design targets with implemented features.** The verified 2026-10-27 baseline has React + TypeScript + Vite, FastAPI, SQLAlchemy, SQLite, Alembic, and a local-first single-shop workflow. It includes customer profiles, measurements with versions, orders, payments, receipts, reporting, and backup/restore. Authentication, employee management, fully translated Dari/Pashto UI, and advanced modules may exist in newer work. **Inspect the current repository before writing code, naming routes, or claiming completion.**

This document is not a mandate to rewrite working screens or change the backend framework. Implement incrementally; never lose customer records, order snapshots, or financial history.

---

## 2. Product vision

TMS should feel like a calm, modern workbench for a tailor, not a complex enterprise accounting application. It must help a shop owner answer four questions immediately:

1. What orders need attention today?
2. What are the exact measurements and instructions for this customer?
3. Where is each garment in the production process?
4. What has been paid, and what remains due?

### Experience principles

| Principle | Required behavior |
| --- | --- |
| Speed first | Repeat orders reuse saved customer and measurement data. |
| Clarity | Every screen has one primary action and plainly labeled fields. |
| Data confidence | Financial and measurement details are legible and traceable. |
| Low training cost | Familiar labels, simple tables, recognizable icons, visible empty states. |
| Offline reliability | No required CDN, internet font, image service, or cloud API for essential workflows. |
| Language native | Dari and Pashto layouts are genuinely RTL; English is LTR. |
| Consistency | Forms, tables, dialogs, badges, filters, and printing share common patterns. |
| Progressive detail | Show essentials first; reveal advanced fields when relevant. |
| Practical accessibility | Keyboard use, readable contrast, focus indications, and generous hit areas. |

### Visual keywords

**Premium, precise, calm, trustworthy, modern, compact, warm-neutral, business-focused.** Avoid flashy gradients, excessive blur, oversized icons, giant dashboard cards, or decorative motion that slows the app.

---

## 3. Product phases and navigation scope

### 3.1 Confirmed core workflow

`Dashboard -> Customers -> Measurements -> Orders -> Payments -> Delivery -> Reports -> Settings`

A measurement may be reached through a customer profile or an order. The minimal baseline navigation may group this workflow under **Dashboard, Customers, Orders, Payments, Reports, Settings**. Preserve working flows and URLs.

### 3.2 Target information architecture

The complete TMS product requirements describe **12 functional areas**. Each should become visible only after the corresponding functionality is implemented and access is authorized.

| Area | English label | Dari label | Pashto label | Phase |
| --- | --- | --- | --- | --- |
| Dashboard | Dashboard | داشبورد | ډشبورډ | Core |
| Customers | Customers | مشتریان | پېرودونکي | Core |
| Measurements | Measurements | اندازه‌گیری | اندازې | Core / nested |
| Orders | Orders | سفارشات | فرمایشونه | Core |
| Production | Production | مدیریت تولید | تولید | Expansion |
| Tailors | Tailors | استادکاران | خیاطان | Expansion |
| Inventory | Inventory | گدام | ګودام | Expansion |
| Finance | Finance & Payments | مالی و حسابات | مالي چارې | Payments core, rest expansion |
| Delivery | Delivery | تحویل‌دهی | سپارل | Core / nested, expanded later |
| Reports | Reports | گزارشات | راپورونه | Core |
| Employees | Employees | کارمندان | کارکوونکي | Expansion |
| Settings | Settings | تنظیمات | امستنې | Core |

Translation examples are starting content, **not a completed translation audit**. A Dari/Pashto reviewer should validate domain terminology before release.

Suggested sidebar grouping:

- **Workspace:** Dashboard, Customers, Measurements, Orders.
- **Operations:** Production, Tailors, Inventory, Delivery.
- **Business:** Finance & Payments, Reports, Employees.
- **System:** Settings, Backup & Restore, optional Help.

Do not show blank navigation destinations, disabled fake links, or fabricated performance metrics. Hide unavailable modules or label them explicitly as planned in development-only documentation, not production navigation.

---

## 4. Brand direction

### 4.1 Identity

- Product display name: **Thread & Ledger**; subtitle: **Tailoring Management System**.
- Compact brand mark: `TMS` inside a rounded square, unless an approved logo already exists.
- Optional brand symbol: an abstract thread loop, stitching line, measuring tape, or garment outline. Keep it simple at 24 px.
- Do not invent customer testimonials, awards, statistics, or security certifications.
- No decorative fabric patterns behind forms or data tables.

### 4.2 Color concept

A **deep navy workspace** with **sapphire-blue interaction accents** and restrained status colors. Light mode uses cool white surfaces and dark slate typography. Dark mode is the recommended initial preference for the product, but the user's saved setting wins.

#### Semantic tokens

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--bg` | `#F5F7FB` | `#0B1220` | App canvas |
| `--surface` | `#FFFFFF` | `#111C2E` | Cards, dialogs, sidebars |
| `--surface-raised` | `#F8FAFC` | `#1B2A40` | Hover, elevated surfaces |
| `--surface-hover` | `#EFF6FF` | `#22354E` | Hover over clickable surfaces |
| `--text` | `#0F172A` | `#F8FAFC` | Main content |
| `--text-secondary` | `#475569` | `#CDD8E7` | Supporting text |
| `--text-subtle` | `#64748B` | `#AFC0D3` | Timestamps, secondary labels |
| `--border` | `#E2E8F0` | `#334155` | Inputs, separators |
| `--primary` | `#1D4ED8` | `#2563EB` | Primary buttons and strong links |
| `--primary-hover` | `#1E40AF` | `#1D4ED8` | Hover on primary buttons |
| `--primary-soft` | `#DBEAFE` | `#17345B` | Selected nav, blue info background |
| `--primary-text` | `#FFFFFF` | `#FFFFFF` | Text on primary buttons |
| `--focus` | `#2563EB` | `#93C5FD` | Visible keyboard focus |
| `--success` | `#047857` | `#34D399` | Successful operations |
| `--warning` | `#92400E` | `#FBBF24` | Due soon, attention needed |
| `--danger` | `#B91C1C` | `#F87171` | Validation errors, destructive actions |
| `--info` | `#1D4ED8` | `#93C5FD` | Noncritical information |

**Color safety:** Light-mode success/warning/danger colors above are intended primarily for text/icons on light surfaces. Dark-mode accents are intended primarily for dark surfaces. Use status badges with subtle backgrounds and sufficiently contrasting text. Never rely on color alone.

### 4.3 Copyable CSS variables

Implement tokens in the existing stylesheet or design-token layer. Use the existing CSS architecture; **do not install Tailwind just because this document uses token terminology**.

```css
:root,
[data-theme="light"] {
  color-scheme: light;
  --bg: #f5f7fb;
  --surface: #ffffff;
  --surface-raised: #f8fafc;
  --surface-hover: #eff6ff;
  --text: #0f172a;
  --text-secondary: #475569;
  --text-subtle: #64748b;
  --border: #e2e8f0;
  --primary: #1d4ed8;
  --primary-hover: #1e40af;
  --primary-soft: #dbeafe;
  --primary-text: #ffffff;
  --focus: #2563eb;
  --success: #047857;
  --warning: #92400e;
  --danger: #b91c1c;
  --info: #1d4ed8;
  --shadow: 0 4px 20px rgb(15 23 42 / 6%);
}

[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0b1220;
  --surface: #111c2e;
  --surface-raised: #1b2a40;
  --surface-hover: #22354e;
  --text: #f8fafc;
  --text-secondary: #cdd8e7;
  --text-subtle: #afc0d3;
  --border: #334155;
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-soft: #17345b;
  --primary-text: #ffffff;
  --focus: #93c5fd;
  --success: #34d399;
  --warning: #fbbf24;
  --danger: #f87171;
  --info: #93c5fd;
  --shadow: 0 8px 28px rgb(0 0 0 / 20%);
}

:root {
  --radius-xs: 6px;
  --radius-sm: 9px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --sidebar-expanded: 264px;
  --sidebar-collapsed: 76px;
  --topbar-height: 68px;
  --content-max: 1600px;
}

html, body, #root { min-height: 100%; }
body { background: var(--bg); color: var(--text); }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px; }
```

**Accessibility note:** Tokens do not themselves guarantee WCAG contrast for every composite control. Test each actual foreground/background pairing, especially badges and colored cards, with at least 4.5:1 contrast for ordinary text and 3:1 for large text and UI indicators.

### 4.4 Theme rules

- On first launch, use the product's selected default (recommended: **dark**). Once a person selects a theme, persist the choice locally.
- Theme changes must not lose unsaved form data or reload the page.
- All screens, dialogs, date pickers, charts, table menus, alerts, and print previews must honor the current theme.
- Print output always uses a readable monochrome/light receipt theme, independent of on-screen theme.
- Do not store theme choice in a remote service for an offline deployment unless explicitly designed.

---

## 5. Typography and content hierarchy

### 5.1 Font families

- Dari and Pashto: use a **locally bundled** legible Arabic-script font such as Vazirmatn with proper glyph coverage; verify Pashto glyphs in the actual bundled files. Fallback: `Tahoma, Arial, sans-serif`.
- English: locally bundled Inter if available; otherwise `system-ui, Arial, sans-serif`.
- Numeric financial columns: use tabular numerals where supported.
- Avoid loading Google Fonts or any external CSS when the app must work offline.

```css
html[lang="fa-AF"], html[lang="ps-AF"] {
  font-family: "Vazirmatn", Tahoma, Arial, sans-serif;
}
html[lang="en"] {
  font-family: Inter, system-ui, Arial, sans-serif;
}
.money, .tabular-number { font-variant-numeric: tabular-nums; }
```

Fonts are examples, not new mandatory dependencies. Bundle with appropriate licensing only after checking repo assets.

### 5.2 Type scale

| Style | Desktop | Mobile | Weight | Use |
| --- | --- | --- | --- | --- |
| Page title | 26 px / 1.35 | 22 px / 1.4 | 700 | Screen name |
| Section title | 19 px / 1.4 | 17 px / 1.45 | 700 | Groups, panels |
| Card headline | 24 px / 1.3 | 22 px / 1.35 | 700 | KPI values |
| Body | 14 px / 1.6 | 14 px / 1.65 | 400 | Text, tables |
| Field label | 13 px / 1.5 | 13 px / 1.55 | 600 | Forms |
| Meta / caption | 12 px / 1.5 | 12 px / 1.5 | 400 | Dates, hints |
| Buttons | 14 px / 1.3 | 14 px / 1.3 | 600 | Actions |

Use 16 px for mobile inputs if the target mobile browser auto-zooms smaller input fonts. Keep headings short and avoid uppercase translations.

### 5.3 Spacing

Use a **4 px base unit** with a practical scale: `4, 8, 12, 16, 20, 24, 32, 40, 48` px.

- Cards: 20 to 24 px internal padding desktop; 16 px mobile.
- Forms: 16 px between fields, 24 px between sections.
- Table cells: 12 px vertical, 14 to 16 px horizontal.
- Page content: 24 px outer desktop padding, 16 px tablet, 12 to 16 px mobile.
- Card grid gaps: 16 px on desktop, 12 px mobile.
- One page should not use more than three unrelated spacing patterns.

---

## 6. Application shell

### 6.1 Desktop layout, 1024 px and above

```text
┌───────────────────────┬─────────────────────────────────────────────────────────┐
│ BRAND / SHOP NAME     │ Page title / breadcrumb     Search   +New   Lang Theme  │
│                       ├─────────────────────────────────────────────────────────┤
│ WORKSPACE             │                                                         │
│  Dashboard            │   PAGE CONTENT                                          │
│  Customers            │   Summary cards, filters, tables, dialogs, detail tabs   │
│  Measurements         │                                                         │
│  Orders               │                                                         │
│                       │                                                         │
│ OPERATIONS            │                                                         │
│  Production           │                                                         │
│  Tailors              │                                                         │
│  Inventory            │                                                         │
│  Delivery             │                                                         │
│                       │                                                         │
│ BUSINESS              │                                                         │
│  Payments             │                                                         │
│  Reports              │                                                         │
│  Employees            │                                                         │
│                       │                                                         │
│  Settings             │                                                         │
└───────────────────────┴─────────────────────────────────────────────────────────┘
```

- Sidebar width: 264 px expanded, 76 px collapsed. Persist expansion preference.
- Top bar height: 68 px; avoid multiple horizontal toolbars.
- Main content max width: 1600 px; permit full-width data tables if needed.
- Active navigation: blue-tinted background, a clear indicator, bold label, and matching icon.
- Sidebar may scroll independently while preserving navigation accessibility.
- Collapse action must be reachable via keyboard and announce its state.
- Use logical CSS properties (`padding-inline-start`, `inset-inline-start`) rather than hard-coded left/right.
- Help icon and user menu should appear only if associated functionality exists.

### 6.2 RTL and LTR shell

- Dari/Pashto: sidebar anchored to the **right**, heading/actions order adapted to RTL, menu direction right to left.
- English: sidebar anchored to the **left**, normal LTR flow.
- Switch `document.documentElement.lang` and `.dir` together; preserve active route and form state.
- Search field icon and clear button positions should mirror appropriately.
- Phone numbers, email addresses, UUIDs, and order codes should remain readable in LTR isolated spans.
- Monetary values should align consistently by column, irrespective of page direction.

### 6.3 Tablet, 768 to 1023 px

- Default collapsed sidebar or a compact drawer, depending on actual viewport.
- Content remains one or two columns, never three dense form columns.
- Page actions collapse into a menu if the row overflows.
- Tables scroll horizontally inside their own container; never move the entire page sideways.

### 6.4 Mobile, 360 to 767 px

- Sidebar becomes a drawer with an accessible open/close control.
- Top bar shows page title, search trigger, a primary action when space allows, and overflow menu.
- Summary cards use one or two columns depending on minimum readable width.
- Detailed desktop tables may become stacked record cards **or** remain horizontally scrollable if comparisons require columns.
- Form modals become full-screen sheets; action bar remains visible without obscuring inputs.
- Main navigation never blocks the receipt or print action.

### 6.5 Minimum screen handling

Target 360 px CSS viewport and 200% zoom without hidden critical controls. Where a table truly needs horizontal scrolling, provide a visual cue and accessible column headers.

---

## 7. Interaction and motion language

- Every page has exactly **one prominent primary action** where possible, such as `New Order`.
- Secondary actions use outlined/tonal styling. Destructive actions require a clear confirmation with the specific record name or number.
- Animations use 120 to 220 ms transitions for hover, focus, drawer, modal, and selection changes.
- Never animate running totals, data tables, or frequently changing financial values in a way that delays reading.
- Support `prefers-reduced-motion: reduce` and disable nonessential movement.
- Visual response to clicks must be immediate; asynchronous save buttons show progress and prevent duplicate submissions.
- Do not show fake success toasts before a server response confirms persistence.
- For long processes (backup/restore/report generation), show progress or at least an honest pending state and safe cancel options when supported.
- Scrollbars can be visually subtle or hidden by product preference, but wheel, touch, keyboard, and screen-reader scrolling must remain functional.
- Preserve scroll position when returning to lists from a detail page where feasible.

---

## 8. Reusable component specifications

### 8.1 Buttons

| Type | Appearance | Usage |
| --- | --- | --- |
| Primary | Solid blue, white text | Save, create, confirm non-destructive action |
| Secondary | Subtle surface / border | Cancel, filter, view details |
| Ghost | No filled background | Toolbar icon buttons, row actions |
| Danger | Danger-toned confirmation | Delete, revoke, reverse after explicit review |
| Icon-only | 40 by 40 px minimum hit area | Search, edit, close, collapse |

Default button height: 40 px; dense tables may use 36 px. Mobile important targets should be at least 44 by 44 px. Icon-only buttons require an accessible name and tooltip where useful.

### 8.2 Inputs and forms

- Standard control height 42 to 44 px, radius 9 px.
- Place labels **above** fields; a placeholder is never the only label.
- Required fields visibly marked; optional fields labeled when ambiguity matters.
- Errors show under the relevant field and are announced accessibly. Errors must explain how to fix the value.
- Use real select, date, autocomplete, radio, or segmented controls according to the data model.
- Currency fields: accept appropriate localized numerals but normalize for calculation and API submission.
- Phone fields: preserve user-entered country code, validate without rejecting legitimate Afghanistan formats unnecessarily.
- For measurements: show unit directly with the value and keep precision appropriate to the unit.
- Use maximum two columns for most forms, one column on mobile, three only for compact repeated measurement inputs on wider screens.
- Unsaved changes: confirm before dismissing a dirty form, navigating away, or changing a customer selection.
- Never clear the completed form until save succeeds.

### 8.3 Search and filters

- Search placeholder describes searchable fields: `Search by customer, phone, or order number`.
- Debounce text input around 250 to 400 ms for local queries if needed, but allow Enter for explicit lookup.
- Filters appear near search; selected filters are shown as removable chips or clearly labeled controls.
- Always include `Reset filters` when any filter is active.
- Status/date/payment filters must match actual backend query capabilities.
- Persist filter state during list/detail navigation when practical.

### 8.4 Tables

- Tables are the default for lists on desktop.
- Display readable header text, row hover, clickable main identifier, and trailing actions menu.
- Use sticky headers only within properly bounded scrolling containers.
- Show loading, empty, error, and filtered-zero states separately.
- Paginate or virtually render large lists; never assume all records fit in memory.
- Financial columns align consistently, show currency, and use tabular numbers.
- Show an actual count of results; do not claim a record count before the query succeeds.
- Avoid overflowing menus behind table scroll containers.
- Do not include columns that only duplicate another visible field.

### 8.5 Cards and KPIs

- Use a restrained card border and very subtle shadow; no floating glass panels.
- KPI card structure: concise label, value, helper context, optional action or tiny trend.
- Make an entire card clickable only if it has a meaningful navigation destination; provide focus state.
- Overdue and outstanding amounts should have clear contextual labels, not just red numbers.

### 8.6 Badges and statuses

- Badge has short text + subtle background + optional icon.
- Use consistent words across lists, details, receipt printing, and history.
- Available core order statuses must follow the actual API, typically `Pending`, `In Progress`, `Ready`, `Delivered`.
- Do not add `Cancelled`, per-item production sub-stages, or partial delivery transitions solely in frontend styling. Add them only after the data model and business rules support them.

Proposed core status mapping:

| Status | Visual treatment | Meaning |
| --- | --- | --- |
| Pending | Slate / neutral | Order accepted, work not started |
| In Progress | Blue | Work in progress |
| Ready | Green | Ready for collection |
| Delivered | Muted green / slate | Handed to customer |
| Overdue indicator | Amber / red accent + text | Due date passed and not fully delivered |

Overdue is **derived from date and delivery state**, not necessarily an independent order status.

### 8.7 Modals, drawers, and details

- Use dialogs for short, contained actions: create customer, record payment, reverse payment, confirmation.
- Use page-level detail views for rich records: customer, order, measurement history.
- Widths: small 420 px, medium 600 px, large 840 px, within viewport margins.
- Trap focus within open dialogs; restore focus on close.
- `Esc` closes non-destructive dismissible dialogs, but never silently discards unsaved data.
- Confirm payment reversals and data restore with high-visibility explanation.

### 8.8 Toasts, alerts, and empty states

- Toast for confirmed success: short, non-blocking, 3 to 5 seconds.
- Persistent alert for errors requiring action or a risky storage condition.
- Empty page state: relevant icon, one sentence, one genuine CTA.
- Offline-first means **no internet** is normal; do not report that as an error. A missing local backend or failed DB connection is an actual connection error.
- Error copy must never expose stack traces, credentials, file paths with sensitive information, or SQL statements.

### 8.9 Tabs

- Tabs should group related details, not entire product modules.
- Use selected underline or filled indicator, with accessible tab semantics and keyboard navigation.
- On mobile, tab strip may scroll horizontally; selected tab must remain visible.
- A customer detail page may use `Overview / Measurements / Orders / Payments / Ledger / Activity` when each panel is implemented.

### 8.10 Date and time components

- Display dates in the selected locale and clearly show delivery deadlines.
- Current verified baseline uses Gregorian dates; **Jalali display/input is a future design target unless newer code supports it**.
- If a calendar toggle is implemented, store a canonical ISO/Gregorian date in the backend and convert only at presentation boundaries.
- Never silently reinterpret a displayed Jalali date as Gregorian on submit.
- Use shop-local calendar day for `Today`, `Due today`, and daily summaries. Avoid UTC date shifts.

---

## 9. Dashboard design

### Goal

Give the owner a readable priority list within seconds, without forcing them through large charts.

### Desktop hierarchy

```text
[Dashboard] [Today / business date]            [+ New Order]

[Active Orders] [Due Today] [Ready for Pickup] [Outstanding AFN]

[Attention Needed: Overdue Orders / Due Soon]

[Recent Orders table]                         [Recent Payments]

[Optional compact date-range chart when supported]
```

### Must-have content

- Active orders, due today, ready for pickup, and amount outstanding.
- Overdue order panel with customer, order number, due date, and quick access.
- Fast actions: New customer, New order, Record payment.
- Recent orders limited to a useful subset, with `View all` link.
- No estimated profit unless expense/cost tracking supports truthful calculation.
- Distinguish **order revenue** from **money collected**. These are not identical.

### States

- No orders yet: explain how to create the first order.
- No overdue orders: show a calm success state; do not use an empty red warning box.
- Load failure: show retry with clear explanation and keep other modules usable.

---

## 10. Customers design

### Customers listing

Top row: title, count, primary `Add Customer`.  
Second row: search by name/phone, optional customer type filter.  
Table: Customer, Phone, Active Orders, Outstanding Balance, Last Visit, Actions.

Only display calculated columns when backed by efficient actual queries. Never fetch every order just to derive each customer's totals on the frontend.

### Add/Edit customer

- Required: customer name.
- Optional: phone, WhatsApp, father's name, address, notes, and customer type as supported.
- Inline duplicate warning may use similar name/phone, but must not silently merge profiles.
- Preserve names in Dari/Pashto without transliteration.
- Keep a clear `Save & New Order` shortcut if supported.

### Customer detail

Header: name, phone, status/summary, actions.  
Tabs: Overview, Measurements, Orders, Payments/Ledger, Activity when implemented.  
Primary CTA: `Create Order` using the selected customer.

### Critical UX rule

A customer's current measurement changes must not overwrite measurement snapshots on previously created orders. Show measurement version/date in the UI.

---

## 11. Measurements design

### Template-driven approach

Use clothing-type templates, not one giant form. Typical examples:

- Afghan shalwar kameez: shirt length, shoulder, sleeve, chest, neck, trouser length, waist, leg opening.
- Suit / jacket: jacket length, shoulder, chest, sleeve, trouser waist, trouser length.
- Women's garments: contextual sleeve, bust, waist, hip, dress length, and optional specialty measurements.

Avoid imposing one uniform set of measurements across all garments. Additional fields should be configurable only when the backend model can store them safely.

### Measurement screen layout

```text
[Customer: Ahmad]   [Garment Type ▼]   [Profile: Standard ▼]

[Upper-body measurements]       [Lower-body measurements]
[Size, Shoulder, Sleeve...]     [Waist, Length, Leg opening...]

[Style / Collar / Pocket / Stitch notes]
[Reference image, if supported]

[Previous versions]            [Save New Version]
```

### Rules

- Always show measurement unit (`cm` or `in`) next to numeric entry.
- Never silently mix centimeter and inch values. Conversion must be explicit and testable.
- Provide a `Copy from previous version` action when data supports it.
- Show clear active version and chronological version history.
- Snapshot the selected version when creating an order.
- Reference garment images must be optional and stored locally for offline work if supported.
- Use input grouping to avoid a confusing full-screen spreadsheet of measurements.

---

## 12. Orders design

### Orders list

Toolbar: Search, Status, Due Date, Payment State, Reset, `New Order`.  
Columns: Order #, Customer, Garments / Quantity, Created, Due, Status, Total, Paid, Balance, Actions.

- Highlight overdue dates with text `Overdue by N days`, not color alone.
- Link on order number opens detail view.
- Default sort prioritizes action-required orders or latest orders, according to explicit screen label.
- Show `Ready` orders separately where useful.

### New order workflow

Use a simple wizard **only if it saves time**, or one readable form with logical sections. Target sequence:

1. **Customer:** search or add customer inline.
2. **Garments:** choose type, quantity, unit price, notes, and relevant measurement snapshot.
3. **Schedule:** order date, due date, optional assigned tailor and urgency when supported.
4. **Payment:** show server-calculated total, optional advance payment, remaining balance.
5. **Review & save:** verify items, customer, schedule, and totals before submit.

### Financial example

| Item | Quantity | Unit Price | Line Total |
| --- | ---: | ---: | ---: |
| Afghan shalwar kameez | 2 | 1,200 AFN | 2,400 AFN |
| Waistcoat | 1 | 800 AFN | 800 AFN |
| **Total** | | | **3,200 AFN** |
| **Advance** | | | **2,000 AFN** |
| **Balance** | | | **1,200 AFN** |

These are **illustrative values**, not production records. Client-side totals may preview amounts; the backend must validate and calculate authoritative totals using whole AFN integers in the current release.

### Order detail

Header: order number, customer, due date, status, quick actions.  
Summary: total, paid, balance, quantities.  
Main tabs: Overview, Items / Measurements, Payments, Status History, Activity, Print when supported.

- Show the exact measurement snapshot attached to each garment.
- Never silently replace an item's snapshot with a newly edited customer measurement.
- If a payment is reversed, show a clearly traceable reversal event.
- Editing quantities or prices after payment requires validation and an understandable change record.
- Make status transitions explicit and require backend authorization.

---

## 13. Production and tailor management design (expansion)

**Only implement these screens after current API/storage capabilities are confirmed or extended safely.**

### Production board

Views: `Table` (default), `Board` (optional).  
Stages as supported by the model: Pending, Cutting, Sewing, Fitting, Finishing, Ready, Delivered. These **must not be treated as existing core status values** without proper migrations and transition rules.

Board card should show: order/item code, customer, garment, quantity, assigned tailor, due date, urgency. Board movement requires permission and confirmed save.

### Tailors overview

- List: name, expertise, active assignments, completed items, payable amount.
- Profile tabs: Overview, Assigned Jobs, Completed Jobs, Payable Ledger, Activity.
- Separate work completion from wage payment. A completed garment does not automatically mean its tailoring wage has been paid.
- Show rate type: piece rate, fixed salary, or approved hybrid.
- Payroll actions should have explicit accounting semantics, not just visual counters.

---

## 14. Inventory design (expansion)

### Inventory list

Columns: Item, Category, Color/Variant, Unit, Available, Minimum Stock, Purchase Cost, Actions.  
Fast filters: Low Stock, Fabric, Accessories, Supplier when supported.

### Detail / stock movement

- Inventory card must show a correct physical unit such as meter, gaz, piece, or pack.
- Keep a stock movement ledger: purchase, consumption for order, adjustment, reversal.
- Display customer-owned fabric separately from shop-owned fabric if supported.
- Negative inventory is prohibited by default unless a documented role-restricted workflow allows it.
- Do not mix units without a recorded conversion rate.
- Saving an order must not decrement stock twice on retries. UI must not imply success until persisted.
- Every inventory-changing action shows before, delta, and after in its confirmation/receipt where practical.

---

## 15. Finance, payments, and ledger design

### Core payments list

Columns: Receipt #, Date, Customer, Order #, Amount AFN, Method, Recorded By, Status / Actions.  
Filters: customer, date range, receipt number, payment method, reversed status.

### Record payment dialog

```text
Record Payment
Order: #1001   Customer: Ahmad
Order total:       3,200 AFN
Already paid:      2,000 AFN
Remaining due:     1,200 AFN

Amount [       ] AFN
Method [Cash ▼]
Note   [           ]

[Cancel]                    [Record Payment]
```

- Backend is authority for balance and payment validity.
- Disable duplicate submission while saving.
- Show final receipt only after confirmed persistence.
- Reversals are traceable corrections, not silent deletion.
- A reversal dialog states which payment is affected, why, and what the new balance will be after server confirmation.

### Finance expansion

- Use clearly separate tabs for collections, customer debt, expenses, cash accounts, and wage payments only when implemented.
- Never sum AFN, USD, and PKR as one number without explicit conversion and a stored rate. Current documented release is **AFN-only**.
- Do not display `Net Profit` until related expenses and cost-of-goods inputs are present and correctly modeled.
- Distinguish `Sales/Order Value`, `Cash Collected`, `Outstanding`, `Operating Expenses`, and `Profit`.

---

## 16. Delivery design

### Ready-for-pickup queue

Rows: Order #, Customer, Garments, Ready Date, Promised Date, Balance, Contact, Deliver action.

### Delivery confirmation

- Identify recipient and delivery date when supported.
- Show payment balance clearly before handing over garments.
- If partial delivery is supported, let the user select exact items and quantities, with remaining quantities shown.
- Never display a partial-delivery UI against a backend that only supports whole-order delivery.
- If a shop policy permits delivery with an unpaid balance, require proper role authorization and show the remaining debt.
- Offer a print-ready delivery receipt after confirmation.

---

## 17. Reports design

### Report landing page

Prefer concise report cards or tabs with date filters at the top:

1. Orders by day / month.
2. Due and overdue orders.
3. Delivered orders.
4. Payments received.
5. Outstanding customer balances.
6. Customer history.
7. Production, payroll, inventory, expenses, and profit only when their source modules are implemented.

### Report filters and output

- Date range selector; explicit `Apply`/`Reset`.
- Clear currency units and report generation timestamp.
- Explain filters in printable report header.
- Show a table before a chart when the user needs to verify individual entries.
- Provide CSV/PDF/print actions only when they produce actual usable output.
- Charts should not be required to understand a report; offer labels, legend, and values.
- Use pagination or server-side aggregation for large datasets.
- In reports, **order value** and **cash collected** must never be presented interchangeably.

---

## 18. Employees and access design (expansion)

The initial reference archive was single-user, while later work may have added health/auth JWT routers. Inspect present implementation before adding or redesigning auth.

### Authentication screens

- Sign In: email or approved username identifier, password, show/hide password, visible error messages.
- Sign Up / owner bootstrap: only if first-run account creation is allowed by backend rules.
- Password reset: only when a real recovery flow is implemented. Never render a fake link.
- Avoid external identity dependencies if they compromise offline operation.

### Employee list and profile

- Columns: Employee, Role, Contact, Status, Joined, Actions.
- Profile: personal details, work role, access level, activity, salary if authorized.
- Use explicit status Active/Inactive, not hidden user deletion.
- Separate personal staff profile from permission grant where backend design requires it.

### Role-aware UI

Recommended conceptual roles: Owner/Admin, Manager, Tailor, Cashier, Viewer. These are **design proposals**, not claims that corresponding RBAC is implemented. Every protected action requires backend permission enforcement.

- Hide inaccessible navigation where appropriate, but do not rely on hiding for security.
- Distinguish insufficient permission from a missing record.
- Avoid showing salary, financial details, or user administration to unauthorized roles.
- Don't put tokens in URLs or visible debug banners.

---

## 19. Settings, local data, backup, and restore

Suggested settings groups:

- **Shop profile:** shop name, phone, address, optional logo, receipt footer.
- **Appearance:** light/dark theme, density if implemented, language, direction.
- **Dates and numbers:** locale, display calendar, measurement unit (where supported).
- **Printing:** page type, header/footer preview, numbering style.
- **Data & safety:** backup, restore, migration/version information.
- **Users & permissions:** only with a verified auth backend.

### Backup screen

- Display last successful backup only when verifiable.
- Use distinct buttons: `Create Backup` and `Restore Backup`.
- Restore requires selecting a valid file, validating compatibility, presenting the exact action, and confirming that current data will be replaced.
- Recommend a protective backup before a destructive restore; backend must enforce integrity checks.
- Never place live SQLite database files in exported source-code ZIP packages.
- A successful toast may appear only after the backup file is actually created and verified.

---

## 20. Receipt and print specifications

### General

- Support an accessible **A4 portrait** printable receipt by default and a compact receipt only if the shop's printer/page settings support it.
- Print is monochrome-friendly, crisp, with no dark UI background, animations, menus, or shadows.
- Use consistent space for shop logo/name, address/phone if configured, timestamp, order/receipt number, customer, line items, amounts, and footer.
- Use local fonts with correct Dari/Pashto glyphs; do not rely on remote fonts.
- Use `@media print` and actual print sizes in mm where possible. Preview before print.
- Do not print hidden personal metadata, authorization tokens, or internal database IDs unnecessarily.
- Receipts must be reproducible from stored immutable financial/order records, not from unsaved frontend form drafts.

### Suggested order receipt layout

```text
              THREAD & LEDGER / SHOP NAME
                 Shop address / contact
------------------------------------------------
ORDER RECEIPT                  ORDER #1001
Date: YYYY-MM-DD               Due: YYYY-MM-DD
Customer: Ahmad                Phone: ........
------------------------------------------------
Garment              Qty      Unit       Total
Shalwar Kameez        2       1200        2400
Waistcoat             1        800         800
------------------------------------------------
Order total                              3200 AFN
Payments received                       2000 AFN
Outstanding                             1200 AFN
------------------------------------------------
Measurements / remarks: see attached details
                 Thank you for visiting
```

Illustrative, not real customer data. For Dari/Pashto, mirror the text layout as appropriate while isolating phone numbers and numeric codes.

### Printing QA

- Test A4, narrow printer widths where implemented, Windows/macOS/Linux print dialogs as applicable, and a physical printer when available.
- Test dark-mode screen to light-mode print transformation.
- Confirm no clipped columns, incorrect page breaks, or duplicated receipt totals.

---

## 21. Localization requirements

### Languages and direction

| Language | Locale | Direction | Preferred audience |
| --- | --- | --- | --- |
| Dari | `fa-AF` | RTL | Afghan Dari speakers |
| Pashto | `ps-AF` | RTL | Afghan Pashto speakers |
| English | `en` | LTR | International / technical users |

- Every user-visible label, tooltip, empty state, validation error, confirmation, status label, receipt label, and report title must use translation keys.
- Never concatenate localized strings into grammatically incorrect phrases.
- Keep translation keys semantic: `orders.create`, `payments.balance_due`, `errors.request_failed`.
- Switch language without navigating away or losing unsaved edits.
- Place UI direction on `html` (or an equivalent stable root) and use logical CSS properties.
- Numeric inputs must recognize localized digits appropriately, but normalize before API submission.
- Use `dir="ltr"` on phone numbers, identifiers, email, ISO dates, and codes when embedded in RTL prose; prevent bidi confusion.
- Keep correct units: `AFN`, `؋`, `cm`, `in`. Avoid ambiguous currency strings.
- If an unsupported language state is encountered, use a clear fallback without mixing random untranslated phrases throughout a page.

### Translation acceptance examples

| Key | English | Dari | Pashto (review required) |
| --- | --- | --- | --- |
| `nav.dashboard` | Dashboard | داشبورد | ډشبورډ |
| `nav.customers` | Customers | مشتریان | پېرودونکي |
| `nav.orders` | Orders | سفارشات | فرمایشونه |
| `actions.save` | Save | ذخیره | خوندي کول |
| `actions.cancel` | Cancel | انصراف | لغوه کول |
| `orders.balance` | Remaining balance | باقی‌مانده | پاتې پیسې |
| `orders.due_date` | Delivery date | تاریخ تحویل | د سپارلو نېټه |
| `common.search` | Search | جستجو | لټون |

---

## 22. Responsiveness and accessibility contract

### Breakpoints

| Target | Width | Default composition |
| --- | --- | --- |
| Compact mobile | 360 to 479 px | Single column, drawer nav |
| Mobile | 480 to 767 px | One column or two compact cards |
| Tablet | 768 to 1023 px | Collapsed nav and one/two columns |
| Desktop | 1024 to 1439 px | Sidebar + page, up to three-column KPIs |
| Wide desktop | 1440 px+ | Sidebar + spacious page, 4 KPI cards |

Prefer content-driven layouts over device detection. Test at 360, 390, 768, 1024, 1280, and 1440 px widths.

### Accessibility checklist

- Normal text contrast target 4.5:1; large text and visual indicators at least 3:1 where WCAG AA applies.
- Visible `:focus-visible` state; logical keyboard order in RTL and LTR.
- Proper labels and accessible names for all controls.
- Buttons have discernible purpose; avoid icon-only ambiguous actions.
- Errors are shown as text, connected to fields, and announced when appropriate.
- Dialogs trap focus while open and restore it on exit.
- Important state is not indicated only by color, shape, or motion.
- Screen-reader friendly tables, sorting indications, and status updates.
- Reduced motion support and usable 200% zoom.
- Destructive actions are explicit, reversible where feasible, and logged.

---

## 23. Loading, performance, and offline experience

- Prefer skeletons for simple known page structure, but avoid jarring repeated shimmer animation.
- Show a real pending state on saves, backups, and restore operations.
- Keep previous list content visible during background filtering when it would reduce flicker and not mislead the user.
- Use list pagination, queries, and server aggregations where practical; do not loop over entire datasets on every React render.
- Avoid expensive chart libraries when simple tables/bars meet the need.
- Bundle fonts, icons, assets, and core scripts for offline use.
- Offline mode is the expected operation; local API unavailable is a distinct error.
- Never log raw customer measurements, payment details, or credentials to the browser console in production.
- Respect reduced CPU and older Windows laptop hardware; keep animations restrained.

---

## 24. Component architecture and folder guidance

**Existing verified entry points** include `frontend/src/main.tsx`, `frontend/src/style.css`, and `frontend/src/types.ts`. Use whatever structure the *current* repository actually contains. The following is a **recommended incremental target**, not a claim that these folders exist:

```text
frontend/
  src/
    app/                  # app shell, routes, providers
    components/
      layout/             # Sidebar, Topbar, PageHeader
      ui/                 # Button, Input, Modal, Badge, Table
      feedback/           # Toast, ConfirmDialog, EmptyState
      print/              # Receipt and print helpers
    features/
      dashboard/
      customers/
      measurements/
      orders/
      payments/
      reports/
      settings/
      production/         # expansion only
      inventory/          # expansion only
      employees/          # expansion only
    i18n/                 # translation dictionaries
    styles/               # tokens, global, print styles
    services/             # typed API clients
    types/                # shared TypeScript view models
```

**Do not refactor the app into this tree simply to match a design document.** Introduce shared components and directories only when the change improves maintainability and preserves current functionality.

### Example component contracts

- `PageHeader(title, description?, primaryAction?, breadcrumbs?, actions?)`
- `StatCard(label, value, helperText?, icon?, onClick?)`
- `DataTable(columns, rows, loading, error, emptyState, pagination?)`
- `StatusBadge(status, label?)`
- `CurrencyAmount(amount, currency = 'AFN', locale)`
- `DateDisplay(value, locale, calendarMode)`
- `ConfirmDialog(title, message, confirmLabel, severity, onConfirm)`
- `FormField(id, label, required?, error?, hint?)`

These are conceptual TypeScript interfaces; adapt them to the actual UI framework and component API rather than copy-pasting blindly.

---

## 25. Screen state matrix

Every important screen should account for these states:

| State | Visual behavior | Required action |
| --- | --- | --- |
| Initial loading | Structure skeleton or concise progress | Avoid duplicate requests |
| Populated | Correct data + primary CTA | Operable keyboard and pointer controls |
| Empty database | Clear first-use guidance | Add first record |
| No filtered matches | No-match copy + clear filters | Reset filters |
| Validation error | Inline corrective message | Preserve entered data |
| Save pending | Button spinner/disabled duplicate-submit | Prevent double save |
| Save success | Confirmed toast or return to detail | Use persisted response |
| Request failure | Clear error + retry | Keep draft safe |
| Permission denied | Explain restriction | No fake controls |
| Database unavailable | Local backend/storage message | Retry or safe troubleshooting |
| Destructive confirmation | Specific record and consequences | Confirm or cancel |

---

## 26. Design decisions for future development

### Default decisions

- Default theme preference: **dark**, but honor any saved user choice.
- Default language: use existing configured choice; if no product choice exists, consider **Dari** for the Afghan market without overriding a working English-first deployment unexpectedly.
- Default money: **AFN whole integers** until requirements and financial architecture explicitly change.
- Default dates: **Gregorian storage**; optional Jalali display as a separately implemented feature.
- Default list: table on desktop, stacked cards only where that improves mobile usability.
- Default report: accurate labeled table, optional simple chart.
- Default typography: readable local fonts, no remote dependency.
- Default module visibility: only implemented and authorized modules appear.

### Decisions requiring backend/product work first

- Partial delivery per garment.
- Custom production stages and per-item statuses.
- Tailor payroll and salary ledger.
- Inventory reservations/consumption.
- Multiple currencies and exchange rates.
- Multi-branch or multi-shop ownership.
- Full login/RBAC and employee management if not already completed.
- Jalali date entry and dual-calendar conversion.
- Desktop auto-update and installers.

**Do not imply that a visual specification makes any of these features operational.**

---

## 27. Implementation plan for Claude

When asked to build or revise a TMS screen, follow this process:

1. **Inspect** the actual related frontend components, routes, API calls, model fields, and backend behavior.
2. **Identify phase**: existing core feature or approved expansion feature. Do not introduce dead sidebar links.
3. **Sketch layout** using the shell, spacing, typography, and tokens in this document.
4. **Reuse** existing components and styling conventions. Do not introduce a parallel design system.
5. **Implement localization** for every new user-visible string in supported languages and adapt RTL/LTR.
6. **Connect real data**; remove hardcoded sample customers, orders, money, and charts from production.
7. **Enforce business rules** on the backend. UI validation is complementary, not authoritative.
8. **Test** light/dark, RTL/LTR, desktop/tablet/mobile, empty/error/loading states, and keyboard navigation.
9. **Run** existing frontend build, backend test suites, and relevant integration tests; report exact commands and outcomes.
10. **Deliver** a concise summary and only the changed files in a ZIP, preserving paths, unless the user explicitly requests a complete project archive.

### Verification examples

```bash
# Check the existing package scripts first
cat frontend/package.json

# After installing the project's required dependencies
cd frontend
npm run build

# From the project root, after installing backend dependencies
python -m pytest backend/tests
```

Do not claim tests passed unless the commands actually ran successfully. Adapt commands to Windows or project-specific launchers when needed.

---

## 28. Detailed visual QA checklist

### Shared UI

- [ ] Top bar and sidebar are aligned, without clipped labels.
- [ ] Sidebar mirrors correctly between RTL and LTR.
- [ ] Active navigation is obvious, and collapse/expand is functional.
- [ ] The same primary blue, radius scale, fonts, spacing, and button styles appear on all screens.
- [ ] Dark and light mode are both complete, with no bright unstyled dialogs.
- [ ] No elements are cut off at 360 px width or 200% zoom.
- [ ] Tables and filters fit without accidental page-wide horizontal scrolling.
- [ ] Every interactive icon has a purpose and accessible label.
- [ ] Focus is visible throughout keyboard navigation.
- [ ] Reduced-motion preference works.

### Business UI

- [ ] Dashboard totals reflect real data and clearly distinguish payments from order value.
- [ ] Customer edit does not change historical order measurement snapshots.
- [ ] Multiple garment lines sum correctly, with backend-verified prices.
- [ ] Order due and overdue indicators use actual shop-local dates.
- [ ] Payment dialogs prevent invalid amounts and duplicate submits.
- [ ] Reverse/correction entries show traceable history.
- [ ] Receipt reflects persisted order/payment records and prints in monochrome.
- [ ] Backup/restore UX is truthful and safe.
- [ ] Employee/finance screens respect backend role permissions where present.
- [ ] Nonexistent modules and actions are not exposed in production.

### Localization

- [ ] Every screen is usable in English, Dari, and Pashto when those locales are declared released.
- [ ] No untranslated navigation, filters, modals, alerts, tooltips, or print labels.
- [ ] RTL layout mirrors correctly, including fields and actions.
- [ ] Phone numbers and order identifiers remain correctly ordered.
- [ ] Dari/Pashto fonts show correct letter joins and glyphs offline.
- [ ] Switching language/theme preserves user work.

---

## 29. Definition of done for a design task

A UI task is complete only when:

1. It matches this system or documents an approved exception.
2. Its controls perform real actions, with properly handled loading, success, and failure states.
3. It works at specified responsive widths and in both text directions.
4. It supports theme and released languages without stray untranslated strings.
5. It does not alter historical measurements, paid amounts, or records unintentionally.
6. It uses actual data and protects the user's draft on failed save.
7. Relevant tests/build checks pass, or the report clearly states why they were not run.
8. The changed-file list and backend/API impacts are clearly described.

---

## 30. Final rule

**TMS exists to help tailors spend less time on paperwork and more time serving customers.** Every visual decision must improve speed, accuracy, and confidence. Favor readable forms, reliable totals, practical navigation, and safe workflows over decorative complexity. Preserve the working application while improving it in small, verified steps.
