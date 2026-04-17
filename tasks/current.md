# Milestone 2 — Stores, Lists, Items, Favorites

**Complexity:** Large
**Mode:** Phased (6 phases, each with its own quality gate)

## Summary

Vollständige dreistufige Navigation (Home → Store → List → Items) nach Apple-Reminders-Ästhetik. Stores-CRUD mit Icon-Picker und Farb-Palette. Pro Store: Shopping-Lists mit Active/History/Deleted-Sections und Soft-Delete. Pro Liste: Items mit Checkbox, Kategorie, Menge, Preis, Angebot-Flag, Notiz. Complete-Flow (letzte Position abgehakt → Toast mit Undo → Status `completed`). Favorites automatisch aus Item-Adds generiert, Vorschläge im New-Item-Dialog. Categories pro Haushalt editierbar in Settings. Zusätzlich drei Minor-Fixes aus Milestone 1 (proxy.ts Cookie-Race, households DELETE-Policy, signUp-Rollback).

## Scope

### Included
- Stores: List, Create, Edit, Delete (Home + Detail-Header)
- StoreIconPicker: curated Heroicons-Map (20 Icons laut Konzept)
- Store-Farbe: 8-Farben-Palette (CSS-Variable-gebunden + Tailwind-Safelist)
- Shopping-Lists: New, Soft-Delete, Restore, Hard-Delete, Complete, Reopen
- List-Sections: Active / History (30 Tage Default) / Deleted (einklappbar, default collapsed außer Active)
- List-Items: Create, Update (all fields), Check/Uncheck, Delete
- NewItemDialog mit Autocomplete aus Favoriten (debounced, 2+ Zeichen, 8 Treffer)
- Favorites Auto-Logik: beim Item-Create upsert mit usage_count++
- Complete-Flow: Button + Toast-Undo (5s) + Auto-Complete bei letztem Check
- Categories: List, Create, Rename, Delete, Reorder (↑/↓) in Settings
- Totals: live im List-Header ("X offen · Y erledigt" + Summe)
- Minor-Fix 1: proxy.ts nutzt updateSession-Client statt Second-Client
- Minor-Fix 2: households DELETE-Policy (explizit false — Household-Delete nicht Teil dieses Milestones)
- Minor-Fix 3: signUp-Rollback via Admin-API (Service-Role-Key wird endlich genutzt)

### Excluded
- Stats/`/stats` (Milestone 7)
- Drag-and-Drop (Kategorien und Items)
- Realtime-Sync
- Household-Rename / Delete
- Favoriten-Verwaltungs-UI (Rename/Delete einzelner Favoriten) — nur Auto-Erzeugung in diesem Milestone
- Monatsübersicht und Charts
- PWA/Manifest
- Docker/Deployment

## Product Decisions

- History-Default: 30 Tage, Toggle "Alle anzeigen" via Query-Param
- Favorites: auto aus Item-Create (case-insensitive Title-Match), kein manuelles Kuratieren
- Categories-Reorder: kompakt-Layout — ChevronUp/Down (36px) links + Tap-auf-Name = Inline-Edit + Delete rechts
- Leere Listen: erlaubt, kein Auto-Delete
- Offer-Flag: `TagIcon` (Heroicons) inline nach Titel, `text-orange-500`, `aria-label="Angebot"`, kein Text-Badge, keine Sortierung
- Items: auto sort_order, kein manuelles Reorder
- Default-Listentitel: "Einkauf TT.MM.JJJJ" bei Create
- Soft-Delete: `deleted_at IS NOT NULL` = gelöscht, in Deleted-Section sichtbar, restorebar
- Hard-Delete: Cascade-Delete der Liste (+ Items) erst nach User-Confirm in Deleted-Section
- **Complete-Flow (M1-Entscheidung):** Auto-Trigger mit **30s**-Delay nach letztem Check. Toast "Alle Positionen erledigt · Liste abschließen in 30s · Rückgängig". Tab-Close = kein Auto-Complete (akzeptiert). Manueller Button als Primärweg immer verfügbar.
- **Inline-Edit Titel (M2):** `onBlur` + `Enter` = save · `Escape` = reset auf Original · Input scrollt bei Keyboard-Öffnung ins Bild · `min-w-[120px] max-w-full`
- **Sections-Defaults:** Active open, History + Deleted closed (weicht von Konzept "alle closed" bewusst ab — pragmatischer)
- **BottomNav Active-State:** `href === "/" ? pathname === "/" : pathname.startsWith(href)` → `/stores/*` und `/lists/*` = Home-Tab aktiv, `/settings/*` = Einstellungen-Tab
- **Dark Mode:** StoreCard-Icon immer `text-white`, Farb-Klassen ggf. `opacity-80` im Dark Mode
- **Safe-Area:** FAB `bottom-[calc(4rem+env(safe-area-inset-bottom))]`, Content-Bereich `pb-[calc(5rem+env(safe-area-inset-bottom))]`
- **NewItemDialog "Speichern & weiter":** Titel leeren + fokussieren, Kategorie + Menge behalten
- **Sidebar-Trigger (Mobile):** `Bars3Icon` im ListHeader oben-links, `aria-label="Andere Listen"`
- **Dialog + Keyboard (iOS):** `max-h-[calc(100dvh-env(keyboard-inset-height))]` mit `dvh`
- **Empty-State Stores:** "Noch keine Geschäfte · Tippe +, um zu starten"
- **Hard-Delete Text:** 'Liste „{Titel}" und alle Positionen unwiderruflich löschen?'
- **Autocomplete-Placeholder:** "Position suchen oder hinzufügen…"
- **Undo-Toast-Text:** "Liste abgeschlossen · Rückgängig"
- **Back-Button** in Store-Detail und List-Detail (oben-links, `ArrowLeftIcon`)
- **Alle-abgehakt + Erledigt-Gruppe-eingeklappt:** Einblendung "Alle Positionen erledigt · Liste abschließen" statt leere Ansicht

## Affected Files

### Migration (Phase 1)
- `supabase/migrations/006_milestone2_helpers.sql` — upsert_favorite + households_delete Policy

### Types (Phase 1)
- `types/database.ts` — regeneriert nach Migration 006

### Shared Library (Phase 1)
- `lib/icons/storeIcons.ts` — curated Heroicons-Map (20 Icons outline+solid)
- `lib/icons/storeColors.ts` — 8 Farben (hex + key + label)
- `lib/schemas/store.ts`, `list.ts`, `item.ts`, `category.ts` — zod-Schemas
- `lib/format.ts` — `formatCurrency`, `formatDate` (TT.MM.JJJJ)
- `lib/lists/aggregate.ts` — `countOpen`, `countDone`, `sumTotal` (pure)

### Stores (Phase 2)
- `app/(app)/page.tsx` — Stores-Grid (umgeschrieben)
- `app/(app)/actions.ts` — createStore/updateStore/deleteStore
- `components/stores/{StoreCard,StoreIconPicker,StoreColorPicker,StoreFormFields,NewStoreDialog,EditStoreDialog,StoreGridFab}.tsx`

### Lists per Store (Phase 3)
- `app/(app)/stores/[id]/page.tsx`
- `app/(app)/stores/[id]/actions.ts` — createList/softDeleteList/restoreList/hardDeleteList/completeList/reopenList/updateListTitle
- `components/lists/{ListRow,CollapsibleSection,NewListDialog,StoreHeader,ListHistoryToggle}.tsx`

### List Detail + Items (Phase 4)
- `app/(app)/lists/[id]/page.tsx`
- `app/(app)/lists/[id]/actions.ts`
- `app/(app)/lists/[id]/favorites/route.ts` — JSON-Endpoint Autocomplete
- `components/items/{ItemRow,ItemCheckbox,NewItemDialog,EditItemDialog,FavoriteAutocomplete,ItemsGroup,ListHeader}.tsx`
- `components/lists/ListSidebar.tsx`

### Categories in Settings (Phase 5)
- `app/(app)/settings/categories/page.tsx`
- `app/(app)/settings/categories/actions.ts`
- `components/categories/CategoryManager.tsx`
- `app/(app)/settings/page.tsx` — Link ergänzt

### Fixes (Phase 6)
- `proxy.ts` — nutzt updateSession-Client
- `lib/supabase/middleware.ts` — Rückgabe `{ response, supabase }`
- `lib/supabase/admin.ts` (neu) — Service-Role-Client (Server-only!)
- `app/(auth)/register/actions.ts` — `auth.admin.deleteUser()` im Rollback

## Data Model (Migration 006)

```sql
create or replace function public.upsert_favorite(
  p_store_id    uuid,
  p_title       text,
  p_quantity    text,
  p_price       numeric(10,2),
  p_category_id uuid
) returns void
  language plpgsql security definer set search_path = public
as $$
declare
  v_normalized text := lower(btrim(p_title));
  v_existing   uuid;
begin
  if not exists (
    select 1 from stores s
    join household_members hm on hm.household_id = s.household_id
    where s.id = p_store_id and hm.user_id = auth.uid()
  ) then
    raise exception 'nicht_berechtigt';
  end if;

  select id into v_existing
    from favorites
    where store_id = p_store_id
      and lower(btrim(title)) = v_normalized
    limit 1;

  if v_existing is not null then
    update favorites
      set usage_count = usage_count + 1,
          default_quantity = coalesce(p_quantity, default_quantity),
          default_price    = coalesce(p_price, default_price),
          category_id      = coalesce(p_category_id, category_id)
      where id = v_existing;
  else
    insert into favorites (store_id, title, default_quantity, default_price, category_id, usage_count)
      values (p_store_id, btrim(p_title), p_quantity, p_price, p_category_id, 1);
  end if;
end;
$$;

grant execute on function public.upsert_favorite(uuid, text, text, numeric, uuid) to authenticated;

create policy "households_delete"
  on households for delete
  to authenticated
  using (false);
```

## UX Placement

### Home `/` — Stores-Grid
- Grid `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, farbige Icon-Cards
- FAB bottom-right über BottomNav

### Store-Detail `/stores/[id]`
- Header: Icon + Name + Edit
- Sections: Aktiv (open), History (closed), Gelöscht (closed)

### List-Detail `/lists/[id]`
- Mobile: full-width + Sheet-Sidebar
- Desktop (lg+): Sidebar links (240px) + Hauptbereich
- Header: Datum · Store · inline-editierbarer Titel · Counter + Summe + Complete-Button
- Items gruppiert nach Kategorie + separate "Erledigt"-Gruppe

### `/settings/categories`
- Subroute mit Zurück-Link, Liste mit Inline-Edit + ↑/↓

## Implementation Steps

### Phase 1 — Migration + Shared Libs
- [x] `supabase/migrations/006_milestone2_helpers.sql`
- [x] `lib/icons/storeIcons.ts` (20 Icons)
- [x] `lib/icons/storeColors.ts` (8 Farben)
- [x] `lib/schemas/{store,list,item,category}.ts`
- [x] `lib/format.ts` + `lib/lists/aggregate.ts`
- [x] `pnpm build && pnpm lint` — 0 Fehler, 0 Warnungen
- [ ] **PAUSE** — Migration 006 im Supabase SQL-Editor
- [ ] Types regenerieren

### Phase 2 — Stores (Home)
- [x] `app/(app)/actions.ts` CRUD
- [x] StoreIconPicker/StoreColorPicker/StoreFormFields/NewStoreDialog/EditStoreDialog
- [x] StoreCard mit active-lists-count Badge
- [x] StoreGridFab
- [x] `app/(app)/page.tsx` Grid

### Phase 3 — Shopping-Lists per Store
- [x] 7 Actions (create/softDelete/restore/hardDelete/complete/reopen/updateTitle)
- [x] CollapsibleSection, ListRow, StoreHeader, NewListDialog, ListHistoryToggle
- [x] `stores/[id]/page.tsx` mit 3 Queries (Active/History/Deleted)

### Phase 4 — List Detail + Items + Favorites
- [x] Actions: createItem (ruft upsert_favorite), updateItem, toggleItem, deleteItem, completeList, reopenList, updateListTitle
- [x] ItemCheckbox (Reminders-Style), ItemRow, EditItemDialog, ItemsGroup
- [x] FavoriteAutocomplete (debounced 200ms), NewItemDialog mit "Speichern & weiter"
- [x] `favorites/route.ts` JSON-GET
- [x] ListHeader inline-edit + Counter + Summe
- [x] ListSidebar (Desktop inline, Mobile Sheet)
- [x] Complete-Auto-Flow: clientseitiger **30s**-Undo-Timer → `completeList()`. Toast zeigt Restzeit. Bei Tab-Close: Timer verloren (akzeptiert)
- [x] Wenn alle offen=0 und Erledigt-Gruppe eingeklappt: Info-Block "Alle Positionen erledigt · Liste abschließen" einblenden
- [x] Offer-Flag: `TagIcon` `text-orange-500` inline nach Titel
- [x] BottomNav `isActive` erweitern: Subrouten-Match via `startsWith`
- [x] FAB + Content-Padding via `env(safe-area-inset-bottom)`
- [x] Dialog `max-h-[calc(100dvh-env(keyboard-inset-height))]` + `dvh`
- [x] Back-Button in Detail-PageHeadern

### Phase 5 — Categories in Settings
- [x] actions.ts create/rename/delete/moveUp/moveDown
- [x] CategoryManager (Client)
- [x] `/settings/categories/page.tsx`
- [x] Settings-Link

### Phase 6 — Minor-Fixes
- [x] middleware.ts gibt `{ response, supabase }` zurück
- [x] proxy.ts nutzt diesen Client
- [x] households_delete Policy (in 006 enthalten)
- [x] `lib/supabase/admin.ts` (Service-Role, Server-only)
- [x] register/actions.ts — admin.deleteUser() im Rollback

## Manual Verification

- [ ] `pnpm build && pnpm lint && pnpm typecheck` alle 0
- [ ] Stores: Create/Edit/Delete/RLS
- [ ] Store-Detail: 3 Sections, Restore, History-Toggle
- [ ] List-Detail: inline-edit, Counter, Autocomplete, "Speichern & weiter", Item-Check, Auto-Complete mit Undo
- [ ] Categories: CRUD + Reorder + Delete von referenzierten Kats
- [ ] Favorites Auto: case-insensitive Dedup, usage_count hochzählt
- [ ] proxy.ts Token-Refresh
- [ ] households_delete blockiert
- [ ] signUp-Rollback: invalid invite hinterlässt keinen orphaned auth.user

## Risks

- **upsert_favorite SECURITY DEFINER** — expliziter Membership-Check eingebaut
- **Complete-Undo-Timer** — clientseitig halten, Tab-Close = keep as-is (kein Lost-State)
- **Tailwind Farben** — `style={{backgroundColor}}` statt dynamischer Klassen
- **Next.js 16 searchParams** — Promise, await in Server Component
- **Pausierungs-Punkt** zwischen Phase 1 und 2 für Migration + Types-Regen
- **SERVICE_ROLE_KEY** nun produktiv — README ergänzen

## Open Questions

Keine blockierenden. Sechs Planer-Entscheidungen pragmatisch getroffen — siehe "Product Decisions".

---

## Progress

**2026-04-17 — Phase 5 abgeschlossen**

Erledigte Schritte:
- `app/(app)/settings/categories/actions.ts` — createCategory (sort_order = max+1), renameCategory (Zod), deleteCategory (FK ON DELETE SET NULL), moveCategoryUp / moveCategoryDown (3-Schritt-Swap via temporärem negativen Wert)
- `components/categories/AddCategoryForm.tsx` — Client Component, useTransition, Toast bei Fehler, Form-Reset nach Erfolg
- `components/categories/CategoryManager.tsx` — Client Component, CategoryRow mit Inline-Edit (onBlur + Enter = save, Escape = reset), ChevronUp/Down disabled bei first/last, TrashIcon mit window.confirm
- `app/(app)/settings/categories/page.tsx` — Server Component, Membership-Query, Kategorien sortiert nach sort_order ASC, Back-Link, AddCategoryForm, CategoryManager
- `app/(app)/settings/page.tsx` — Link "Kategorien verwalten" → /settings/categories mit ChevronRightIcon ergänzt
- TypeScript-Fix: form action mit Return-Typ war nicht kompatibel → AddCategoryForm als separater Client Component mit onSubmit-Handler
- `pnpm build` — erfolgreich, 0 Fehler
- `pnpm lint` — 0 Warnungen, 0 Fehler

Veränderte/neue Dateien:
- `/home/barto/developments/igrocery/app/(app)/settings/categories/actions.ts` (neu)
- `/home/barto/developments/igrocery/app/(app)/settings/categories/page.tsx` (neu)
- `/home/barto/developments/igrocery/components/categories/CategoryManager.tsx` (neu)
- `/home/barto/developments/igrocery/components/categories/AddCategoryForm.tsx` (neu)
- `/home/barto/developments/igrocery/app/(app)/settings/page.tsx` (Link ergänzt)

---

**2026-04-17 — Phase 4 abgeschlossen**

Erledigte Schritte:
- `app/(app)/lists/[id]/actions.ts` — createItem (upsert_favorite non-blocking), updateItem, toggleItem, deleteItem, completeList, reopenList, updateListTitle
- `app/(app)/lists/[id]/favorites/route.ts` — GET Handler, ILIKE-Suche, limit 8, order usage_count DESC
- `app/(app)/lists/[id]/page.tsx` — Server Component, 5 Queries, Kategorie-Gruppen, Erledigt-Gruppe, CompleteWatcher, FAB, Empty State
- `components/items/ItemCheckbox.tsx` — Reminders-Style Kreis, 44×44 Touch-Target, aria-checked, useTransition
- `components/items/ItemRow.tsx` — Checkbox + Content-Tap → EditItemDialog, TagIcon für Angebot, DocumentTextIcon für Notiz, Subtitle Menge · Preis, Line-Through wenn erledigt
- `components/items/EditItemDialog.tsx` — shadcn Dialog, react-hook-form + zodResolver, alle Felder, Confirm-Delete
- `components/items/NewItemDialog.tsx` — FAB + Dialog, FavoriteAutocomplete, "Speichern & weiter" mit Kategorie+Menge behalten, focus via useEffect+State (kein titleRef in Render)
- `components/items/FavoriteAutocomplete.tsx` — debounced 200ms, setState in async callback (kein setState-in-effect), Keyboard-Navigation ↑↓ Enter Escape
- `components/items/ItemsGroup.tsx` — CollapsibleSection-Wrapper, Server Component
- `components/items/ListHeader.tsx` — Back-Link, Sidebar-Trigger, Inline-Edit Titel, Counter + Summe, Complete/Reopen Button, allDoneHint Block
- `components/items/CompleteWatcher.tsx` — 30s Auto-Complete Timer, sonner Toast mit Undo, Cancel bei Uncheck
- `components/items/ListPageClient.tsx` — Client-Wrapper für Sidebar-Sheet-State
- `components/lists/ListSidebar.tsx` — Desktop Aside (240px), Mobile Sheet via Bars3Icon
- `types/database.ts` — upsert_favorite Args auf nullable (p_category_id, p_price, p_quantity) korrigiert
- `lib/schemas/item.ts` — is_offer von `.default(false)` auf `.optional()` geändert (Resolver-Kompatibilität)
- `pnpm build` — erfolgreich, 0 Fehler
- `pnpm lint` — 0 Warnungen, 0 Fehler

Veränderte/neue Dateien:
- `/home/barto/developments/igrocery/app/(app)/lists/[id]/actions.ts` (neu)
- `/home/barto/developments/igrocery/app/(app)/lists/[id]/favorites/route.ts` (neu)
- `/home/barto/developments/igrocery/app/(app)/lists/[id]/page.tsx` (neu)
- `/home/barto/developments/igrocery/components/items/ItemCheckbox.tsx` (neu)
- `/home/barto/developments/igrocery/components/items/ItemRow.tsx` (neu)
- `/home/barto/developments/igrocery/components/items/EditItemDialog.tsx` (neu)
- `/home/barto/developments/igrocery/components/items/NewItemDialog.tsx` (neu)
- `/home/barto/developments/igrocery/components/items/FavoriteAutocomplete.tsx` (neu)
- `/home/barto/developments/igrocery/components/items/ItemsGroup.tsx` (neu)
- `/home/barto/developments/igrocery/components/items/ListHeader.tsx` (neu)
- `/home/barto/developments/igrocery/components/items/CompleteWatcher.tsx` (neu)
- `/home/barto/developments/igrocery/components/items/ListPageClient.tsx` (neu)
- `/home/barto/developments/igrocery/components/lists/ListSidebar.tsx` (neu)
- `/home/barto/developments/igrocery/types/database.ts` (upsert_favorite nullable Args)
- `/home/barto/developments/igrocery/lib/schemas/item.ts` (is_offer optional)

---

**2026-04-17 — Phase 3 abgeschlossen**

Erledigte Schritte:
- `app/(app)/stores/[id]/actions.ts` — createList / softDeleteList / restoreList / hardDeleteList / completeList / reopenList / updateListTitle (Server Actions, Zod-Validierung, RLS-Scope via store_id)
- `components/lists/CollapsibleSection.tsx` — Client Component, useState, ChevronDown-Animation, aria-expanded, headerExtra-Slot
- `components/lists/ListRow.tsx` — Server Component, Context-abhängige Aktionsbuttons (active/history/deleted), inline `"use server"` forms
- `components/lists/HardDeleteButton.tsx` — Client Component, window.confirm mit korrektem Text, useTransition
- `components/lists/NewListDialog.tsx` — Client Component, FAB-Trigger, react-hook-form, zodResolver, Auto-Prefill "Einkauf TT.MM.JJJJ"
- `components/lists/StoreHeader.tsx` — Server Component, Back-Link, Store-Icon-Badge, EditStoreDialogTrigger
- `components/stores/EditStoreDialogTrigger.tsx` — Client-Wrapper damit StoreHeader Server Component bleibt
- `components/lists/ListHistoryToggle.tsx` — Server Component, Link-Toggle zwischen 30d und all
- `app/(app)/stores/[id]/page.tsx` — Next.js 16 async params/searchParams, 3 Queries (active/history/deleted), Item-Count-Aggregation, 3 CollapsibleSections, FAB, Empty-States
- `pnpm build` — erfolgreich, 0 Fehler
- `pnpm lint` — 0 Warnungen

Veränderte Dateien:
- `/home/barto/developments/igrocery/app/(app)/stores/[id]/actions.ts` (neu)
- `/home/barto/developments/igrocery/app/(app)/stores/[id]/page.tsx` (neu)
- `/home/barto/developments/igrocery/components/lists/CollapsibleSection.tsx` (neu)
- `/home/barto/developments/igrocery/components/lists/ListRow.tsx` (neu)
- `/home/barto/developments/igrocery/components/lists/HardDeleteButton.tsx` (neu)
- `/home/barto/developments/igrocery/components/lists/NewListDialog.tsx` (neu)
- `/home/barto/developments/igrocery/components/lists/StoreHeader.tsx` (neu)
- `/home/barto/developments/igrocery/components/lists/ListHistoryToggle.tsx` (neu)
- `/home/barto/developments/igrocery/components/stores/EditStoreDialogTrigger.tsx` (neu)

---

**2026-04-17 — Phase 2 abgeschlossen**

Erledigte Schritte:
- `app/(app)/actions.ts` — createStore / updateStore / deleteStore (Server Actions, Zod-Validierung, household_id-Scope, RLS)
- `components/stores/StoreIconPicker.tsx` — grid-cols-5, aria-pressed, selected-Ring
- `components/stores/StoreColorPicker.tsx` — 8 Farb-Kreise, inline-style, ring on selected
- `components/stores/StoreFormFields.tsx` — react-hook-form Controller für alle drei Felder
- `components/stores/NewStoreDialog.tsx` — controlled open/onOpenChange, zodResolver, Toast on success
- `components/stores/EditStoreDialog.tsx` — Defaults aus store-Prop, Löschen mit confirm-Step
- `components/stores/StoreCard.tsx` — Client Component (wegen EditStoreDialog-State), farbiger Icon-Badge, active-lists-count
- `components/stores/StoreGridFab.tsx` — FAB fixed bottom-right, öffnet NewStoreDialog
- `app/(app)/page.tsx` — Stores-Grid, Membership-Check, active-lists-count per Store, Empty-State, FAB
- `components/layout/BottomNav.tsx` — Active-State für `/stores/*` und `/lists/*` → Home-Tab
- Bugfix: Zod v4 hat `error.errors` → `error.issues` geändert (in actions.ts korrigiert)
- `pnpm build` — erfolgreich, 0 Fehler
- `pnpm lint` — 0 Warnungen

Veränderte Dateien:
- `/home/barto/developments/igrocery/app/(app)/actions.ts` (neu)
- `/home/barto/developments/igrocery/app/(app)/page.tsx` (umgeschrieben)
- `/home/barto/developments/igrocery/components/stores/StoreIconPicker.tsx` (neu)
- `/home/barto/developments/igrocery/components/stores/StoreColorPicker.tsx` (neu)
- `/home/barto/developments/igrocery/components/stores/StoreFormFields.tsx` (neu)
- `/home/barto/developments/igrocery/components/stores/NewStoreDialog.tsx` (neu)
- `/home/barto/developments/igrocery/components/stores/EditStoreDialog.tsx` (neu)
- `/home/barto/developments/igrocery/components/stores/StoreCard.tsx` (neu)
- `/home/barto/developments/igrocery/components/stores/StoreGridFab.tsx` (neu)
- `/home/barto/developments/igrocery/components/layout/BottomNav.tsx` (Active-State)

---

**2026-04-17 — Phase 1 abgeschlossen (bis Pause-Punkt)**

Erledigte Schritte:
- `supabase/migrations/006_milestone2_helpers.sql` — `upsert_favorite` SECURITY DEFINER + `households_delete` Policy
- `lib/icons/storeIcons.ts` — 20 Heroicons (outline + solid), semantische Keys
- `lib/icons/storeColors.ts` — 8 Farben mit key/label/hex
- `lib/schemas/store.ts` — storeCreateSchema / storeUpdateSchema
- `lib/schemas/list.ts` — listCreateSchema / listUpdateSchema
- `lib/schemas/item.ts` — itemCreateSchema / itemUpdateSchema
- `lib/schemas/category.ts` — categoryCreateSchema / categoryUpdateSchema / categoryReorderSchema
- `lib/format.ts` — formatCurrency (de-DE, EUR) + formatDate (TT.MM.JJJJ)
- `lib/lists/aggregate.ts` — countOpen / countDone / sumTotal
- `pnpm build` — erfolgreich, 0 Fehler
- `pnpm lint` — 0 Warnungen

Veränderte Dateien (neu):
- `/home/barto/developments/igrocery/supabase/migrations/006_milestone2_helpers.sql`
- `/home/barto/developments/igrocery/lib/icons/storeIcons.ts`
- `/home/barto/developments/igrocery/lib/icons/storeColors.ts`
- `/home/barto/developments/igrocery/lib/schemas/store.ts`
- `/home/barto/developments/igrocery/lib/schemas/list.ts`
- `/home/barto/developments/igrocery/lib/schemas/item.ts`
- `/home/barto/developments/igrocery/lib/schemas/category.ts`
- `/home/barto/developments/igrocery/lib/format.ts`
- `/home/barto/developments/igrocery/lib/lists/aggregate.ts`

Ausstehend (Pause-Punkt):
- Migration 006 manuell im Supabase SQL-Editor ausführen
- `pnpm supabase gen types` / Types-Regeneration durchführen

---

**2026-04-17 — Phase 6 abgeschlossen**

Erledigte Schritte:
- Fix 1: `lib/supabase/middleware.ts` — `updateSession()` gibt nun `{ response, supabase }` statt nur `response` zurück; Rückgabetyp explizit via `Promise<{ response: NextResponse; supabase: ReturnType<...> }>`
- Fix 1: `proxy.ts` — zweiten `createServerClient`-Aufruf entfernt, `{ response, supabase }` aus `updateSession()` destrukturiert; `supabase.auth.getUser()` nutzt denselben Client, der auch für Cookie-Updates zuständig war
- Fix 2: `households_delete` Policy — bereits in Migration 006 enthalten, kein Code-Change nötig
- Fix 3: `lib/supabase/admin.ts` (neu) — `createAdminClient()` mit `SUPABASE_SERVICE_ROLE_KEY`, Server-only Guard (`typeof window !== "undefined"` → throw), `autoRefreshToken: false`, `persistSession: false`
- Fix 3: `app/(auth)/register/actions.ts` — beide Rollback-Zweige (invite-Fehler + household-Fehler) rufen nach `signOut()` auch `createAdminClient().auth.admin.deleteUser(authData.user.id)` auf; Rollback-Fehler werden geloggt, aber die Error-Response bleibt unverändert
- `pnpm build` — 0 Fehler
- `pnpm lint` — 0 Warnungen

Veränderte/neue Dateien:
- `/home/barto/developments/igrocery/lib/supabase/middleware.ts` (Rückgabetyp erweitert)
- `/home/barto/developments/igrocery/proxy.ts` (zweiten Client-Aufruf entfernt)
- `/home/barto/developments/igrocery/lib/supabase/admin.ts` (neu)
- `/home/barto/developments/igrocery/app/(auth)/register/actions.ts` (Rollback mit deleteUser)
