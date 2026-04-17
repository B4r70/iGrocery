# Einkaufslisten Web-App – Projektspezifikation

> **Anweisung an Claude Code:** Bitte erstelle auf Basis dieser Spezifikation ein vollständiges Next.js-Projekt. Arbeite in sinnvollen, überprüfbaren Schritten (Phasen unten). Nach jeder Phase kurz innehalten, Status zusammenfassen und auf Freigabe warten. Sprache für UI-Texte: **Deutsch**. Code-Kommentare: Deutsch. Commit-Messages: Conventional Commits (englisch).

---

## 1. Projekt-Überblick

Eine private Web-App für zwei Personen (ich & meine Partnerin) zur Organisation von Einkäufen. Jede Person meldet sich mit eigenem Account an, sieht aber die gemeinsamen Einkaufslisten. Die App ist Mobile-First designed, läuft über Cloudflare Tunnel auf meinem Linux-Server `bartoai`.

**Kerngedanke:** Wie Apple Erinnerungen, aber spezialisiert auf Einkäufe, mit Geschäft → Listen → Positionen als dreistufige Navigation.

---

## 2. Tech-Stack (final)

| Bereich         | Technologie                                    |
|-----------------|------------------------------------------------|
| Framework       | **Next.js 15** (App Router, TypeScript)        |
| Styling         | **Tailwind CSS** + **shadcn/ui**               |
| Icons           | **Heroicons** (`@heroicons/react`)             |
| Backend/DB      | **Supabase** (Postgres + Auth + RLS)           |
| Auth            | Supabase Auth (E-Mail + Passwort)              |
| Datenzugriff    | `@supabase/ssr` (Server Components + Client)   |
| State (Client)  | React Server Components + `useState` / Zustand falls nötig |
| Forms           | `react-hook-form` + `zod` für Validierung      |
| Dark Mode       | `next-themes` mit `system` als Default         |
| Deployment      | Docker Container auf bartoai, via Cloudflare Tunnel erreichbar |
| Package Manager | `pnpm`                                         |

---

## 3. Datenmodell (Supabase / Postgres)

### 3.1 Tabellen

```sql
-- Benutzer werden über auth.users (Supabase) verwaltet.
-- Zusätzliches Profil für Anzeigename:
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);

-- Ein "Haushalt" verbindet mehrere User, damit beide dieselben Listen sehen
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table household_members (
  household_id uuid references households on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text default 'member',
  primary key (household_id, user_id)
);

-- Geschäfte (z.B. REWE, Netto, OBI)
create table stores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households on delete cascade,
  name text not null,
  icon_key text not null,        -- z.B. 'shopping-cart', 'computer-desktop'
  color text default '#ef4444',  -- Hex-Farbe fürs Icon
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Produkt-Kategorien (Obst, Milchprodukte, ...)
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households on delete cascade,
  name text not null,
  icon_key text,
  sort_order int default 0
);

-- Favoriten pro Geschäft (für Autocomplete / schnelles Hinzufügen)
create table favorites (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores on delete cascade,
  title text not null,
  default_quantity text,         -- z.B. "1 Stück", "500g"
  default_price numeric(10,2),
  category_id uuid references categories on delete set null,
  usage_count int default 0,     -- wie oft wurde das Item schon verwendet
  created_at timestamptz default now()
);

-- Einkaufslisten
create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores on delete cascade,
  title text,                    -- optional, sonst "Einkauf vom <Datum>"
  status text not null default 'active',  -- 'active' | 'completed' | 'deleted'
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

-- Einzelne Positionen
create table list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references shopping_lists on delete cascade,
  title text not null,
  quantity text,                 -- Freitext: "2x", "500g", "1 Packung"
  price numeric(10,2),
  note text,
  is_offer boolean default false,
  category_id uuid references categories on delete set null,
  is_checked boolean default false,
  checked_at timestamptz,
  sort_order int default 0,
  created_at timestamptz default now()
);
```

### 3.2 Row Level Security (RLS)

**Wichtig:** Alle Tabellen mit `household_id` oder indirektem Bezug (via store → household) bekommen RLS-Policies, sodass nur Mitglieder des jeweiligen Haushalts zugreifen können.

Beispiel-Policy für `stores`:

```sql
alter table stores enable row level security;

create policy "Mitglieder sehen Geschäfte ihres Haushalts"
on stores for all
using (
  household_id in (
    select household_id from household_members where user_id = auth.uid()
  )
);
```

Analog für `categories`, `shopping_lists`, `list_items`, `favorites` (letztere via Store-Join).

### 3.3 Seed-Daten

Beim ersten Login eines Users:
1. Profil anlegen
2. Falls noch kein Haushalt: einen neuen `households`-Eintrag + `household_members` erzeugen
3. Default-Kategorien seeden: Obst & Gemüse, Milchprodukte, Fleisch & Fisch, Backwaren, Getränke, Tiefkühl, Drogerie, Süßigkeiten, Sonstiges

---

## 4. UI / Navigation

### 4.1 Screens (Mobile-First)

1. **Login/Register** – `/login`, `/register`
2. **Geschäfte-Übersicht** – `/` (Home)
3. **Geschäft-Detail** – `/stores/[storeId]` → zeigt die 3 Kategorien (Aktiv, History, Gelöscht)
4. **Einkaufsliste-Detail** – `/lists/[listId]`
5. **Einstellungen** – `/settings` (Haushalt, Partner einladen, Kategorien verwalten)
6. **Statistik** – `/stats` (Monatsübersicht pro Geschäft)

### 4.2 Geschäfte-Übersicht (Home)

- Großes Header: "Meine Geschäfte"
- Grid (2 Spalten auf Mobile, 3-4 auf Desktop) mit Geschäft-Karten
- Jede Karte: Icon (groß, in der gewählten Farbe) + Name + Badge mit Anzahl aktiver Listen
- Floating Action Button unten rechts: **"+ Neues Geschäft"**
- Bei Klick auf Karte → Navigation zu `/stores/[storeId]`

**Modal "Neues Geschäft anlegen":**
- Textfeld Name
- Icon-Picker: Grid mit ~20 kuratierten Heroicons (siehe 4.6)
- Farb-Picker: 8 vordefinierte Farben
- Buttons: Abbrechen / Speichern

### 4.3 Geschäft-Detail

- Header: Icon + Name des Geschäfts + Edit-Button
- **3 einklappbare Sektionen (alle default collapsed):**
  - ▶ Aktiv (zeigt Anzahl in Klammern)
  - ▶ History
  - ▶ Gelöscht
- Jede Liste wird dargestellt als Zeile mit:
  - Titel bzw. "Einkauf vom TT.MM.JJJJ"
  - Untertitel: "3 offene Positionen" / "erledigt" / "gelöscht am ..."
  - Chevron rechts
- Floating Action Button: **"+ Neue Liste"**
- Swipe-Aktionen auf Listen (Mobile): Links-Swipe → Löschen / Wiederherstellen

### 4.4 Einkaufsliste-Detail

**Layout:**
- **Linkes Panel** (einklappbar, default collapsed auf Mobile, expanded auf Desktop ≥ lg):
  - Liste der anderen aktiven Einkaufslisten im selben Geschäft
  - Klick darauf → Navigation
  - Toggle-Button (Hamburger / X)
- **Hauptbereich:**
  - Kopf: Datum · Geschäftsname · editierbarer Titel
  - Zähler: "X offen · Y erledigt" + Gesamtsumme (z.B. "34,18 €")
  - Button "Einkauf abschließen" (wird nur angezeigt, wenn noch nicht alle abgehakt)
  - **Positionen-Liste** (Gruppierung wie Apple Erinnerungen):
    - Gruppe **Offen**: alle noch nicht abgehakten Items
    - Gruppe **Bereits erledigt**: alle abgehakten Items (optional einklappbar)
  - Positionen-Zeile (orientiert am Screenshot des Users):
    ```
    ○  Titel                                          [🏷️ Angebot]
       Menge · Preis
       Notiz (klein, grau, kursiv)
    ─────────────────────────────────────────────────
    ```
    - Kreis links: tap → Häkchen (Animation, optimistic update)
    - Rechts: kleines Tag-Icon falls `is_offer = true`
    - Horizontaler Trenner (grau, `border-border`) zwischen Items
  - Floating Action Button: **"+ Position hinzufügen"**

**Modal "Position hinzufügen":**
- Titel-Input mit Autocomplete aus `favorites` des aktuellen Geschäfts (sortiert nach `usage_count DESC`)
- Bei Auswahl eines Favoriten: Menge, Preis, Kategorie vorausfüllen
- Felder: Titel, Menge, Preis, Kategorie (Select), Notiz (Textarea), Angebot-Toggle
- Speichern + "Speichern & weiter" (Modal offen lassen)

### 4.5 Erledigt-Logik (siehe Q10)

- Wenn letzte offene Position abgehakt wird → Toast: "Einkauf abgeschlossen ✓" mit Undo-Button
  - Nach 5s ohne Undo: Status auf `completed` setzen
- Manueller Button "Einkauf abschließen": gleiches Verhalten
- In History sichtbar, kann dort wieder reaktiviert oder gelöscht werden

### 4.6 Icon-Set für Geschäfte (Heroicons)

Kuratierte Auswahl mit semantischem Key:

| Key                      | Typischer Use-Case              |
|--------------------------|---------------------------------|
| `shopping-cart`          | Supermarkt (REWE, Edeka)        |
| `shopping-bag`           | Discounter (Netto, Lidl, Aldi)  |
| `building-storefront`    | kleines Geschäft / Bäcker       |
| `computer-desktop`       | Elektronik (MediaMarkt)         |
| `wrench-screwdriver`     | Baumarkt (OBI, Hornbach)        |
| `home-modern`            | Möbel / IKEA                    |
| `beaker`                 | Drogerie (dm, Rossmann)         |
| `sparkles`               | Kosmetik                        |
| `cake`                   | Bäcker / Konditor               |
| `gift`                   | Geschenke                       |
| `book-open`              | Buchhandel                      |
| `musical-note`           | Musik                           |
| `heart`                  | Apotheke                        |
| `cube`                   | Paketshop / Versand             |
| `truck`                  | Getränkemarkt                   |
| `paint-brush`            | Farben/Künstlerbedarf           |
| `puzzle-piece`           | Spielzeug                       |
| `face-smile`             | Kinder / Spielwaren             |
| `briefcase`              | Bürobedarf                      |
| `ellipsis-horizontal`    | Sonstiges                       |

---

## 5. Features im Detail

### 5.1 Autocomplete & Favoriten (Q8)

- Jedes Mal, wenn eine Position in einer Liste gespeichert wird, wird geprüft:
  - Gibt es schon einen Favoriten mit gleichem `title` (case-insensitive) für dieses Store?
  - Wenn ja: `usage_count += 1`, Default-Werte aktualisieren (letzter Preis)
  - Wenn nein: neuen Favoriten anlegen
- Im "Position hinzufügen"-Modal: Dropdown-Vorschläge ab 2 Zeichen Eingabe, sortiert nach `usage_count DESC LIMIT 8`

### 5.2 Summen & Statistik (Q11)

**In der Listenansicht:**
- Summe aller Positionen (offen + erledigt) live berechnet
- Darstellung im Header rechts

**Statistik-Seite `/stats`:**
- Monatsauswahl (Default: aktueller Monat)
- Pro Geschäft: Anzahl Listen, Anzahl Positionen, Gesamtausgaben
- Einfache Balkendiagramm-Darstellung (Recharts oder shadcn Chart)
- Exportbutton (kommt in Phase 2)

### 5.3 Mobile-First & PWA

- Alle Interaktionen für Touch optimiert (mind. 44×44px Tap-Targets)
- Feste Bottom-Navigation auf Mobile: Home · Statistik · Einstellungen
- Viewport meta-Tag: `width=device-width, initial-scale=1, maximum-scale=1`
- Optional in Phase 1: `manifest.json` für PWA-Installation (Add-to-Homescreen)

### 5.4 Dark Mode (Q13)

- `next-themes` mit `defaultTheme="system"` und `enableSystem`
- shadcn/ui bringt Dark-Mode-Support out of the box
- Farben über CSS-Variablen in `globals.css`

---

## 6. Projekt-Setup & Struktur

```
einkauf/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # mit BottomNav
│   │   ├── page.tsx                # Geschäfte-Übersicht
│   │   ├── stores/[storeId]/page.tsx
│   │   ├── lists/[listId]/page.tsx
│   │   ├── settings/page.tsx
│   │   └── stats/page.tsx
│   ├── api/                        # falls Route Handlers gebraucht werden
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn components
│   ├── stores/
│   │   ├── StoreCard.tsx
│   │   ├── StoreIconPicker.tsx
│   │   └── NewStoreDialog.tsx
│   ├── lists/
│   │   ├── ListRow.tsx
│   │   ├── CollapsibleSection.tsx
│   │   └── NewListDialog.tsx
│   ├── items/
│   │   ├── ItemRow.tsx
│   │   ├── ItemCheckbox.tsx
│   │   └── NewItemDialog.tsx
│   └── layout/
│       ├── BottomNav.tsx
│       └── ListSidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # Server Client
│   │   ├── client.ts               # Browser Client
│   │   └── middleware.ts
│   ├── schemas/                    # zod-Schemas
│   ├── icons/storeIcons.ts         # Icon-Map (siehe 4.6)
│   └── utils.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_init.sql
│   │   └── 002_rls_policies.sql
│   └── seed.sql
├── public/
│   └── manifest.json
├── Dockerfile
├── docker-compose.yml
├── .env.local.example
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. Deployment (Cloudflare Tunnel auf bartoai)

### 7.1 Dockerfile

Multi-stage build mit `node:20-alpine`, Output auf Port 3000.

### 7.2 docker-compose.yml

```yaml
services:
  einkauf:
    build: .
    restart: unless-stopped
    ports:
      - "3010:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
```

### 7.3 Cloudflare Tunnel

Hinweise im README:
- Subdomain (z.B. `einkauf.barto.cloud`) im Cloudflare-Dashboard anlegen
- Im `cloudflared`-Config auf `localhost:3010` routen
- Keine Ports öffentlich öffnen

---

## 8. Phasen / Meilensteine

Bitte in dieser Reihenfolge arbeiten und nach jeder Phase kurz berichten:

**Phase 1 – Setup (ca. 15 min)**
- Next.js 15 + TS + Tailwind + shadcn/ui initialisieren
- Heroicons, next-themes, Supabase Clients einrichten
- Basis-Layout mit Dark Mode und BottomNav
- `.env.local.example` erstellen

**Phase 2 – Supabase & Auth**
- Migrations schreiben (Schema + RLS)
- Login/Register-Flows
- Auto-Seeding: Profil + Haushalt + Default-Kategorien beim ersten Login
- Middleware für geschützte Routen

**Phase 3 – Geschäfte**
- Home-Seite mit Grid
- Neues-Geschäft-Modal mit Icon-Picker
- Edit/Delete
- Badge mit Anzahl aktiver Listen

**Phase 4 – Listen**
- Geschäft-Detail mit 3 einklappbaren Sektionen
- Neue Liste erstellen
- Swipe-Aktionen für Soft-Delete / Restore

**Phase 5 – Positionen**
- Listen-Detail mit Positionen-Gruppen (offen / erledigt)
- Position hinzufügen mit Autocomplete
- Check-Interaktion mit optimistic update
- Linkes Panel mit anderen aktiven Listen
- Erledigt-Logik (auto + manuell) mit Undo-Toast

**Phase 6 – Favoriten & Summen**
- Favoriten-Logik (auto-insert, usage_count)
- Gesamtsumme pro Liste im Header

**Phase 7 – Statistik**
- Monatsauswahl + Aggregation pro Geschäft
- Einfaches Balkendiagramm

**Phase 8 – Deployment**
- Dockerfile + docker-compose
- README mit Cloudflare-Tunnel-Anleitung

**Phase 9 (später) – Erweiterungen**
- Drag & Drop Sortierung (`@dnd-kit/core`) für Positionen und Geschäfte
- CSV-Export einer Liste
- PDF-Export einer Liste (z.B. `@react-pdf/renderer`)

---

## 9. Qualitäts-Anforderungen

- TypeScript **strict mode**, keine `any`
- Keine Client-Components, wo Server-Components reichen
- Alle Mutationen via **Server Actions**
- Fehlerbehandlung: keine leeren `catch`-Blöcke, User-freundliche Fehlermeldungen (deutsch)
- Accessibility: semantisches HTML, `aria-labels` an Icon-Buttons
- Keine Secrets im Client-Bundle (`SUPABASE_SERVICE_ROLE_KEY` nur Server-seitig)
- `README.md` mit Setup-Schritten (Supabase-Projekt anlegen, `.env.local`, Migrations einspielen, Docker starten, Cloudflare Tunnel)

---

## 10. Was NICHT gebaut werden soll (Scope-Abgrenzung)

- Kein Realtime-Sync (Reload reicht laut Q2)
- Keine Foto-Uploads für Items
- Kein Barcode-Scanner
- Keine Sprachsteuerung
- Keine Rezept-Integration
- Keine Push-Notifications

Diese Punkte bleiben für spätere Iterationen offen.
