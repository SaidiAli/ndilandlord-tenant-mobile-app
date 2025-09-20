import { ScrollView, View, Text, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { Card } from '../../components/ui/Card';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { settings, updateSetting } = useSettings();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  const handleEditProfile = () => {
    router.push('/screens/edit-profile');
  };

  const handleChangePassword = () => {
    router.push('/screens/change-password');
  };

  const handleContactSupport = async () => {
    const supportEmail = 'support@ndilandlord.com';
    const subject = 'Support Request - NDI Landlord App';
    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Email Support',
          `Please send an email to ${supportEmail} for support.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Contact Support',
        `Email: ${supportEmail}\nPhone: +256 700 123 456`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleTermsOfService = () => {
    router.push('/screens/terms-of-service');
  };

  const handlePrivacyPolicy = () => {
    router.push('/screens/privacy-policy');
  };

  const handleNavigateToLease = () => {
    router.push('/screens/lease');
  };

  const handleNavigateToProperty = () => {
    router.push('/screens/property');
  };

  const handleNavigateToHelp = () => {
    router.push('/screens/help');
  };

  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-4">
          {/* Header */}
          <Text className="text-2xl font-semibold text-gray-800 mb-6">
            Profile
          </Text>

          {/* User Info Card */}
          <Card className="mb-4">
            <View className="space-y-4 items-center">
              <View className="w-20 h-20 bg-[#2D5A4A] rounded-full items-center justify-center">
                <Text className="text-white font-bold text-xl">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </Text>
              </View>
              
              <View className="space-y-1 items-center">
                <Text className="text-lg font-semibold text-gray-800">
                  {user.firstName} {user.lastName}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {user.email}
                </Text>
                <Text className="text-[#2D5A4A] text-sm font-medium capitalize">
                  {user.role}
                </Text>
              </View>

              <TouchableOpacity
                className="flex-row items-center space-x-2 bg-[#2D5A4A] px-4 py-2 rounded-md active:bg-[#254B3C]"
                onPress={handleEditProfile}
              >
                <MaterialIcons name="edit" size={16} color="white" />
                <Text className="text-white font-medium text-sm">
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* My Account Section */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                My Account
              </Text>

              <TouchableOpacity
                className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100"
                onPress={handleNavigateToLease}
              >
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="description" size={20} color="#6B7280" />
                  <Text className="font-medium text-gray-800">
                    Lease Information
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100"
                onPress={handleNavigateToProperty}
              >
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="home" size={20} color="#6B7280" />
                  <Text className="font-medium text-gray-800">
                    Property Information
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100"
                onPress={handleNavigateToHelp}
              >
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="help-outline" size={20} color="#6B7280" />
                  <Text className="font-medium text-gray-800">
                    Help & Resources
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Account Settings */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Account Settings
              </Text>

              <TouchableOpacity
                className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100"
                onPress={handleEditProfile}
              >
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="person" size={20} color="#6B7280" />
                  <Text className="font-medium text-gray-800">
                    Personal Information
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100"
                onPress={handleChangePassword}
              >
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="lock" size={20} color="#6B7280" />
                  <Text className="font-medium text-gray-800">
                    Change Password
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Preferences */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Preferences
              </Text>

              <View className="flex-row justify-between items-center py-2">
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="notifications" size={20} color="#6B7280" />
                  <View>
                    <Text className="font-medium text-gray-800">
                      Push Notifications
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Receive payment reminders and updates
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.pushNotifications}
                  onValueChange={(value) => updateSetting('pushNotifications', value)}
                  trackColor={{ false: '#E5E7EB', true: '#2D5A4A' }}
                  thumbColor={settings.pushNotifications ? '#ffffff' : '#9CA3AF'}
                />
              </View>

              <View className="border-t border-gray-200" />

              <View className="flex-row justify-between items-center py-2">
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="credit-card" size={20} color="#6B7280" />
                  <View>
                    <Text className="font-medium text-gray-800">
                      Auto-Payment
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Automatically pay rent each month
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.autoPayment}
                  onValueChange={(value) => updateSetting('autoPayment', value)}
                  trackColor={{ false: '#E5E7EB', true: '#2D5A4A' }}
                  thumbColor={settings.autoPayment ? '#ffffff' : '#9CA3AF'}
                />
              </View>
            </View>
          </Card>

          {/* Support */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Support
              </Text>

              <TouchableOpacity
                className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100"
                onPress={handleContactSupport}
              >
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="help" size={20} color="#6B7280" />
                  <Text className="font-medium text-gray-800">
                    Contact Support
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100"
                onPress={handleTermsOfService}
              >
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="description" size={20} color="#6B7280" />
                  <Text className="font-medium text-gray-800">
                    Terms of Service
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100"
                onPress={handlePrivacyPolicy}
              >
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="privacy-tip" size={20} color="#6B7280" />
                  <Text className="font-medium text-gray-800">
                    Privacy Policy
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </Card>

          {/* App Info */}
          <Card className="mb-4">
            <View className="space-y-2 items-center">
              <Text className="text-sm text-gray-500">
                NDI Landlord Tenant App
              </Text>
              <Text className="text-sm text-gray-500">
                Version 1.0.0
              </Text>
            </View>
          </Card>

          {/* Logout */}
          <Card className="mb-6">
            <TouchableOpacity
              className="flex-row justify-center items-center py-3 rounded-md active:bg-red-50"
              onPress={handleLogout}
            >
              <View className="flex-row items-center space-x-2">
                <MaterialIcons name="logout" size={20} color="#EF4444" />
                <Text className="font-medium text-red-500">
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}