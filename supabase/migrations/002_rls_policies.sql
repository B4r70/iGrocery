-- Migration 002: Row Level Security policies
-- Helper function breaks recursion on household_members self-reference.

-- ── Helper: is_household_member ───────────────────────────────────────────────
-- security definer + stable: executes as function owner, result cached per txn.
-- Never queries household_members from inside a policy directly — use this instead.
create or replace function public.is_household_member(p_household_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = p_household_id
      and user_id = auth.uid()
  );
$$;

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
alter table profiles          enable row level security;
alter table households        enable row level security;
alter table household_members enable row level security;
alter table stores            enable row level security;
alter table categories        enable row level security;
alter table favorites         enable row level security;
alter table shopping_lists    enable row level security;
alter table list_items        enable row level security;
alter table household_invites enable row level security;

-- ── profiles ──────────────────────────────────────────────────────────────────
-- SELECT: user can see profiles of members in any shared household
create policy "profiles_select"
  on profiles for select
  to authenticated
  using (
    exists (
      select 1 from household_members hm1
      join household_members hm2 on hm2.household_id = hm1.household_id
      where hm1.user_id = auth.uid()
        and hm2.user_id = profiles.id
    )
    or id = auth.uid()
  );

-- UPDATE: user can only update their own profile
create policy "profiles_update"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── households ────────────────────────────────────────────────────────────────
-- SELECT: member of the household
create policy "households_select"
  on households for select
  to authenticated
  using (is_household_member(id));

-- INSERT: any authenticated user (controlled via server action)
create policy "households_insert"
  on households for insert
  to authenticated
  with check (true);

-- UPDATE: member of the household
create policy "households_update"
  on households for update
  to authenticated
  using (is_household_member(id))
  with check (is_household_member(id));

-- ── household_members ─────────────────────────────────────────────────────────
-- SELECT: own membership row, or other members in same household
create policy "household_members_select"
  on household_members for select
  to authenticated
  using (is_household_member(household_id));

-- INSERT: only via security definer functions (accept_invite / register flow)
-- No direct insert policy — inserts go through SECURITY DEFINER functions.

-- ── stores ────────────────────────────────────────────────────────────────────
create policy "stores_select"
  on stores for select
  to authenticated
  using (is_household_member(household_id));

create policy "stores_insert"
  on stores for insert
  to authenticated
  with check (is_household_member(household_id));

create policy "stores_update"
  on stores for update
  to authenticated
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "stores_delete"
  on stores for delete
  to authenticated
  using (is_household_member(household_id));

-- ── categories ────────────────────────────────────────────────────────────────
create policy "categories_select"
  on categories for select
  to authenticated
  using (is_household_member(household_id));

create policy "categories_insert"
  on categories for insert
  to authenticated
  with check (is_household_member(household_id));

create policy "categories_update"
  on categories for update
  to authenticated
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "categories_delete"
  on categories for delete
  to authenticated
  using (is_household_member(household_id));

-- ── favorites ─────────────────────────────────────────────────────────────────
-- Access via store → household_id
create policy "favorites_select"
  on favorites for select
  to authenticated
  using (
    exists (
      select 1 from stores s
      where s.id = favorites.store_id
        and is_household_member(s.household_id)
    )
  );

create policy "favorites_insert"
  on favorites for insert
  to authenticated
  with check (
    exists (
      select 1 from stores s
      where s.id = favorites.store_id
        and is_household_member(s.household_id)
    )
  );

create policy "favorites_update"
  on favorites for update
  to authenticated
  using (
    exists (
      select 1 from stores s
      where s.id = favorites.store_id
        and is_household_member(s.household_id)
    )
  );

create policy "favorites_delete"
  on favorites for delete
  to authenticated
  using (
    exists (
      select 1 from stores s
      where s.id = favorites.store_id
        and is_household_member(s.household_id)
    )
  );

-- ── shopping_lists ────────────────────────────────────────────────────────────
-- Access via store → household_id
create policy "shopping_lists_select"
  on shopping_lists for select
  to authenticated
  using (
    exists (
      select 1 from stores s
      where s.id = shopping_lists.store_id
        and is_household_member(s.household_id)
    )
  );

create policy "shopping_lists_insert"
  on shopping_lists for insert
  to authenticated
  with check (
    exists (
      select 1 from stores s
      where s.id = shopping_lists.store_id
        and is_household_member(s.household_id)
    )
  );

create policy "shopping_lists_update"
  on shopping_lists for update
  to authenticated
  using (
    exists (
      select 1 from stores s
      where s.id = shopping_lists.store_id
        and is_household_member(s.household_id)
    )
  );

create policy "shopping_lists_delete"
  on shopping_lists for delete
  to authenticated
  using (
    exists (
      select 1 from stores s
      where s.id = shopping_lists.store_id
        and is_household_member(s.household_id)
    )
  );

-- ── list_items ────────────────────────────────────────────────────────────────
-- Access via list → store → household_id
create policy "list_items_select"
  on list_items for select
  to authenticated
  using (
    exists (
      select 1 from shopping_lists sl
      join stores s on s.id = sl.store_id
      where sl.id = list_items.list_id
        and is_household_member(s.household_id)
    )
  );

create policy "list_items_insert"
  on list_items for insert
  to authenticated
  with check (
    exists (
      select 1 from shopping_lists sl
      join stores s on s.id = sl.store_id
      where sl.id = list_items.list_id
        and is_household_member(s.household_id)
    )
  );

create policy "list_items_update"
  on list_items for update
  to authenticated
  using (
    exists (
      select 1 from shopping_lists sl
      join stores s on s.id = sl.store_id
      where sl.id = list_items.list_id
        and is_household_member(s.household_id)
    )
  );

create policy "list_items_delete"
  on list_items for delete
  to authenticated
  using (
    exists (
      select 1 from shopping_lists sl
      join stores s on s.id = sl.store_id
      where sl.id = list_items.list_id
        and is_household_member(s.household_id)
    )
  );

-- ── household_invites ─────────────────────────────────────────────────────────
-- SELECT/INSERT/UPDATE/DELETE restricted to household members.
-- Token acceptance goes through the accept_invite() SECURITY DEFINER function.
create policy "household_invites_select"
  on household_invites for select
  to authenticated
  using (is_household_member(household_id));

create policy "household_invites_insert"
  on household_invites for insert
  to authenticated
  with check (is_household_member(household_id));

create policy "household_invites_update"
  on household_invites for update
  to authenticated
  using (is_household_member(household_id));

create policy "household_invites_delete"
  on household_invites for delete
  to authenticated
  using (is_household_member(household_id));
