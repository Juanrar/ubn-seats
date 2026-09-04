create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  mp_preference_id text,
  mp_payment_id text,
  amount integer not null,
  created_at timestamptz not null default now()
);

alter table reservations
  add column order_id uuid references orders(id);

alter table orders enable row level security;

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
begin
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

  update orders set status = 'cancelled' where id = p_order_id;
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
begin
  if p_status not in ('confirmed', 'cancelled') then
    raise exception 'estado inválido: %', p_status;
  end if;

  update orders
    set status = p_status, mp_payment_id = p_mp_payment_id
    where id = p_order_id and status = 'pending';

  update reservations
    set status = p_status
    where order_id = p_order_id and status = 'pending';
end;
$$;

revoke all on function set_order_status(uuid, text, text) from public;
grant execute on function set_order_status(uuid, text, text) to service_role;
