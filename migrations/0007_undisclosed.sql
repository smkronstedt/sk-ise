alter table account_access add column if not exists undisclosed_open boolean not null default false;
