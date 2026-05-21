-- Extend cp_invoices for escrow
ALTER TABLE cp_invoices
  ADD COLUMN IF NOT EXISTS escrow_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_percentage integer DEFAULT 70,
  ADD COLUMN IF NOT EXISTS advance_paid_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_paid_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_payment_reference text,
  ADD COLUMN IF NOT EXISTS balance_payment_reference text,
  ADD COLUMN IF NOT EXISTS advance_payment_link text,
  ADD COLUMN IF NOT EXISTS balance_payment_link text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_pdf_url text;

-- Disputes table
CREATE TABLE IF NOT EXISTS cp_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES cp_invoices(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES cp_users(id),
  client_email text NOT NULL,
  client_name text NOT NULL,
  raised_by text NOT NULL CHECK (raised_by IN ('client', 'creator')),
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved_creator', 'resolved_client', 'escalated')),
  resolution_notes text,
  evidence_urls text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contracts table
CREATE TABLE IF NOT EXISTS cp_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES cp_invoices(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES cp_users(id),
  client_email text NOT NULL,
  client_name text NOT NULL,
  contract_html text,
  pdf_url text,
  creator_signed_at timestamptz DEFAULT now(),
  client_viewed_at timestamptz,
  client_accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS for disputes
ALTER TABLE cp_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Creators can view their disputes" ON cp_disputes FOR SELECT TO authenticated USING (creator_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Anyone can insert dispute" ON cp_disputes FOR INSERT TO anon, authenticated WITH CHECK (true);

-- RLS for contracts
ALTER TABLE cp_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Creators can manage their contracts" ON cp_contracts FOR ALL TO authenticated USING (creator_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Public can view contracts by invoice" ON cp_contracts FOR SELECT TO anon USING (true);
