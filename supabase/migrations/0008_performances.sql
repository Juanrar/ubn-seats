create table performances (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null unique
);

alter table performances enable row level security;

revoke insert, update, delete on performances from authenticated, anon;

create policy "select funciones"
  on performances for select
  to authenticated
  using (true);

insert into performances (starts_at) values
  ('2026-12-05 21:00:00-03'),
  ('2026-12-07 21:00:00-03');

alter table orders
  add column performance_id uuid references performances(id);

alter table reservations
  add column performance_id uuid references performances(id);

update orders
  set performance_id = (select id from performances order by starts_at limit 1);

update reservations
  set performance_id = (select id from performances order by starts_at limit 1);

alter table orders alter column performance_id set not null;

alter table reservations alter column performance_id set not null;

drop index reservations_seat_active_idx;

create unique index reservations_seat_active_idx
  on reservations (performance_id, seat_id)
  where status in ('pending', 'confirmed', 'blocked');

drop function active_reservation_seats();

create function active_reservation_seats(p_performance_id uuid)
returns table (seat_id text, status text, order_id uuid)
language sql
security definer
set search_path = public
as $$
  select seat_id, status, order_id
  from reservations
  where performance_id = p_performance_id
    and (
      status in ('confirmed', 'blocked')
      or (status = 'pending' and created_at > now() - interval '20 minutes')
    )
$$;

revoke all on function active_reservation_seats(uuid) from public;
grant execute on function active_reservation_seats(uuid) to authenticated, service_role;

drop function create_order(text[], integer);

create function create_order(p_performance_id uuid, p_seat_ids text[], p_amount integer)
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

  if not exists (
    select 1 from performances
    where id = p_performance_id and starts_at > now()
  ) then
    raise exception 'la función no está a la venta';
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
    where performance_id = p_performance_id
      and seat_id = any(p_seat_ids)
      and status = 'pending'
      and created_at <= now() - interval '20 minutes';

  insert into orders (user_id, amount, performance_id)
    values (v_user_id, p_amount, p_performance_id)
    returning id into v_order_id;

  insert into reservations (seat_id, user_id, status, order_id, performance_id)
    select seat_id, v_user_id, 'pending', v_order_id, p_performance_id
    from unnest(p_seat_ids) as seat_id;

  return v_order_id;
end;
$$;

revoke all on function create_order(uuid, text[], integer) from public;
grant execute on function create_order(uuid, text[], integer) to authenticated;

drop function admin_block_seats(text[]);

create function admin_block_seats(p_performance_id uuid, p_seat_ids text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blocked integer;
begin
  if not exists (select 1 from performances where id = p_performance_id) then
    raise exception 'la función no existe';
  end if;

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
    where performance_id = p_performance_id
      and seat_id = any(p_seat_ids)
      and status = 'pending'
      and created_at <= now() - interval '20 minutes';

  insert into reservations (seat_id, user_id, status, order_id, performance_id)
    select distinct s, null::uuid, 'blocked'::text, null::uuid, p_performance_id
    from unnest(p_seat_ids) as s
    where not exists (
      select 1 from reservations r
      where r.performance_id = p_performance_id
        and r.seat_id = s
        and r.status in ('pending', 'confirmed', 'blocked')
    );

  get diagnostics v_blocked = row_count;

  return v_blocked;
end;
$$;

revoke all on function admin_block_seats(uuid, text[]) from public;
grant execute on function admin_block_seats(uuid, text[]) to service_role;

drop function admin_unblock_seats(text[]);

create function admin_unblock_seats(p_performance_id uuid, p_seat_ids text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_released integer;
begin
  if coalesce(array_length(p_seat_ids, 1), 0) = 0 then
    return 0;
  end if;

  delete from reservations
    where performance_id = p_performance_id
      and seat_id = any(p_seat_ids)
      and status = 'blocked';

  get diagnostics v_released = row_count;

  return v_released;
end;
$$;

revoke all on function admin_unblock_seats(uuid, text[]) from public;
grant execute on function admin_unblock_seats(uuid, text[]) to service_role;
