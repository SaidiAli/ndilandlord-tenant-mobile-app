import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorView } from '../../components/ui/ErrorView';
import { useTenantLease } from '../../hooks/useTenantLease';
import { useRetry } from '../../hooks/useRetry';
import { paymentApi } from '../../lib/api';
import { PaymentScheduleItem } from '../../types';
import { formatUGX } from '../../lib/currency';
import { SafeAreaWrapper } from '../../components/ui/SafeAreaWrapper';

type ScheduleStatus = PaymentScheduleItem['status'];

const getStatusBadgeConfig = (status: ScheduleStatus) => {
  switch (status) {
    case 'upcoming':
      return { label: 'Upcoming', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
    case 'pending':
      return { label: 'Pending', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    case 'overdue':
      return { label: 'Overdue', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    case 'paid':
      return { label: 'Paid', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    case 'partial':
      return { label: 'Partial', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    default:
      return { label: status, bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
};

const StatusBadge = ({ status }: { status: ScheduleStatus }) => {
  const config = getStatusBadgeConfig(status);
  return (
    <View className={`px-2 py-1 rounded-full ${config.bgColor}`}>
      <Text className={`text-xs font-medium ${config.textColor}`}>
        {config.label}
      </Text>
    </View>
  );
};

export default function PaymentScheduleScreen() {
  const { leaseId, isLoading: isLeaseLoading, error: leaseError } = useTenantLease();
  const { execute: executeWithRetry, isRetrying } = useRetry<any>({ maxAttempts: 3, retryDelay: 1000 });

  const [schedule, setSchedule] = useState<PaymentScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actualLeaseId = leaseId;

  const fetchSchedule = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      if (!actualLeaseId) {
        throw new Error('No active lease found. Please contact your landlord.');
      }

      const result = await executeWithRetry(async () => {
        return await paymentApi.getSchedule(actualLeaseId);
      });

      setSchedule(result);
    } catch (err: any) {
      console.error('Failed to fetch payment schedule:', err);

      let errorMessage = 'Failed to load payment schedule';

      if (err.message.includes('Network Error') || err.message.includes('connection')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.message.includes('401') || err.message.includes('unauthorized')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.message.includes('403') || err.message.includes('forbidden')) {
        errorMessage = 'Access denied. Please contact support.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Payment schedule not found. Please contact support.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server error. Please try again in a few moments.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [actualLeaseId, executeWithRetry]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchSchedule(false);
    setIsRefreshing(false);
  }, [fetchSchedule]);

  React.useEffect(() => {
    if (actualLeaseId) {
      fetchSchedule();
    }
  }, [actualLeaseId, fetchSchedule]);

  useFocusEffect(
    useCallback(() => {
      if (actualLeaseId) {
        fetchSchedule(false);
      }
    }, [actualLeaseId, fetchSchedule])
  );

  // Calculate summary statistics
  const totalPayments = schedule.length;
  const overdueCount = schedule.filter(item => item.status === 'overdue').length;
  const nextDueItem = schedule.find(item => item.status === 'pending' || item.status === 'upcoming');

  if (isLeaseLoading || isLoading) {
    const message = isRetrying ? "Retrying connection..." : "Loading payment schedule...";
    return <LoadingSpinner message={message} />;
  }

  if (leaseError) {
    return (
      <ErrorView
        title="Unable to Load Lease Information"
        message={leaseError}
        onRetry={() => fetchSchedule()}
      />
    );
  }

  if (!actualLeaseId) {
    return (
      <ErrorView
        title="No Active Lease Found"
        message="You don't have an active lease. Please contact your landlord."
        icon="home"
        iconColor="#6B7280"
      />
    );
  }

  if (error) {
    return (
      <ErrorView
        title="Unable to Load Payment Schedule"
        message={error}
        onRetry={() => fetchSchedule()}
        retryLabel={isRetrying ? 'Retrying...' : 'Try Again'}
        isRetrying={isRetrying}
      >
        <Text className="text-xs text-gray-500 mt-2 text-center">
          Check your internet connection and try again
        </Text>
      </ErrorView>
    );
  }

  return (
    <SafeAreaWrapper>
      <View className="flex-1 bg-gray-50">
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="px-4 pt-6 pb-4">
            {/* Header */}
            <Text className="text-2xl font-semibold text-gray-800 mb-6">
              Payment Schedule
            </Text>

            {/* Summary Card */}
            <Card className="mb-4">
              <View className="space-y-3">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Summary
                </Text>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Total Scheduled Payments</Text>
                  <Text className="font-semibold text-gray-800">{totalPayments}</Text>
                </View>

                {overdueCount > 0 && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-red-600">Overdue Payments</Text>
                    <Text className="font-semibold text-red-600">{overdueCount}</Text>
                  </View>
                )}

                {nextDueItem && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Next Due Date</Text>
                    <Text className="font-semibold text-gray-800">
                      {new Date(nextDueItem.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Schedule List */}
            <Card className="mb-6">
              <View className="space-y-3">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Scheduled Payments
                </Text>

                {schedule.length === 0 ? (
                  <View className="items-center py-8">
                    <MaterialIcons name="event-note" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-2">No scheduled payments</Text>
                    <Text className="text-gray-400 text-sm mt-1 text-center">
                      Your payment schedule will appear here once it's set up.
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-0">
                    {schedule.map((item, index) => {
                      const progressPercent = item.amount > 0
                        ? Math.min((item.paidAmount / item.amount) * 100, 100)
                        : 0;

                      return (
                        <View key={item.id} className="py-4">
                          <View className="space-y-2">
                            {/* Payment Number and Status */}
                            <View className="flex-row justify-between items-center">
                              <Text className="font-medium text-gray-800">
                                Payment #{item.paymentNumber}
                              </Text>
                              <StatusBadge status={item.status} />
                            </View>

                            {/* Due Date */}
                            <View className="flex-row items-center gap-2">
                              <MaterialIcons name="event" size={16} color="#6B7280" />
                              <Text className="text-sm text-gray-600">
                                Due: {new Date(item.dueDate).toLocaleDateString()}
                              </Text>
                            </View>

                            {/* Amount */}
                            <View className="flex-row justify-between items-center">
                              <Text className="text-gray-600">Amount</Text>
                              <Text className="text-lg font-bold text-gray-800">
                                {formatUGX(item.paidAmount < item.amount ? item.amount - item.paidAmount : item.amount)}
                              </Text>
                            </View>

                            {/* Period Covered */}
                            <View className="flex-row items-center gap-2">
                              <MaterialIcons name="date-range" size={16} color="#6B7280" />
                              <Text className="text-sm text-gray-600">
                                Period: {new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}
                              </Text>
                            </View>

                            {/* Progress Bar for Partial Payments */}
                            {item.status === 'partial' && (
                              <View className="mt-2">
                                <View className="flex-row justify-between items-center mb-1">
                                  <Text className="text-xs text-gray-500">
                                    Paid: {formatUGX(item.paidAmount)}
                                  </Text>
                                  <Text className="text-xs text-gray-500">
                                    {Math.round(progressPercent)}%
                                  </Text>
                                </View>
                                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <View
                                    className="h-full bg-yellow-500 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </View>
                              </View>
                            )}
                          </View>

                          {index < schedule.length - 1 && (
                            <View className="border-t border-gray-200 mt-4" />
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </Card>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}
