import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDebts } from '../../lib/DebtsContext';
import { formatCurrency } from '../../lib/format';
import { Card } from '../../components/Card';
import { Debt } from '../../lib/types';

export default function DebtsScreen() {
  const { debts, addDebt, logPayment, deleteDebt } = useDebts();
  const [showForm, setShowForm] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Debts</Text>

      {debts.map((debt) => (
        <DebtCard
          key={debt.id}
          debt={debt}
          onLogPayment={(amount) => logPayment(debt.id, amount)}
          onDelete={() => {
            Alert.alert('Delete debt', `Remove "${debt.name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteDebt(debt.id) },
            ]);
          }}
        />
      ))}

      {showForm ? (
        <AddDebtForm
          onCancel={() => setShowForm(false)}
          onSubmit={(input) => {
            addDebt(input);
            setShowForm(false);
          }}
        />
      ) : (
        <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Add a debt</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function DebtCard({
  debt,
  onLogPayment,
  onDelete,
}: {
  debt: Debt;
  onLogPayment: (amount: number) => void;
  onDelete: () => void;
}) {
  const [paymentInput, setPaymentInput] = useState('');

  return (
    <Card style={styles.debtCard}>
      <View style={styles.debtHeader}>
        <Text style={styles.debtName}>{debt.name}</Text>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Text style={styles.deleteText}>Remove</Text>
        </Pressable>
      </View>
      <Text style={styles.debtBalance}>{formatCurrency(debt.currentBalance)}</Text>
      <Text style={styles.debtMeta}>
        {debt.apr}% APR · {formatCurrency(debt.minPayment)}/mo minimum
      </Text>

      <View style={styles.paymentRow}>
        <TextInput
          style={styles.paymentInput}
          placeholder="Log a payment"
          keyboardType="decimal-pad"
          value={paymentInput}
          onChangeText={setPaymentInput}
        />
        <Pressable
          style={styles.paymentButton}
          onPress={() => {
            const amount = parseFloat(paymentInput);
            if (!amount || amount <= 0) return;
            onLogPayment(amount);
            setPaymentInput('');
          }}
        >
          <Text style={styles.paymentButtonText}>Log</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function AddDebtForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: { name: string; balance: number; apr: number; minPayment: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [apr, setApr] = useState('');
  const [minPayment, setMinPayment] = useState('');

  const submit = () => {
    const parsedBalance = parseFloat(balance);
    const parsedApr = parseFloat(apr);
    const parsedMinPayment = parseFloat(minPayment);
    if (!name.trim() || !parsedBalance || parsedBalance <= 0) {
      Alert.alert('Missing info', 'Enter a name and a balance greater than 0.');
      return;
    }
    onSubmit({
      name: name.trim(),
      balance: parsedBalance,
      apr: Number.isFinite(parsedApr) ? parsedApr : 0,
      minPayment: Number.isFinite(parsedMinPayment) ? parsedMinPayment : 0,
    });
  };

  return (
    <Card>
      <Text style={styles.formTitle}>New debt</Text>
      <TextInput style={styles.input} placeholder="Name (e.g. Visa card)" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Balance"
        keyboardType="decimal-pad"
        value={balance}
        onChangeText={setBalance}
      />
      <TextInput
        style={styles.input}
        placeholder="APR % (e.g. 24.99)"
        keyboardType="decimal-pad"
        value={apr}
        onChangeText={setApr}
      />
      <TextInput
        style={styles.input}
        placeholder="Minimum monthly payment"
        keyboardType="decimal-pad"
        value={minPayment}
        onChangeText={setMinPayment}
      />
      <View style={styles.formButtons}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.submitButton} onPress={submit}>
          <Text style={styles.submitButtonText}>Save</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8F6' },
  content: { padding: 20, paddingTop: 60, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#12261B' },
  debtCard: { gap: 4 },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  debtName: { fontSize: 16, fontWeight: '600', color: '#12261B' },
  deleteText: { fontSize: 13, color: '#B3261E' },
  debtBalance: { fontSize: 24, fontWeight: '700', color: '#1B5E20', marginTop: 4 },
  debtMeta: { fontSize: 13, color: '#5B6B63' },
  paymentRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  paymentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  paymentButton: {
    backgroundColor: '#1B5E20',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  paymentButtonText: { color: '#FFFFFF', fontWeight: '600' },
  addButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9AA5A0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: { color: '#1B5E20', fontWeight: '600' },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#12261B', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  formButtons: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelButtonText: { color: '#5B6B63', fontWeight: '600' },
  submitButton: { backgroundColor: '#1B5E20', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  submitButtonText: { color: '#FFFFFF', fontWeight: '600' },
});
