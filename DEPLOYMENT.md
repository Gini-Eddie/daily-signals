# Daily Signals deployment

This is a **personal installation with one owner account**. Creating the account protects the existing habits and history; it does not erase or migrate them. Public multi-user registration is not enabled.

## Existing Vercel frontend + Render Python backend

1. Back up the production database.
2. Set a long random `ACCOUNT_SETUP_KEY` on the backend. Keep it private and enter it on the initial account creation screen. This prevents someone else claiming the existing data before you.
3. Deploy the Python backend first. Startup creates a new `daily_signals_state` table for the account, profile, check-ins and publications. Existing habit tables stay in place.
4. Deploy the frontend. The included `vercel.json` forwards `/api` requests to the existing Render backend, so no frontend API environment variable is required on Vercel. An optional `VITE_API_BASE_URL` overrides this if you host elsewhere. For a different frontend domain using direct API requests, add that exact origin to `backend/app.py` CORS configuration.
5. Create your personal account and save the recovery code privately. Use your email and that code under **Forgot password?** to choose a new password. Recovery invalidates existing sessions and replaces the recovery code. No email provider is needed; email reset links are not implemented.

Use HTTPS. Run one backend process/worker: sessions and attempt limits are currently process-local. Backend restarts require signing in again; the account and habit data persist in the database. A scaled deployment needs a shared session and rate-limit store first.

## Bundled Node server

`npm install`, `npm run build`, then `npm start` serves both the frontend and API. Leave `VITE_API_BASE_URL` unset. Production requires `ACCOUNT_SETUP_KEY` for initial account setup. Set `DATA_DIR` to a persistent writable directory on your host; back up both `store.json` and `account.json`. Do not use multiple Node processes against these JSON files. `PORT` defaults to 3000.

For local development, run `npm run dev`. Account setup does not require a key unless `ACCOUNT_SETUP_KEY` is configured. The API now defaults to `/api`, so local development uses your local data rather than the hosted account.

## Verification

- `npm run lint`
- `npm run build`
- `node --test tests/api.test.cjs` (build first)
- Install `backend/requirements.txt` plus `httpx`, then `python tests/test_backend.py`

Both integration tests use disposable data and cover account protection, target changes, previous-day logging and recovery. The Python test also covers date query parameters, editing the third signal, persisted profile and real publication scores.

Habit target changes apply to the habit definition, including when viewing past days. Entries retain their recorded values; historical target snapshots are not implemented.

## Owner provisioning and weekly goals

The requested owner account has been provisioned against the configured hosted database for the supplied email. Its initial password and recovery code are in the ignored local file `data/hosted-owner-access.txt`. Local Node development has a separate owner account; its credentials are in `data/owner-access.txt`. These files are private and must never be committed or placed in a public asset folder. After deploying, sign in and choose your own password when prompted.

For another installation, provision only a missing account with `node scripts/provision-owner.cjs <email>` (Node), or `python scripts/provision_owner.py <email>` (Python). Both scripts refuse to replace an existing account. `OWNER_ACCESS_FILE` selects the output path for the Python credentials file. Existing profile, habit and entry records are retained.

Weekly goals are separate records, organized by Monday–Sunday weeks. Each goal stores its own target, unit and progress. Completion is `min(100, progress / target × 100)`; weekly overall progress is the average of the goals' capped percentages. Goals remain editable in previous weeks. Node persists them in `DATA_DIR/weekly-goals.json`; include this file in backups. Python persists them in `daily_signals_state` alongside the owner account, without altering the existing habit tables.

Deploy the updated frontend and Python backend together so that weekly goals, owner login and password changes are available on the hosted app. The new illustration is bundled locally in `public/images/steady-progress.webp`; no external image service is required.
