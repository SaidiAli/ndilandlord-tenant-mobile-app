import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaWrapper>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            borderTopColor: Colors[colorScheme ?? 'light'].border,
            paddingBottom: 5,
            height: 85,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 5,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="dashboard" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            title: 'Payments',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="payment" size={size || 24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size || 24} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaWrapper>
  );
}
