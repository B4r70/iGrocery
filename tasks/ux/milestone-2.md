# UX Review — Milestone 2

**Datum:** 2026-04-17
**Reviewer:** igrocery-ux-reviewer
**Status:** Refinement Needed (0 Blocker, 2 Major, 8 Minor)

## Major

### M1 — Complete-Flow Auto-Trigger: 5s zu kurz, Tab-Close-Edge-Case
Auto-Complete nach letztem Check + 5s-Undo überrumpelt im Supermarkt. Tab-Close lässt Timer hängen → Liste bleibt `active`.
**Empfehlung:** Auto-Trigger entfernen. Nur manueller "Einkauf abschließen"-Button + Toast-Undo 5s. Alternativ: 30s-Delay mit aktiver Rückfrage ("Alle erledigt — abschließen?" Ja/Abbrechen).

### M2 — Inline-Edit Titel ohne Commit/Cancel-Spezifikation
`onBlur`-Save kann unerwünscht feuern, kein Cancel-Pfad, Virtual-Keyboard-Verschiebung.
**Empfehlung:** `onBlur` + `Enter` = save; `Escape` = reset; Input scrollt ins Bild; `min-w-[120px]`.

## Minor

1. **BottomNav Active-State auf Subrouten** — `/stores/*` und `/lists/*` → Home-Tab aktiv (nicht exakt-match)
2. **Sections-Defaults** — Plan widerspricht Konzept (Konzept: alle closed). Plan-Version (Active open) übernehmen + explizit fixieren
3. **FAB + Safe-Area** — `bottom-[calc(4rem+env(safe-area-inset-bottom))]`, Content `pb-[calc(5rem+env(safe-area-inset-bottom))]`
4. **Offer-Badge Spec** — `TagIcon` aus Heroicons in `text-orange-500`, inline nach Titel, `aria-label="Angebot"`, kein Text-Badge
5. **Categories ↑/↓ auf Mobile** — bei 375px zu eng. Kompakt: ChevronUp/Down 36px links + Tap-auf-Name = Inline-Edit + Delete rechts
6. **NewItemDialog "Speichern & weiter"** — Titel leeren + fokussieren, Kategorie/Menge behalten
7. **Sidebar Trigger** — `Bars3Icon` / `ListBulletIcon` im ListHeader oben-links, `aria-label="Andere Listen"`
8. **Fehlende Texte** — Undo-Toast "Liste abgeschlossen · Rückgängig", Autocomplete-Placeholder "Position suchen oder hinzufügen…", Empty-State Stores "Noch keine Geschäfte · Tippe +, um zu starten", Hard-Delete "Liste „{Titel}" und alle Positionen unwiderruflich löschen?"

## Missing Considerations

- **Safe-Area-Insets** (iOS/Android)
- **Virtual Keyboard** — `max-h-[calc(100dvh-env(keyboard-inset-height))]` mit `dvh`
- **Swipe-Aktionen** im Konzept genannt, im Plan ungeklärt → Discoverability-Hint-Animation
- **Loading-Skeleton** beim History-Toggle
- **Offer ohne Preis** — redundant, Validierungs-Feedback fehlt
- **Alle-abgehakt + Gruppe-eingeklappt** → leere Ansicht verwirrend. Empfehlung: "Alle Positionen erledigt · Liste abschließen" einblenden
- **Dark Mode + farbige StoreCards** — Icon immer `white`, helle Farben ggf. `opacity-80`
- **Zurück-Button** in Detail-Screens (Store/List) — auf Mobile nicht zwingend Browser-Back sichtbar

## Zusammenfassung

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 2     |
| Minor    | 8     |

Kein Stop. M1 und M2 vor Phase 4 im Plan fixieren. Minor 1 + 3 in Phase 3/4 einbauen.
