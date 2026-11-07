create table if not exists service_links (
  user_id text not null references "user" (id) on delete cascade,
  provider text not null,
  client_id text not null,
  client_secret text not null,
  refresh_token text not null,
  access_token text,
  expires_at bigint,
  athlete text,
  primary key (user_id, provider)
);
