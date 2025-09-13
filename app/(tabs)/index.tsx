import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Card, MetricCard } from '../../components/ui/Card';
import { StatusBadge, getPaymentStatusBadge, getMaintenanceStatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// Mock data - will be replaced with real API calls
const mockData = {
  currentLease: {
    unit: 'Unit 2A',
    property: '123 Maple Street',
    rentAmount: 1200,
    nextDueDate: '2024-01-01',
  },
  upcomingPayment: {
    amount: 1200,
    dueDate: '2024-01-01',
    status: 'pending',
  },
  recentPayments: [
    { id: '1', amount: 1200, date: '2023-12-01', status: 'completed' },
    { id: '2', amount: 1200, date: '2023-11-01', status: 'completed' },
  ],
  maintenanceRequests: [
    { id: '1', title: 'Leaky faucet', status: 'in_progress', date: '2023-12-15' },
    { id: '2', title: 'AC not working', status: 'completed', date: '2023-12-10' },
  ],
};

export default function DashboardScreen() {
  const { user } = useAuth();

  if (!user) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-4">
          {/* Header */}
          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-2xl font-semibold text-gray-800">
                Hello, {user.firstName}!
              </Text>
              <Text className="text-gray-600 text-sm">
                Welcome to your tenant portal
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View className="space-y-4 mb-6">
            <View className="flex-row space-x-4">
              <MetricCard
                title="Current Rent"
                value={`$${mockData.currentLease.rentAmount}`}
                subtitle={mockData.currentLease.unit}
                icon={
                  <MaterialIcons name="home" size={20} color="#6B7280" />
                }
                className="flex-1"
              />
              <MetricCard
                title="Next Payment"
                value="Jan 1"
                subtitle="Due in 5 days"
                icon={
                  <MaterialIcons name="payment" size={20} color="#6B7280" />
                }
                className="flex-1"
              />
            </View>
          </View>

          {/* Current Lease Info */}
          <Card className="mb-4">
            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-800">
                  Current Lease
                </Text>
                <StatusBadge status="success" text="Active" />
              </View>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Property:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockData.currentLease.property}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Unit:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockData.currentLease.unit}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Monthly Rent:</Text>
                  <Text className="font-bold text-[#2D5A4A] text-lg">
                    ${mockData.currentLease.rentAmount}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Upcoming Payment */}
          <Card className="mb-4">
            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-800">
                  Upcoming Payment
                </Text>
                <StatusBadge 
                  {...getPaymentStatusBadge(mockData.upcomingPayment.status)} 
                />
              </View>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-2xl font-bold text-gray-800">
                    ${mockData.upcomingPayment.amount}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Due: {new Date(mockData.upcomingPayment.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity className="bg-[#2D5A4A] px-4 py-2 rounded-md active:bg-[#254B3C]">
                  <Text className="text-white font-medium">
                    Pay Now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Recent Payments */}
          <Card className="mb-4">
            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-800">
                  Recent Payments
                </Text>
                <TouchableOpacity>
                  <Text className="text-[#2D5A4A] text-sm">
                    View All
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="space-y-3">
                {mockData.recentPayments.map((payment, index) => (
                  <View key={payment.id}>
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="font-medium text-gray-800">
                          ${payment.amount}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {new Date(payment.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <StatusBadge {...getPaymentStatusBadge(payment.status)} />
                    </View>
                    {index < mockData.recentPayments.length - 1 && (
                      <View className="border-t border-gray-200 mt-3" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Maintenance Requests */}
          <Card className="mb-6">
            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-800">
                  Maintenance Requests
                </Text>
                <TouchableOpacity>
                  <Text className="text-[#2D5A4A] text-sm">
                    View All
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="space-y-3">
                {mockData.maintenanceRequests.map((request, index) => (
                  <View key={request.id}>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="font-medium text-gray-800">
                          {request.title}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {new Date(request.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <StatusBadge {...getMaintenanceStatusBadge(request.status)} />
                    </View>
                    {index < mockData.maintenanceRequests.length - 1 && (
                      <View className="border-t border-gray-200 mt-3" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}