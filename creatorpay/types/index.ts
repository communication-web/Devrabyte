export type CreativeCategory =
  | 'designer'
  | 'photographer'
  | 'content_creator'
  | 'musician'
  | 'videographer'
  | 'other'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'
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
