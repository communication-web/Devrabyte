-- ============================================================
-- CreatorPay: Escrow, Dispute & Contract System
-- Apply in Supabase SQL editor: https://supabase.com/dashboard
-- ============================================================

-- 1. Extend cp_invoices for escrow + protected payments
ALTER TABLE cp_invoices
  ADD COLUMN IF NOT EXISTS escrow_enabled         boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_percentage     integer     DEFAULT 70,
  ADD COLUMN IF NOT EXISTS advance_paid_amount    numeric     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_paid_amount    numeric     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_payment_reference text,
  ADD COLUMN IF NOT EXISTS balance_payment_reference text,
  ADD COLUMN IF NOT EXISTS advance_payment_link   text,
  ADD COLUMN IF NOT EXISTS balance_payment_link   text,
  ADD COLUMN IF NOT EXISTS delivered_at           timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at           timestamptz,
  ADD COLUMN IF NOT EXISTS escrow_status          text        DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS contract_signed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS contract_pdf_url       text;

-- 2. Add payment_type to cp_transactions
ALTER TABLE cp_transactions
  ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'full';

-- 3. Disputes table
CREATE TABLE IF NOT EXISTS cp_disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid REFERENCES cp_invoices(id) ON DELETE CASCADE,
  creator_id      uuid REFERENCES cp_users(id),
  client_email    text NOT NULL,
  client_name     text NOT NULL,
  raised_by       text NOT NULL CHECK (raised_by IN ('client', 'creator')),
  reason          text NOT NULL,
  details         text,
  status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','under_review','resolved_creator','resolved_client','escalated')),
  resolution_notes text,
  evidence_urls   text[],
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 4. Contracts table
CREATE TABLE IF NOT EXISTS cp_contracts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          uuid REFERENCES cp_invoices(id) ON DELETE CASCADE,
  creator_id          uuid REFERENCES cp_users(id),
  client_email        text NOT NULL,
  client_name         text NOT NULL,
  pdf_url             text,
  creator_signed_at   timestamptz DEFAULT now(),
  client_viewed_at    timestamptz,
  client_accepted_at  timestamptz,
  created_at          timestamptz DEFAULT now()
);

-- 5. Admin flag on cp_users
ALTER TABLE cp_users
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 6. RLS for disputes
ALTER TABLE cp_disputes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can view own disputes' AND tablename = 'cp_disputes') THEN
    CREATE POLICY "Creators can view own disputes" ON cp_disputes FOR SELECT TO authenticated USING (creator_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert dispute' AND tablename = 'cp_disputes') THEN
    CREATE POLICY "Anyone can insert dispute" ON cp_disputes FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 7. RLS for contracts
ALTER TABLE cp_contracts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Creators can manage own contracts' AND tablename = 'cp_contracts') THEN
    CREATE POLICY "Creators can manage own contracts" ON cp_contracts FOR ALL TO authenticated USING (creator_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view contracts' AND tablename = 'cp_contracts') THEN
    CREATE POLICY "Public can view contracts" ON cp_contracts FOR SELECT USING (true);
  END IF;
END $$;
