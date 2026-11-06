-- Per-user progress for Call Room (desk state + cards).
-- Applied after the Better Auth schema.

create table if not exists user_progress (
  user_id text primary key references "user" (id) on delete cascade,
  desk jsonb not null default '{}'::jsonb,
  bank jsonb not null default '{}'::jsonb,
  cards jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists user_progress_updated_at_idx on user_progress (updated_at);
