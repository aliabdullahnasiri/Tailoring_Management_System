# Thread & Ledger | Tailoring Management System

A single-shop, local-first tailoring application based on the supplied TMS PRD. React + TypeScript + Vite frontend, FastAPI + Pydantic backend, SQLAlchemy + SQLite, and Alembic migrations. The production frontend is already built and included.

## Start on Windows

1. Extract this ZIP into a writable folder, for example `D:\TailoringMS`.
2. Install Python 3.12 or newer if it is not installed. Enable “Add Python to PATH” during installation.
3. Double-click `Start-Windows.bat`.
4. First launch installs Python dependencies and requires internet. Later launches work offline.
5. The browser opens `http://127.0.0.1:8000`. Keep the terminal open while using the application.

No Node.js installation is needed to use the included built application. On first launch, create your owner account. Signup then closes permanently. Later visits use your username and password; Sign out ends the server session. Run only one server process; the launcher enforces the default port and uses one worker. Use a password of at least 10 characters and keep it safe; password recovery is not included.

## Start on Linux or macOS

With Python 3.12+ and Python venv support installed:

```sh
sh start-linux-mac.sh
```

On Ubuntu, install the corresponding Python venv package if the launcher reports that venv is unavailable. First-time dependency installation requires internet. The application itself uses no external fonts, scripts, APIs, or cloud storage.

## First shop workflow

1. Create the owner account, then open Settings and enter your shop name, phone, address and receipt paper size.
2. Open Customers, click New customer, and save a name and optional phone/notes.
3. Open that customer's card, choose Measurements, and add a named profile. Select a clothing type, units and at least one measurement.
4. Choose New order. Select the customer, set the due date, add clothing items, select saved measurements, enter quantity/unit price and an optional advance.
5. Open the order and select Pending, In progress, Ready or Delivered. Marking an order delivered does not silently collect its balance.
6. Record later payments from the order or Payments page. A printable receipt opens after a payment.
7. Correct an incorrect payment using Reverse payment and a reason. For a partial correction, reverse the entire payment and enter the correct amount. History remains visible.
8. Use Settings > Download backup regularly. Use the browser's Save As dialog/download settings to choose a USB drive or another location.

Orders and payments cannot be silently deleted. The release does not provide cancellation/refund or editing order lines after creation; those were not required in the P0 workflow. Check a new order before saving. Status changes can be corrected and remain in the history.

## Data protection and location

Windows default: `%LOCALAPPDATA%\TailoringMS\tailoring.db`.
Linux/macOS default: `~/.local/share/TailoringMS/tailoring.db`.
Set `TMS_DATA_DIR` to an absolute directory before launch to override the location.

Data stays outside the program folder, survives application restarts, and does not depend on the current directory. Startup applies Alembic migrations. Orders retain immutable copies of the selected measurements. Current profiles retain earlier versions. Monetary amounts use whole AFN integers; fractional AFN and other currencies are not supported.

Backup uses SQLite's consistent backup API. Restore validates the database, schema version, relationships, totals and key input data before replacement. A pre-restore safety backup stays next to the live database. Use only backups you trust. Restore supports version 0001 of this application and files up to 50 MB. Restore replaces the complete shop dataset, not individual records.

The launcher binds to 127.0.0.1. All shop API routes require a server session; writes also require a CSRF token. Passwords use salted scrypt hashes. Sessions expire after 12 hours, and sign-in is limited to 10 failed attempts per 15 minutes.

The owner account is in `authentication.db` beside `tailoring.db`. Shop backup/restore does not include or alter the owner account. For a full machine migration, stop the server and securely copy the entire data directory. Never delete `authentication.db` to update the program.

For your own HTTPS server, set `TMS_PUBLIC_ORIGIN=https://your-domain.example` and a random `TMS_SETUP_KEY` of at least 20 characters before first signup. The first signup requires this key. Keep uvicorn on localhost behind your HTTPS reverse proxy and run one worker. This enables Secure cookies. Remove the setup key after account creation. The ChatGPT-hosted browser demo is separate and still uses platform login.

## Receipts and dates

Print an order from its details or print a payment from Payment history. Select Save as PDF in the browser/operating-system print dialog when available. A4 and 80 mm content widths are provided. Configure the matching paper size in the printer dialog; physical printer output has not been tested here.

Dates use the computer's local calendar/timezone. Set the shop computer's clock and timezone correctly. Timestamp records are stored in UTC and shown in local time. Gregorian dates ship in v1; Solar Hijri is deferred by the PRD. A reprinted receipt shows the order's current total paid/balance and the original individual payment amount/date.

## Language support

English, Farsi and Pashto interfaces include right-to-left layouts, forms, reports, receipts and account screens. Vazirmatn is bundled for Farsi; Noto Sans Arabic is bundled for Pashto. Fonts load locally without internet. Native-speaker review is recommended before production use.

## Developer setup

Frontend source:

```sh
cd frontend
npm ci
npm run build
```

Development frontend, while the backend runs on port 8000:

```sh
npm run dev
```

Backend from the project root with uv:

```sh
uv sync --locked
uv run uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000 --workers 1
uv run pytest
```

Alternatively create `.venv` with Python, install `backend/requirements.txt`, then run `.venv/bin/python -m pytest` (Windows: `.venv\Scripts\python.exe -m pytest`). The lockfile pins dependencies. Update dependencies deliberately and rerun tests before distributing an updated release.

## Included / deferred

Included: six navigation sections; customer create/edit/search and duplicate warnings; measurement profiles with units and version history; multiple order items and snapshots; status and delivery history; partial payments, idempotent submission, reversals and balance checks; printable receipts; live dashboard and date-filtered reports; shop settings; SQLite backup/restore; responsive layouts.

Deferred as specified: cloud sync, multiple accounts, multi-branch management, inventory, payroll, expense accounting, WhatsApp/SMS, customer mobile applications, AI measurements and desktop EXE packaging. Reports deliberately do not claim net profit. No demo customers or payments are shipped in your live database.

## Verification

See `VERIFICATION.md` for the actual checks and remaining verification limits. This is tested source with a built frontend, not a signed Windows installer. Test with sample shop records and your printer before moving real records into it.
