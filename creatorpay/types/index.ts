export type CreativeCategory =
  | 'designer'
  | 'photographer'
  | 'content_creator'
  | 'musician'
  | 'videographer'
  | 'other'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'
export type EscrowStatus = 'none' | 'awaiting_advance' | 'advance_paid' | 'delivered' | 'confirmed' | 'completed' | 'disputed'
export type TransactionStatus = 'pending' | 'success' | 'failed'
export type WithdrawalStatus = 'pending' | 'success' | 'failed' | 'reversed'
export type AdvanceStatus = 'requested' | 'approved' | 'paid_out' | 'repaid'

export interface LineItem {
  description: string
  quantity: number
  unit_price: number
}

export interface User {
  id: string
  email: string
  full_name: string
  business_name: string | null
  creative_category: CreativeCategory | null
  phone: string | null
  paystack_subaccount_code: string | null
  paystack_recipient_code: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_account_name: string | null
  created_at: string
}

export interface Client {
  id: string
  creator_id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  created_at: string
}

export interface Invoice {
  id: string
  creator_id: string
  client_id: string
  invoice_number: string
  line_items: LineItem[]
  subtotal: number
  platform_fee: number
  total: number
  due_date: string
  status: InvoiceStatus
  payment_reference: string | null
  paystack_payment_link: string | null
  advance_requested: boolean
  advance_paid_out: boolean
  created_at: string
  clients?: Client
  // Escrow / Protected Payment fields
  escrow_enabled?: boolean
  advance_percentage?: number
  advance_paid_amount?: number
  balance_paid_amount?: number
  advance_payment_reference?: string | null
  balance_payment_reference?: string | null
  advance_payment_link?: string | null
  balance_payment_link?: string | null
  delivered_at?: string | null
  confirmed_at?: string | null
  escrow_status?: EscrowStatus
  contract_signed_at?: string | null
  contract_pdf_url?: string | null
}

export interface Dispute {
  id: string
  invoice_id: string
  creator_id: string
  client_email: string
  client_name: string
  raised_by: 'client' | 'creator'
  reason: string
  details: string | null
  status: 'open' | 'under_review' | 'resolved_creator' | 'resolved_client' | 'escalated'
  resolution_notes: string | null
  evidence_urls: string[] | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  invoice_id: string
  creator_id: string
  client_email: string
  client_name: string
  contract_html: string | null
  pdf_url: string | null
  creator_signed_at: string
  client_viewed_at: string | null
  client_accepted_at: string | null
  created_at: string
}

export interface Transaction {
  id: string
  invoice_id: string
  creator_id: string
  amount: number
  platform_fee_amount: number
  creator_amount: number
  paystack_reference: string
  paystack_channel: string
  status: TransactionStatus
  paid_at: string
}

export interface Withdrawal {
  id: string
  creator_id: string
  amount: number
  paystack_transfer_code: string | null
  status: WithdrawalStatus
  created_at: string
}

export interface Advance {
  id: string
  invoice_id: string
  creator_id: string
  advance_amount: number
  fee_amount: number
  status: AdvanceStatus
  repaid_at: string | null
  created_at: string
}

export interface DashboardStats {
  total_earned: number
  available_balance: number
  pending_amount: number
  paid_out: number
}

export type NotificationType =
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'advance_approved'
  | 'advance_rejected'
  | 'withdrawal_success'
  | 'withdrawal_failed'
  | 'system'

export interface Notification {
  id: string
  creator_id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface AnalyticsStats {
  total_earned: number
  earned_this_month: number
  earned_last_month: number
  invoice_count: number
  paid_invoice_count: number
  avg_invoice_value: number
  top_clients: { name: string; total: number }[]
  monthly_revenue: { month: string; amount: number }[]
}
