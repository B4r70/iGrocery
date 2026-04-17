-- Migration 003: Seed helper functions
-- seed_default_categories: inserts 9 default categories for a new household
-- accept_invite: atomic, validated invite consumption (SECURITY DEFINER)

-- ── seed_default_categories ───────────────────────────────────────────────────
create or replace function public.seed_default_categories(p_household uuid)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into categories (household_id, name, icon_key, sort_order) values
    (p_household, 'Obst & Gemüse',   null, 1),
    (p_household, 'Milchprodukte',   null, 2),
    (p_household, 'Fleisch & Fisch', null, 3),
    (p_household, 'Backwaren',       null, 4),
    (p_household, 'Getränke',        null, 5),
    (p_household, 'Tiefkühl',        null, 6),
    (p_household, 'Drogerie',        null, 7),
    (p_household, 'Süßigkeiten',     null, 8),
    (p_household, 'Sonstiges',       null, 9);
end;
$$;

-- ── accept_invite ─────────────────────────────────────────────────────────────
-- Atomically validates and consumes an invite token.
-- Returns the household_id the caller has joined.
-- Raises exceptions with German error codes for UI handling.
create or replace function public.accept_invite(p_token text)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_invite  household_invites%rowtype;
  v_hid     uuid;
begin
  -- Lock the row to prevent concurrent acceptance
  select * into v_invite
    from household_invites
    where token = p_token
    for update;

  if not found then
    raise exception 'einladung_unbekannt';
  end if;

  if v_invite.consumed_at is not null then
    raise exception 'einladung_verbraucht';
  end if;

  if v_invite.expires_at <= now() then
    raise exception 'einladung_abgelaufen';
  end if;

  v_hid := v_invite.household_id;

  -- Skip if the user is already a member of this exact household
  if exists (
    select 1 from household_members
    where household_id = v_hid
      and user_id = auth.uid()
  ) then
    return v_hid;
  end if;

  -- Reject if the user already belongs to any other household
  if exists (
    select 1 from household_members
    where user_id = auth.uid()
  ) then
    raise exception 'bereits_in_haushalt';
  end if;

  -- Join the household
  insert into household_members (household_id, user_id, role)
  values (v_hid, auth.uid(), 'member');

  -- Consume the token
  update household_invites
    set consumed_at  = now(),
        consumed_by  = auth.uid()
    where token = p_token;

  return v_hid;
end;
$$;

-- ── Grant execute to authenticated users ──────────────────────────────────────
grant execute on function public.seed_default_categories(uuid) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
