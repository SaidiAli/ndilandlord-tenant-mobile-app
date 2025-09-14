import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { StatusBadge, getPaymentStatusBadge } from '../../components/ui/StatusBadge';

// Mock payment data
const mockPayments = [
  {
    id: '1',
    amount: 1200,
    dueDate: '2024-01-01',
    status: 'pending',
    description: 'Monthly Rent - January 2024',
  },
  {
    id: '2',
    amount: 1200,
    paidDate: '2023-12-01',
    dueDate: '2023-12-01',
    status: 'completed',
    description: 'Monthly Rent - December 2023',
    paymentMethod: 'Credit Card',
  },
  {
    id: '3',
    amount: 1200,
    paidDate: '2023-11-01',
    dueDate: '2023-11-01',
    status: 'completed',
    description: 'Monthly Rent - November 2023',
    paymentMethod: 'Bank Transfer',
  },
  {
    id: '4',
    amount: 1200,
    paidDate: '2023-10-05',
    dueDate: '2023-10-01',
    status: 'completed',
    description: 'Monthly Rent - October 2023',
    paymentMethod: 'Credit Card',
    isLate: true,
  },
];

const currentBalance = 1200;
const upcomingPayment = mockPayments.find(p => p.status === 'pending');

export default function PaymentsScreen() {
  const handlePayNow = (paymentId: string) => {
    // TODO: Implement payment processing
    console.log('Pay now for payment:', paymentId);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-4">
          {/* Header */}
          <Text className="text-2xl font-semibold text-gray-800 mb-6">
            Payments
          </Text>

          {/* Current Balance Card */}
          <Card className="mb-4">
            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-800">
                  Current Balance
                </Text>
                <MaterialIcons name="account-balance" size={24} color="#6B7280" />
              </View>
              
              <View className="space-y-2">
                <Text className="text-3xl font-bold text-[#2D5A4A]">
                  ${currentBalance}
                </Text>
                <Text className="text-gray-600 text-sm">
                  Due: {upcomingPayment ? new Date(upcomingPayment.dueDate).toLocaleDateString() : 'No upcoming payments'}
                </Text>
              </View>

              {upcomingPayment && (
                <TouchableOpacity 
                  className="bg-[#2D5A4A] py-3 rounded-md items-center flex-row justify-center space-x-2 active:bg-[#254B3C]"
                  onPress={() => handlePayNow(upcomingPayment.id)}
                >
                  <MaterialIcons name="payment" size={20} color="white" />
                  <Text className="text-white font-medium text-lg">
                    Pay Now
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>

          {/* Payment Methods Card */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Payment Methods
              </Text>
              
              <TouchableOpacity className="flex-row items-center justify-between py-2 px-2 rounded-md active:bg-gray-100">
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="credit-card" size={24} color="#6B7280" />
                  <View>
                    <Text className="font-medium text-gray-800">
                      Credit/Debit Card
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Visa, Mastercard, American Express
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between py-2 px-2 rounded-md active:bg-gray-100">
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="account-balance" size={24} color="#6B7280" />
                  <View>
                    <Text className="font-medium text-gray-800">
                      Bank Transfer (ACH)
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Direct from your bank account
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Payment History */}
          <Card className="mb-6">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Payment History
              </Text>

              <View className="space-y-0">
                {mockPayments.map((payment, index) => (
                  <TouchableOpacity
                    key={payment.id}
                    className="py-4 rounded-md active:bg-gray-50"
                  >
                    <View className="space-y-2">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 space-y-1">
                          <Text className="font-medium text-gray-800">
                            {payment.description}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            Due: {new Date(payment.dueDate).toLocaleDateString()}
                            {payment.paidDate && (
                              <Text>
                                {' • Paid: '}
                                {new Date(payment.paidDate).toLocaleDateString()}
                              </Text>
                            )}
                          </Text>
                          {payment.paymentMethod && (
                            <Text className="text-sm text-gray-500">
                              {payment.paymentMethod}
                            </Text>
                          )}
                          {payment.isLate && (
                            <Text className="text-sm text-yellow-600 font-medium">
                              Late Payment
                            </Text>
                          )}
                        </View>
                        
                        <View className="items-end space-y-1">
                          <Text className="text-lg font-bold text-gray-800">
                            ${payment.amount}
                          </Text>
                          <StatusBadge {...getPaymentStatusBadge(payment.status)} />
                        </View>
                      </View>
                      
                      {payment.status === 'pending' && (
                        <TouchableOpacity
                          className="mt-2 border border-[#2D5A4A] py-2 px-4 rounded-md active:bg-[#2D5A4A]/10"
                          onPress={() => handlePayNow(payment.id)}
                        >
                          <Text className="text-[#2D5A4A] font-medium text-center">
                            Pay Now
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {index < mockPayments.length - 1 && (
                      <View className="border-t border-gray-200 mt-4" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}