import React from 'react';
import { View, Text, Switch, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useDebts } from '../lib/DebtsContext';
import { notificationsSupported } from '../lib/notifications';
import { BADGE_CATALOG } from '../lib/badges';
import { Card } from '../components/Card';

const REMINDER_HOURS = [8, 12, 17, 19, 21];

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

export default function SettingsScreen() {
  const { settings, streak, badges, setNotificationsEnabled, setReminderHour } = useDebts();

  const onToggleNotifications = async (value: boolean) => {
    const granted = await setNotificationsEnabled(value);
    if (value && !granted) {
      Alert.alert(
        'Notifications blocked',
        'Enable notifications for DebtPay in your device settings to get daily reminders.'
      );
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.cardTitle}>Daily reminders</Text>
        {notificationsSupported ? (
          <>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Remind me to log progress</Text>
              <Switch value={settings.notificationsEnabled} onValueChange={onToggleNotifications} />
            </View>
            {settings.notificationsEnabled && (
              <View style={styles.hourRow}>
                {REMINDER_HOURS.map((hour) => (
                  <Pressable
                    key={hour}
                    style={[styles.hourChip, settings.reminderHour === hour && styles.hourChipActive]}
                    onPress={() => setReminderHour(hour)}
                  >
                    <Text
                      style={[
                        styles.hourChipText,
                        settings.reminderHour === hour && styles.hourChipTextActive,
                      ]}
                    >
                      {formatHour(hour)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>Reminders are available on iOS and Android.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Streak</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Current streak</Text>
          <Text style={styles.rowValue}>{streak.currentStreak} days</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Longest streak</Text>
          <Text style={styles.rowValue}>{streak.longestStreak} days</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Badges</Text>
        {BADGE_CATALOG.map((badge) => {
          const earned = badges.includes(badge.id);
          return (
            <View key={badge.id} style={styles.badgeRow}>
              <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>
                {earned ? '🏅' : '🔒'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.badgeTitle, !earned && styles.badgeLocked]}>{badge.title}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8F6' },
  content: { padding: 20, gap: 16 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#12261B', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { fontSize: 14, color: '#5B6B63', flex: 1, marginRight: 8 },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#12261B' },
  emptyText: { fontSize: 14, color: '#5B6B63' },
  hourRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  hourChip: {
    borderWidth: 1,
    borderColor: '#DCE5E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hourChipActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  hourChipText: { fontSize: 13, color: '#12261B' },
  hourChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  badgeIcon: { fontSize: 22 },
  badgeIconLocked: { opacity: 0.4 },
  badgeTitle: { fontSize: 14, fontWeight: '600', color: '#12261B' },
  badgeLocked: { color: '#9AA5A0' },
  badgeDescription: { fontSize: 12, color: '#5B6B63' },
});
