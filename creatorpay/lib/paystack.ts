const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const BASE_URL = 'https://api.paystack.co'

async function paystackRequest<T>(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  if (!data.status) {
    throw new Error(data.message || 'Paystack request failed')
  }
  return data.data as T
}

export interface SubaccountData {
  subaccount_code: string
  id: number
}

export interface TransferRecipientData {
  recipient_code: string
  id: number
}

export interface PaymentInitData {
  authorization_url: string
  access_code: string
  reference: string
}

export interface TransferData {
  transfer_code: string
  id: number
  status: string
}

export const paystack = {
  createSubaccount(params: {
    business_name: string
    settlement_bank: string
    account_number: string
    percentage_charge: number
    primary_contact_email?: string
    primary_contact_name?: string
    primary_contact_phone?: string
  }) {
    return paystackRequest<SubaccountData>('POST', '/subaccount', params)
  },

  createTransferRecipient(params: {
    type: string
    name: string
    account_number: string
    bank_code: string
    currency?: string
  }) {
    return paystackRequest<TransferRecipientData>('POST', '/transferrecipient', {
      ...params,
      currency: params.currency ?? 'NGN',
    })
  },

  initializeTransaction(params: {
    email: string
    amount: number
    reference: string
    subaccount?: string
    bearer?: string
    callback_url?: string
    metadata?: Record<string, unknown>
  }) {
    return paystackRequest<PaymentInitData>('POST', '/transaction/initialize', params)
  },

  initiateTransfer(params: {
    source: string
    amount: number
    recipient: string
    reason?: string
    reference?: string
  }) {
    return paystackRequest<TransferData>('POST', '/transfer', params)
  },

  verifyTransaction(reference: string) {
    return paystackRequest<{ status: string; amount: number; channel: string }>(
      'GET',
      `/transaction/verify/${reference}`
    )
  },
}

export function getBankCode(bankName: string): string {
  const banks: Record<string, string> = {
    'Access Bank': '044',
    'GTBank': '058',
    'Guaranty Trust Bank': '058',
    'First Bank': '011',
    'UBA': '033',
    'United Bank for Africa': '033',
    'Zenith Bank': '057',
    'Kuda Bank': '090267',
    'Opay': '100004',
    'PalmPay': '100033',
    'Moniepoint': '090405',
    'Stanbic IBTC': '221',
    'Sterling Bank': '232',
    'Wema Bank': '035',
    'Union Bank': '032',
    'Fidelity Bank': '070',
    'FCMB': '214',
    'Ecobank': '050',
    'Polaris Bank': '076',
    'Heritage Bank': '030',
  }
  return banks[bankName] || '000'
}
