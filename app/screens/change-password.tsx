import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';

export default function ChangePasswordScreen() {
  const { changePassword } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      Alert.alert(
        'Success', 
        'Password changed successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak' };
    if (password.length < 8) return { strength: 2, label: 'Fair' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 4, label: 'Strong' };
    }
    return { strength: 3, label: 'Good' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              onPress={handleCancel}
              className="flex-row items-center space-x-2"
            >
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
              <Text className="text-lg font-medium text-gray-700">Back</Text>
            </TouchableOpacity>
            
            <Text className="text-xl font-semibold text-gray-800">
              Change Password
            </Text>
            
            <View className="w-20" />
          </View>

          {/* Security Notice */}
          <Card className="mb-4">
            <View className="flex-row items-start space-x-3">
              <MaterialIcons name="security" size={24} color="#2D5A4A" />
              <View className="flex-1">
                <Text className="font-semibold text-gray-800 mb-1">
                  Security Notice
                </Text>
                <Text className="text-sm text-gray-600">
                  Choose a strong password that you haven't used before. 
                  Your password should be at least 6 characters long.
                </Text>
              </View>
            </View>
          </Card>

          {/* Form Fields */}
          <Card className="mb-4">
            <View className="space-y-4">
              {/* Current Password */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </Text>
                <View className="relative">
                  <TextInput
                    value={formData.currentPassword}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, currentPassword: text }));
                      if (errors.currentPassword) {
                        setErrors(prev => ({ ...prev, currentPassword: '' }));
                      }
                    }}
                    className={`border rounded-md px-3 py-3 pr-12 bg-white ${
                      errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your current password"
                    secureTextEntry={!showPasswords.current}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-3"
                  >
                    <MaterialIcons 
                      name={showPasswords.current ? "visibility-off" : "visibility"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.currentPassword && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.currentPassword}
                  </Text>
                )}
              </View>

              {/* New Password */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  New Password
                </Text>
                <View className="relative">
                  <TextInput
                    value={formData.newPassword}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, newPassword: text }));
                      if (errors.newPassword) {
                        setErrors(prev => ({ ...prev, newPassword: '' }));
                      }
                    }}
                    className={`border rounded-md px-3 py-3 pr-12 bg-white ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your new password"
                    secureTextEntry={!showPasswords.new}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-3"
                  >
                    <MaterialIcons 
                      name={showPasswords.new ? "visibility-off" : "visibility"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Password Strength Indicator */}
                {formData.newPassword.length > 0 && (
                  <View className="mt-2">
                    <View className="flex-row items-center space-x-2 mb-1">
                      <Text className="text-xs text-gray-600">Password strength:</Text>
                      <Text className={`text-xs font-medium ${
                        passwordStrength.strength === 1 ? 'text-red-500' :
                        passwordStrength.strength === 2 ? 'text-yellow-500' :
                        passwordStrength.strength === 3 ? 'text-blue-500' :
                        'text-green-500'
                      }`}>
                        {passwordStrength.label}
                      </Text>
                    </View>
                    <View className="flex-row space-x-1">
                      {[1, 2, 3, 4].map((level) => (
                        <View
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= passwordStrength.strength
                              ? level === 1 ? 'bg-red-500' :
                                level === 2 ? 'bg-yellow-500' :
                                level === 3 ? 'bg-blue-500' :
                                'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </View>
                  </View>
                )}
                
                {errors.newPassword && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.newPassword}
                  </Text>
                )}
              </View>

              {/* Confirm Password */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </Text>
                <View className="relative">
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, confirmPassword: text }));
                      if (errors.confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    className={`border rounded-md px-3 py-3 pr-12 bg-white ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your new password"
                    secureTextEntry={!showPasswords.confirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-3"
                  >
                    <MaterialIcons 
                      name={showPasswords.confirm ? "visibility-off" : "visibility"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>
            </View>
          </Card>

          {/* Password Tips */}
          <Card className="mb-6">
            <Text className="font-semibold text-gray-800 mb-2">
              Password Tips
            </Text>
            <View className="space-y-1">
              <Text className="text-sm text-gray-600">
                • Use at least 6 characters (8+ recommended)
              </Text>
              <Text className="text-sm text-gray-600">
                • Include uppercase and lowercase letters
              </Text>
              <Text className="text-sm text-gray-600">
                • Add numbers and special characters
              </Text>
              <Text className="text-sm text-gray-600">
                • Avoid common words or personal information
              </Text>
            </View>
          </Card>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={isLoading}
              className={`py-4 rounded-md ${
                isLoading ? 'bg-gray-300' : 'bg-[#2D5A4A]'
              }`}
            >
              <Text className="text-white font-semibold text-center text-lg">
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCancel}
              className="py-4 rounded-md border border-gray-300 bg-white"
            >
              <Text className="text-gray-700 font-semibold text-center text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}