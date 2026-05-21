import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    paddingTop: 56,
    paddingBottom: 72,
    paddingHorizontal: 56,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#18181b',
  },
  // Header
  titleSection: {
    alignItems: 'center',
    marginBottom: 28,
    borderBottomWidth: 2,
    borderBottomColor: '#18181b',
    paddingBottom: 16,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 9,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  // Sections
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d4d4d8',
    paddingBottom: 4,
  },
  bodyText: {
    fontSize: 10,
    color: '#3f3f46',
    lineHeight: 1.65,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
  },
  // Parties grid
  partiesRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 18,
  },
  partyBox: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderWidth: 0.5,
    borderColor: '#e4e4e7',
    borderRadius: 4,
    padding: 12,
  },
  partyLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  partyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 9,
    color: '#52525b',
    lineHeight: 1.5,
  },
  // Payment table
  paymentRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f4f4f5',
  },
  paymentLabel: {
    flex: 2,
    fontSize: 10,
    color: '#3f3f46',
  },
  paymentValue: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#18181b',
    textAlign: 'right',
  },
  // Line items
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f4f4f5',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 0.7, textAlign: 'center' },
  colAmt: { flex: 1.2, textAlign: 'right' },
  headerCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cell: {
    fontSize: 9,
    color: '#52525b',
  },
  // Clause bullets
  clauseItem: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 6,
  },
  bullet: {
    fontSize: 10,
    color: '#71717a',
    width: 10,
  },
  clauseText: {
    flex: 1,
    fontSize: 10,
    color: '#3f3f46',
    lineHeight: 1.6,
  },
  // Acceptance box
  acceptanceBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 4,
    padding: 14,
    marginTop: 16,
  },
  acceptanceTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  acceptanceText: {
    fontSize: 9.5,
    color: '#166534',
    lineHeight: 1.6,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 56,
    right: 56,
    borderTopWidth: 0.5,
    borderTopColor: '#e4e4e7',
    paddingTop: 8,
    textAlign: 'center',
    fontSize: 8,
    color: '#a1a1aa',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#e4e4e7',
    marginVertical: 12,
  },
  highlight: {
    backgroundColor: '#f5f3ff',
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
    color: '#6d28d9',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
})

export interface ContractPDFProps {
  invoiceNumber: string
  creatorName: string
  clientName: string
  clientEmail: string
  lineItems: { description: string; quantity: number; unit_price: number }[]
  total: number
  advancePercentage: number
  dueDate: string
  currency: string
  generatedDate: string
}

function fmt(n: number, symbol: string) {
  return `${symbol}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ContractPDF({
  invoiceNumber,
  creatorName,
  clientName,
  clientEmail,
  lineItems,
  total,
  advancePercentage,
  dueDate,
  currency,
  generatedDate,
}: ContractPDFProps) {
  const symbol = currency === 'USD' ? '$' : '₦'
  const balancePct = 100 - advancePercentage
  const advanceAmount = Math.round(total * advancePercentage / 100)
  const balanceAmount = total - advanceAmount

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Service Contract Agreement</Text>
          <Text style={styles.subtitle}>
            Invoice Reference: {invoiceNumber} · Date: {generatedDate}
          </Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Parties</Text>
          <View style={styles.partiesRow}>
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Service Provider (Creator)</Text>
              <Text style={styles.partyName}>{creatorName}</Text>
              <Text style={styles.partyDetail}>Hereinafter referred to as "the Creator"</Text>
            </View>
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Client</Text>
              <Text style={styles.partyName}>{clientName}</Text>
              <Text style={styles.partyDetail}>{clientEmail}</Text>
              <Text style={styles.partyDetail}>Hereinafter referred to as "the Client"</Text>
            </View>
          </View>
          <Text style={styles.bodyText}>
            This Service Contract Agreement ("Agreement") is entered into between the Creator and the Client as of the date indicated above. Both parties agree to the terms set out herein.
          </Text>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Scope of Services</Text>
          <Text style={[styles.bodyText, { marginBottom: 8 }]}>
            The Creator agrees to provide the following services as described:
          </Text>
          <View style={styles.tableHeaderRow}>
            <View style={styles.colDesc}><Text style={styles.headerCell}>Description</Text></View>
            <View style={styles.colQty}><Text style={[styles.headerCell, { textAlign: 'center' }]}>Qty</Text></View>
            <View style={styles.colAmt}><Text style={[styles.headerCell, { textAlign: 'right' }]}>Amount</Text></View>
          </View>
          {lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colDesc}><Text style={styles.cell}>{item.description}</Text></View>
              <View style={styles.colQty}><Text style={[styles.cell, { textAlign: 'center' }]}>{item.quantity}</Text></View>
              <View style={styles.colAmt}><Text style={[styles.cell, { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#18181b' }]}>{fmt(item.quantity * item.unit_price, symbol)}</Text></View>
            </View>
          ))}
        </View>

        {/* Payment Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Payment Terms</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Contract Value</Text>
            <Text style={styles.paymentValue}>{fmt(total, symbol)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
              Advance Payment ({advancePercentage}%) — due before commencement
            </Text>
            <Text style={styles.paymentValue}>{fmt(advanceAmount, symbol)}</Text>
          </View>
          <View style={[styles.paymentRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.paymentLabel}>
              Balance Payment ({balancePct}%) — due upon Client confirmation of delivery
            </Text>
            <Text style={styles.paymentValue}>{fmt(balanceAmount, symbol)}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.bodyText}>
            All payments are processed securely through Paystack. The advance payment must be received before the Creator commences work. The balance payment becomes due immediately upon the Client confirming satisfactory delivery of all agreed services. Delivery timeline: {dueDate}.
          </Text>
        </View>

        {/* Creator Obligations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Obligations of the Service Provider (Creator)</Text>
          {[
            'Deliver the services described in Section 2 with reasonable skill and care, to a professional standard.',
            'Communicate promptly if there are any delays, changes in scope, or issues that may affect delivery.',
            'Provide revisions as expressly agreed upon at the time of contracting. Additional revision requests may be subject to additional fees.',
            'Maintain confidentiality of any sensitive client information shared in connection with this contract.',
            'Deliver work by the agreed due date, or notify the Client at least 48 hours in advance of any expected delay.',
          ].map((text, i) => (
            <View key={i} style={styles.clauseItem}>
              <Text style={styles.bullet}>{i + 1}.</Text>
              <Text style={styles.clauseText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Client Obligations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Obligations of the Client</Text>
          {[
            `Pay the advance payment of ${fmt(advanceAmount, symbol)} before the Creator commences work. Work will not begin until the advance is received.`,
            'Provide all necessary information, assets, and feedback required for the Creator to deliver the services described.',
            'Review deliverables and provide written feedback or approval within five (5) business days of delivery notification.',
            `Pay the balance of ${fmt(balanceAmount, symbol)} promptly upon confirming satisfactory delivery of the services.`,
            'Not use, reproduce, or distribute any deliverables until full payment has been received by the Creator.',
          ].map((text, i) => (
            <View key={i} style={styles.clauseItem}>
              <Text style={styles.bullet}>{i + 1}.</Text>
              <Text style={styles.clauseText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Dispute Resolution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Dispute Resolution</Text>
          <Text style={[styles.bodyText, { marginBottom: 6 }]}>
            In the event of any dispute arising from or in connection with this Agreement, the parties shall follow the process below:
          </Text>
          {[
            'The parties shall first attempt to resolve the dispute amicably through good-faith negotiation within five (5) business days of the dispute being raised.',
            'If the dispute remains unresolved, either party may escalate the matter to the CreatorPay mediation team by submitting a formal dispute via the platform. CreatorPay\'s decision regarding the release of escrowed funds shall be final and binding on both parties.',
            'Further escalation may be made to the Consumer Protection Council of Nigeria pursuant to the Consumer Protection Council Act Cap C25 LFN 2004.',
            'Any arbitration shall be conducted in accordance with the Arbitration and Conciliation Act Cap A18 LFN 2004 (as amended by the Arbitration and Mediation Act 2023).',
            'The venue of any legal proceedings shall be in Nigeria.',
          ].map((text, i) => (
            <View key={i} style={styles.clauseItem}>
              <Text style={styles.bullet}>{i + 1}.</Text>
              <Text style={styles.clauseText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* IP */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text style={styles.bodyText}>
            All deliverables, including but not limited to designs, photographs, videos, content, and other creative works, remain the sole intellectual property of the Service Provider (Creator) until full payment — including the balance payment — has been received. Upon receipt of full payment, ownership of the final deliverables transfers to the Client, unless otherwise agreed in writing. The Creator retains the right to display the work in their portfolio unless the Client requests confidentiality in writing.
          </Text>
        </View>

        {/* Force Majeure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Force Majeure</Text>
          <Text style={styles.bodyText}>
            Neither party shall be held liable for delays or failure to perform caused by circumstances beyond their reasonable control, including but not limited to natural disasters, government actions, internet outages, power failures, or other events of force majeure. The affected party shall promptly notify the other party and both parties shall cooperate to find a mutually acceptable resolution.
          </Text>
        </View>

        {/* Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Governing Law</Text>
          <Text style={styles.bodyText}>
            This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Both parties submit to the non-exclusive jurisdiction of the Nigerian courts.
          </Text>
        </View>

        {/* Acceptance */}
        <View style={styles.acceptanceBox}>
          <Text style={styles.acceptanceTitle}>10. Acceptance & Electronic Signature</Text>
          <Text style={styles.acceptanceText}>
            By proceeding with the advance payment, the Client confirms they have read, understood, and agree to all terms of this Agreement. This constitutes a valid electronic acceptance under Nigerian law.{'\n\n'}
            By generating and sending this invoice, the Creator agrees to deliver the services described herein in accordance with the terms above.{'\n\n'}
            Both parties acknowledge that this electronically generated contract is legally binding under the Cybercrimes (Prohibition, Prevention, etc.) Act 2015 and the Electronic Transactions Bill provisions of Nigeria.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This contract is generated and managed by CreatorPay (Devrabyte) · Invoice: {invoiceNumber} · Generated: {generatedDate}
        </Text>
      </Page>
    </Document>
  )
}
