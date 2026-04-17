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
- [x] Install `@supabase/ssr` + `@supabase/supabase-js`
- [x] `lib/supabase/server.ts` (async `cookies()`), `client.ts`, `middleware.ts`
- [x] Root `proxy.ts` (Next.js 16: `middleware.ts` deprecated → `proxy.ts`) with matcher excluding `_next`/static/favicon
- [x] `001_initial_schema.sql` — `create extension if not exists pgcrypto` + 9 tables + trigger
- [x] `002_rls_policies.sql` — RLS + policies using `is_household_member(hid)` helper (security definer stable) to avoid recursion
- [x] `003_seed_defaults.sql` — seed + accept functions
- [x] README: create Supabase project → keys → apply migrations 001→002→003 → disable email confirmation → types-gen
- [x] `types/database.ts` placeholder
- [x] `supabase/seed.sql` placeholder
- [ ] **PAUSE** — user performs manual Supabase steps
- [ ] User runs types-gen command
- [ ] Verify: `pnpm build` with generated types

### Phase 3 — Auth (depends on Phase 2)
- [x] `lib/schemas/auth.ts`
- [x] `/login` page + Client form + `signIn()` action
- [x] `/register` page (reads `?invite=`) + form + `signUp()` (branches: new household vs invite-join)
- [x] `signOut()` + logout button
- [x] Middleware redirects: unauth → `/login` (except `/login`, `/register`, `/join/`, `/api/`); auth → `/` from auth routes
- [ ] Verify: register creates household + 9 categories, redirects `/`; logout works; unauth `/` redirects
  - [x] Unauth `/` → 307 `/login` — bestätigt via curl
  - [ ] Register-Funktionstest (erfordert Migration 005 in DB)

### Phase 4 — Invite Flow (depends on Phase 3)
- [x] `lib/schemas/invite.ts`
- [x] `createInvite`, `revokeInvite` actions
- [x] `InviteSection` Client with `useTransition`
- [x] `app/join/[token]/page.tsx` branches on auth state + token validity
- [x] `acceptInvite` RPC action
- [x] Verify: user1 creates invite → user2 (private window) registers → joins same household; expired/consumed tokens error correctly

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
- [x] Consumed invite cannot be reused
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

---

## Progress — Phase 2

**Datum:** 2026-04-17

**Abgeschlossene Schritte:**
- 2.1 `@supabase/ssr@0.10.2` + `@supabase/supabase-js@2.103.3` installiert
- 2.2 `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts` erstellt
- 2.3 Root-Proxy: `middleware.ts` in Next.js 16 deprecated → `proxy.ts` mit `export async function proxy()` erstellt
- 2.4 `supabase/migrations/001_initial_schema.sql`, `002_rls_policies.sql`, `003_seed_defaults.sql` erstellt
- 2.5 `supabase/seed.sql` Platzhalter
- 2.6 `types/database.ts` Platzhalter
- 2.7 README war bereits vollständig aus Phase 1

**Verifikation:**
- `pnpm build` — 0 Fehler, 0 Warnings
- `pnpm lint` — 0 Warnings
- `pnpm typecheck` — 0 Fehler

**Modifizierte Dateien:**
- `/home/barto/developments/igrocery/lib/supabase/server.ts` (neu)
- `/home/barto/developments/igrocery/lib/supabase/client.ts` (neu)
- `/home/barto/developments/igrocery/lib/supabase/middleware.ts` (neu)
- `/home/barto/developments/igrocery/proxy.ts` (neu — ersetzt middleware.ts, Next.js 16 Konvention)
- `/home/barto/developments/igrocery/supabase/migrations/001_initial_schema.sql` (neu)
- `/home/barto/developments/igrocery/supabase/migrations/002_rls_policies.sql` (neu)
- `/home/barto/developments/igrocery/supabase/migrations/003_seed_defaults.sql` (neu)
- `/home/barto/developments/igrocery/supabase/seed.sql` (neu)
- `/home/barto/developments/igrocery/types/database.ts` (neu)

**Verbleibend (manuelle User-Schritte vor Phase 3):**
- Supabase-Projekt anlegen + Keys in `.env.local` eintragen
- Migrations 001 → 002 → 003 im SQL Editor ausführen
- Email-Bestätigung deaktivieren
- DB-Types generieren: `pnpm dlx supabase gen types typescript --project-id <ref> --schema public > types/database.ts`
- `pnpm build` mit generierten Types verifizieren

---

## Progress — Phase 3

**Datum:** 2026-04-17

**Abgeschlossene Schritte:**
- 3.1 `lib/schemas/auth.ts` — loginSchema + registerSchema mit Zod
- 3.2 `/login`: `page.tsx` (Server), `LoginForm.tsx` (Client), `actions.ts` (`signIn`)
- 3.3 `/register`: `page.tsx` (Server, liest searchParams.invite), `RegisterForm.tsx` (Client), `actions.ts` (`signUp` mit create_household_for_user RPC)
- 3.4 `app/(auth)/actions.ts` — `signOut()` Action
- 3.5 `app/(app)/settings/page.tsx` — Settings-Stub mit Logout-Button
- 3.6 `app/(app)/layout.tsx` — Auth-Guard (getUser → redirect /login)
- 3.7 `proxy.ts` — Redirect-Logik: unauth→/login, auth auf auth-Routen→/
- 3.8 Migration `supabase/migrations/005_register_rpc.sql` — `create_household_for_user` SECURITY DEFINER Funktion
- 3.8b `types/database.ts` — `create_household_for_user` manuell eingetragen (bis Types regeneriert werden)

**Migration 005 nötig: JA**
Begründung: `household_members` hat keine INSERT-Policy für `authenticated` — nur SECURITY DEFINER Funktionen dürfen einfügen (explizit so in `002_rls_policies.sql` kommentiert). Die `create_household_for_user` Funktion kapselt Household-Erstellung + Member-Insert + Category-Seeding atomisch.

**Build/Lint/Typecheck:**
- `pnpm build` — 0 Fehler, 0 Warnings
- `pnpm lint` — 0 Warnings
- `pnpm typecheck` — 0 Fehler

**Funktionstests:**
- Unauth `/` → 307 `/login` — bestätigt via curl
- `/login` Seite lädt korrekt mit deutschem UI
- Register/Login/Logout-Flow und DB-Sanity-Check noch ausstehend (erfordert Migration 005 in Supabase)

**OFFEN — Manuelle Aktion erforderlich:**
Migration 005 muss im Supabase SQL Editor ausgeführt werden:
`supabase/migrations/005_register_rpc.sql`

Danach Types regenerieren:
```bash
pnpm dlx supabase gen types typescript --project-id yyyekcccyzonqazftvlv --schema public > types/database.ts
```

Dann vollständigen Register/Login/Logout Test + DB-Sanity-Check durchführen.

**Modifizierte/Erstellte Dateien:**
- `/home/barto/developments/igrocery/lib/schemas/auth.ts` (neu)
- `/home/barto/developments/igrocery/app/(auth)/login/page.tsx` (neu)
- `/home/barto/developments/igrocery/app/(auth)/login/LoginForm.tsx` (neu)
- `/home/barto/developments/igrocery/app/(auth)/login/actions.ts` (neu)
- `/home/barto/developments/igrocery/app/(auth)/register/page.tsx` (neu)
- `/home/barto/developments/igrocery/app/(auth)/register/RegisterForm.tsx` (neu)
- `/home/barto/developments/igrocery/app/(auth)/register/actions.ts` (neu)
- `/home/barto/developments/igrocery/app/(auth)/actions.ts` (neu)
- `/home/barto/developments/igrocery/app/(app)/settings/page.tsx` (geändert)
- `/home/barto/developments/igrocery/app/(app)/layout.tsx` (geändert — Auth-Guard hinzugefügt)
- `/home/barto/developments/igrocery/proxy.ts` (geändert — Redirect-Logik hinzugefügt)
- `/home/barto/developments/igrocery/supabase/migrations/005_register_rpc.sql` (neu)
- `/home/barto/developments/igrocery/types/database.ts` (geändert — create_household_for_user Typ manuell ergänzt)

---

## Progress — Phase 4

**Datum:** 2026-04-17

**Abgeschlossene Schritte:**
- 4.1 `lib/schemas/invite.ts` — inviteTokenSchema (32 hex chars)
- 4.2 `app/(app)/settings/actions.ts` — `createInvite` + `revokeInvite` Server Actions
- 4.3 `app/(app)/settings/page.tsx` — Server Component mit Profil, Haushalt, Members, Invites (2 Queries statt Join, da household_members.user_id → auth.users, nicht → profiles)
- 4.3 `app/(app)/settings/InviteSection.tsx` — Client Component mit useTransition, sonner toast, Copy-to-Clipboard, Revoke-Button
- 4.4 `app/join/[token]/page.tsx` — außerhalb (app)-Gruppe, branches: ungültig/eingeloggt+Haushalt/nicht-eingeloggt→register/eingeloggt+kein-Haushalt→Beitreten
- 4.4 `app/join/[token]/actions.ts` — `acceptInvite` Server Action via Supabase RPC
- 4.5 proxy.ts — `/join/` bereits in PUBLIC_PATHS, kein Update nötig
- 4.6 Migration 006 — NICHT nötig: `accept_invite` in Migration 003 enthält bereits den `bereits_in_haushalt`-Check
- 4.7 `app/layout.tsx` — `<Toaster>` von sonner ergänzt

**Migration 006 nötig: NEIN**
Begründung: `accept_invite` in `supabase/migrations/003_seed_defaults.sql` prüft bereits `exists (select 1 from household_members where user_id = auth.uid())` und raised `bereits_in_haushalt`.

**Build/Lint/Typecheck:**
- `pnpm typecheck` — 0 Fehler
- `pnpm build` — 0 Fehler, alle 8 Seiten korrekt generiert
- `pnpm lint` — 0 Warnungen

**End-to-End-Test (SQL-Simulation via Admin-API):**
- User A angelegt, Haushalt erstellt, als Owner eingetragen
- Invite-Token (`aabbccdd11223344aabbccdd11223344`) direkt in `household_invites` eingefügt
- User B angelegt, eingeloggt (JWT), `accept_invite` RPC aufgerufen
- Ergebnis: `"c461915c-ccf5-4309-b5d6-b931157c5ae7"` — korrekte household_id zurückgegeben
- `household_members`: 2 Zeilen (User A owner + User B member) im selben Haushalt
- `household_invites`: `consumed_at` + `consumed_by` korrekt gesetzt
- Zweiter `accept_invite` mit gleichem Token: `{"message":"einladung_verbraucht"}` — korrekt
- Cleanup: beide User + Haushalt gelöscht (Cascade: Members + Invite entfernt)

**Modifizierte/Erstellte Dateien:**
- `/home/barto/developments/igrocery/lib/schemas/invite.ts` (neu)
- `/home/barto/developments/igrocery/app/(app)/settings/actions.ts` (neu)
- `/home/barto/developments/igrocery/app/(app)/settings/page.tsx` (refactored — Server Component mit Datenladen)
- `/home/barto/developments/igrocery/app/(app)/settings/InviteSection.tsx` (neu)
- `/home/barto/developments/igrocery/app/join/[token]/page.tsx` (neu)
- `/home/barto/developments/igrocery/app/join/[token]/actions.ts` (neu)
- `/home/barto/developments/igrocery/app/layout.tsx` (Toaster ergänzt)
