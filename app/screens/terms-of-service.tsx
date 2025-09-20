import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '../../components/ui/Card';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-4">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center space-x-2"
            >
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
              <Text className="text-lg font-medium text-gray-700">Back</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-bold text-gray-800 mb-6">
            Terms of Service
          </Text>

          <Card className="mb-4">
            <View className="space-y-4">
              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  1. Acceptance of Terms
                </Text>
                <Text className="text-gray-600 leading-6">
                  By accessing and using the NDI Landlord application, you accept and agree to be bound by the terms and provision of this agreement.
                </Text>
              </View>

              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  2. Use License
                </Text>
                <Text className="text-gray-600 leading-6">
                  Permission is granted to temporarily download one copy of the materials on NDI Landlord's mobile application for personal, non-commercial transitory viewing only.
                </Text>
              </View>

              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  3. User Account
                </Text>
                <Text className="text-gray-600 leading-6">
                  You are responsible for safeguarding the password and for maintaining the confidentiality of your account. You agree not to disclose your password to any third party.
                </Text>
              </View>

              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  4. Privacy Policy
                </Text>
                <Text className="text-gray-600 leading-6">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                </Text>
              </View>

              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  5. Payment Terms
                </Text>
                <Text className="text-gray-600 leading-6">
                  All payments made through the application are subject to the terms and conditions of the respective payment providers. We are not responsible for payment processing failures.
                </Text>
              </View>

              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  6. Disclaimer
                </Text>
                <Text className="text-gray-600 leading-6">
                  The materials on NDI Landlord's mobile application are provided on an 'as is' basis. NDI Landlord makes no warranties, expressed or implied.
                </Text>
              </View>

              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  7. Limitations
                </Text>
                <Text className="text-gray-600 leading-6">
                  In no event shall NDI Landlord or its suppliers be liable for any damages arising out of the use or inability to use the materials on the application.
                </Text>
              </View>

              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  8. Accuracy of Materials
                </Text>
                <Text className="text-gray-600 leading-6">
                  The materials appearing on NDI Landlord's application could include technical, typographical, or photographic errors. NDI Landlord does not warrant that any of the materials are accurate, complete, or current.
                </Text>
              </View>

              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  9. Modifications
                </Text>
                <Text className="text-gray-600 leading-6">
                  NDI Landlord may revise these terms of service at any time without notice. By using this application, you are agreeing to be bound by the then current version of these terms of service.
                </Text>
              </View>

              <View>
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  10. Contact Information
                </Text>
                <Text className="text-gray-600 leading-6">
                  If you have any questions about these Terms of Service, please contact us at support@ndilandlord.com
                </Text>
              </View>

              <View className="mt-6 pt-4 border-t border-gray-200">
                <Text className="text-sm text-gray-500 text-center">
                  Last updated: January 2024
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}