-- Migration 001: Initial schema
-- Tables: profiles, households, household_members, stores, categories,
--         favorites, shopping_lists, list_items, household_invites
-- Includes: pgcrypto extension, profile auto-create trigger

create extension if not exists pgcrypto;

-- ── profiles ─────────────────────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  created_at  timestamptz not null default now()
);

-- ── households ───────────────────────────────────────────────────────────────
create table households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ── household_members ─────────────────────────────────────────────────────────
create table household_members (
  household_id uuid not null references households on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         text not null default 'member',
  primary key (household_id, user_id)
);

-- ── stores ───────────────────────────────────────────────────────────────────
create table stores (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name         text not null,
  icon_key     text,
  color        text not null default '#ef4444',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index on stores (household_id);

-- ── categories ───────────────────────────────────────────────────────────────
create table categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name         text not null,
  icon_key     text,
  sort_order   integer not null default 0
);

-- ── favorites ────────────────────────────────────────────────────────────────
create table favorites (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references stores on delete cascade,
  title            text not null,
  default_quantity text,
  default_price    numeric(10,2),
  category_id      uuid references categories on delete set null,
  usage_count      integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ── shopping_lists ────────────────────────────────────────────────────────────
create table shopping_lists (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores on delete cascade,
  title        text not null,
  status       text not null default 'active',
  created_by   uuid not null references auth.users on delete cascade,
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at   timestamptz
);

create index on shopping_lists (store_id, status);

-- ── list_items ────────────────────────────────────────────────────────────────
create table list_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references shopping_lists on delete cascade,
  title       text not null,
  quantity    text,
  price       numeric(10,2),
  note        text,
  is_offer    boolean not null default false,
  category_id uuid references categories on delete set null,
  is_checked  boolean not null default false,
  checked_at  timestamptz,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index on list_items (list_id);

-- ── household_invites ─────────────────────────────────────────────────────────
create table household_invites (
  token        text primary key,
  household_id uuid not null references households on delete cascade,
  created_by   uuid not null references auth.users on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '24 hours',
  consumed_at  timestamptz,
  consumed_by  uuid references auth.users on delete set null
);

create index on household_invites (household_id);

-- ── Profile auto-create trigger ───────────────────────────────────────────────
create or replace function handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (new.id, '');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
