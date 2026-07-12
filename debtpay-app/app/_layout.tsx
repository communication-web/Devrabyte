import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DebtsProvider } from '../lib/DebtsContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DebtsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: true, title: 'Settings' }} />
        </Stack>
      </DebtsProvider>
    </SafeAreaProvider>
  );
}
