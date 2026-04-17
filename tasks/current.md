# Milestone 1 — Setup + Supabase & Auth

**Complexity:** Large
**Mode:** Phased (5 phases, each with its own verification gate)

## Summary

Bootstrap Next.js 15 App-Router project with strict TypeScript, Tailwind, shadcn/ui, Heroicons, next-themes, react-hook-form+zod, Supabase SSR. Create DB schema (9 tables) with RLS, default-category seeding, Email/Password Auth (Login/Register/Logout), Auth middleware, and household-invite flow (`/settings` stub + `/join/[token]`). At end: a logged-in user lands on empty home shell with BottomNav; a second user can join the household via invite link.

## Scope

### Included
- Phase 1: Next.js project init, tooling, base layout, BottomNav skeleton, folder structure, env template, README
- Phase 2: Supabase migrations (tables, RLS, seed function, invite table), types/database.ts, Supabase clients (server/browser/middleware)
- Phase 3: `/login`, `/register`, logout action, auth middleware + redirect rules
- Phase 4: Invite mechanism — `household_invites` table already in migration 001, `/settings` page stub with generate-token button (server action), `/join/[token]` page with accept-action
- Phase 5: Git init, initial commit, remote on `git.barto.cloud:barto/igrocery.git`

### Excluded
- Stores / Lists / Items / Favorites CRUD (Milestones 3–6)
- Stats (Milestone 7)
- Docker, Cloudflare Tunnel, production deploy (Milestone 8)
- PWA manifest (later)
- Profile edit UI (later settings milestone)
- Password reset / magic link (out of scope per concept)

## Product Decisions (resolved before planning)

- **Supabase Cloud** — user creates project manually, provides URL + anon key + service-role key via `.env.local`
- **Invite-only registration** — enforced via Supabase Dashboard "Allow new users to sign up" disabled after both users registered; `/register` route still exists
- **Invite tokens** — generated in `/settings`, link to `/join/[token]`, 24h TTL, single-use
- **Local dev port** — 3000 (production 3010:3000 later)
- **Domain** — `grocery.barto.cloud` (Cloudflare Tunnel in later deploy milestone)
- **Git remote** — `git@git.barto.cloud:barto/igrocery.git` (repo does not exist yet, created at end of milestone)

## Planner Decisions

### Q1: Invite mechanism in Milestone 1 or later?
**Decision: In Milestone 1.** Rationale:
- Without it, user 2 cannot onboard without manual DB hackery — concept requires two users from day one
- The `household_invites` table is trivial (5 columns), costs almost nothing to add to migration 001
- `/join/[token]` is a single page with one server action; deferring it creates a gap where user 1 has nothing testable
- `/settings` is needed as a minimal shell anyway (BottomNav links to it)

Scope of invite stub in this milestone:
- Token generation button + "Copy invite link" UI on `/settings`
- Listing of active (non-expired, non-consumed) invites with revoke action
- `/join/[token]` page: if logged out → redirect to `/register?invite=<token>`; if logged in but already in a household → error; if logged in no household → insert household_member + consume token
- Register flow reads `?invite=` query param; if present, joins existing household instead of creating a new one

### Q2: Auto-generate Supabase types or handwritten `types/database.ts`?
**Decision: CLI-generated.** Command in README:
```bash
pnpm dlx supabase gen types typescript --project-id <project-ref> --schema public > types/database.ts
```
Checked into git. Regenerated after each migration. Handwriting types for 9 tables is wasteful and drifts.

### Q3: Seed strategy — DB trigger or server action?
**Decision: Hybrid.**
- **Profile row**: DB trigger on `auth.users` INSERT — auto-creates `profiles` entry so we never have orphaned auth users. This is plumbing, not business logic.
- **Household + members + default categories + display_name**: Server action in `/register`. Reason: we need to know whether the user came via invite token (join existing household) or not (create new household). A trigger cannot access request-scoped invite context cleanly.

Flow:
1. `signUp()` → auth.users row inserted → trigger fires → `profiles` row with `display_name = ''` created
2. Server action then: `UPDATE profiles SET display_name = ...`, either `INSERT households` + `INSERT household_members` + seed categories, or (invite path) consume token + `INSERT household_members`

## Affected Files

### Project scaffolding (Phase 1)
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, `eslint.config.mjs`, `.gitignore`, `.env.example`, `README.md`
- `app/layout.tsx`, `app/globals.css`, `app/(auth)/layout.tsx`, `app/(app)/layout.tsx`
- `app/(app)/page.tsx`, `app/(app)/stats/page.tsx`, `app/(app)/settings/page.tsx`
- `components/layout/BottomNav.tsx`, `components/theme-provider.tsx`, `lib/utils.ts`

### shadcn base components (Phase 1)
- `components/ui/` — button, input, label, form, card, toast, toaster, use-toast, dialog

### Supabase layer (Phase 2)
- `lib/supabase/server.ts`, `client.ts`, `middleware.ts`
- `middleware.ts` (root)
- `types/database.ts` (generated, committed)
- `supabase/migrations/001_initial_schema.sql` — tables + invites + pgcrypto + profile trigger
- `supabase/migrations/002_rls_policies.sql` — RLS + policies
- `supabase/migrations/003_seed_defaults.sql` — `seed_default_categories` + `accept_invite`
- `supabase/seed.sql` — placeholder

### Auth (Phase 3)
- `lib/schemas/auth.ts`
- `app/(auth)/login/` — page, actions, LoginForm
- `app/(auth)/register/` — page, actions, RegisterForm
- `app/(auth)/actions.ts` — shared signOut

### Invite (Phase 4)
- `lib/schemas/invite.ts`
- `app/(app)/settings/actions.ts`, `InviteSection.tsx`
- `app/join/[token]/page.tsx`, `actions.ts`

## Data Model Details

### `household_invites` (migration 001)
```sql
create table household_invites (
  token text primary key,
  household_id uuid not null references households on delete cascade,
  created_by uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  consumed_at timestamptz,
  consumed_by uuid references auth.users on delete set null
);
create index on household_invites (household_id);
```

RLS: SELECT/INSERT/UPDATE/DELETE restricted to household members. Public acceptance via `SECURITY DEFINER` function `accept_invite(token)` (atomic validate+consume, never exposes household_id).

### Profile auto-create trigger (migration 001)
```sql
create function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name) values (new.id, '');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

### Default categories (migration 003)
`seed_default_categories(p_household uuid)` inserts 9 rows: Obst & Gemüse, Milchprodukte, Fleisch & Fisch, Backwaren, Getränke, Tiefkühl, Drogerie, Süßigkeiten, Sonstiges.

## UX Placement

**BottomNav** — Home / Statistik / Einstellungen, in `(app)/layout.tsx`, `usePathname()` for active tab. Hidden on `/join/[token]` (outside `(app)` group).

**Settings page (minimum viable):**
- "Mein Profil" — display_name + email readonly
- "Haushalt" — name + member list
- "Partner einladen" — button creates token, shows `https://grocery.barto.cloud/join/<token>` + Copy button + active-invites table with revoke
- "Abmelden" — logout button

## Implementation Steps

### Phase 1 — Next.js + Tooling
- [ ] `pnpm create next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias "@/*" --eslint`
- [ ] tsconfig: `"strict": true`, `"noUncheckedIndexedAccess": true`
- [ ] Add deps: next-themes, @heroicons/react, react-hook-form, zod, @hookform/resolvers, clsx, tailwind-merge, class-variance-authority
- [ ] `pnpm dlx shadcn@latest init` (neutral, CSS variables, zinc)
- [ ] `pnpm dlx shadcn@latest add button input label form card toast dialog`
- [ ] Root layout with ThemeProvider, `lang="de"`, `suppressHydrationWarning`
- [ ] Route groups `(auth)` + `(app)` with layouts
- [ ] BottomNav ≥44px touch, active via `usePathname`
- [ ] Placeholder pages in German
- [ ] `.env.example` + `README.md`
- [ ] Verify: `pnpm build`, `pnpm lint`, `pnpm dev` all pass

### Phase 2 — Supabase Layer (depends on Phase 1)
- [ ] Install `@supabase/ssr` + `@supabase/supabase-js`
- [ ] `lib/supabase/server.ts` (async `cookies()`), `client.ts`, `middleware.ts`
- [ ] Root `middleware.ts` with matcher excluding `_next`/static/favicon
- [ ] `001_initial_schema.sql` — `create extension if not exists pgcrypto` + 9 tables + trigger
- [ ] `002_rls_policies.sql` — RLS + policies using `is_household_member(hid)` helper (security definer stable) to avoid recursion
- [ ] `003_seed_defaults.sql` — seed + accept functions
- [ ] README: create Supabase project → keys → apply migrations 001→002→003 → disable email confirmation → types-gen
- [ ] **PAUSE** — user performs manual Supabase steps
- [ ] User runs types-gen command
- [ ] Verify: `pnpm build` with generated types

### Phase 3 — Auth (depends on Phase 2)
- [ ] `lib/schemas/auth.ts`
- [ ] `/login` page + Client form + `signIn()` action
- [ ] `/register` page (reads `?invite=`) + form + `signUp()` (branches: new household vs invite-join)
- [ ] `signOut()` + logout button
- [ ] Middleware redirects: unauth → `/login` (except `/login`, `/register`, `/join/`, `/api/`); auth → `/` from auth routes
- [ ] Verify: register creates household + 9 categories, redirects `/`; logout works; unauth `/` redirects

### Phase 4 — Invite Flow (depends on Phase 3)
- [ ] `lib/schemas/invite.ts`
- [ ] `createInvite`, `revokeInvite` actions
- [ ] `InviteSection` Client with `useTransition`
- [ ] `app/join/[token]/page.tsx` branches on auth state + token validity
- [ ] `acceptInvite` RPC action
- [ ] Verify: user1 creates invite → user2 (private window) registers → joins same household; expired/consumed tokens error correctly

### Phase 5 — Git Init
- [ ] `git init`
- [ ] Initial commit (Conventional: `feat(setup): initialize iGrocery with Next.js 15, Supabase auth, and invite flow`)
- [ ] User creates `igrocery` repo in Forgejo UI
- [ ] `git remote add origin git@git.barto.cloud:barto/igrocery.git`
- [ ] `git push -u origin main`

## Manual Verification

- [ ] `pnpm install` no warnings
- [ ] `pnpm build` 0 errors, 0 warnings
- [ ] `pnpm lint` 0 warnings
- [ ] Unauth visit `/` → redirect `/login`
- [ ] Register new email → profile + household + 9 categories → `/`
- [ ] BottomNav Home/Stats/Settings, correct active state
- [ ] System dark mode respected
- [ ] Logout → `/login`; login → `/`
- [ ] `/settings` generate invite, copy link
- [ ] Private window register via invite link → joins same household (2 rows in `household_members`, 1 household)
- [ ] RLS smoke test: cross-household select returns 0 rows
- [ ] Expired invite (manual `expires_at = now() - '1h'`) → error UI
- [ ] Consumed invite cannot be reused
- [ ] Repo pushed to `git.barto.cloud:barto/igrocery.git`

## Risks

### Technical
- **Next.js 15 `cookies()` async** — must await. Developer consults Context7 for `@supabase/ssr` + Next 15 pattern before Phase 2.
- **Server Action + middleware cookie sync** — standard `updateSession` pattern.
- **Email confirmation default ON** — user disables in Supabase Dashboard. README documents.
- **RLS recursion on `household_members`** — `is_household_member(hid)` helper (security definer stable) breaks recursion.
- **Invite token security** — 32-char crypto-random, never leak household_id, atomic `accept_invite`.

### Process
- User performs manual steps before Phase 2 verification: create Supabase project, copy keys, apply migrations, disable email confirm, types-gen
- Developer halts Phase 2 until user confirms

## Resolved Decisions

- **Household name on first registration**: `"${display_name}s Haushalt"` (renameable later in Settings).
- Domain `grocery.barto.cloud`, port 3010 later, invite 24h TTL single-use.
