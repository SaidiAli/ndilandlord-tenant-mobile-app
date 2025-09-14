import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge, getPaymentStatusBadge } from '../../components/ui/StatusBadge';
import { PaymentAmountModal } from '../../components/ui/PaymentAmountModal';
import { MobileMoneyPinModal } from '../../components/ui/MobileMoneyPinModal';
import { PaymentStatusTracker } from '../../components/ui/PaymentStatusTracker';
import { PaymentReceiptModal } from '../../components/ui/PaymentReceiptModal';
import { useAuth } from '../../hooks/useAuth';
import { paymentApi } from '../../lib/api';
import { 
  PaymentBalance, 
  PaymentWithDetails, 
  PaymentInitiationResponse, 
  PaymentStatusResponse,
  PaymentFlowState,
  PaymentStep
} from '../../types';
import { 
  formatUGX, 
  formatPhoneNumber, 
  normalizePhoneNumber,
  validatePhoneNumber,
  getMobileMoneyProvider
} from '../../lib/currency';

export default function PaymentsScreen() {
  const { user } = useAuth();
  
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

  // Mock lease ID - in a real app, this would come from user context or API
  const TENANT_LEASE_ID = '74f63f60-4c8b-404a-8a37-45f03219138e';

  const fetchPaymentData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      // Fetch balance and payment history in parallel
      const [balanceData, paymentsData] = await Promise.all([
        paymentApi.getBalance(TENANT_LEASE_ID),
        paymentApi.getHistory(TENANT_LEASE_ID),
      ]);

      setBalance(balanceData);
      setPayments(paymentsData);
    } catch (err: any) {
      console.error('Failed to fetch payment data:', err);
      setError(err.message || 'Failed to load payment information');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPaymentData(false);
    setIsRefreshing(false);
  }, [fetchPaymentData]);

  // Fetch data on component mount and focus
  useEffect(() => {
    fetchPaymentData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh when screen comes into focus
      fetchPaymentData(false);
    }, [])
  );

  const handlePayNow = useCallback(() => {
    if (!balance) return;
    
    setPaymentFlow({
      step: 'amount-selection',
      isLoading: false,
    });
  }, [balance]);

  const handleAmountConfirm = useCallback(async (amount: number) => {
    if (!balance) return;

    try {
      setPaymentFlow(prev => ({ ...prev, amount, isLoading: true }));

      // For demo purposes, use a default phone number
      const phoneNumber = user?.phone || '256700654321';
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const provider = getMobileMoneyProvider(normalizedPhone);
      
      const providerName = provider === 'mtn' ? 'MTN MoMo' : 
                          provider === 'airtel' ? 'Airtel Money' : 
                          'Mobile Money';

      setPaymentFlow(prev => ({
        ...prev,
        phoneNumber: normalizedPhone,
        paymentMethod: {
          id: provider === 'unknown' ? 'mtn' : provider,
          name: provider === 'unknown' ? 'mtn' : provider,
          displayName: providerName,
          color: provider === 'mtn' ? '#FFCB05' : '#E51A1A',
          icon: 'phone-android',
          prefixes: [],
        },
        step: 'pin-entry',
        isLoading: false,
      }));

    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to proceed with payment');
      setPaymentFlow(prev => ({ ...prev, isLoading: false }));
    }
  }, [balance, user?.phone]);

  const handlePinConfirm = useCallback(async (pin: string) => {
    setPaymentFlow(prev => {
      const { amount, phoneNumber } = prev;
      
      if (!balance || !amount || !phoneNumber) return prev;

      // Start async payment process
      (async () => {
        try {
          setPaymentFlow(current => ({ ...current, isLoading: true, error: undefined }));

          // Initiate payment
          const paymentResponse = await paymentApi.initiate({
            leaseId: TENANT_LEASE_ID,
            amount,
            phoneNumber,
            paymentMethod: 'mobile_money',
          });

          setCurrentPayment(paymentResponse);
          setPaymentFlow(current => ({
            ...current,
            transactionId: paymentResponse.transactionId,
            step: 'processing',
            isLoading: false,
          }));

        } catch (err: any) {
          console.error('Payment initiation failed:', err);
          setPaymentFlow(current => ({ 
            ...current, 
            error: err.message || 'Payment failed. Please try again.',
            isLoading: false 
          }));
        }
      })();

      return { ...prev, isLoading: true, error: undefined };
    });
  }, [balance]);

  const handlePaymentSuccess = useCallback((status: PaymentStatusResponse) => {
    setPaymentFlow(prev => ({ ...prev, step: 'success' }));
    // Refresh payment data to show updated balance
    fetchPaymentData(false);
  }, [fetchPaymentData]);

  const handlePaymentFailed = useCallback((status: PaymentStatusResponse) => {
    setPaymentFlow(prev => ({ 
      ...prev, 
      step: 'failed',
      error: status.statusMessage || 'Payment failed'
    }));
  }, []);

  const handlePaymentTimeout = useCallback(() => {
    setPaymentFlow(prev => ({ 
      ...prev, 
      step: 'failed',
      error: 'Payment processing timed out. Please check your payment status manually.'
    }));
  }, []);

  const closePaymentFlow = useCallback(() => {
    setPaymentFlow({ step: 'idle' });
    setCurrentPayment(null);
  }, []);

  const retryPayment = useCallback(() => {
    setPaymentFlow({ step: 'amount-selection' });
    setCurrentPayment(null);
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading payment information..." />;
  }

  if (error && !balance) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-4">
        <MaterialIcons name="error" size={48} color="#EF4444" />
        <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">
          Unable to Load Payments
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => fetchPaymentData()}
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
          <Text className="text-2xl font-semibold text-gray-800 mb-6">
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
                <View className="flex-row justify-between items-center">
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

                {balance.outstandingBalance > 0 && (
                  <TouchableOpacity 
                    className="bg-[#2D5A4A] py-3 rounded-md items-center flex-row justify-center space-x-2 active:bg-[#254B3C]"
                    onPress={handlePayNow}
                    disabled={paymentFlow.step !== 'idle'}
                  >
                    <MaterialIcons name="payment" size={20} color="white" />
                    <Text className="text-white font-medium text-lg">
                      Pay Now
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          )}

          {/* Payment Methods Card */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Payment Methods
              </Text>
              
              <View className="flex-row items-center justify-between py-2 px-2 rounded-md bg-yellow-50 border border-yellow-200">
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
                        className="py-4 rounded-md active:bg-gray-50"
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
                                Rent Payment
                              </Text>
                              <Text className="text-sm text-gray-600">
                                {payment.dueDate && (
                                  <>Due: {new Date(payment.dueDate).toLocaleDateString()}</>
                                )}
                                {payment.paidDate && (
                                  <Text>
                                    {payment.dueDate ? ' • Paid: ' : 'Paid: '}
                                    {new Date(payment.paidDate).toLocaleDateString()}
                                  </Text>
                                )}
                              </Text>
                              {payment.paymentMethod && (
                                <Text className="text-sm text-gray-500">
                                  {payment.paymentMethod === 'mobile_money' ? 'Mobile Money' : payment.paymentMethod}
                                </Text>
                              )}
                              {payment.transactionId && (
                                <Text className="text-xs text-gray-400 font-mono">
                                  {payment.transactionId.substring(0, 8)}...
                                </Text>
                              )}
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
                              {payment.status === 'completed' && (
                                <MaterialIcons name="receipt" size={16} color="#2D5A4A" />
                              )}
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
        <PaymentAmountModal
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