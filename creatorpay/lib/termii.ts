const TERMII_API_KEY = process.env.TERMII_API_KEY!
const TERMII_BASE_URL = 'https://v3.api.termii.com'

export async function sendWhatsApp(phone: string, message: string) {
  try {
    const res = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        from: 'CreatorPay',
        sms: message,
        type: 'plain',
        channel: 'whatsapp',
        api_key: TERMII_API_KEY,
      }),
    })
    return await res.json()
  } catch (err) {
    console.error('Termii WhatsApp error:', err)
  }
}

export async function sendSMS(phone: string, message: string) {
  try {
    const res = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        from: 'CreatorPay',
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: TERMII_API_KEY,
      }),
    })
    return await res.json()
  } catch (err) {
    console.error('Termii SMS error:', err)
  }
}
