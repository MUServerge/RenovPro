# MaysterPRO — Work & Salary Tracker

Multi-user web app for tracking work days, hours, addresses and salary/payments,
with separate **admin** and **worker** roles. Rewrite of the original single-file
HTML/localStorage prototype into a production Next.js app.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** — palette carried over from the original prototype
- **Prisma** ORM → **PostgreSQL** (Supabase)
- **Auth** — lightweight custom JWT session (bcrypt + `jose`), roles `admin` / `worker`
- **i18n** — 4 languages: Georgian (`ka`), English (`en`), Ukrainian (`uk`), French (`fr`)
- **Deploy** — Vercel

## Features (current MVP)

- Email + password login, role-based routing and route protection (middleware)
- **Worker**: own dashboard — add/delete work entries (date, hours, address) and
  payments, decimal-safe hour/rate input (comma or period), live salary/balance
  totals, CSV export
- **Admin**: all workers overview (most hours, highest balance), workers table,
  create worker accounts (rate/position), open any worker and manage their entries
- **Audit log**: every create/delete on work entries and payments is recorded
  (who, when, before → after)
- Language switcher (per-user preference, stored on the user record)

> Roadmap (from `MaysterPROplan.md`): progress photos (Supabase Storage),
> offline-first PWA sync, PDF annual reports, email reminders, richer analytics.

## Local setup

1. **Install**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at <https://supabase.com>, then copy the
   connection strings from **Settings → Database → Connection string**.

3. **Configure env** — copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — pooled connection (port `6543`, `?pgbouncer=true&connection_limit=1`)
   - `DIRECT_URL` — direct connection (port `5432`)
   - `AUTH_SECRET` — `openssl rand -base64 32`

4. **Create the tables & seed demo accounts**
   ```bash
   npm run db:push     # creates tables in Supabase from prisma/schema.prisma
   npm run db:seed     # creates an admin + a demo worker
   ```

5. **Run**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000>. Default seed logins:
   - admin  → `admin@maysterpro.app` / `admin1234`
   - worker → `worker@maysterpro.app` / `worker1234`

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the same env vars (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`) in
   **Vercel → Project → Settings → Environment Variables**.
3. Deploy. The `build` script runs `prisma generate` automatically.
4. Run `npm run db:push` once against the production database (locally with the
   prod `DIRECT_URL`, or via the Supabase SQL editor) to create the tables.

## Project layout

```
prisma/schema.prisma     data model (users, work_entries, payments, audit_log, …)
prisma/seed.ts           demo admin + worker
src/lib/auth.ts          JWT session (bcrypt + jose)
src/lib/actions.ts       server actions (login, CRUD, audit)
src/lib/i18n/            translation dictionaries (ka/en/uk/fr) + provider
src/middleware.ts        route protection
src/app/login            login page
src/app/dashboard        worker dashboard
src/app/admin            admin dashboard + /admin/workers/[id]
src/components/Tracker.tsx   the ported prototype UI (KPIs, journal, payments)
```
