import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL || 'CreatorPay <invoices@creatorpay.app>'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

export interface InvoiceEmailPayload {
  to: string
  clientName: string
  creatorName: string
  invoiceNumber: string
  total: number
  dueDate: string
  paymentLink: string
  lineItems: { description: string; quantity: number; unit_price: number }[]
  currency?: string
  notes?: string
}

function fmt(n: number, symbol: string) {
  return `${symbol}${n.toLocaleString('en-NG')}`
}

function invoiceEmailHtml(p: InvoiceEmailPayload): string {
  const symbol = p.currency === 'USD' ? '$' : '₦'
  const rows = p.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:14px;">${item.description}</td>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#a1a1aa;font-size:14px;text-align:right;">${fmt(item.unit_price, symbol)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #27272a;color:#f4f4f5;font-size:14px;text-align:right;font-weight:600;">${fmt(item.quantity * item.unit_price, symbol)}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding-bottom:28px;" align="center">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#7c3aed;border-radius:10px;padding:10px 14px;vertical-align:middle;">
                  <span style="color:#fff;font-weight:800;font-size:16px;letter-spacing:-0.5px;">CreatorPay</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#18181b;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

            <!-- Accent bar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="height:4px;background:#7c3aed;"></td></tr>
            </table>

            <!-- Invoice meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 36px 24px;">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.12em;">Invoice from</p>
                  <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${p.creatorName}</p>
                </td>
                <td align="right">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.12em;">Invoice</p>
                  <p style="margin:0;font-size:16px;font-weight:700;color:#fff;font-family:monospace;">${p.invoiceNumber}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Due ${p.dueDate}</p>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 36px 24px;">
              <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.12em;">Billed to</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:#f4f4f5;">${p.clientName}</p>
              </td></tr>
            </table>

            <!-- Line items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 36px 24px;">
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <th style="text-align:left;font-size:10px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:10px;border-bottom:1px solid #27272a;">Description</th>
                      <th style="text-align:center;font-size:10px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:10px;border-bottom:1px solid #27272a;">Qty</th>
                      <th style="text-align:right;font-size:10px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:10px;border-bottom:1px solid #27272a;">Price</th>
                      <th style="text-align:right;font-size:10px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:10px;border-bottom:1px solid #27272a;">Amount</th>
                    </tr>
                    ${rows}
                    <tr>
                      <td colspan="3" style="padding:16px 0 4px;font-size:15px;font-weight:700;color:#f4f4f5;">Total</td>
                      <td style="padding:16px 0 4px;font-size:18px;font-weight:800;color:#a78bfa;text-align:right;">${fmt(p.total, symbol)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            ${p.notes ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 36px 24px;">
              <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:0.12em;">Notes</p>
                <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">${p.notes}</p>
              </td></tr>
            </table>` : ''}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 36px 36px;">
              <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding-top:28px;" align="center">
                <a href="${p.paymentLink}"
                  style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:16px;">
                  Pay ${fmt(p.total, symbol)}
                </a>
                <p style="margin:12px 0 0;font-size:11px;color:#52525b;">Secured by Paystack · Card, bank transfer, or USSD</p>
              </td></tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-size:11px;color:#3f3f46;">Powered by <strong style="color:#52525b;">CreatorPay</strong> · Devrabyte</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendInvoiceEmail(payload: InvoiceEmailPayload) {
  const resend = getResend()
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping invoice email')
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: `Invoice ${payload.invoiceNumber} from ${payload.creatorName} — ${payload.currency === 'USD' ? '$' : '₦'}${payload.total.toLocaleString('en-NG')}`,
    html: invoiceEmailHtml(payload),
  })

  if (error) {
    console.error('Resend error:', error)
    throw error
  }
}
