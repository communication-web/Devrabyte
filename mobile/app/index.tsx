import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/lib/theme';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.brand.deep }}>
        <ActivityIndicator color={Colors.brand.gold} size="large" />
      </View>
    );
  }

  return user ? <Redirect href="/(tabs)/dashboard" /> : <Redirect href="/(auth)/login" />;
}
