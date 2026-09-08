# Event Check-In

Event Check-In is a mobile-first event entrance tool for scanning tickets, validating attendees, recording check-ins, and monitoring live event-day operations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/event-check-in/src/App.tsx` — scanner, event-day overview, history, and settings flows
- `artifacts/event-check-in/src/index.css` — shared visual tokens and responsive styling
- `artifacts/api-server/` — shared API service scaffold for future server-backed validation
- `lib/api-spec/openapi.yaml` — API contract source of truth when the mock service is replaced

## Architecture decisions

- The first build uses a typed local mock service boundary so the scanner UI can move to a real validation API without changing the scanning interaction.
- The scanner is exposed at both `/check-in` and `/dashboard/check-in` for staff convenience and compatibility with the product requirements.
- The interface treats the backend as authoritative for ticket state; demo controls exercise the complete result-state surface without embedding sensitive customer data in QR content.
- The initial experience is mobile-first, with a desktop event-day overview for organizers.

## Product

- Live event-day overview with check-in rate, scanner coverage, entrance flow, and sync status
- Camera-style scanner workspace with continuous scanning, manual ticket lookup, and auto-check-in mode
- Distinct valid, duplicate, wrong-event, invalid, refunded, cancelled, transferred, and expired ticket states
- Check-in history, demo audit outcomes, scanner/device settings, and offline-ready messaging

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
