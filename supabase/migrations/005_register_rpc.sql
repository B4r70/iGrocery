-- Migration 005: SECURITY DEFINER helper for new-user household creation
-- Needed because household_members has no direct INSERT policy — only SECURITY DEFINER functions may insert.
-- Called from the /register server action when no invite token is present.

create or replace function public.create_household_for_user(p_name text)
  returns uuid
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  new_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Prevent creating a second household if the user is already a member somewhere
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'user already in a household';
  end if;

  insert into households (name)
    values (p_name)
    returning id into new_household_id;

  insert into household_members (household_id, user_id, role)
    values (new_household_id, auth.uid(), 'owner');

  perform seed_default_categories(new_household_id);

  return new_household_id;
end;
$$;

grant execute on function public.create_household_for_user(text) to authenticated;
