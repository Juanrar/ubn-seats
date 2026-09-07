alter table orders
  add column ticket_sent_at timestamptz;

create or replace function claim_ticket_delivery(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed integer;
begin
  update orders
    set ticket_sent_at = now()
    where id = p_order_id
      and status = 'confirmed'
      and ticket_sent_at is null;

  get diagnostics v_claimed = row_count;

  return v_claimed = 1;
end;
$$;

revoke all on function claim_ticket_delivery(uuid) from public;
grant execute on function claim_ticket_delivery(uuid) to service_role;

create or replace function release_ticket_delivery(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
    set ticket_sent_at = null
    where id = p_order_id;
end;
$$;

revoke all on function release_ticket_delivery(uuid) from public;
grant execute on function release_ticket_delivery(uuid) to service_role;
