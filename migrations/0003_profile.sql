alter table user_progress add column if not exists score integer not null default 0;

create table if not exists user_profile (
  user_id text primary key references "user" (id) on delete cascade,
  bio text not null default '',
  updated_at timestamptz not null default now()
);
