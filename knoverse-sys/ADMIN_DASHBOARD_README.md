# Admin Dashboard — Manage Pages

This document describes how the admin "manage" pages work in this repository, where to find the code, how data flows, required environment variables, and quick dev and extension notes.

## Overview

The admin area lives under `app/admin/` and contains the main manage pages:

- `app/admin/manage-files/` — file listing, upload, delete
- `app/admin/manage-teams/` — teams list and creation
- `app/admin/manage-teams/[teamId]/page.tsx` — team detail + member management
- `app/admin/manage-users/` — user listing and admin actions

These pages call server API routes under `app/api/admin/` for all data and side effects (CRUD operations). UI components are in `components/` and `components/ui/`.

## Core concepts and data flow

- Pages are built with the Next.js App Router. Server components are used for initial reads; client components are used for interactive controls (forms, buttons, dialogs).
- All mutations (create/update/delete) go through API routes found at `app/api/admin/*`. API routes perform auth/role checks and then call Supabase DB/storage through helpers in `supabase/` and `lib/`.
- Shared UI primitives: `components/ui/*` (buttons, inputs, dialogs, tables) and higher-level admin components in `components/`.

## Important files

- Pages

  - `app/admin/manage-files/` (list + file upload UI)
  - `app/admin/manage-teams/` (teams list)
  - `app/admin/manage-teams/[teamId]/page.tsx` (team detail)
  - `app/admin/manage-users/` (users list)

- API

  - `app/api/admin/files/*` — listing, `uploadFile`, `deleteFile`, `number-of-files`
  - `app/api/admin/teams/*` — teams list, members endpoints, `number-of-teams`
  - `app/api/admin/users/*` — users list, updates, `number-of-users`

- Auth & helpers

  - `lib/checkUserRole.ts` — role validation helper
  - `lib/auth/checkAuth.ts` — auth checking
  - `supabase/client.ts` & `supabase/server.ts` — Supabase wrappers
  - `supabase/middleware.ts` — middleware utilities

- DB
  - `db/schema.ts`
  - `supabase/migrations/` (SQL migrations and snapshots)

## Authentication & authorization

- Auth is handled via Supabase. Every admin API route should enforce server-side role checks using helpers such as `checkAuth` and `checkUserRole`.
- Client-side checks provide UX feedback but are not security. Never rely on client-only checks for admin actions.
- Keep the `SUPABASE_SERVICE_ROLE_KEY` and any server-only secrets out of client bundles and only available on the server (e.g., in `.env.local`).

## Environment variables

Add the following to `.env.local` at the project root:

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server only)
- NEXT*PUBLIC*\* variables as needed

Restart the dev server after adding/changing env vars.

## Running locally

1. Install dependencies:
   npm install

2. Set env vars in `.env.local`.

3. Start dev server:
   npm run dev

4. Visit admin routes in the browser:
   - `/admin/manage-files`
   - `/admin/manage-teams`
   - `/admin/manage-users`

## Extending functionality (quick guide)

1. Backend changes

   - Update `db/schema.ts` and add a migration under `supabase/migrations/` for DB changes.
   - Update or add API routes under `app/api/admin/` to expose new fields or endpoints.
   - Use server helpers in `supabase/server.ts` for privileged operations.

2. Frontend changes

   - Update server components or create client components in `app/admin/*` to consume new API endpoints.
   - Update or add UI controls in `components/` for forms and interactions.

3. Tests & validation
   - Validate role checks on every server route.
   - Test upload and delete flows locally against a dev Supabase instance.

## Troubleshooting

- 401 / 403 on admin pages: verify login session and role in the DB; inspect `lib/checkUserRole.ts` and `supabase/middleware.ts`.
- Upload errors: confirm `SUPABASE_SERVICE_ROLE_KEY` is present for server code and check `app/api/admin/files/uploadFile/route.ts` logs.
- DB schema mismatch: create a new migration and apply it to your database.

## Best practices

- Perform all sensitive checks and mutations on the server.
- Use the small `number-of-*` metric endpoints for dashboard cards instead of querying full lists.
- Prefer server components for lists and initial render, and client components for user interactions.

## Where to look next

- UI and components: `components/`, `components/ui/`
- Admin APIs: `app/api/admin/`
- Team detail page: `app/admin/manage-teams/[teamId]/page.tsx`
- Auth helpers: `lib/`, `supabase/`

If you want, I can also:

- Create a short example of a client component that calls one of the admin API routes.
- Add a one-page HTML admin index that links to the manage pages.
