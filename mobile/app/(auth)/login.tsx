import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Colors, Spacing, Radius, Typography } from '@/lib/theme';

const BRAND = process.env.EXPO_PUBLIC_BRAND_NAME ?? 'House of Jade';
const POWERED = process.env.EXPO_PUBLIC_POWERED_BY ?? 'Devrabyte';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Invalid credentials. Please try again.');
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Brand header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoLetter}>H</Text>
            </View>
            <Text style={styles.brandName}>{BRAND}</Text>
            <Text style={styles.tagline}>Operations & Client Management</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSub}>Access your workspace below.</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor={Colors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.muted}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.poweredBy}>Powered by {POWERED}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.brand.deep },
  keyboardView: { flex: 1 },
  scroll:       { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl },
  header:       { alignItems: 'center', marginBottom: Spacing.xl },
  logoWrap: {
    width: 72, height: 72, borderRadius: Radius.lg,
    backgroundColor: Colors.brand.gold,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoLetter: { fontFamily: Typography.display, fontSize: 36, color: Colors.brand.deep, fontWeight: '700' },
  brandName:  { fontFamily: Typography.display, fontSize: 28, color: Colors.text.inverse, letterSpacing: 1 },
  tagline:    { fontSize: 13, color: Colors.brand.light, marginTop: 4 },
  card: {
    backgroundColor: Colors.bg.base, borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  cardTitle:  { fontFamily: Typography.display, fontSize: 26, color: Colors.brand.deep, marginBottom: 4 },
  cardSub:    { fontSize: 14, color: Colors.text.muted, marginBottom: Spacing.lg },
  fieldWrap:  { marginBottom: Spacing.md },
  label:      { fontSize: 13, fontWeight: '600', color: Colors.text.secondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.bg.input, paddingHorizontal: Spacing.md,
    paddingVertical: 12, fontSize: 15, color: Colors.text.primary,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { fontSize: 13, color: Colors.danger },
  button: {
    backgroundColor: Colors.brand.mid, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: Colors.text.inverse, fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  poweredBy:      { textAlign: 'center', marginTop: Spacing.xl, fontSize: 12, color: Colors.brand.light, opacity: 0.7 },
});
