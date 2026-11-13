create table if not exists live_book (
  id smallint primary key check (id = 1),
  as_of timestamptz not null,
  refreshed_by text not null,
  account_masked text not null,
  source_note text not null,
  degraded boolean not null default false,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
