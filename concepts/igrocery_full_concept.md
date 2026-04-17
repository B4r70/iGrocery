# iGrocery – Projektspezifikation

> **Hinweis:** Dieses Dokument beschreibt *was* gebaut wird (Features, Datenmodell, UI). Für *wie* gearbeitet wird (Architektur-Regeln, Code-Standards, Agent-Workflow), siehe `CLAUDE.md`.

---

## 1. Projekt-Überblick

Eine private Web-App für zwei Personen (ich & meine Partnerin) zur Organisation von Einkäufen. Jede Person meldet sich mit eigenem Account an, sieht aber die gemeinsamen Einkaufslisten. Die App ist Mobile-First designed, läuft über Cloudflare Tunnel auf meinem Linux-Server `bartoai`.

**Kerngedanke:** Wie Apple Erinnerungen, aber spezialisiert auf Einkäufe, mit Geschäft → Listen → Positionen als dreistufige Navigation.

---

## 2. Tech-Stack

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
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);

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

create table stores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households on delete cascade,
  name text not null,
  icon_key text not null,
  color text default '#ef4444',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households on delete cascade,
  name text not null,
  icon_key text,
  sort_order int default 0
);

create table favorites (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores on delete cascade,
  title text not null,
  default_quantity text,
  default_price numeric(10,2),
  category_id uuid references categories on delete set null,
  usage_count int default 0,
  created_at timestamptz default now()
);

create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores on delete cascade,
  title text,
  status text not null default 'active',  -- 'active' | 'completed' | 'deleted'
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

create table list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references shopping_lists on delete cascade,
  title text not null,
  quantity text,
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

Alle Tabellen mit `household_id` oder indirektem Bezug (via store → household) bekommen RLS-Policies. Nur Mitglieder des jeweiligen Haushalts können zugreifen.

Beispiel für `stores`:

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

### 3.3 Seed-Daten

Beim ersten Login: Profil anlegen, Haushalt erstellen, Default-Kategorien seeden (Obst & Gemüse, Milchprodukte, Fleisch & Fisch, Backwaren, Getränke, Tiefkühl, Drogerie, Süßigkeiten, Sonstiges).

---

## 4. UI / Navigation

### 4.1 Screens

1. **Login/Register** – `/login`, `/register`
2. **Geschäfte-Übersicht** – `/` (Home)
3. **Geschäft-Detail** – `/stores/[storeId]`
4. **Einkaufsliste-Detail** – `/lists/[listId]`
5. **Einstellungen** – `/settings`
6. **Statistik** – `/stats`

### 4.2 Geschäfte-Übersicht (Home)

- Header: "Meine Geschäfte"
- Grid (2 Spalten Mobile, 3-4 Desktop) mit Geschäft-Karten: Icon + Name + Badge aktiver Listen
- FAB: "Neues Geschäft" → Modal mit Name, Icon-Picker (~20 Heroicons), Farb-Picker (8 Farben)

### 4.3 Geschäft-Detail

- Header: Icon + Name + Edit-Button
- 3 einklappbare Sektionen (default collapsed): Aktiv, History, Gelöscht
- Jede Liste als Zeile: Titel/Datum, Untertitel ("3 offene Positionen"), Chevron
- FAB: "Neue Liste"
- Swipe-Aktionen (Mobile): Löschen / Wiederherstellen

### 4.4 Einkaufsliste-Detail

- **Linkes Panel** (collapsed Mobile, expanded Desktop ≥ lg): andere aktive Listen im Geschäft
- **Hauptbereich:**
  - Kopf: Datum · Geschäftsname · editierbarer Titel
  - Zähler: "X offen · Y erledigt" + Gesamtsumme
  - Button "Einkauf abschließen"
  - Positionen-Gruppen: Offen / Bereits erledigt (einklappbar)
  - Positionen-Zeile: Kreis (tap → Häkchen) · Titel · Angebot-Tag · Menge · Preis · Notiz · Trenner
  - FAB: "Position hinzufügen" → Modal mit Autocomplete aus Favoriten, Speichern + Speichern & weiter

### 4.5 Erledigt-Logik

- Letzte Position abgehakt → Toast mit Undo (5s) → Status `completed`
- Manueller Button: gleiches Verhalten
- In History: reaktivierbar oder löschbar

### 4.6 Icon-Set für Geschäfte

| Key                      | Use-Case                        |
|--------------------------|---------------------------------|
| `shopping-cart`          | Supermarkt                      |
| `shopping-bag`           | Discounter                      |
| `building-storefront`    | kleines Geschäft                |
| `computer-desktop`       | Elektronik                      |
| `wrench-screwdriver`     | Baumarkt                        |
| `home-modern`            | Möbel                           |
| `beaker`                 | Drogerie                        |
| `sparkles`               | Kosmetik                        |
| `cake`                   | Bäcker                          |
| `gift`                   | Geschenke                       |
| `book-open`              | Buchhandel                      |
| `musical-note`           | Musik                           |
| `heart`                  | Apotheke                        |
| `cube`                   | Paketshop                       |
| `truck`                  | Getränkemarkt                   |
| `paint-brush`            | Künstlerbedarf                  |
| `puzzle-piece`           | Spielzeug                       |
| `face-smile`             | Kinder                          |
| `briefcase`              | Bürobedarf                      |
| `ellipsis-horizontal`    | Sonstiges                       |

---

## 5. Features

### 5.1 Autocomplete & Favoriten

- Bei jedem Speichern einer Position: Favorit mit gleichem Titel vorhanden? → `usage_count += 1`. Sonst neuen Favoriten anlegen.
- Im Modal: Vorschläge ab 2 Zeichen, sortiert nach `usage_count DESC LIMIT 8`

### 5.2 Summen & Statistik

- Listenansicht: Gesamtsumme live berechnet im Header
- `/stats`: Monatsauswahl, pro Geschäft Anzahl Listen/Positionen/Ausgaben, Balkendiagramm

### 5.3 Mobile-First & PWA

- Touch-Targets ≥ 44×44px
- Bottom-Navigation: Home · Statistik · Einstellungen
- `manifest.json` für Add-to-Homescreen

### 5.4 Dark Mode

- `next-themes` mit `defaultTheme="system"`
- Farben via CSS-Variablen

---

## 6. Deployment

- **Dockerfile:** Multi-stage build mit `node:20-alpine`, Port 3000
- **docker-compose:** Service `igrocery` auf Port 3010:3000, Env-Vars für Supabase
- **Cloudflare Tunnel:** `einkauf.barto.cloud` → `localhost:3010`

---

## 7. Implementierungsreihenfolge

Implementierung über das Agent-Team (siehe `CLAUDE.md`):

1. **Setup** — Next.js + Tailwind + shadcn/ui + Heroicons + next-themes + Supabase + BottomNav
2. **Supabase & Auth** — Migrations + RLS + Login/Register + Auto-Seeding + Middleware
3. **Geschäfte** — Home-Grid + Modal + Icon-Picker + Edit/Delete + Badge
4. **Listen** — Geschäft-Detail + Sektionen + Neue Liste + Swipe
5. **Positionen** — Listen-Detail + Gruppen + Autocomplete + Check + Erledigt-Logik + Panel
6. **Favoriten & Summen** — Auto-Favoriten + Gesamtsumme
7. **Statistik** — Monatsauswahl + Aggregation + Chart
8. **Deployment** — Dockerfile + docker-compose + README

### Spätere Erweiterungen

- Drag & Drop (`@dnd-kit/core`)
- CSV-Export
- PDF-Export

---

## 8. Scope-Abgrenzung

**Nicht** gebaut: Realtime-Sync, Foto-Uploads, Barcode-Scanner, Sprachsteuerung, Rezept-Integration, Push-Notifications.
