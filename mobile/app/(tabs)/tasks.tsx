import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTasks, updateTask, type Task, type TaskStatus } from '@/lib/api';
import { Colors, Spacing, Radius, priorityColor, statusColor } from '@/lib/theme';

const SCOPES = [
  { key: 'all',      label: 'All' },
  { key: 'mine',     label: 'Mine' },
  { key: 'due_today',label: 'Due today' },
  { key: 'overdue',  label: 'Overdue' },
  { key: 'blocked',  label: 'Blocked' },
] as const;

const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED'];

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scope, setScope] = useState<string>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Task | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const params: any = {};
    if (scope !== 'all') params.scope = scope;
    if (q.trim()) params.q = q.trim();
    const res = await getTasks(params);
    if (res.ok) setTasks(res.data.tasks);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, [scope]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [scope]);

  async function changeStatus(task: Task, status: TaskStatus) {
    await updateTask(task.id, { status });
    setSelected(null);
    load(true);
  }

  function renderTask({ item: t }: { item: Task }) {
    const dotColor = priorityColor(t.priority);
    const { bg, text } = statusColor(t.status);
    return (
      <TouchableOpacity style={s.taskRow} onPress={() => setSelected(t)} activeOpacity={0.75}>
        <View style={[s.priorityDot, { backgroundColor: dotColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={s.taskTitle} numberOfLines={2}>{t.title}</Text>
          <Text style={s.taskMeta}>
            {t.assignee?.name ?? 'Unassigned'}
            {t.workflow ? '  ·  ' + t.workflow.name : ''}
            {t.dueAt ? '  ·  ' + formatRelative(t.dueAt) : ''}
          </Text>
        </View>
        <View style={[s.badge, { backgroundColor: bg }]}>
          <Text style={[s.badgeText, { color: text }]}>
            {t.status.replace('_', ' ').toLowerCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Tasks</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.text.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search tasks"
          placeholderTextColor={Colors.text.muted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => load()}
          returnKeyType="search"
        />
      </View>

      {/* Scope pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scopeRow}>
        {SCOPES.map(sc => (
          <TouchableOpacity
            key={sc.key}
            onPress={() => setScope(sc.key)}
            style={[s.scopePill, scope === sc.key && s.scopePillActive]}
          >
            <Text style={[s.scopeLabel, scope === sc.key && s.scopeLabelActive]}>{sc.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={Colors.brand.mid} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={t => t.id}
          renderItem={renderTask}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.mid} />}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={<EmptyState scope={scope} />}
        />
      )}

      {/* Task detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected ? (
          <TaskDetailModal task={selected} onClose={() => setSelected(null)} onStatusChange={changeStatus} />
        ) : null}
      </Modal>
    </View>
  );
}

function TaskDetailModal({ task, onClose, onStatusChange }: { task: Task; onClose: () => void; onStatusChange: (t: Task, s: TaskStatus) => void }) {
  const { bg, text } = statusColor(task.status);
  return (
    <View style={m.container}>
      <View style={m.handle} />
      <ScrollView contentContainerStyle={m.scroll}>
        <TouchableOpacity onPress={onClose} style={m.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.text.muted} />
        </TouchableOpacity>
        <View style={m.metaRow}>
          <PriorityBadge priority={task.priority} />
          {task.workflow ? <Text style={m.workflowLabel}>{task.workflow.name}</Text> : null}
        </View>
        <Text style={m.title}>{task.title}</Text>
        {task.description ? <Text style={m.desc}>{task.description}</Text> : null}

        <Text style={m.sectionLabel}>Update status</Text>
        <View style={m.statusGrid}>
          {STATUSES.map(st => {
            const { bg: sbg, text: stxt } = statusColor(st);
            return (
              <TouchableOpacity
                key={st}
                onPress={() => onStatusChange(task, st)}
                style={[m.statusBtn, { backgroundColor: task.status === st ? sbg : Colors.bg.surface, borderColor: task.status === st ? stxt : Colors.border }]}
              >
                <Text style={[m.statusBtnText, { color: task.status === st ? stxt : Colors.text.muted }]}>
                  {st.replace('_', ' ').toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={m.infoGrid}>
          <InfoRow label="Assignee" value={task.assignee?.name ?? 'Unassigned'} />
          <InfoRow label="Due" value={task.dueAt ? new Date(task.dueAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'} />
          {task.stage ? <InfoRow label="Stage" value={task.stage.name} /> : null}
          <InfoRow label="Priority" value={task.priority.toLowerCase()} />
        </View>
      </ScrollView>
    </View>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = priorityColor(priority);
  return (
    <View style={{ backgroundColor: Colors.bg.surface, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: color }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color, textTransform: 'uppercase' }}>{priority.toLowerCase()}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: Colors.text.primary, fontWeight: '500', textTransform: 'capitalize' }}>{value}</Text>
    </View>
  );
}

function EmptyState({ scope }: { scope: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
      <Ionicons name="checkbox-outline" size={40} color={Colors.brand.light} />
      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text.secondary }}>No tasks</Text>
      <Text style={{ fontSize: 13, color: Colors.text.muted }}>
        {scope === 'overdue' ? 'No overdue tasks — great.' : scope === 'blocked' ? 'Nothing blocked.' : 'Nothing here.'}
      </Text>
    </View>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const mins = Math.floor(-diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `in ${hrs}h` : `in ${Math.floor(hrs / 24)}d`;
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 48 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  header: { backgroundColor: Colors.brand.deep, paddingTop: 56, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.text.inverse },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginVertical: 10, backgroundColor: Colors.bg.input, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text.primary },
  scopeRow: { paddingHorizontal: Spacing.lg, marginBottom: 10 },
  scopePill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  scopePillActive: { backgroundColor: Colors.brand.mid, borderColor: Colors.brand.mid },
  scopeLabel: { fontSize: 13, color: Colors.text.muted, fontWeight: '500' },
  scopeLabelActive: { color: Colors.text.inverse, fontWeight: '700' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.primary, lineHeight: 20 },
  taskMeta: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },
  badge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12 },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  workflowLabel: { fontSize: 12, color: Colors.brand.mid, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text.primary, lineHeight: 30, marginBottom: 10 },
  desc: { fontSize: 14, color: Colors.text.muted, lineHeight: 22, marginBottom: Spacing.lg },
  sectionLabel: { fontSize: 12, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700', marginBottom: 10, marginTop: Spacing.md },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
  statusBtn: { borderWidth: 1.5, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  statusBtnText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  infoGrid: { marginTop: Spacing.md },
});
