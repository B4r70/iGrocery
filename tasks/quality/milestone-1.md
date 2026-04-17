# Quality Gate — Milestone 1 (Setup + Supabase Layer + Auth + Invite)

**Datum:** 2026-04-17
**Reviewer:** igrocery-quality-gate

## Review Status

Genehmigt mit Minor-Vorbehalten

## Verification Status

Statisch plausibel — bekannte Risiken dokumentiert

## Build & Lint

- `pnpm lint` — Exit 0, 0 Warnungen
- `pnpm build` — Exit 0, 8 Routen (Next.js 16.2.4 / Turbopack)

## Findings

### [Minor] 1. `proxy.ts` liest Session-Cookies aus Original-Request

- Datei: `proxy.ts:30`
- Risiko: Nach `updateSession()` schreibt Supabase neue Tokens in Response-Cookies. Der zweite lightweight Client liest aber noch `request.cookies.getAll()`. Bei Token-Refresh in derselben Request-Runde kann `getUser()` mit altem Token laufen.
- Empfehlung: Response-Cookies verwenden, oder Client aus `updateSession` exportieren und wiederverwenden.

### [Minor] 2. Fehlende RLS DELETE-Policy auf `households`

- Datei: `supabase/migrations/002_rls_policies.sql`
- Risiko: RLS aktiv, aber kein DELETE für households. Delete-Calls scheitern still (0 rows).
- Empfehlung: Explizite `to authenticated using (false)` oder `role = 'owner'` ergänzen.

### [Minor] 3. Kein Rollback von `auth.users` bei Household-Fehler in `signUp`

- Datei: `app/(auth)/register/actions.ts:33-59`
- Risiko: Wenn `create_household_for_user`/`accept_invite` scheitert, bleibt `auth.users`-Eintrag bestehen. Nutzer sitzt in Limbo, E-Mail ist blockiert.
- Empfehlung: Admin-API `auth.admin.deleteUser()` mit Service-Role-Key aufrufen, oder Risiko dokumentieren.

### [Info] 4. `acceptInvite` differenziert Fehler nicht

- Datei: `app/join/[token]/actions.ts:16-18`
- Risiko: `einladung_verbraucht`, `einladung_abgelaufen`, `einladung_unbekannt` landen alle bei `redirect("/?invite_error=1")`, UI zeigt nichts.
- Empfehlung: Error-State auf `/join/[token]` selbst rendern.

### [Info] 5. `SUPABASE_SERVICE_ROLE_KEY` ungenutzt

- Risiko: Toter Env-Var, Verwirrung.
- Empfehlung: Kommentar im `.env.example` oder entfernen bis Milestone ihn braucht.

### [Info] 6. Token-Lowercase-Annahme nicht dokumentiert

- Datei: `lib/schemas/invite.ts`, `app/(app)/settings/actions.ts:23`
- Risiko: Regex `/^[0-9a-f]{32}$/` setzt Node lowercase-UUID voraus. Per Spec gegeben, aber undokumentiert.

### [Info] 7. `invite_error` Query-Param nicht verarbeitet

- Korreliert mit Finding 4.

### [Info] 8. `households_insert` Policy: `with check (true)`

- Datei: `supabase/migrations/002_rls_policies.sql:64-66`
- Risiko: Jeder authentifizierte Nutzer kann leere Households anlegen (nicht Mitglied werden — kein direkter INSERT auf `household_members`).
- Empfehlung: Auf `false` setzen, nur via SECURITY DEFINER erlauben.

## Positives

- Server Actions + Zod auf allen Mutations
- RLS auf allen 9 Tabellen, `is_household_member()` SECURITY DEFINER STABLE
- `accept_invite()` atomar mit `FOR UPDATE` Lock
- `handle_new_user()` Trigger mit `search_path = public`
- Token 32 Hex, Regex konsistent
- `.gitignore` schließt `.env*` korrekt aus
- BottomNav 56px Touch-Target, `aria-current`, deutsche UI-Texte
- Dark Mode via `next-themes`, `lang="de"`, `suppressHydrationWarning`
- `types/database.ts` konsistent mit Migrationen (9 Tabellen + 4 Funktionen)

## Manual Verification Required

- [ ] Login-Flow: E-Mail/Passwort → `/` mit BottomNav
- [ ] Register ohne Invite: Konto → Profil + Haushalt + 9 Kategorien
- [ ] Register mit Invite: `/join/<token>` → `/register?invite=<token>` → korrekter Haushalt
- [ ] Logout → `/login`, Re-Login → `/`
- [ ] `/settings` auf 375px Viewport
- [ ] `/settings` im Dark Mode (blaue Invite-Hinweisbox prüfen)
- [ ] BottomNav aktiver State auf allen 3 Tabs
- [ ] Abgelaufener Token (manuell `expires_at = now() - interval '1h'`)
- [ ] Session-Persistenz nach Browser-Close
- [ ] RLS Smoke-Test: zweiter User sieht Daten des ersten nicht
- [ ] Supabase: E-Mail-Bestätigung deaktiviert

## Zählung

- Blocker: 0
- Major: 0
- Minor: 3
- Info: 5
- Pass: Build, Lint, Typen, RLS-Coverage, Atomicity, Security-Boundaries

## Overall

Solides Fundament. Architektur folgt CLAUDE.md konsequent. Die 3 Minor-Issues sind real, aber nicht blockierend für 2-Personen-Szenario. Finding 1 (Cookie-Race) und Finding 3 (User-Limbo) vor Milestone 2 adressieren.
