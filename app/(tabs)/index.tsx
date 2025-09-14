import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Card, MetricCard } from '../../components/ui/Card';
import { StatusBadge, getPaymentStatusBadge, getMaintenanceStatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatUGX } from '../../lib/currency';
import { paymentApi } from '../../lib/api';
import { PaymentBalance, PaymentWithDetails } from '../../types';

// Mock data - will be replaced with real API calls
const mockData = {
  currentLease: {
    unit: 'Unit 2A',
    property: '123 Maple Street',
    rentAmount: 1500000, // UGX amount
    nextDueDate: '2024-01-01',
  },
  upcomingPayment: {
    amount: 1500000, // UGX amount
    dueDate: '2024-01-01',
    status: 'pending',
  },
  recentPayments: [
    { id: '1', amount: 1500000, date: '2023-12-01', status: 'completed' },
    { id: '2', amount: 1500000, date: '2023-11-01', status: 'completed' },
  ],
  maintenanceRequests: [
    { id: '1', title: 'Leaky faucet', status: 'in_progress', date: '2023-12-15' },
    { id: '2', title: 'AC not working', status: 'completed', date: '2023-12-10' },
  ],
};

export default function DashboardScreen() {
  const { user } = useAuth();

  // State for real data
  const [balance, setBalance] = useState<PaymentBalance | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock lease ID - in a real app, this would come from user context or API
  const TENANT_LEASE_ID = '74f63f60-4c8b-404a-8a37-45f03219138e';

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      // Fetch balance and recent payments in parallel
      const [balanceData, paymentsData] = await Promise.all([
        paymentApi.getBalance(TENANT_LEASE_ID).catch(() => null), // Don't fail if balance fails
        paymentApi.getHistory(TENANT_LEASE_ID).catch(() => []), // Return empty array if fails
      ]);

      setBalance(balanceData);
      setRecentPayments(paymentsData.slice(0, 2)); // Only show 2 most recent
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData(false);
    setIsRefreshing(false);
  };

  // Fetch data on component mount and focus
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh when screen comes into focus
      fetchDashboardData(false);
    }, [])
  );

  if (!user) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  if (error && !balance) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-4">
        <MaterialIcons name="error" size={48} color="#EF4444" />
        <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">
          Unable to Load Dashboard
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => fetchDashboardData()}
          className="bg-[#2D5A4A] px-6 py-3 rounded-md mt-4"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
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
                value={balance ? formatUGX(balance.monthlyRent) : "Loading..."}
                subtitle={balance ? "Monthly Rent" : ""}
                icon={
                  <MaterialIcons name="home" size={20} color="#6B7280" />
                }
                className="flex-1"
              />
              <MetricCard
                title="Outstanding"
                value={balance ? formatUGX(balance.outstandingBalance) : "Loading..."}
                subtitle={balance?.isOverdue ? "Overdue" : "Current balance"}
                icon={
                  <MaterialIcons 
                    name={balance?.isOverdue ? "warning" : "payment"} 
                    size={20} 
                    color={balance?.isOverdue ? "#F59E0B" : "#6B7280"} 
                  />
                }
                className="flex-1"
              />
            </View>
          </View>

          {/* Current Balance Card */}
          {balance && (
            <Card className="mb-4">
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-semibold text-gray-800">
                    Payment Summary
                  </Text>
                  <MaterialIcons 
                    name={balance.isOverdue ? "warning" : "account-balance"} 
                    size={24} 
                    color={balance.isOverdue ? "#F59E0B" : "#6B7280"} 
                  />
                </View>
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Monthly Rent:</Text>
                    <Text className="font-medium text-gray-800">
                      {formatUGX(balance.monthlyRent)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Amount Paid:</Text>
                    <Text className="font-medium text-gray-800">
                      {formatUGX(balance.paidAmount)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Outstanding:</Text>
                    <Text className="font-bold text-[#2D5A4A] text-lg">
                      {formatUGX(balance.outstandingBalance)}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm">
                    Next Due: {new Date(balance.dueDate).toLocaleDateString()}
                  </Text>
                  {balance.isOverdue && (
                    <Text className="text-yellow-600 text-sm font-medium">
                      ⚠️ Payment is overdue
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Quick Actions */}
          {balance && balance.outstandingBalance > 0 && (
            <Card className="mb-4">
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-semibold text-gray-800">
                    Quick Actions
                  </Text>
                  <StatusBadge 
                    status={balance.isOverdue ? "error" : "warning"}
                    text={balance.isOverdue ? "Overdue" : "Payment Due"} 
                  />
                </View>
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-2xl font-bold text-gray-800">
                      {formatUGX(balance.outstandingBalance)}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      Due: {new Date(balance.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    className="bg-[#2D5A4A] px-4 py-2 rounded-md active:bg-[#254B3C]"
                    onPress={() => router.push('/payments')}
                  >
                    <Text className="text-white font-medium">
                      Pay Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}

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
              {recentPayments.length === 0 ? (
                <View className="items-center py-8">
                  <MaterialIcons name="receipt" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">No payments yet</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {recentPayments.map((paymentData, index) => {
                    const payment = paymentData.payment;
                    return (
                      <View key={payment.id}>
                        <View className="flex-row justify-between items-center">
                          <View>
                            <Text className="font-medium text-gray-800">
                              {formatUGX(typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount)}
                            </Text>
                            <Text className="text-gray-600 text-sm">
                              {payment.paidDate 
                                ? new Date(payment.paidDate).toLocaleDateString()
                                : new Date(payment.createdAt).toLocaleDateString()
                              }
                            </Text>
                          </View>
                          <StatusBadge {...getPaymentStatusBadge(payment.status)} />
                        </View>
                        {index < recentPayments.length - 1 && (
                          <View className="border-t border-gray-200 mt-3" />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
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