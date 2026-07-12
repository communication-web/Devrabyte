import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useDebts } from '../../lib/DebtsContext';
import { simulatePayoff } from '../../lib/payoff';
import { formatCurrency, formatDate } from '../../lib/format';
import { Card } from '../../components/Card';
import { Strategy } from '../../lib/types';

const MAX_EXTRA = 1000;
const STEP = 10;

export default function StrategyScreen() {
  const { debts, settings, setStrategy, setExtraMonthly } = useDebts();

  const baseline = useMemo(() => simulatePayoff(debts, settings.strategy, 0), [debts, settings.strategy]);
  const withExtra = useMemo(
    () => simulatePayoff(debts, settings.strategy, settings.extraMonthly),
    [debts, settings.strategy, settings.extraMonthly]
  );

  const monthsSaved =
    baseline && withExtra ? baseline.months - withExtra.months : 0;
  const interestSaved =
    baseline && withExtra ? baseline.totalInterestPaid - withExtra.totalInterestPaid : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Strategy Playground</Text>

      <Card>
        <Text style={styles.cardTitle}>Payoff method</Text>
        <View style={styles.toggleRow}>
          <StrategyButton
            label="Snowball"
            sublabel="Smallest balance first"
            active={settings.strategy === 'snowball'}
            onPress={() => setStrategy('snowball')}
          />
          <StrategyButton
            label="Avalanche"
            sublabel="Highest APR first"
            active={settings.strategy === 'avalanche'}
            onPress={() => setStrategy('avalanche')}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Extra monthly payment</Text>
        <Text style={styles.extraAmount}>{formatCurrency(settings.extraMonthly)}/mo</Text>
        <Slider
          minimumValue={0}
          maximumValue={MAX_EXTRA}
          step={STEP}
          value={settings.extraMonthly}
          onValueChange={setExtraMonthly}
          minimumTrackTintColor="#1B5E20"
          maximumTrackTintColor="#DCE5E0"
          thumbTintColor="#1B5E20"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>$0</Text>
          <Text style={styles.sliderLabelText}>{formatCurrency(MAX_EXTRA)}</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>What this buys you</Text>
        {debts.length === 0 ? (
          <Text style={styles.emptyText}>Add a debt on the Debts tab to see the impact.</Text>
        ) : withExtra ? (
          <>
            <Row label="Debt-free date" value={formatDate(withExtra.payoffDate)} />
            <Row label="Months to freedom" value={String(withExtra.months)} />
            <Row
              label="Time saved vs. minimums only"
              value={monthsSaved > 0 ? `${monthsSaved} months sooner` : 'No extra applied yet'}
              highlight={monthsSaved > 0}
            />
            <Row
              label="Interest saved"
              value={interestSaved > 0 ? formatCurrency(interestSaved) : '$0'}
              highlight={interestSaved > 0}
            />
          </>
        ) : (
          <Text style={styles.emptyText}>
            At this rate the debt won't be paid off — try adding more extra payment.
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

function StrategyButton({
  label,
  sublabel,
  active,
  onPress,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.strategyButton, active && styles.strategyButtonActive]} onPress={onPress}>
      <Text style={[styles.strategyButtonLabel, active && styles.strategyButtonLabelActive]}>{label}</Text>
      <Text style={[styles.strategyButtonSublabel, active && styles.strategyButtonLabelActive]}>
        {sublabel}
      </Text>
    </Pressable>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8F6' },
  content: { padding: 20, paddingTop: 60, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#12261B' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#12261B', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  strategyButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 12,
    padding: 12,
  },
  strategyButtonActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  strategyButtonLabel: { fontSize: 15, fontWeight: '700', color: '#12261B' },
  strategyButtonSublabel: { fontSize: 12, color: '#5B6B63', marginTop: 2 },
  strategyButtonLabelActive: { color: '#FFFFFF' },
  extraAmount: { fontSize: 28, fontWeight: '700', color: '#1B5E20', marginBottom: 8 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabelText: { fontSize: 12, color: '#5B6B63' },
  emptyText: { fontSize: 14, color: '#5B6B63' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 14, color: '#5B6B63' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#12261B' },
  rowValueHighlight: { color: '#1B5E20' },
});
