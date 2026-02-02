import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge, getPaymentStatusBadge } from '../../components/ui/StatusBadge';
import { PaymentReceiptModal } from '../../components/ui/PaymentReceiptModal';
import { ErrorView } from '../../components/ui/ErrorView';
import { useTenantLease } from '../../hooks/useTenantLease';
import { useRetry } from '../../hooks/useRetry';
import { paymentApi } from '../../lib/api';
import { PaymentWithDetails } from '../../types';
import { formatUGX } from '../../lib/currency';
import { SafeAreaWrapper } from '../../components/ui/SafeAreaWrapper';

export default function PaymentHistoryScreen() {
  const { leaseId, isLoading: isLeaseLoading, error: leaseError } = useTenantLease();
  const { execute: executeWithRetry, isRetrying } = useRetry<any>({ maxAttempts: 3, retryDelay: 1000 });

  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReceiptPaymentId, setSelectedReceiptPaymentId] = useState<string | null>(null);

  const actualLeaseId = leaseId;

  const fetchPaymentHistory = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      if (!actualLeaseId) {
        throw new Error('No active lease found. Please contact your landlord.');
      }

      const result = await executeWithRetry(async () => {
        return await paymentApi.getHistory(actualLeaseId);
      });

      setPayments(result);
    } catch (err: any) {
      console.error('Failed to fetch payment history:', err);

      let errorMessage = 'Failed to load payment history';

      if (err.message.includes('Network Error') || err.message.includes('connection')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.message.includes('401') || err.message.includes('unauthorized')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.message.includes('403') || err.message.includes('forbidden')) {
        errorMessage = 'Access denied. Please contact support.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Payment history not found. Please contact support.';
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
    await fetchPaymentHistory(false);
    setIsRefreshing(false);
  }, [fetchPaymentHistory]);

  // Fetch data when lease ID becomes available
  React.useEffect(() => {
    if (actualLeaseId) {
      fetchPaymentHistory();
    }
  }, [actualLeaseId, fetchPaymentHistory]);

  useFocusEffect(
    useCallback(() => {
      if (actualLeaseId) {
        fetchPaymentHistory(false);
      }
    }, [actualLeaseId, fetchPaymentHistory])
  );

  if (isLeaseLoading || isLoading) {
    const message = isRetrying ? "Retrying connection..." : "Loading payment history...";
    return <LoadingSpinner message={message} />;
  }

  if (leaseError) {
    return (
      <ErrorView
        title="Unable to Load Lease Information"
        message={leaseError}
        onRetry={() => fetchPaymentHistory()}
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
        title="Unable to Load Payment History"
        message={error}
        onRetry={() => fetchPaymentHistory()}
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
              Payment History
            </Text>

            {/* Payment List */}
            <Card className="mb-6">
              <View className="space-y-3">
                {payments.length === 0 ? (
                  <View className="items-center py-8">
                    <MaterialIcons name="receipt" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-2">No payments yet</Text>
                    <Text className="text-gray-400 text-sm mt-1 text-center">
                      Your payment history will appear here once you make your first payment.
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-0">
                    {payments.map((paymentData, index) => {
                      const payment = paymentData.payment;
                      const isLate = payment.paidDate && payment.dueDate &&
                        new Date(payment.paidDate) > new Date(payment.dueDate);

                      return (
                        <TouchableOpacity
                          key={payment.id}
                          className="py-4 rounded-md"
                          onPress={() => {
                            if (payment.status === 'completed') {
                              setSelectedReceiptPaymentId(payment.id);
                            }
                          }}
                        >
                          <View className="space-y-2">
                            <View className="flex-row justify-between items-start">
                              <View className="flex-1 space-y-1">
                                <Text className="font-medium text-gray-800">
                                  Rent Payment {payment.dueDate ? `(${new Date(payment.dueDate).toLocaleDateString()})` : ''}
                                </Text>
                                <Text className="text-sm text-gray-600">
                                  {payment.periodCovered ? (
                                    <Text>Period: {payment.periodCovered}</Text>
                                  ) : (
                                    payment.dueDate && (
                                      <Text>Period: {new Date(payment.dueDate).toLocaleDateString()}</Text>
                                    )
                                  )}
                                </Text>
                                <Text className="text-sm text-gray-600">
                                  {payment.paidDate && (
                                    <Text>
                                      {'Paid: '}
                                      {new Date(payment.paidDate).toLocaleDateString()}
                                    </Text>
                                  )}
                                </Text>
                                {isLate && (
                                  <Text className="text-sm text-yellow-600 font-medium">
                                    Late Payment
                                  </Text>
                                )}
                                {payment.status === 'completed' && (
                                  <Text className="text-xs text-[#524768] font-medium">
                                    Tap to view receipt
                                  </Text>
                                )}
                              </View>

                              <View className="items-end space-y-1">
                                <Text className="text-lg font-bold text-gray-800">
                                  {formatUGX(typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount)}
                                </Text>
                                <StatusBadge {...getPaymentStatusBadge(payment.status)} />
                              </View>
                            </View>
                          </View>

                          {index < payments.length - 1 && (
                            <View className="border-t border-gray-200 mt-4" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </Card>
          </View>
        </ScrollView>

        {/* Payment Receipt Modal */}
        {selectedReceiptPaymentId && (
          <PaymentReceiptModal
            visible={!!selectedReceiptPaymentId}
            onClose={() => setSelectedReceiptPaymentId(null)}
            paymentId={selectedReceiptPaymentId}
          />
        )}
      </View>
    </SafeAreaWrapper>
  );
}
