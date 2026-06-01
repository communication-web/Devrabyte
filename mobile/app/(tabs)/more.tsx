import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { generateDailyReport, runBottleneckScan } from '@/lib/api';
import { Colors, Spacing, Radius, Shadow } from '@/lib/theme';

const BRAND = process.env.EXPO_PUBLIC_BRAND_NAME ?? 'House of Jade';
const POWERED = process.env.EXPO_PUBLIC_POWERED_BY ?? 'Devrabyte';

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dailyLoading, setDailyLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);

  async function handleDailyReport() {
    setDailyLoading(true);
    setSummary(null);
    const res = await generateDailyReport();
    if (res.ok) setSummary(res.data.summary);
    else setSummary('Could not generate summary. Please try again.');
    setDailyLoading(false);
  }

  async function handleScan() {
    setScanLoading(true);
    setScanResult(null);
    const res = await runBottleneckScan();
    if (res.ok) {
      const count = res.data.findings.length;
      setScanResult(res.data.narrative ?? (count === 0 ? 'No bottlenecks detected.' : `${count} issue${count !== 1 ? 's' : ''} found. Check the dashboard.`));
    } else {
      setScanResult('Scan failed. Please try again.');
    }
    setScanLoading(false);
  }

  function confirmLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Profile card */}
      <View style={s.profileCard}>
        <View style={s.profileAvatar}>
          <Text style={s.profileInitials}>
            {(user?.name ?? user?.email ?? 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={s.profileName}>{user?.name ?? 'Team member'}</Text>
          <Text style={s.profileEmail}>{user?.email}</Text>
          <Text style={s.profileOrg}>{user?.org?.name ?? BRAND} · {user?.org?.role?.toLowerCase()}</Text>
        </View>
      </View>

      {/* AI actions */}
      <Section title="AI tools">
        <ActionCard
          icon="document-text-outline"
          title="Generate daily summary"
          subtitle="AI-written operations brief for today"
          loading={dailyLoading}
          onPress={handleDailyReport}
        />
        {summary ? (
          <View style={s.resultBox}>
            <Text style={s.resultText}>{summary}</Text>
          </View>
        ) : null}

        <ActionCard
          icon="warning-outline"
          title="Run bottleneck scan"
          subtitle="Detect operational issues in the last 14 days"
          loading={scanLoading}
          onPress={handleScan}
          color={Colors.warning}
        />
        {scanResult ? (
          <View style={s.resultBox}>
            <Text style={s.resultText}>{scanResult}</Text>
          </View>
        ) : null}
      </Section>

      {/* Links */}
      <Section title="Workspace">
        <MenuRow icon="bar-chart-outline" label="Reports" onPress={() => {}} />
        <MenuRow icon="alert-circle-outline" label="Bottleneck alerts" onPress={() => {}} />
        <MenuRow icon="logo-whatsapp" label="WhatsApp integration" onPress={() => {}} color="#25D366" />
      </Section>

      <Section title="Account">
        <MenuRow icon="settings-outline" label="Settings" onPress={() => {}} />
        <MenuRow icon="card-outline" label="Billing & plan" onPress={() => {}} />
        <MenuRow icon="log-out-outline" label="Sign out" onPress={confirmLogout} color={Colors.danger} />
      </Section>

      <View style={s.footer}>
        <Text style={s.footerBrand}>{BRAND}</Text>
        <Text style={s.footerPowered}>Powered by {POWERED}</Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={ss.wrap}>
      <Text style={ss.title}>{title}</Text>
      <View style={ss.card}>{children}</View>
    </View>
  );
}

function ActionCard({ icon, title, subtitle, onPress, loading, color }: { icon: string; title: string; subtitle: string; onPress: () => void; loading?: boolean; color?: string }) {
  return (
    <TouchableOpacity style={ac.row} onPress={onPress} disabled={loading} activeOpacity={0.75}>
      <View style={[ac.icon, { backgroundColor: (color ?? Colors.brand.mid) + '20' }]}>
        {loading ? <ActivityIndicator size="small" color={color ?? Colors.brand.mid} /> : <Ionicons name={icon as any} size={20} color={color ?? Colors.brand.mid} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ac.title}>{title}</Text>
        <Text style={ac.sub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
    </TouchableOpacity>
  );
}

function MenuRow({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity style={mr.row} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={color ?? Colors.text.secondary} />
      <Text style={[mr.label, color ? { color } : null]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4FF' },
  content: { paddingBottom: 80 },
  profileCard: {
    backgroundColor: Colors.brand.deep, paddingTop: 56, paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg, flexDirection: 'row', gap: 14, alignItems: 'center',
  },
  profileAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.brand.gold, justifyContent: 'center', alignItems: 'center',
  },
  profileInitials: { fontSize: 20, fontWeight: '800', color: Colors.brand.deep },
  profileName: { fontSize: 16, fontWeight: '700', color: Colors.text.inverse },
  profileEmail: { fontSize: 12, color: Colors.brand.light, marginTop: 1 },
  profileOrg: { fontSize: 12, color: Colors.brand.gold, marginTop: 2, textTransform: 'capitalize' },
  resultBox: { backgroundColor: Colors.brand.pale, borderRadius: Radius.md, padding: Spacing.md, margin: Spacing.sm, marginTop: 0 },
  resultText: { fontSize: 13, color: Colors.text.secondary, lineHeight: 20 },
  footer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 4 },
  footerBrand: { fontSize: 14, fontWeight: '700', color: Colors.brand.deep },
  footerPowered: { fontSize: 11, color: Colors.text.muted },
});
const ss = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  title: { fontSize: 12, fontWeight: '700', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  card: { backgroundColor: Colors.bg.base, borderRadius: Radius.lg, ...Shadow.sm, overflow: 'hidden' },
});
const ac = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  icon: { width: 40, height: 40, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  sub: { fontSize: 12, color: Colors.text.muted, marginTop: 1 },
});
const mr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { flex: 1, fontSize: 14, color: Colors.text.secondary, fontWeight: '500' },
});
