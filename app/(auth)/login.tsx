import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { debugAPI, getNetworkInfo } from '../../lib/debug';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const { login } = useAuth();

  const handleDebugConnection = async () => {
    setIsDebugging(true);
    try {
      const networkInfo = getNetworkInfo();
      console.log('Network info:', networkInfo);
      
      const connectionTest = await debugAPI.testConnection();
      const authTest = await debugAPI.testAuthEndpoint();
      
      Alert.alert(
        'Debug Information',
        `API URL: ${networkInfo.apiUrl}\n\nConnection Test: ${connectionTest.message}\n\nAuth Test: ${authTest.message}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Debug Error', error.message);
    } finally {
      setIsDebugging(false);
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      console.log('Form submission for username:', data.username);
      await login(data.username, data.password);
      console.log('Login successful!');
    } catch (err: any) {
      console.error('Login form error:', err);
      
      let errorMessage = 'Login failed';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      Alert.alert('Login Error', errorMessage, [
        { text: 'OK', style: 'default' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 bg-gray-50">
        <View className="flex-1 px-6 justify-center min-h-screen">
          <View className="items-center">
            {/* Logo/Brand Section */}
            <View className="mb-8 items-center">
              <View className="w-16 h-16 bg-[#2D5A4A] rounded-full items-center justify-center mb-4">
                <MaterialIcons name="home" size={32} color="white" />
              </View>
              <Text className="text-3xl font-bold text-[#2D5A4A] text-center">
                NDI Landlord
              </Text>
              <Text className="text-base text-gray-600 text-center mt-2">
                Tenant Portal
              </Text>
            </View>

            {/* Login Form */}
            <View className="w-full max-w-sm">
              <View className="space-y-4">
                <View>
                  <Text className="text-2xl font-semibold text-gray-800 text-center">
                    Welcome Back
                  </Text>
                  <Text className="text-sm text-gray-600 text-center mt-2">
                    Sign in to access your tenant portal
                  </Text>
                </View>

                {/* Username Field */}
                <View className="w-full">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Username
                  </Text>
                  <Controller
                    control={control}
                    name="username"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <View className="absolute left-3 top-3 z-10">
                          <MaterialIcons name="person" size={20} color="#6B7280" />
                        </View>
                        <TextInput
                          className={`w-full pl-12 pr-4 py-3 border rounded-md bg-white ${
                            errors.username ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your username"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          autoCapitalize="none"
                        />
                      </View>
                    )}
                  />
                  {errors.username && (
                    <Text className="text-red-500 text-sm mt-1">
                      {errors.username.message}
                    </Text>
                  )}
                </View>

                {/* Password Field */}
                <View className="w-full">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Password
                  </Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <View className="absolute left-3 top-3 z-10">
                          <MaterialIcons name="lock" size={20} color="#6B7280" />
                        </View>
                        <TextInput
                          className={`w-full pl-12 pr-4 py-3 border rounded-md bg-white ${
                            errors.password ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your password"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          secureTextEntry
                        />
                      </View>
                    )}
                  />
                  {errors.password && (
                    <Text className="text-red-500 text-sm mt-1">
                      {errors.password.message}
                    </Text>
                  )}
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className={`w-full py-3 rounded-md mt-6 ${
                    isLoading ? 'bg-gray-400' : 'bg-[#2D5A4A] active:bg-[#254B3C]'
                  }`}
                >
                  <View className="flex-row justify-center items-center">
                    {isLoading && (
                      <ActivityIndicator color="white" size="small" className="mr-2" />
                    )}
                    <Text className="text-white font-medium text-center">
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <Text className="text-sm text-gray-500 text-center mt-6">
                  Need help? Contact your property manager
                </Text>

                {/* Debug Button - Remove in production */}
                <TouchableOpacity
                  onPress={handleDebugConnection}
                  disabled={isDebugging}
                  className="mt-4 p-2"
                >
                  <Text className="text-xs text-gray-400 text-center underline">
                    {isDebugging ? 'Testing Connection...' : 'Debug Connection'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}