# Quality Gate — Milestone 2 (Stores, Lists, Items, Favorites, Categories)

**Datum:** 2026-04-17
**Reviewer:** igrocery-quality-gate

## Review Status

Genehmigt mit Minor-Vorbehalten (Major nach Fix behoben)

## Verification Status

Statisch plausibel — Major-Finding vor Wrap-Up adressiert

## Build & Lint

- `pnpm lint` — Exit 0, 0 Warnungen
- `pnpm build` — Exit 0, 11 Routen (Next.js 16.2.4 / Turbopack)
- TypeScript strict — 0 Fehler

## Findings

### [Major → Fixed] 1. `admin.ts` ohne `import "server-only"`

- Datei: `lib/supabase/admin.ts:1`
- Risiko: Runtime-Guard `typeof window !== "undefined"` verhindert Ausführung im Browser, aber nicht das Bundling. Bei versehentlichem Import aus Client Component landet `SUPABASE_SERVICE_ROLE_KEY` im Client-Bundle.
- **Status:** Behoben — `import "server-only"` als erste Zeile + Package installiert.

### [Minor] 2. Categories Reorder — Race-Dokumentation

- Datei: `app/(app)/settings/categories/actions.ts`
- Risiko: 3-Step-Swap via temporär negativem `sort_order` ist nicht atomar. Bei parallelen Requests theoretisch inkonsistent.
- Empfehlung: Kommentar am Funktionskopf („Annahme: keine parallelen Reorder-Requests pro Household"). 2-Personen-Szenario unkritisch.

### [Minor] 3. CategoriesPage Redirect-Handling

- Datei: `app/(app)/settings/categories/page.tsx`
- Risiko: Kein `redirect("/login")` bei fehlender Session. Layout sollte absichern, aber explizite Redirect-Konsistenz mit anderen App-Routes wäre sauberer.
- Empfehlung: Session-Check + Redirect wie in `stores/[id]/page.tsx`.

### [Minor] 4. CompleteWatcher Toast-Cleanup

- Datei: `components/items/CompleteWatcher.tsx`
- Risiko: Beim Unmount (Navigation) während 30s-Timer: `clearTimeout` ja, aber `toast.dismiss()` fehlt → Undo-Toast bleibt nach Wegklick sichtbar.
- Empfehlung: `useEffect`-Cleanup mit `toast.dismiss(toastId)`.

### [Minor] 5. BottomNav Safe-Area Padding

- Datei: `components/layout/BottomNav.tsx`
- Risiko: Nav hat `pb-[env(safe-area-inset-bottom)]`, aber Content-Pages nutzen es nicht konsistent (FAB + Listen-Ende).
- Empfehlung: Globales `pb-[calc(5rem+env(safe-area-inset-bottom))]` auf `(app)/layout.tsx` main-Container.

### [Minor] 6. `createItem` N+1 bei Favorit-Upsert

- Datei: `app/(app)/lists/[id]/actions.ts`
- Risiko: Nach Insert wird `upsert_favorite` non-blocking aufgerufen. Bei schnellem Mehrfach-Add derselben Position mehrere RPC-Calls parallel → usage_count springt (akzeptabel, aber dokumentieren).
- Empfehlung: Inline-Kommentar "best-effort, non-atomar".

## Positives

- Server Actions + Zod auf allen Mutations (store/list/item/category)
- RLS-Coverage via `is_household_member()` konsistent auf allen M2-Tabellen
- `upsert_favorite` mit SECURITY DEFINER + Membership-Check + `search_path = public`
- `households_delete` RLS-Policy `using(false)` explizit
- `admin.deleteUser()` Rollback auf beiden Register-Error-Pfaden
- Cookie-Race-Fix: `middleware.ts` returned `{ response, supabase }`, `proxy.ts` nutzt Single-Client
- 3-Step-Swap Reorder korrekt implementiert
- Soft-Delete via `deleted_at` + Restore/HardDelete sauber getrennt
- `CompleteWatcher` 30s-Timer mit sonner-Undo
- `formatCurrency`/`formatDate` in `lib/format.ts` (DE-Lokalisierung)
- Icons/Colors in `lib/icons/` kuratiert (20 Icons × 8 Farben)

## Manual Verification Required

- [ ] Store erstellen / bearbeiten / löschen (Icon + Farbe)
- [ ] Liste in Store anlegen, Item hinzufügen, abhaken, bearbeiten
- [ ] Favorit-Autocomplete nach 3 Items derselben Store-Kategorie
- [ ] 30s-Auto-Complete + Undo
- [ ] History-Toggle (Loading-Skeleton fehlt, vermerkt in UX-Review)
- [ ] Hard-Delete aus History
- [ ] Categories: Erstellen / Reorder (↑/↓) / Rename / Delete
- [ ] BottomNav Active-State auf `/stores/:id` + `/lists/:id` (Home aktiv)
- [ ] Dark Mode auf allen M2-Screens
- [ ] 375px Viewport: FAB, Sections, Categories
- [ ] Safe-Area auf iOS Safari (home-indicator)
- [ ] RLS: Zweiter Haushalt sieht Stores/Listen/Items/Favoriten nicht

## Zählung

- Blocker: 0
- Major: 1 (behoben)
- Minor: 5
- Pass: Build, Lint, TypeScript, RLS, Security-Boundaries, Atomicity (accept_invite), Cookie-Race, Admin-Rollback, Server-Only-Guard

## Overall

Milestone 2 release-ready nach `server-only`-Fix. Architektur folgt CLAUDE.md konsequent: Server Components Default, Server Actions für alle Mutations, RLS auf allen Tabellen, SECURITY DEFINER mit Membership-Check. Die 5 Minor sind Polish — kein Blocker für 2-Personen-Szenario.
