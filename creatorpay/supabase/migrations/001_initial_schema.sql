-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.cp_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  business_name text,
  creative_category text check (creative_category in ('designer','photographer','content_creator','musician','videographer','other')),
  phone text,
  paystack_subaccount_code text,
  paystack_recipient_code text,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  created_at timestamptz not null default now()
);

-- Clients table
create table public.cp_clients (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.cp_users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  company text,
  created_at timestamptz not null default now()
);

-- Invoices table
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text not null unique,
  line_items jsonb not null default '[]',
  subtotal numeric(12,2) not null default 0,
  platform_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  payment_reference text,
  paystack_payment_link text,
  advance_requested boolean not null default false,
  advance_paid_out boolean not null default false,
  created_at timestamptz not null default now()
);

-- Transactions table
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  amount numeric(12,2) not null,
  platform_fee_amount numeric(12,2) not null,
  creator_amount numeric(12,2) not null,
  paystack_reference text not null,
  paystack_channel text,
  status text not null default 'pending' check (status in ('pending','success','failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Withdrawals table
create table public.withdrawals (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid not null references public.users(id) on delete cascade,
  amount numeric(12,2) not null,
  paystack_transfer_code text,
  status text not null default 'pending' check (status in ('pending','success','failed','reversed')),
  created_at timestamptz not null default now()
);

-- Advances table
create table public.advances (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  advance_amount numeric(12,2) not null,
  fee_amount numeric(12,2) not null,
  status text not null default 'requested' check (status in ('requested','approved','paid_out','repaid')),
  repaid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security Policies
-- ============================================================

alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.advances enable row level security;

-- Users: can only see/edit own row
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Clients: creator sees their own
create policy "Creators manage own clients" on public.clients
  for all using (auth.uid() = creator_id);

-- Invoices: creator sees their own; public can read for payment page
create policy "Creators manage own invoices" on public.invoices
  for all using (auth.uid() = creator_id);

create policy "Public can view sent/paid invoices" on public.invoices
  for select using (status in ('sent', 'paid'));

-- Transactions: creator sees their own
create policy "Creators view own transactions" on public.transactions
  for select using (auth.uid() = creator_id);

create policy "Service can insert transactions" on public.transactions
  for insert with check (true);

-- Withdrawals: creator sees their own
create policy "Creators manage own withdrawals" on public.withdrawals
  for all using (auth.uid() = creator_id);

-- Advances: creator sees their own
create policy "Creators manage own advances" on public.advances
  for all using (auth.uid() = creator_id);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_invoices_creator_id on public.invoices(creator_id);
create index idx_invoices_payment_reference on public.invoices(payment_reference);
create index idx_invoices_invoice_number on public.invoices(invoice_number);
create index idx_transactions_creator_id on public.transactions(creator_id);
create index idx_withdrawals_creator_id on public.withdrawals(creator_id);
create index idx_clients_creator_id on public.clients(creator_id);
