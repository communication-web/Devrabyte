import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Font,
} from '@react-pdf/renderer'

// Use built-in fonts (no external fetching needed)
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 52,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  // Accent bar
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#7c3aed',
  },
  // Header row
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  brandName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
    letterSpacing: -0.5,
  },
  invoiceLabel: {
    fontSize: 9,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    marginBottom: 20,
  },
  // Two-column section
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  col: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  bodyText: {
    fontSize: 10,
    color: '#3f3f46',
    lineHeight: 1.6,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
    fontSize: 11,
  },
  // Line items table
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colAmt: { flex: 1.5, textAlign: 'right' },
  headerCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cell: {
    fontSize: 10,
    color: '#52525b',
  },
  amountCell: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
  },
  // Totals
  totalsContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 10, color: '#71717a', width: 100, textAlign: 'right' },
  totalValue: { fontSize: 10, color: '#3f3f46', width: 100, textAlign: 'right' },
  grandTotalLabel: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
    width: 100,
    textAlign: 'right',
  },
  grandTotalValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
    width: 100,
    textAlign: 'right',
  },
  // Payment CTA
  ctaBox: {
    marginTop: 32,
    backgroundColor: '#f5f3ff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  ctaLabel: {
    fontSize: 10,
    color: '#6d28d9',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaLink: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
    textDecoration: 'underline',
    textAlign: 'center',
  },
  ctaNote: {
    fontSize: 8,
    color: '#a78bfa',
    marginTop: 6,
    textAlign: 'center',
  },
  // Notes
  notesBox: {
    marginTop: 24,
    padding: 14,
    backgroundColor: '#fafafa',
    borderRadius: 6,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 52,
    right: 52,
    textAlign: 'center',
    fontSize: 8,
    color: '#a1a1aa',
  },
  dueBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dueText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#7c3aed',
  },
})

export interface InvoicePDFProps {
  invoiceNumber: string
  creatorName: string
  clientName: string
  clientEmail: string
  clientCompany?: string | null
  lineItems: { description: string; quantity: number; unit_price: number }[]
  subtotal: number
  platformFee: number
  total: number
  dueDate: string
  currency: string
  paymentLink: string
  notes?: string
  terms?: string
  brandColor?: string
}

function fmt(n: number, symbol: string) {
  return `${symbol}${n.toLocaleString('en-NG')}`
}

export function InvoicePDF({
  invoiceNumber,
  creatorName,
  clientName,
  clientEmail,
  clientCompany,
  lineItems,
  subtotal,
  platformFee,
  total,
  dueDate,
  currency,
  paymentLink,
  notes,
  terms,
}: InvoicePDFProps) {
  const symbol = currency === 'USD' ? '$' : '₦'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Accent bar */}
        <View style={styles.accentBar} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{creatorName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <View style={[styles.dueBox, { marginTop: 6 }]}>
              <Text style={styles.dueText}>Due {dueDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill to */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Billed to</Text>
            <Text style={styles.boldText}>{clientName}</Text>
            {clientCompany && <Text style={styles.bodyText}>{clientCompany}</Text>}
            <Text style={styles.bodyText}>{clientEmail}</Text>
          </View>
          <View style={[styles.col, { alignItems: 'flex-end' }]}>
            <Text style={styles.sectionLabel}>Amount due</Text>
            <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#18181b' }}>
              {fmt(total, symbol)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Line items */}
        <View>
          <Text style={[styles.sectionLabel, { marginBottom: 8 }]}>Items</Text>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}><Text style={styles.headerCell}>Description</Text></View>
            <View style={styles.colQty}><Text style={styles.headerCell}>Qty</Text></View>
            <View style={styles.colPrice}><Text style={[styles.headerCell, { textAlign: 'right' }]}>Unit price</Text></View>
            <View style={styles.colAmt}><Text style={[styles.headerCell, { textAlign: 'right' }]}>Amount</Text></View>
          </View>
          {lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colDesc}><Text style={styles.cell}>{item.description}</Text></View>
              <View style={styles.colQty}><Text style={[styles.cell, { textAlign: 'center' }]}>{item.quantity}</Text></View>
              <View style={styles.colPrice}><Text style={[styles.cell, { textAlign: 'right' }]}>{fmt(item.unit_price, symbol)}</Text></View>
              <View style={styles.colAmt}><Text style={[styles.amountCell, { textAlign: 'right' }]}>{fmt(item.quantity * item.unit_price, symbol)}</Text></View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(subtotal, symbol)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Platform fee (1.5%)</Text>
            <Text style={styles.totalValue}>{fmt(platformFee, symbol)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#e4e4e7', paddingTop: 8, marginTop: 4 }]}>
            <Text style={styles.grandTotalLabel}>Total due</Text>
            <Text style={styles.grandTotalValue}>{fmt(total, symbol)}</Text>
          </View>
        </View>

        {/* Pay CTA */}
        <View style={styles.ctaBox}>
          <Text style={styles.ctaLabel}>Click the link below to pay securely via Paystack</Text>
          <Link src={paymentLink} style={styles.ctaLink}>
            {paymentLink.length > 60 ? paymentLink.slice(0, 60) + '…' : paymentLink}
          </Link>
          <Text style={styles.ctaNote}>Accepts card, bank transfer, and USSD</Text>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notesBox}>
            <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>Notes</Text>
            <Text style={styles.bodyText}>{notes}</Text>
          </View>
        )}

        {/* Terms */}
        {terms && (
          <View style={[styles.notesBox, { marginTop: 10 }]}>
            <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>Terms</Text>
            <Text style={styles.bodyText}>{terms}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Powered by CreatorPay · Devrabyte · {invoiceNumber}
        </Text>
      </Page>
    </Document>
  )
}
