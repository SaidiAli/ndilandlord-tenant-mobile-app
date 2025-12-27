import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge, getPaymentStatusBadge } from '../../components/ui/StatusBadge';
import { PaymentModal } from '../../components/ui/PaymentModal';
import { MobileMoneyPinModal } from '../../components/ui/MobileMoneyPinModal';
import { PaymentStatusTracker } from '../../components/ui/PaymentStatusTracker';
import { PaymentReceiptModal } from '../../components/ui/PaymentReceiptModal';
import { useAuth } from '../../hooks/useAuth';
import { useTenantLease } from '../../hooks/useTenantLease';
import { useRetry } from '../../hooks/useRetry';
import { paymentApi } from '../../lib/api';
import { ErrorView } from '../../components/ui/ErrorView';
import {
  PaymentBalance,
  PaymentWithDetails,
  PaymentInitiationResponse,
  PaymentStatusResponse,
  PaymentFlowState,
} from '../../types';
import {
  formatUGX,
  normalizePhoneNumber,
  getMobileMoneyProvider
} from '../../lib/currency';

export default function PaymentsScreen() {
  const { user } = useAuth();
  const { leaseId, tenantData, isLoading: isLeaseLoading, error: leaseError } = useTenantLease();
  const { execute: executeWithRetry, isRetrying } = useRetry<any>({ maxAttempts: 3, retryDelay: 1000 });

  // Data states
  const [balance, setBalance] = useState<PaymentBalance | null>(null);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment flow states
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlowState>({
    step: 'idle',
  });
  const [currentPayment, setCurrentPayment] = useState<PaymentInitiationResponse | null>(null);
  const [selectedReceiptPaymentId, setSelectedReceiptPaymentId] = useState<string | null>(null);

  // Get actual lease ID from tenant data
  const actualLeaseId = leaseId;

  const fetchPaymentData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      // Check if we have a valid lease ID
      if (!actualLeaseId) {
        throw new Error('No active lease found. Please contact your landlord.');
      }

      // Fetch balance and payment history with retry mechanism
      const result = await executeWithRetry(async () => {
        const [balanceData, paymentsData] = await Promise.all([
          paymentApi.getBalance(actualLeaseId),
          paymentApi.getHistory(actualLeaseId),
        ]);
        return { balanceData, paymentsData };
      });

      setBalance(result.balanceData);
      setPayments(result.paymentsData);
    } catch (err: any) {
      console.error('Failed to fetch payment data:', err);

      // Provide more user-friendly error messages
      let errorMessage = 'Failed to load payment information';

      if (err.message.includes('Network Error') || err.message.includes('connection')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.message.includes('401') || err.message.includes('unauthorized')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.message.includes('403') || err.message.includes('forbidden')) {
        errorMessage = 'Access denied. Please contact support.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Payment information not found. Please contact support.';
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
    await fetchPaymentData(false);
    setIsRefreshing(false);
  }, [fetchPaymentData]);

  // Fetch data when lease ID becomes available
  useEffect(() => {
    if (actualLeaseId) {
      fetchPaymentData();
    }
  }, [actualLeaseId, fetchPaymentData]);

  useFocusEffect(
    useCallback(() => {
      // Refresh when screen comes into focus and we have a lease ID
      if (actualLeaseId) {
        fetchPaymentData(false);
      }
    }, [actualLeaseId, fetchPaymentData])
  );

  const handlePayNow = useCallback(() => {
    if (!balance) return;

    setPaymentFlow({
      step: 'amount-selection',
      isLoading: false,
    });
  }, [balance]);

  const handleAmountConfirm = useCallback(async (amount: number) => {
    if (!balance || !actualLeaseId) {
      Alert.alert('Error', 'Payment information not available. Please try again.');
      return;
    }

    try {
      setPaymentFlow(prev => ({ ...prev, amount, isLoading: true, error: undefined }));

      // Use tenant phone number from the lease data or user profile
      const phoneNumber = tenantData?.tenant?.phone || user?.phone;

      if (!phoneNumber) {
        throw new Error('Phone number not found. Please update your profile.');
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const provider = getMobileMoneyProvider(normalizedPhone);

      if (provider === 'unknown') {
        throw new Error('Unsupported phone number. Please use MTN or Airtel mobile money.');
      }

      const providerName = provider === 'mtn' ? 'MTN MoMo' : 'Airtel Money';

      setPaymentFlow(prev => ({
        ...prev,
        phoneNumber: normalizedPhone,
        paymentMethod: {
          id: provider,
          name: provider,
          displayName: providerName,
          color: provider === 'mtn' ? '#FFCB05' : '#E51A1A',
          icon: 'phone-android',
          prefixes: [],
        },
        step: 'pin-entry',
        isLoading: false,
        error: undefined,
      }));

    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to proceed with payment');
      setPaymentFlow(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, [balance, tenantData?.tenant?.phone, user?.phone, actualLeaseId]);

  const handlePinConfirm = useCallback(async (pin: string) => {
    // Get current payment flow state
    const { amount, phoneNumber } = paymentFlow;

    if (!balance || !amount || !phoneNumber || !actualLeaseId) {
      Alert.alert('Error', 'Missing payment information. Please try again.');
      return;
    }

    try {
      // Set loading state
      setPaymentFlow(prev => ({ ...prev, isLoading: true, error: undefined }));

      // Initiate payment with retry mechanism
      const paymentResponse = await executeWithRetry(async () => {
        return await paymentApi.initiate({
          leaseId: actualLeaseId,
          amount,
          phoneNumber,
          provider: 'mtn',
          paymentMethod: 'mobile_money',
        });
      });

      // Update state with payment response
      setCurrentPayment(paymentResponse);
      setPaymentFlow(prev => ({
        ...prev,
        transactionId: paymentResponse.transactionId,
        step: 'processing',
        isLoading: false,
        error: undefined,
      }));

    } catch (err: any) {
      console.error('Payment initiation failed:', err);

      // Provide user-friendly error messages
      let errorMessage = 'Payment failed. Please try again.';

      if (err.message.includes('Network Error') || err.message.includes('connection')) {
        errorMessage = 'Connection failed. Please check your internet and try again.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message.includes('Invalid payment data')) {
        errorMessage = 'Invalid payment information. Please check your details.';
      } else if (err.message.includes('Insufficient funds')) {
        errorMessage = 'Insufficient funds in your mobile money account.';
      } else if (err.message.includes('Phone number')) {
        errorMessage = 'Invalid phone number. Please check your mobile money number.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setPaymentFlow(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [balance, paymentFlow, actualLeaseId]);

  const handlePaymentSuccess = useCallback((status: PaymentStatusResponse) => {
    setPaymentFlow(prev => ({
      ...prev,
      step: 'success',
      error: undefined,
      isLoading: false
    }));
    // Refresh payment data to show updated balance
    setTimeout(() => {
      fetchPaymentData(false);
    }, 1000);
  }, [fetchPaymentData]);

  const handlePaymentFailed = useCallback((status: PaymentStatusResponse) => {
    setPaymentFlow(prev => ({
      ...prev,
      step: 'failed',
      error: status.statusMessage || 'Payment failed',
      isLoading: false
    }));
  }, []);

  const handlePaymentTimeout = useCallback(() => {
    setPaymentFlow(prev => ({
      ...prev,
      step: 'failed',
      error: 'Payment processing timed out. Please check your payment status or try again.',
      isLoading: false
    }));
  }, []);

  const closePaymentFlow = useCallback(() => {
    setPaymentFlow({
      step: 'idle',
      isLoading: false,
      error: undefined
    });
    setCurrentPayment(null);
  }, []);

  const retryPayment = useCallback(() => {
    setPaymentFlow({
      step: 'amount-selection',
      isLoading: false,
      error: undefined
    });
    setCurrentPayment(null);
  }, []);

  if (isLeaseLoading || isLoading) {
    const message = isRetrying ? "Retrying connection..." : "Loading payment information...";
    return <LoadingSpinner message={message} />;
  }

  if (leaseError) {
    return (
      <ErrorView
        title="Unable to Load Lease Information"
        message={leaseError}
        onRetry={() => fetchPaymentData()}
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

  if (error && !balance) {
    return (
      <ErrorView
        title="Unable to Load Payments"
        message={error}
        onRetry={() => fetchPaymentData()}
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
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="px-4 pt-6 pb-4">
          {/* Header */}
          <Text className="text-3xl font-bold text-gray-800 mb-6">
            Payments
          </Text>

          {/* Payment Status Tracker (during processing) */}
          {paymentFlow.step === 'processing' && currentPayment && (
            <PaymentStatusTracker
              transactionId={currentPayment.transactionId}
              amount={currentPayment.amount}
              onSuccess={handlePaymentSuccess}
              onFailed={handlePaymentFailed}
              onTimeout={handlePaymentTimeout}
              className="mb-6"
            />
          )}

          {/* Success/Failure Messages */}
          {paymentFlow.step === 'success' && currentPayment && (
            <Card className="mb-6 bg-green-50 border-green-200">
              <View className="items-center space-y-4 py-4">
                <MaterialIcons name="check-circle" size={48} color="#10B981" />
                <Text className="text-xl font-bold text-green-800">
                  Payment Successful!
                </Text>
                <Text className="text-green-700 text-center">
                  Your payment of {formatUGX(currentPayment.amount)} has been processed successfully.
                </Text>
                <TouchableOpacity
                  onPress={closePaymentFlow}
                  className="bg-green-600 px-6 py-3 rounded-md"
                >
                  <Text className="text-white font-semibold">Continue</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {paymentFlow.step === 'failed' && (
            <Card className="mb-6 bg-red-50 border-red-200">
              <View className="items-center space-y-4 py-4">
                <MaterialIcons name="error" size={48} color="#EF4444" />
                <Text className="text-xl font-bold text-red-800">
                  Payment Failed
                </Text>
                <Text className="text-red-700 text-center">
                  {paymentFlow.error || 'Your payment could not be processed.'}
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={retryPayment}
                    className="bg-red-600 px-6 py-3 rounded-md"
                  >
                    <Text className="text-white font-semibold">Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closePaymentFlow}
                    className="border border-red-600 px-6 py-3 rounded-md"
                  >
                    <Text className="text-red-600 font-semibold">Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}

          {/* Current Balance Card */}
          {balance && (
            <Card className="mb-4">
              <View className="space-y-4">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-semibold text-gray-800">
                    Outstanding Balance
                  </Text>
                  <MaterialIcons
                    name={balance.isOverdue ? "warning" : "account-balance"}
                    size={24}
                    color={balance.isOverdue ? "#F59E0B" : "#6B7280"}
                  />
                </View>

                <View className="space-y-2">
                  <Text className="text-3xl font-bold text-[#2D5A4A]">
                    {formatUGX(balance.outstandingBalance)}
                  </Text>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600 text-sm">
                      Monthly Rent: {formatUGX(balance.monthlyRent)}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      Paid: {formatUGX(balance.paidAmount)}
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

                <TouchableOpacity
                  className="bg-[#2D5A4A] py-3 rounded-md items-center flex-row justify-center space-x-2 active:bg-[#254B3C] mt-8"
                  onPress={handlePayNow}
                  disabled={paymentFlow.step !== 'idle'}
                >
                  <Text className="text-white font-medium text-lg">
                    Pay Now
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Payment Methods Card */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                Payment Methods
              </Text>

              <View className="flex-row items-center justify-between py-2 px-2 mb-2 rounded-md bg-yellow-50 border border-yellow-200">
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="phone-android" size={24} color="#F59E0B" />
                  <View>
                    <Text className="font-medium text-gray-800">
                      MTN Mobile Money
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Pay with your MTN MoMo account
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="verified" size={20} color="#10B981" />
              </View>

              <View className="flex-row items-center justify-between py-2 px-2 rounded-md bg-red-50 border border-red-200">
                <View className="flex-row items-center space-x-3">
                  <MaterialIcons name="phone-android" size={24} color="#E51A1A" />
                  <View>
                    <Text className="font-medium text-gray-800">
                      Airtel Money
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Pay with your Airtel Money account
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="verified" size={20} color="#10B981" />
              </View>
            </View>
          </Card>

          {/* Payment History */}
          <Card className="mb-6">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Payment History
              </Text>

              {payments.length === 0 ? (
                <View className="items-center py-8">
                  <MaterialIcons name="receipt" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">No payments yet</Text>
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
                              {/* {payment.paymentMethod && (
                                <Text className="text-sm text-gray-500">
                                  {payment.paymentMethod === 'mobile_money' ? 'Mobile Money' : payment.paymentMethod}
                                </Text>
                              )} */}
                              {/* {payment.transactionId && (
                                <Text className="text-xs text-gray-400 font-mono">
                                  {payment.transactionId.substring(0, 8)}...
                                </Text>
                              )} */}
                              {isLate && (
                                <Text className="text-sm text-yellow-600 font-medium">
                                  Late Payment
                                </Text>
                              )}
                              {payment.status === 'completed' && (
                                <Text className="text-xs text-[#2D5A4A] font-medium">
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

      {/* Payment Amount Modal */}
      {balance && (
        <PaymentModal
          visible={paymentFlow.step === 'amount-selection'}
          onClose={closePaymentFlow}
          onConfirm={handleAmountConfirm}
          balance={balance}
          isLoading={paymentFlow.isLoading}
        />
      )}

      {/* Mobile Money PIN Modal */}
      {paymentFlow.paymentMethod && paymentFlow.phoneNumber && (
        <MobileMoneyPinModal
          visible={paymentFlow.step === 'pin-entry'}
          onClose={closePaymentFlow}
          onConfirm={handlePinConfirm}
          amount={paymentFlow.amount || 0}
          phoneNumber={paymentFlow.phoneNumber}
          providerName={paymentFlow.paymentMethod.displayName}
          isLoading={paymentFlow.isLoading}
          error={paymentFlow.error}
        />
      )}

      {/* Payment Receipt Modal */}
      {selectedReceiptPaymentId && (
        <PaymentReceiptModal
          visible={!!selectedReceiptPaymentId}
          onClose={() => setSelectedReceiptPaymentId(null)}
          paymentId={selectedReceiptPaymentId}
        />
      )}
    </View>
  );
}