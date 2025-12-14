import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <SafeAreaWrapper>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
    </SafeAreaWrapper>
  );
}