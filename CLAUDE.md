# iGrocery — CLAUDE.md

## Language & Communication

- Always respond in German
- English for code and variable names
- English for code comments
- Keep technical terms, type names, method names original form
- Commit messages: Conventional Commits (English)

## Guiding Principles

- Prefer simplest viable solution
- Fix root cause, no workarounds
- Minimize impact: change only what necessary
- Respect existing architecture
- No silent assumptions on product decisions

## Working Mode

- Plan first for non-trivial tasks
- Bug fixes: analyze autonomously, resolve
- No asking about technical uncertainty if analysis can clarify
- Ask follow-up only for real product/UX/data model decisions
- Never mark task done without quality gate
- After relevant user correction, check if `tasks/lessons.md` needs update

## Project Context

iGrocery = private web app, two people, grocery shopping lists.
Stack: Next.js 15 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui, Heroicons, Supabase.
Mobile-first, deployed via Docker + Cloudflare Tunnel on Linux server.

## Build & Test

- `pnpm build` — production build, must pass no errors
- `pnpm lint` — ESLint, must pass no warnings
- `pnpm dev` — local dev server port 3000
- No test suite yet; verify via build, lint, manual browser test

## Architecture

- **Server Components** default — Client Components only for interactivity (hooks, events)
- **Server Actions** for all mutations — no direct Supabase calls from Client Components
- Business logic in `lib/` as pure utility functions, not components
- Check existing shared types in `lib/` and `types/` before creating new
- Forms: `react-hook-form` + `zod` for validation

## Supabase

- Server Client: `lib/supabase/server.ts`
- Browser Client: `lib/supabase/client.ts`
- Auth middleware: `lib/supabase/middleware.ts`
- `SUPABASE_SERVICE_ROLE_KEY` server-only — never expose to client
- RLS policies mandatory every table (SELECT, INSERT, UPDATE, DELETE)
- Access scoped via `household_id` → `household_members` → `auth.uid()`
- Migrations in `supabase/migrations/`, named `NNN_description.sql`

## UI Conventions

- Colors only via CSS variables / Tailwind (dark mode via `next-themes`, system default)
- shadcn/ui components as base — customize via `className`, no forking
- Icons: Heroicons (`@heroicons/react/24/outline` and `/solid`)
- Touch targets ≥ 44×44px
- German UI text, dates `TT.MM.JJJJ`, currency `X,XX €`
- Loading and error states every data-fetching page

## Important Existing Types

- Store icons: `lib/icons/storeIcons.ts` — curated Heroicons map, semantic keys
- Zod schemas: `lib/schemas/` — shared validation forms + server actions
- Supabase types: `types/database.ts` — generated from Supabase schema

## Project Structure

```
app/(auth)/         → Login, Register
app/(app)/          → Authenticated layout with BottomNav
  page.tsx          → Store overview (Home)
  stores/[id]/      → Store detail (Active/History/Deleted sections)
  lists/[id]/       → Shopping list detail with items
  settings/         → Household, categories, partner invite
  stats/            → Monthly statistics per store
components/
  ui/               → shadcn components
  stores/           → StoreCard, StoreIconPicker, NewStoreDialog
  lists/            → ListRow, CollapsibleSection, NewListDialog
  items/            → ItemRow, ItemCheckbox, NewItemDialog
  layout/           → BottomNav, ListSidebar
lib/
  supabase/         → server.ts, client.ts, middleware.ts
  schemas/          → zod validation schemas
  icons/            → storeIcons.ts
  utils.ts
supabase/
  migrations/       → SQL migrations
  seed.sql
```

## File System for Work Artifacts

- Active plan: `tasks/current.md`
- Quality reports: `tasks/quality/`
- UX reviews: `tasks/ux/`
- Archived plans: `tasks/archive/`
- Lessons learned: `tasks/lessons.md`

Agents create subdirectories automatically if missing.

## Git Conventions

- Commit prefixes: `feat()`, `fix()`, `refactor()`, `docs()`, `chore()`
- Branch schema: `feature/`, `refactor/`, `fix/`
- No force-push to `main`