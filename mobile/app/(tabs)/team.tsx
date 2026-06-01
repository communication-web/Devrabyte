import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { getTeam } from '@/lib/api';
import { Colors, Spacing, Radius } from '@/lib/theme';

type Member = { id: string; userId: string; role: string; openTaskCount: number; user: { id: string; name: string | null; email: string } };

function initials(name: string | null, email: string) {
  return (name ?? email).split(' ').filter(Boolean).map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
}

function hue(s: string) {
  return [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

export default function TeamScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const res = await getTeam();
    if (res.ok) setMembers(res.data.members);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: Colors.bg.base }}><ActivityIndicator color={Colors.brand.mid} /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Team</Text>
        <Text style={s.sub}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        data={members}
        keyExtractor={m => m.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.mid} />}
        contentContainerStyle={s.list}
        renderItem={({ item: m }) => {
          const h = hue(m.user.name ?? m.user.email);
          const init = initials(m.user.name, m.user.email);
          return (
            <View style={s.row}>
              <View style={[s.avatar, { backgroundColor: `hsl(${h}, 60%, 88%)` }]}>
                <Text style={[s.avatarText, { color: `hsl(${h}, 55%, 30%)` }]}>{init}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{m.user.name ?? '—'}</Text>
                <Text style={s.email}>{m.user.email}</Text>
              </View>
              <View style={s.right}>
                <Text style={s.role}>{m.role.toLowerCase()}</Text>
                <Text style={s.tasks}>{m.openTaskCount} open</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  header: { backgroundColor: Colors.brand.deep, paddingTop: 56, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text.inverse },
  sub: { fontSize: 13, color: Colors.brand.light, marginTop: 2 },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  email: { fontSize: 12, color: Colors.text.muted, marginTop: 1 },
  right: { alignItems: 'flex-end' },
  role: { fontSize: 12, fontWeight: '700', color: Colors.brand.mid, textTransform: 'capitalize' },
  tasks: { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
});
