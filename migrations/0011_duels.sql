alter table challenges add column if not exists question_ids text;
alter table challenges add column if not exists from_score int;
alter table challenges add column if not exists to_score int;
alter table challenges add column if not exists from_power int;
alter table challenges add column if not exists to_power int;
alter table challenges add column if not exists topic text;
alter table challenges add column if not exists duel_count int;