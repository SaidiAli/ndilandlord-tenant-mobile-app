import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { LoadingSpinner } from './LoadingSpinner';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';
import { PaymentStatusResponse } from '../../types';
import { formatUGX } from '../../lib/currency';

interface PaymentStatusTrackerProps {
  transactionId: string;
  amount: number;
  onSuccess: (status: PaymentStatusResponse) => void;
  onFailed: (status: PaymentStatusResponse) => void;
  onTimeout: () => void;
  className?: string;
}

export function PaymentStatusTracker({
  transactionId,
  amount,
  onSuccess,
  onFailed,
  onTimeout,
  className = ''
}: PaymentStatusTrackerProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const { status, isPolling, error, startPolling, stopPolling } = usePaymentStatus({
    transactionId,
    onSuccess,
    onFailed,
    onError: (error) => {
      if (error.includes('timeout') || error.includes('timed out')) {
        onTimeout();
      }
    },
  });

  useEffect(() => {
    if (transactionId) {
      startPolling();
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      stopPolling();
    };
  }, [transactionId, startPolling, stopPolling, fadeAnim]);

  const getStatusInfo = () => {
    if (error) {
      return {
        icon: 'error' as const,
        color: '#EF4444',
        title: 'Connection Error',
        message: error,
        showRetry: true,
      };
    }

    if (!status || status.status === 'Pending') {
      return {
        icon: 'hourglass-empty' as const,
        color: '#F59E0B',
        title: 'Processing Payment',
        message: 'Please wait while we process your payment...',
        showRetry: false,
      };
    }

    if (status.status === 'Success') {
      return {
        icon: 'check-circle' as const,
        color: '#10B981',
        title: 'Payment Successful',
        message: 'Your payment has been processed successfully!',
        showRetry: false,
      };
    }

    if (status.status === 'Failed') {
      return {
        icon: 'cancel' as const,
        color: '#EF4444',
        title: 'Payment Failed',
        message: status.statusMessage || 'Your payment could not be processed.',
        showRetry: true,
      };
    }

    return {
      icon: 'help' as const,
      color: '#6B7280',
      title: 'Unknown Status',
      message: 'Unable to determine payment status.',
      showRetry: true,
    };
  };

  const statusInfo = getStatusInfo();

  const handleRetry = () => {
    if (!isPolling) {
      startPolling();
    }
  };

  return (
    <Animated.View 
      style={{ opacity: fadeAnim }}
      className={`${className}`}
    >
      <Card>
        <View className="items-center space-y-6 py-4">
          {/* Status Icon */}
          <View className="relative">
            <View 
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: statusInfo.color + '20' }}
            >
              <MaterialIcons 
                name={statusInfo.icon} 
                size={40} 
                color={statusInfo.color} 
              />
            </View>
            
            {/* Pulsing animation for pending status */}
            {status?.status === 'Pending' && isPolling && (
              <View className="absolute inset-0">
                <LoadingSpinner size="large" message="" className="my-0" />
              </View>
            )}
          </View>

          {/* Status Text */}
          <View className="items-center space-y-2">
            <Text className="text-xl font-bold text-gray-800">
              {statusInfo.title}
            </Text>
            <Text className="text-gray-600 text-center">
              {statusInfo.message}
            </Text>
          </View>

          {/* Amount */}
          <View className="bg-gray-50 px-4 py-2 rounded-md">
            <Text className="text-lg font-semibold text-gray-800">
              {formatUGX(amount)}
            </Text>
          </View>

          {/* Transaction Details */}
          {status && (
            <View className="w-full space-y-2">
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-gray-600 text-sm">Transaction ID:</Text>
                <Text className="text-gray-800 text-sm font-mono">
                  {transactionId.substring(0, 8)}...
                </Text>
              </View>
              
              {status.vendorTransactionId && (
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-600 text-sm">Reference:</Text>
                  <Text className="text-gray-800 text-sm font-mono">
                    {status.vendorTransactionId}
                  </Text>
                </View>
              )}

              {status.processedAt && (
                <View className="flex-row justify-between items-center py-1">
                  <Text className="text-gray-600 text-sm">Processed:</Text>
                  <Text className="text-gray-800 text-sm">
                    {new Date(status.processedAt).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Retry Button */}
          {statusInfo.showRetry && (
            <TouchableOpacity
              onPress={handleRetry}
              disabled={isPolling}
              className={`px-6 py-2 rounded-md border ${
                isPolling
                  ? 'border-gray-300 bg-gray-100'
                  : 'border-[#2D5A4A] bg-white active:bg-[#2D5A4A]/10'
              }`}
            >
              <Text
                className={`font-medium ${
                  isPolling ? 'text-gray-400' : 'text-[#2D5A4A]'
                }`}
              >
                {isPolling ? 'Checking...' : 'Check Status'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Progress Indicator */}
          {isPolling && !error && (
            <View className="w-full">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs text-gray-500">Processing...</Text>
                <Text className="text-xs text-gray-500">Up to 2 min</Text>
              </View>
              <View className="w-full bg-gray-200 rounded-full h-1">
                <View className="bg-[#2D5A4A] h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
              </View>
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}