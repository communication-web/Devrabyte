import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDebts } from '../../lib/DebtsContext';
import { simulatePayoff } from '../../lib/payoff';
import { formatCurrency, formatDate } from '../../lib/format';
import { ProgressRing } from '../../components/ProgressRing';
import { Card } from '../../components/Card';
import { BADGE_CATALOG } from '../../lib/badges';

export default function DashboardScreen() {
  const { isLoaded, debts, settings, streak, newlyEarnedBadges, clearNewlyEarnedBadges } =
    useDebts();

  const { totalOriginal, totalCurrent, totalPaid, progress } = useMemo(() => {
    const totalOriginal = debts.reduce((sum, d) => sum + d.originalBalance, 0);
    const totalCurrent = debts.reduce((sum, d) => sum + d.currentBalance, 0);
    const totalPaid = totalOriginal - totalCurrent;
    return {
      totalOriginal,
      totalCurrent,
      totalPaid,
      progress: totalOriginal > 0 ? totalPaid / totalOriginal : 0,
    };
  }, [debts]);

  const payoff = useMemo(
    () => simulatePayoff(debts, settings.strategy, settings.extraMonthly),
    [debts, settings]
  );

  if (!isLoaded) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Debt-Free Countdown</Text>
        <Link href="/settings" asChild>
          <Pressable hitSlop={8}>
            <Ionicons name="settings-outline" size={24} color="#5B6B63" />
          </Pressable>
        </Link>
      </View>

      {streak.currentStreak > 0 && (
        <View style={styles.streakChip}>
          <Text style={styles.streakChipText}>🔥 {streak.currentStreak}-day streak</Text>
        </View>
      )}

      {newlyEarnedBadges.length > 0 && (
        <Card style={styles.badgeBanner}>
          <Text style={styles.badgeBannerText}>
            🎉 New badge{newlyEarnedBadges.length > 1 ? 's' : ''}:{' '}
            {newlyEarnedBadges
              .map((id) => BADGE_CATALOG.find((b) => b.id === id)?.title ?? id)
              .join(', ')}
          </Text>
          <Pressable onPress={clearNewlyEarnedBadges} hitSlop={8}>
            <Text style={styles.badgeBannerDismiss}>Dismiss</Text>
          </Pressable>
        </Card>
      )}

      <Card style={styles.countdownCard}>
        {debts.length === 0 ? (
          <Text style={styles.emptyText}>Add a debt on the Debts tab to see your countdown.</Text>
        ) : payoff ? (
          <>
            <Text style={styles.countdownDate}>{formatDate(payoff.payoffDate)}</Text>
            <Text style={styles.countdownSub}>
              {payoff.months} {payoff.months === 1 ? 'month' : 'months'} to go
            </Text>
          </>
        ) : (
          <Text style={styles.emptyText}>
            At your current minimum payments, this debt won't be paid off. Add extra monthly
            payments on the Strategy tab.
          </Text>
        )}
      </Card>

      <View style={styles.ringWrap}>
        <ProgressRing
          progress={progress}
          label={`${Math.round(progress * 100)}%`}
          sublabel="paid off"
        />
      </View>

      <Card>
        <Row label="Total original debt" value={formatCurrency(totalOriginal)} />
        <Row label="Remaining balance" value={formatCurrency(totalCurrent)} />
        <Row label="Paid so far" value={formatCurrency(totalPaid)} highlight />
      </Card>
    </ScrollView>
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
  content: { padding: 20, paddingTop: 60, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#12261B', flex: 1, marginRight: 12 },
  streakChip: { alignSelf: 'flex-start', backgroundColor: '#FFF3E0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  streakChipText: { fontSize: 13, fontWeight: '600', color: '#8A4B00' },
  badgeBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9' },
  badgeBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1B5E20', marginRight: 8 },
  badgeBannerDismiss: { fontSize: 13, color: '#5B6B63' },
  countdownCard: { alignItems: 'center', paddingVertical: 24 },
  countdownDate: { fontSize: 26, fontWeight: '700', color: '#1B5E20' },
  countdownSub: { fontSize: 14, color: '#5B6B63', marginTop: 4 },
  emptyText: { fontSize: 14, color: '#5B6B63', textAlign: 'center' },
  ringWrap: { alignItems: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 14, color: '#5B6B63' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#12261B' },
  rowValueHighlight: { color: '#1B5E20' },
});
