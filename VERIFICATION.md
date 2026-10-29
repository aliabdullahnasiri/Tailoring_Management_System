# Verification record

Date: 27 October 2026.

## Passed

- TypeScript strict compilation and Vite production build.
- 27 pytest checks covering customer edits, a fresh backend startup and full process restart, served production assets, current measurements and preserved order snapshots, historical measurement versions, multi-item totals, advance payments, partial payments and complete settlement, duplicate order/payment submission, conflicting payment request keys, overpayment prevention, invalid amount rejection, transaction rollback, status transitions and delivery dates, database backup/restore round trip, invalid and inconsistent backup rejection, local request protections, persisted settings and repeatable migrations.
- Single-owner tests cover anonymous access rejection, hashed passwords and session tokens, closed signup, concurrent signup, CSRF checks, sign-out invalidation, login, expiry, rate limiting, HTTPS setup keys, and account preservation across restore and restart.
- Farsi and Pashto font glyph coverage was checked. Both font families and RTL layouts were visually checked in the hosted-demo preview; Pashto font loading was confirmed in the browser.
- HTTP smoke test launches the real backend in a separate process, reads the built frontend and assets, creates a customer, stops the process, starts it again and verifies the record remains.
- Production frontend consists of local bundled assets. The server does not depend on remote assets or cloud APIs for normal operation.
- Initial database schema is frozen in Alembic revision 0001.

## Remaining verification limits

- Browser interaction/visual QA could not run because the managed preview environment could not access the local Python environment. Build and HTTP tests passed; actual browser interactions are not represented as tested.
- Windows/macOS launcher execution and physical A4/80 mm printer output were not tested on those systems. The Python server and HTTP workflow were tested on Linux.
- The complete internet-disconnected workflow was not exercised in a browser. The runtime uses locally bundled frontend assets and a local SQLite backend; first-time Python dependency installation needs internet.
- New-user usability has not been tested with a tailoring shop owner.
- One non-failing warning comes from Starlette's current HTTPX TestClient deprecation. All tests pass with the pinned dependencies.

This verification record is not a claim of zero defects or completion of manual release acceptance. Follow the manual checklist below before using real shop records.

## Manual release acceptance

1. Start the app, create the owner account, sign out, verify signup is closed, and sign in again. Set shop details.
2. Add a customer and a measurement profile. Search by name and phone.
3. Create an order with two items and an advance; verify quantity × price and balance.
4. Change the current measurement profile and verify the old order still shows the original snapshot.
5. Progress through statuses and inspect overdue/due/ready lists with sample dates.
6. Record partial payments, reverse an incorrect payment and verify the history and balance.
7. Print order/payment receipts on the intended paper size; test Save as PDF.
8. Disconnect internet after setup, restart the local application and complete the same workflow.
9. Back up the sample database, change a sample record, restore the backup and verify the earlier state.
10. Ask the operator to complete a new customer/order/payment without assistance.

## Tauri desktop integration (2026-10-29)

- Local Linux: React production build and PyInstaller single-file backend build passed.
- Python suite: 28 tests passed, including the desktop ready-address protocol and shutdown on parent-pipe closure.
- Packaged backend: HTTP workflow/persistence and desktop lifecycle smoke tests passed.
- Rust launcher: compiled; backend-address validation test passed.
- Native Linux startup: created the Tauri window, installed the runtime printing capability, and verified the desktop-managed backend's auth status and React page over HTTP with an isolated temporary shop directory.
- GitHub Actions now builds Windows NSIS, Linux Debian/AppImage, and Apple Silicon macOS DMG installers and publishes installer archives for version tags. Hosted builds have not been run from this workspace.
- Manual checks remain for native receipt printing, backup download/restore dialogs, installed packages, and Windows/macOS window behavior. Signing and notarization are not configured.
