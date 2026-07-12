import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from 'react-native';
import { useDebts } from '../../lib/DebtsContext';
import { formatCurrency, formatDate } from '../../lib/format';
import { Card } from '../../components/Card';
import { Snowflake } from '../../lib/types';

export default function SnowflakesScreen() {
  const { debts, snowflakes, addSnowflake } = useDebts();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert('Enter an amount', 'How much unexpected cash did you find?');
      return;
    }
    if (debts.length === 0) {
      Alert.alert('Add a debt first', 'Snowflakes need a debt to apply to — add one on the Debts tab.');
      return;
    }
    addSnowflake(parsed, note.trim() || undefined);
    setAmount('');
    setNote('');
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={snowflakes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Snowflake Log</Text>
            <Text style={styles.subtitle}>
              Found some unexpected cash? Log it here and watch your freedom date move up.
            </Text>
            <Card style={styles.formCard}>
              <TextInput
                style={styles.input}
                placeholder="Amount (e.g. 40)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <TextInput
                style={styles.input}
                placeholder="What was it? (optional)"
                value={note}
                onChangeText={setNote}
              />
              <Pressable style={styles.submitButton} onPress={submit}>
                <Text style={styles.submitButtonText}>Log snowflake</Text>
              </Pressable>
            </Card>
          </>
        }
        renderItem={({ item }) => <SnowflakeRow snowflake={item} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No snowflakes logged yet — your first one is waiting.</Text>
        }
      />
    </View>
  );
}

function SnowflakeRow({ snowflake }: { snowflake: Snowflake }) {
  return (
    <Card style={styles.rowCard}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowAmount}>{formatCurrency(snowflake.amount)}</Text>
        <Text style={styles.rowDate}>{formatDate(new Date(snowflake.dateISO))}</Text>
      </View>
      {snowflake.note ? <Text style={styles.rowNote}>{snowflake.note}</Text> : null}
      <Text style={styles.rowDaysSaved}>
        {snowflake.daysSaved > 0
          ? `Saved ${snowflake.daysSaved} days`
          : 'Applied to your balance'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8F6' },
  content: { padding: 20, paddingTop: 60, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#12261B' },
  subtitle: { fontSize: 14, color: '#5B6B63', marginTop: 4, marginBottom: 16 },
  formCard: { gap: 10, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  submitButton: { backgroundColor: '#1B5E20', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600' },
  rowCard: { marginBottom: 10 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  rowAmount: { fontSize: 18, fontWeight: '700', color: '#12261B' },
  rowDate: { fontSize: 12, color: '#5B6B63' },
  rowNote: { fontSize: 13, color: '#5B6B63', marginTop: 4 },
  rowDaysSaved: { fontSize: 13, color: '#1B5E20', fontWeight: '600', marginTop: 6 },
  emptyText: { fontSize: 14, color: '#5B6B63', textAlign: 'center', marginTop: 20 },
});
