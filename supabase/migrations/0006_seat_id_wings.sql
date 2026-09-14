create or replace function create_order(p_seat_ids text[], p_amount integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_seat_count integer := coalesce(array_length(p_seat_ids, 1), 0);
  v_max_seats constant integer := 8;
  v_max_amount constant integer := 2000000;
begin
  if v_user_id is null then
    raise exception 'se necesita sesión para crear una orden';
  end if;

  if v_seat_count = 0 then
    raise exception 'la selección no puede estar vacía';
  end if;

  if v_seat_count > v_max_seats then
    raise exception 'la selección supera el máximo de % butacas', v_max_seats;
  end if;

  if v_seat_count <> (select count(distinct s) from unnest(p_seat_ids) as s) then
    raise exception 'la selección tiene butacas repetidas';
  end if;

  if exists (select 1 from unnest(p_seat_ids) as s where s is null or s !~ '^[a-z]+(-[a-z]+)*-F[0-9]{2}-[0-9]{1,2}$') then
    raise exception 'la selección tiene identificadores de butaca inválidos';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > v_max_amount then
    raise exception 'el monto es inválido: %', p_amount;
  end if;

  update reservations
    set status = 'cancelled'
    where seat_id = any(p_seat_ids)
      and status = 'pending'
      and created_at <= now() - interval '20 minutes';

  insert into orders (user_id, amount)
    values (v_user_id, p_amount)
    returning id into v_order_id;

  insert into reservations (seat_id, user_id, status, order_id)
    select seat_id, v_user_id, 'pending', v_order_id
    from unnest(p_seat_ids) as seat_id;

  return v_order_id;
end;
$$;

revoke all on function create_order(text[], integer) from public;
grant execute on function create_order(text[], integer) to authenticated;

create or replace function admin_block_seats(p_seat_ids text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blocked integer;
begin
  if coalesce(array_length(p_seat_ids, 1), 0) = 0 then
    return 0;
  end if;

  if exists (
    select 1 from unnest(p_seat_ids) as s
    where s is null or s !~ '^[a-z]+(-[a-z]+)*-F[0-9]{2}-[0-9]{1,2}$'
  ) then
    raise exception 'la selección tiene identificadores de butaca inválidos';
  end if;

  update reservations
    set status = 'cancelled'
    where seat_id = any(p_seat_ids)
      and status = 'pending'
      and created_at <= now() - interval '20 minutes';

  insert into reservations (seat_id, user_id, status, order_id)
    select distinct s, null::uuid, 'blocked'::text, null::uuid
    from unnest(p_seat_ids) as s
    where not exists (
      select 1 from reservations r
      where r.seat_id = s and r.status in ('pending', 'confirmed', 'blocked')
    );

  get diagnostics v_blocked = row_count;

  return v_blocked;
end;
$$;

revoke all on function admin_block_seats(text[]) from public;
grant execute on function admin_block_seats(text[]) to service_role;
