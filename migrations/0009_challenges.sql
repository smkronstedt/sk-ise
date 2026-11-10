create table if not exists challenge_opt (
  user_id text primary key references "user" (id) on delete cascade,
  opted boolean not null default false
);

create table if not exists challenges (
  id text primary key,
  from_id text not null references "user" (id) on delete cascade,
  to_id text not null references "user" (id) on delete cascade,
  kind text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists challenges_to_idx on challenges (to_id, created_at desc);
create index if not exists challenges_from_idx on challenges (from_id, created_at desc);
