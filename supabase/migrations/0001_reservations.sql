create table reservations (
  id uuid primary key default gen_random_uuid(),
  seat_id text not null,
  user_id uuid not null references auth.users(id),
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create unique index reservations_seat_active_idx
  on reservations (seat_id)
  where status in ('pending', 'confirmed');

alter table reservations enable row level security;

create policy "select propia reserva completa"
  on reservations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "insert propia reserva"
  on reservations for insert
  to authenticated
  with check (auth.uid() = user_id);

create or replace function active_reservation_seats()
returns table (seat_id text, status text)
language sql
security definer
set search_path = public
as $$
  select seat_id, status
  from reservations
  where status in ('pending', 'confirmed');
$$;

revoke all on function active_reservation_seats() from public;
grant execute on function active_reservation_seats() to authenticated;
