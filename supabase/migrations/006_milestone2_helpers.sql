-- Migration 006: Milestone 2 helpers
-- Adds upsert_favorite() SECURITY DEFINER function and households DELETE policy.

-- ── upsert_favorite ───────────────────────────────────────────────────────────
-- Called by the createItem Server Action whenever a new list item is added.
-- Case-insensitive dedup via lower(btrim(title)).
-- Membership check prevents cross-household data access despite SECURITY DEFINER.
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
  -- Verify caller is a member of the store's household
  if not exists (
    select 1 from stores s
    join household_members hm on hm.household_id = s.household_id
    where s.id = p_store_id and hm.user_id = auth.uid()
  ) then
    raise exception 'nicht_berechtigt';
  end if;

  -- Look for an existing favorite with the same normalized title
  select id into v_existing
    from favorites
    where store_id = p_store_id
      and lower(btrim(title)) = v_normalized
    limit 1;

  if v_existing is not null then
    -- Increment usage counter and update optional fields if provided
    update favorites
      set usage_count      = usage_count + 1,
          default_quantity = coalesce(p_quantity, default_quantity),
          default_price    = coalesce(p_price, default_price),
          category_id      = coalesce(p_category_id, category_id)
      where id = v_existing;
  else
    -- Create new favorite entry
    insert into favorites (store_id, title, default_quantity, default_price, category_id, usage_count)
      values (p_store_id, btrim(p_title), p_quantity, p_price, p_category_id, 1);
  end if;
end;
$$;

grant execute on function public.upsert_favorite(uuid, text, text, numeric, uuid) to authenticated;

-- ── households DELETE policy ──────────────────────────────────────────────────
-- Household deletion is explicitly blocked at the RLS level.
-- Household management (rename / delete) is out of scope for this milestone.
create policy "households_delete"
  on households for delete
  to authenticated
  using (false);
