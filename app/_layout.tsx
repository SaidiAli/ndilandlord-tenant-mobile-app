import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/hooks/useAuth';
import { SettingsProvider } from '@/hooks/useSettings';
import { LeaseProvider } from '@/hooks/LeaseContext';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://e268093b0b645c3bc79a5f4abd022243@o4510142309203968.ingest.de.sentry.io/4510142310383696',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default Sentry.wrap(function RootLayout() {
  const colorScheme = useColorScheme();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <GluestackUIProvider mode="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SettingsProvider>
            <LeaseProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="screens/lease"
                    options={{
                      headerShown: true,
                      title: 'Lease Information',
                      headerStyle: { backgroundColor: '#2D5A4A' },
                      headerTintColor: 'white',
                      headerTitleStyle: { fontWeight: 'bold' }
                    }}
                  />
                  <Stack.Screen
                    name="screens/property"
                    options={{
                      headerShown: true,
                      title: 'Property Information',
                      headerStyle: { backgroundColor: '#2D5A4A' },
                      headerTintColor: 'white',
                      headerTitleStyle: { fontWeight: 'bold' }
                    }}
                  />
                  <Stack.Screen
                    name="screens/help"
                    options={{
                      headerShown: true,
                      title: 'Help & Resources',
                      headerStyle: { backgroundColor: '#2D5A4A' },
                      headerTintColor: 'white',
                      headerTitleStyle: { fontWeight: 'bold' }
                    }}
                  />
                  <Stack.Screen
                    name="screens/edit-profile"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="screens/change-password"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="screens/terms-of-service"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="screens/privacy-policy"
                    options={{ headerShown: false }}
                  />
                </Stack>
                <StatusBar style="light" backgroundColor="#2D5A4A" />
              </ThemeProvider>
            </LeaseProvider>
          </SettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GluestackUIProvider>
  );
});