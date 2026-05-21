-- Extend cp_users with invoice branding fields
alter table public.cp_users
  add column if not exists avatar_url text,
  add column if not exists invoice_logo_url text,
  add column if not exists invoice_brand_color text default '#7c3aed',
  add column if not exists invoice_default_notes text,
  add column if not exists invoice_default_terms text,
  add column if not exists notify_invoice_paid boolean not null default true,
  add column if not exists notify_invoice_overdue boolean not null default true,
  add column if not exists notify_advance_approved boolean not null default true,
  add column if not exists notify_withdrawal_complete boolean not null default true,
  add column if not exists notify_email boolean not null default true,
  add column if not exists notify_sms boolean not null default false;

-- Notifications table
create table if not exists public.cp_notifications (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.cp_users(id) on delete cascade,
  type text not null check (type in ('invoice_paid','invoice_overdue','advance_approved','advance_rejected','withdrawal_success','withdrawal_failed','system')),
  title text not null,
  body text not null,
  read boolean not null default false,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.cp_notifications enable row level security;

create policy "Creators manage own notifications" on public.cp_notifications
  for all using (auth.uid() = creator_id);

create index if not exists idx_notifications_creator_id on public.cp_notifications(creator_id);
create index if not exists idx_notifications_read on public.cp_notifications(creator_id, read);
