import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiQuickParse } from '@/lib/api';
import { Colors, Spacing, Radius } from '@/lib/theme';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  intent?: string;
};

const QUICK_PROMPTS = [
  "What's pending today?",
  "Show me overdue tasks",
  "What's blocked?",
  "Summarize the week",
];

export default function AIScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: "Hi — I'm your operations assistant. You can ask me to create tasks, check what's pending, show overdue or blocked items, or summarise the week.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Execute the intent (create/update) or just parse for read queries
    const isRead = /what|show|list|overdue|pending|blocked|summar/i.test(trimmed);
    const res = await aiQuickParse(trimmed, !isRead);

    const reply = res.ok ? res.data.reply : "I had trouble with that. Please try again.";
    const intent = res.ok && res.data.intent ? (res.data.intent as any).intent : undefined;

    setMessages(prev => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: 'assistant', text: reply, intent },
    ]);
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [loading]);

  function renderMsg({ item }: { item: Message }) {
    const isUser = item.role === 'user';
    return (
      <View style={[ms.row, isUser ? ms.rowUser : ms.rowAssistant]}>
        {!isUser ? (
          <View style={ms.avatar}>
            <Ionicons name="sparkles" size={14} color={Colors.brand.gold} />
          </View>
        ) : null}
        <View style={[ms.bubble, isUser ? ms.bubbleUser : ms.bubbleAssistant]}>
          {item.intent && !isUser ? (
            <Text style={ms.intentLabel}>{item.intent.replace(/_/g, ' ')}</Text>
          ) : null}
          <Text style={[ms.bubbleText, isUser ? ms.bubbleTextUser : ms.bubbleTextAssistant]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="sparkles" size={18} color={Colors.brand.gold} />
          <Text style={s.headerTitle}>AI Assistant</Text>
        </View>
        <Text style={s.headerSub}>Powered by Devrabyte</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMsg}
        contentContainerStyle={s.list}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Quick prompts */}
      {messages.length <= 1 ? (
        <View style={s.quickWrap}>
          <Text style={s.quickLabel}>Try asking:</Text>
          <View style={s.quickRow}>
            {QUICK_PROMPTS.map(q => (
              <TouchableOpacity key={q} style={s.quickChip} onPress={() => send(q)}>
                <Text style={s.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={s.typingRow}>
          <ActivityIndicator size="small" color={Colors.brand.mid} />
          <Text style={s.typingText}>Thinking…</Text>
        </View>
      ) : null}

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything about your operations…"
          placeholderTextColor={Colors.text.muted}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={18} color={Colors.text.inverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  header: { backgroundColor: Colors.brand.deep, paddingTop: 56, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text.inverse },
  headerSub: { fontSize: 11, color: Colors.brand.light },
  list: { padding: Spacing.lg, paddingBottom: 8, flexGrow: 1 },
  quickWrap: { paddingHorizontal: Spacing.lg, paddingBottom: 10 },
  quickLabel: { fontSize: 12, color: Colors.text.muted, marginBottom: 8 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { backgroundColor: Colors.brand.pale, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 7 },
  quickChipText: { fontSize: 13, color: Colors.brand.mid, fontWeight: '600' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.lg, paddingBottom: 6 },
  typingText: { fontSize: 12, color: Colors.text.muted },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.bg.input, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text.primary, maxHeight: 100 },
  sendBtn: { backgroundColor: Colors.brand.mid, borderRadius: Radius.md, width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
const ms = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  rowUser: { justifyContent: 'flex-end' },
  rowAssistant: { justifyContent: 'flex-start', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.brand.pale, justifyContent: 'center', alignItems: 'center' },
  bubble: { maxWidth: '80%', borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: Colors.brand.mid, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: Colors.bg.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: Colors.text.inverse },
  bubbleTextAssistant: { color: Colors.text.secondary },
  intentLabel: { fontSize: 10, color: Colors.brand.mid, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
});
