alter table reservations alter column user_id drop not null;

alter table reservations drop constraint reservations_status_check;

alter table reservations add constraint reservations_status_check
  check (status in ('pending', 'confirmed', 'cancelled', 'blocked'));

alter table reservations add constraint reservations_blocked_has_no_user
  check ((status = 'blocked') = (user_id is null));

drop index reservations_seat_active_idx;

create unique index reservations_seat_active_idx
  on reservations (seat_id)
  where status in ('pending', 'confirmed', 'blocked');

drop function if exists active_reservation_seats();

create function active_reservation_seats()
returns table (seat_id text, status text, order_id uuid)
language sql
security definer
set search_path = public
as $$
  select seat_id, status, order_id
  from reservations
  where status in ('confirmed', 'blocked')
     or (status = 'pending' and created_at > now() - interval '20 minutes')
$$;

revoke all on function active_reservation_seats() from public;
grant execute on function active_reservation_seats() to authenticated, service_role;

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
    where s is null or s !~ '^[a-z]+-F[0-9]{2}-[0-9]{1,2}$'
  ) then
    raise exception 'la selección tiene identificadores de butaca inválidos';
  end if;

  update reservations
    set status = 'cancelled'
    where seat_id = any(p_seat_ids)
      and status = 'pending'
      and created_at <= now() - interval '20 minutes';

  insert into reservations (seat_id, user_id, status, order_id)
    select distinct s, null, 'blocked', null
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

create or replace function admin_unblock_seats(p_seat_ids text[])
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

  update reservations
    set status = 'cancelled'
    where seat_id = any(p_seat_ids)
      and status = 'blocked';

  get diagnostics v_released = row_count;

  return v_released;
end;
$$;

revoke all on function admin_unblock_seats(text[]) from public;
grant execute on function admin_unblock_seats(text[]) to service_role;

create or replace function admin_cancel_order(p_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_freed integer;
begin
  select status into v_status from orders where id = p_order_id for update;

  if v_status is null or v_status not in ('pending', 'confirmed') then
    return 0;
  end if;

  update reservations
    set status = 'cancelled'
    where order_id = p_order_id
      and status in ('pending', 'confirmed');

  get diagnostics v_freed = row_count;

  update orders set status = 'cancelled' where id = p_order_id;

  return v_freed;
end;
$$;

revoke all on function admin_cancel_order(uuid) from public;
grant execute on function admin_cancel_order(uuid) to service_role;
