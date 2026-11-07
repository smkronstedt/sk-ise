create table if not exists site_secret (
  key text primary key,
  value text not null
);

alter table account_access add column if not exists blackops boolean not null default false;
alter table account_access add column if not exists blackops_open boolean not null default false;
