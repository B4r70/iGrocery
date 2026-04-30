# iGrocery — CLAUDE.md

## Language & Communication

- Always respond in German
- Use English for code and variable names
- Use English for code comments
- Keep technical terms, type names, and method names in their original form
- Commit messages: Conventional Commits (English)

## Guiding Principles

- Prefer the simplest viable solution
- Fix the root cause instead of adding workarounds
- Minimize impact: only change what is actually necessary
- Respect the existing architecture
- Do not make silent assumptions on product decisions

## Working Mode

- Plan first for all non-trivial tasks
- For bug fixes, analyze autonomously and resolve the issue
- Do not ask about technical uncertainty if it can be clarified through analysis
- Only ask follow-up questions for real product / UX / data model decisions
- Never mark a task as done without the quality gate
- After every relevant user correction, check whether `tasks/lessons.md` should be updated

## Project Context

iGrocery is a private web app for two people to manage grocery shopping lists.
Built with Next.js 15 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui, Heroicons, and Supabase.
Mobile-first design, deployed via Docker + Cloudflare Tunnel on a Linux server.

## Build & Test

- `pnpm build` — production build, must pass without errors
- `pnpm lint` — ESLint, must pass without warnings
- `pnpm dev` — local dev server on port 3000
- No test suite yet; verification is done through build, lint, and manual browser testing

## Architecture

- **Server Components** by default — Client Components only for interactivity (hooks, events)
- **Server Actions** for all mutations — no direct Supabase calls from Client Components
- Business logic belongs in `lib/` as pure utility functions, not in components
- Always check for existing shared types in `lib/` and `types/` before creating new ones
- Forms: `react-hook-form` + `zod` for validation

## Supabase

- Server Client: `lib/supabase/server.ts`
- Browser Client: `lib/supabase/client.ts`
- Auth middleware: `lib/supabase/middleware.ts`
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose to client
- RLS policies mandatory on every table (SELECT, INSERT, UPDATE, DELETE)
- All access scoped through `household_id` → `household_members` → `auth.uid()`
- Migrations in `supabase/migrations/`, named `NNN_description.sql`

## UI Conventions

- Colors exclusively via CSS variables / Tailwind (dark mode via `next-themes`, system default)
- shadcn/ui components as base — customize via `className`, not by forking
- Icons: Heroicons (`@heroicons/react/24/outline` and `/solid`)
- Touch targets ≥ 44×44px
- German UI text, dates as `TT.MM.JJJJ`, currency as `X,XX €`
- Loading and error states on every data-fetching page

## Important Existing Types

- Store icons: `lib/icons/storeIcons.ts` — curated Heroicons map with semantic keys
- Zod schemas: `lib/schemas/` — shared validation for forms and server actions
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

Agents create subdirectories automatically if they do not exist yet.

## Git Conventions

- Commit prefixes: `feat()`, `fix()`, `refactor()`, `docs()`, `chore()`
- Branch schema: `feature/`, `refactor/`, `fix/`
- No force-push to `main`
