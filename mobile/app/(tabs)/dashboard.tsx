import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { getDashboard, type Task, type Alert } from '@/lib/api';
import { Colors, Spacing, Radius, Shadow, priorityColor, severityColor } from '@/lib/theme';

const BRAND = process.env.EXPO_PUBLIC_BRAND_NAME ?? 'House of Jade';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboard>>['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const res = await getDashboard();
    if (res.ok) setData(res.data);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  if (loading) return <LoadingView />;

  const kpis = data?.kpis;
  const dueToday = data?.dueToday ?? [];
  const alerts = data?.alerts ?? [];
  const activity = data?.activity ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBrand}>{BRAND}</Text>
          <Text style={styles.headerGreeting}>{greeting}, {firstName}</Text>
        </View>
        <TouchableOpacity style={styles.orgBadge}>
          <Text style={styles.orgBadgeText}>{user?.org?.role?.toLowerCase() ?? 'member'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.mid} />}
      >
        {/* KPI row */}
        {kpis ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiRow}>
            <KpiCard label="Open" value={kpis.openCount} />
            <KpiCard label="Due today" value={kpis.dueTodayCount} accent="info" />
            <KpiCard label="Overdue" value={kpis.overdueCount} accent={kpis.overdueCount > 0 ? 'danger' : undefined} />
            <KpiCard label="Blocked" value={kpis.blockedCount} accent={kpis.blockedCount > 0 ? 'warning' : undefined} />
            <KpiCard label="Done (7d)" value={kpis.completed7d} accent="success" />
          </ScrollView>
        ) : null}

        {/* Alerts */}
        {alerts.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Bottleneck alerts" icon="warning-outline" color={Colors.warning} onPress={() => router.push('/(tabs)/more')} />
            {alerts.slice(0, 3).map(a => <AlertRow key={a.id} alert={a} />)}
          </View>
        ) : null}

        {/* Due today */}
        <View style={styles.section}>
          <SectionHeader title="Due today" icon="time-outline" onPress={() => router.push('/(tabs)/tasks')} />
          {dueToday.length === 0 ? (
            <EmptyCard icon="checkmark-circle-outline" message="Nothing due today. Great work." />
          ) : (
            dueToday.map(t => (
              <TaskRow key={t.id} task={t} onPress={() => router.push({ pathname: '/(tabs)/tasks', params: { id: t.id } })} />
            ))
          )}
        </View>

        {/* Activity */}
        {activity.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Recent activity" icon="pulse-outline" />
            {activity.slice(0, 5).map(a => (
              <View key={a.id} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}>{a.summary}</Text>
                  <Text style={styles.activityTime}>{formatRelative(a.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const color = accent === 'danger' ? Colors.danger : accent === 'warning' ? Colors.warning : accent === 'success' ? Colors.success : accent === 'info' ? Colors.info : Colors.brand.mid;
  return (
    <View style={kpiStyles.card}>
      <Text style={[kpiStyles.value, { color }]}>{value}</Text>
      <Text style={kpiStyles.label}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, icon, color, onPress }: { title: string; icon: string; color?: string; onPress?: () => void }) {
  return (
    <View style={secStyles.row}>
      <Ionicons name={icon as any} size={16} color={color ?? Colors.brand.mid} />
      <Text style={secStyles.title}>{title}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress} style={secStyles.more}>
          <Text style={secStyles.moreText}>See all</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const { bg, text } = severityColor(alert.severity);
  return (
    <View style={[alertStyles.row, { backgroundColor: bg }]}>
      <View style={{ flex: 1 }}>
        <Text style={[alertStyles.title, { color: text }]}>{alert.title}</Text>
        <Text style={alertStyles.desc}>{alert.description}</Text>
      </View>
      <View style={[alertStyles.badge, { backgroundColor: text }]}>
        <Text style={alertStyles.badgeText}>{alert.severity.toLowerCase()}</Text>
      </View>
    </View>
  );
}

function TaskRow({ task, onPress }: { task: Task; onPress: () => void }) {
  const dotColor = priorityColor(task.priority);
  return (
    <TouchableOpacity style={taskStyles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[taskStyles.dot, { backgroundColor: dotColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={taskStyles.title} numberOfLines={1}>{task.title}</Text>
        <Text style={taskStyles.meta}>
          {task.assignee?.name ?? 'Unassigned'}
          {task.dueAt ? '  ·  ' + formatTime(task.dueAt) : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={Colors.text.muted} />
    </TouchableOpacity>
  );
}

function EmptyCard({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={emptyStyles.card}>
      <Ionicons name={icon as any} size={28} color={Colors.brand.light} />
      <Text style={emptyStyles.text}>{message}</Text>
    </View>
  );
}

function LoadingView() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg.base }}>
      <ActivityIndicator color={Colors.brand.mid} size="large" />
    </View>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  header: {
    backgroundColor: Colors.brand.deep, paddingTop: 56, paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerBrand:    { fontSize: 12, color: Colors.brand.gold, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  headerGreeting: { fontSize: 22, color: Colors.text.inverse, fontWeight: '700' },
  orgBadge:       { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  orgBadgeText:   { color: Colors.text.inverse, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  scroll:         { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  kpiRow:         { marginBottom: Spacing.md, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  section:        { marginBottom: Spacing.lg },
  activityRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  activityDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brand.light, marginTop: 5 },
  activityText:   { fontSize: 13, color: Colors.text.secondary, lineHeight: 18 },
  activityTime:   { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
});
const kpiStyles = StyleSheet.create({
  card: { backgroundColor: Colors.brand.pale, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 14, marginRight: 10, minWidth: 90, alignItems: 'center' },
  value: { fontSize: 28, fontWeight: '700' },
  label: { fontSize: 11, color: Colors.text.muted, marginTop: 2, textAlign: 'center' },
});
const secStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text.secondary },
  more: {}, moreText: { fontSize: 12, color: Colors.brand.mid, fontWeight: '600' },
});
const alertStyles = StyleSheet.create({
  row: { borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  title: { fontSize: 13, fontWeight: '700' },
  desc: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },
  badge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: Colors.text.inverse, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});
const taskStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  meta: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },
});
const emptyStyles = StyleSheet.create({
  card: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 10 },
  text: { fontSize: 13, color: Colors.text.muted, textAlign: 'center' },
});
