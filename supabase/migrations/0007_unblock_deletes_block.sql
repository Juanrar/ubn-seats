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

  delete from reservations
    where seat_id = any(p_seat_ids)
      and status = 'blocked';

  get diagnostics v_released = row_count;

  return v_released;
end;
$$;

revoke all on function admin_unblock_seats(text[]) from public;
grant execute on function admin_unblock_seats(text[]) to service_role;
