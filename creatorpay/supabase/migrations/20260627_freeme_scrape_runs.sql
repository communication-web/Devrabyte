create type scrape_run_status as enum ('running', 'completed', 'failed');

create table freeme_scrape_runs (
  id               uuid primary key default gen_random_uuid(),
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  status           scrape_run_status not null default 'running',
  sources_run      text[]  not null default '{}',
  total_found      integer not null default 0,
  total_inserted   integer not null default 0,
  total_duplicates integer not null default 0,
  tier1_found      integer not null default 0,
  tier2_found      integer not null default 0,
  tier3_found      integer not null default 0,
  error_message    text,
  log              jsonb   not null default '[]'
);

create index freeme_scrape_runs_started_idx on freeme_scrape_runs (started_at desc);
alter table freeme_scrape_runs disable row level security;
