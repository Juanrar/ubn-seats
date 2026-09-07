create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'paid_without_seats')),
  mp_preference_id text,
  mp_payment_id text,
  amount integer not null,
  created_at timestamptz not null default now()
);

alter table reservations
  add column order_id uuid references orders(id);

drop policy if exists "insert propia reserva" on reservations;

revoke insert, update, delete on reservations from authenticated, anon;

alter table orders enable row level security;

revoke insert, update, delete on orders from authenticated, anon;

create policy "select propia orden"
  on orders for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function active_reservation_seats()
returns table (seat_id text, status text)
language sql
security definer
set search_path = public
as $$
  select seat_id, status
  from reservations
  where status = 'confirmed'
     or (status = 'pending' and created_at > now() - interval '20 minutes')
$$;

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

  if exists (select 1 from unnest(p_seat_ids) as s where s is null or s !~ '^[a-z]+-F[0-9]{2}-[0-9]{1,2}$') then
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

create or replace function cancel_own_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from orders where id = p_order_id and status = 'pending';

  if v_owner is null or v_owner <> auth.uid() then
    return;
  end if;

  update orders set status = 'cancelled' where id = p_order_id and status = 'pending';
  update reservations set status = 'cancelled' where order_id = p_order_id and status = 'pending';
end;
$$;

revoke all on function cancel_own_order(uuid) from public;
grant execute on function cancel_own_order(uuid) to authenticated;

create or replace function set_order_status(p_order_id uuid, p_status text, p_mp_payment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status text;
  v_seats_touched integer;
begin
  if p_status not in ('confirmed', 'cancelled') then
    raise exception 'estado inválido: %', p_status;
  end if;

  select status into v_current_status from orders where id = p_order_id for update;

  if v_current_status is distinct from 'pending' then
    return;
  end if;

  update reservations
    set status = p_status
    where order_id = p_order_id and status = 'pending';

  get diagnostics v_seats_touched = row_count;

  if p_status = 'confirmed' and v_seats_touched = 0 then
    update orders
      set status = 'paid_without_seats', mp_payment_id = p_mp_payment_id
      where id = p_order_id;
    return;
  end if;

  update orders
    set status = p_status, mp_payment_id = p_mp_payment_id
    where id = p_order_id;
end;
$$;

revoke all on function set_order_status(uuid, text, text) from public;
grant execute on function set_order_status(uuid, text, text) to service_role;

create or replace function set_order_preference(p_order_id uuid, p_preference_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
    set mp_preference_id = p_preference_id
    where id = p_order_id and user_id = auth.uid() and status = 'pending';
end;
$$;

revoke all on function set_order_preference(uuid, text) from public;
grant execute on function set_order_preference(uuid, text) to authenticated;
