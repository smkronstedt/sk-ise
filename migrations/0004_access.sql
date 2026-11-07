create table if not exists account_access (
  user_id text primary key references "user" (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index if not exists account_access_status_idx on account_access (status);
