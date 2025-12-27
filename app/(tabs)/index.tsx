import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useLease } from '../../hooks/LeaseContext';
import { Card, MetricCard } from '../../components/ui/Card';
import { LeaseSwitcher } from '../../components/ui/LeaseSwitcher';
import { StatusBadge, getPaymentStatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatUGX } from '../../lib/currency';
import { tenantApi } from '../../lib/api';
import { TenantDashboardData } from '../../types';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { selectedLeaseId, selectedLease } = useLease();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<TenantDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      // Fetch comprehensive dashboard data from backend
      // If we have a selected lease, pass its ID
      const data = await tenantApi.getDashboard(selectedLeaseId || undefined);
      setDashboardData(data);
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
  }, [selectedLeaseId]);

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

  if (error && !dashboardData) {
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
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-2xl font-semibold text-gray-800">
                  Hello, {user.firstName}!
                </Text>
                <Text className="text-gray-600 text-sm">
                  Welcome to your tenant portal
                </Text>
              </View>
              <LeaseSwitcher />
            </View>
          </View>

          {/* Quick Stats */}
          <View className="space-y-4 mb-6">
            <View className="flex-row space-x-4">
              <MetricCard
                title="Current Rent"
                value={dashboardData?.lease ? formatUGX(dashboardData.lease.monthlyRent) : "Loading..."}
                subtitle={dashboardData?.lease ? "Monthly Rent" : ""}
                icon={
                  <MaterialIcons name="home" size={20} color="#6B7280" />
                }
                className="flex-1"
              />
              <MetricCard
                title="Outstanding"
                value={dashboardData ? formatUGX(dashboardData.payments.currentBalance) : "Loading..."}
                subtitle={dashboardData?.payments.isOverdue ? "Overdue" : "Current balance"}
                icon={
                  <MaterialIcons
                    name={dashboardData?.payments.isOverdue ? "warning" : "payment"}
                    size={20}
                    color={dashboardData?.payments.isOverdue ? "#F59E0B" : "#6B7280"}
                  />
                }
                className="flex-1"
              />
            </View>
          </View>

          {/* Current Balance Card */}
          {dashboardData?.lease && (
            <Card className="mb-4">
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-semibold text-gray-800">
                    Payment Summary
                  </Text>
                  <MaterialIcons
                    name={dashboardData.payments.isOverdue ? "warning" : "account-balance"}
                    size={24}
                    color={dashboardData.payments.isOverdue ? "#F59E0B" : "#6B7280"}
                  />
                </View>
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Monthly Rent:</Text>
                    <Text className="font-medium text-gray-800">
                      {formatUGX(dashboardData.lease.monthlyRent)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Total Paid:</Text>
                    <Text className="font-medium text-gray-800">
                      {formatUGX(dashboardData.quickStats.totalPaid)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Outstanding:</Text>
                    <Text className="font-bold text-[#2D5A4A] text-lg">
                      {formatUGX(dashboardData.payments.currentBalance)}
                    </Text>
                  </View>
                  {dashboardData.payments.nextDueDate && (
                    <Text className="text-gray-600 text-sm">
                      Next Due: {new Date(dashboardData.payments.nextDueDate).toLocaleDateString()}
                    </Text>
                  )}
                  {dashboardData.payments.isOverdue && (
                    <Text className="text-yellow-600 text-sm font-medium">
                      ⚠️ Payment is overdue
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Quick Actions */}
          {dashboardData && dashboardData.payments.currentBalance > 0 && (
            <Card className="mb-4">
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-semibold text-gray-800">
                    Quick Actions
                  </Text>
                  <StatusBadge
                    status={dashboardData.payments.isOverdue ? "error" : "warning"}
                    text={dashboardData.payments.isOverdue ? "Overdue" : "Payment Due"}
                  />
                </View>
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-2xl font-bold text-gray-800">
                      {formatUGX(dashboardData.payments.currentBalance)}
                    </Text>
                    {dashboardData.payments.nextDueDate && (
                      <Text className="text-gray-600 text-sm">
                        Due: {new Date(dashboardData.payments.nextDueDate).toLocaleDateString()}
                      </Text>
                    )}
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
              {!dashboardData?.payments.recentPayments || dashboardData.payments.recentPayments.length === 0 ? (
                <View className="items-center py-8">
                  <MaterialIcons name="receipt" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">No payments yet</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {dashboardData.payments.recentPayments.slice(0, 2).map((paymentData, index) => {
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
                        {index < Math.min(2, dashboardData.payments.recentPayments.length) - 1 && (
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

        </View>
      </ScrollView>
    </View>
  );
}