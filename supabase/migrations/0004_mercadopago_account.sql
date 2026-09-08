create table mercadopago_account (
  id            boolean primary key default true check (id),
  mp_user_id    text        not null,
  access_token  text        not null,
  refresh_token text        not null,
  public_key    text,
  expires_at    timestamptz not null,
  connected_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table mercadopago_account enable row level security;
