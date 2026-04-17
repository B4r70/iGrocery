# iGrocery

Private Einkaufslisten-App für zwei Personen. Next.js 15 + Supabase + Tailwind + shadcn/ui.

## Voraussetzungen
- Node.js 22+
- pnpm
- Supabase Cloud Account

## Setup
1. `pnpm install`
2. Supabase-Projekt anlegen auf https://supabase.com/dashboard
3. `cp .env.example .env.local` — Keys aus Supabase-Dashboard (Settings → API) einsetzen
4. Migrations anwenden: Supabase Dashboard → SQL Editor → `supabase/migrations/001_initial_schema.sql`, dann `002_rls_policies.sql`, dann `003_seed_defaults.sql` in dieser Reihenfolge
5. Email-Bestätigung deaktivieren: Supabase Dashboard → Authentication → Providers → Email → "Confirm email" OFF
6. DB-Types generieren:
   ```
   pnpm dlx supabase gen types typescript --project-id <project-ref> --schema public > types/database.ts
   ```
7. `pnpm dev` → http://localhost:3000

## Scripts
- `pnpm dev` — Dev-Server
- `pnpm build` — Production-Build
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript strict check

## Deployment
Docker-Container via Cloudflare Tunnel → grocery.barto.cloud. Details in späterem Meilenstein.
