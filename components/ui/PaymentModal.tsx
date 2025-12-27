import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { LoadingSpinner } from './LoadingSpinner';
import { PaymentBalance } from '../../types';
import {
  formatUGX,
  parseUGX,
  validateUGXAmount,
  generatePaymentSuggestions,
  formatNumber
} from '../../lib/currency';

interface PaymentAmountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  balance: PaymentBalance;
  isLoading?: boolean;
}

export function PaymentModal({
  visible,
  onClose,
  onConfirm,
  balance,
  isLoading = false
}: PaymentAmountModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestions = generatePaymentSuggestions(balance.outstandingBalance, balance.monthlyRent);

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setAmount('');
      setSelectedSuggestion(null);
      setError(null);
    }
  }, [visible]);

  const handleAmountChange = (text: string) => {
    // Remove any non-digit characters except for spaces and commas
    const cleanText = text.replace(/[^\d,\s]/g, '');

    // Parse the amount
    const numericValue = parseUGX(cleanText);

    // Update state
    setAmount(formatNumber(numericValue));
    setSelectedSuggestion(null);
    setError(null);
  };

  const handleSuggestionPress = (suggestionAmount: number) => {
    setAmount(formatNumber(suggestionAmount));
    setSelectedSuggestion(suggestionAmount);
    setError(null);
  };

  const handleConfirm = () => {
    const numericAmount = parseUGX(amount);

    // Validate amount
    const validation = validateUGXAmount(
      numericAmount,
      10000
    );

    if (!validation.isValid) {
      setError(validation.error || 'Invalid amount');
      return;
    }

    // Proceed with payment
    onConfirm(numericAmount);
  };

  const remainingBalance = Math.max(0, balance.outstandingBalance - parseUGX(amount));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-gray-50">
          {/* Header */}
          <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-2xl font-semibold text-gray-800">
                Make Payment
              </Text>
              <View className="w-6" />
            </View>
          </View>

          <ScrollView className="flex-1 px-4 pt-6">
            {/* Balance Information */}
            <Card className="mb-6">
              <View className="space-y-3">
                <Text className="text-lg font-semibold text-gray-800">
                  Outstanding Balance
                </Text>
                <Text className="text-3xl font-bold text-[#2D5A4A]">
                  {formatUGX(balance.outstandingBalance)}
                </Text>
                <View className="flex-row justify-between text-sm text-gray-600">
                  <Text>Monthly Rent: {formatUGX(balance.monthlyRent)}</Text>
                  <Text>Paid: {formatUGX(balance.paidAmount)}</Text>
                </View>
              </View>
            </Card>

            {/* Amount Input */}
            <Card className="mb-4">
              <View className="space-y-4">
                <Text className="text-lg font-semibold text-gray-800">
                  Enter Payment Amount
                </Text>

                <View className="relative">
                  <Text className="absolute left-3 top-3 text-lg text-gray-500 z-10">
                    UGX
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="bg-gray-50 border border-gray-300 rounded-md px-12 py-3 text-lg font-semibold text-gray-800 text-right"
                    maxLength={12}
                  />
                </View>

                {error && (
                  <View className="flex-row items-center space-x-2">
                    <MaterialIcons name="error" size={16} color="#EF4444" />
                    <Text className="text-red-500 text-sm flex-1">{error}</Text>
                  </View>
                )}

                {amount && !error && (
                  <View className="bg-blue-50 p-3 rounded-md">
                    <Text className="text-blue-800 text-sm">
                      Remaining balance after payment: {formatUGX(remainingBalance)}
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Quick Amount Suggestions */}
            <Card className="mb-6">
              <View className="space-y-4">
                <Text className="text-lg font-semibold text-gray-800">
                  Quick Amounts
                </Text>

                <View className="flex-row flex-wrap gap-2">
                  {suggestions.map((suggestion) => {
                    const isSelected = selectedSuggestion === suggestion;
                    const percentage = Math.round((suggestion / balance.outstandingBalance) * 100);

                    return (
                      <TouchableOpacity
                        key={suggestion}
                        onPress={() => handleSuggestionPress(suggestion)}
                        className={`px-4 py-2 rounded-md border ${isSelected
                          ? 'bg-[#2D5A4A] border-[#2D5A4A]'
                          : 'bg-white border-gray-300'
                          }`}
                      >
                        <Text
                          className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'
                            }`}
                        >
                          {formatUGX(suggestion)}
                        </Text>
                        {suggestion < balance.outstandingBalance && (
                          <Text
                            className={`text-xs ${isSelected ? 'text-gray-200' : 'text-gray-500'
                              }`}
                          >
                            {percentage}%
                          </Text>
                        )}
                        {suggestion === balance.outstandingBalance && (
                          <Text
                            className={`text-xs ${isSelected ? 'text-gray-200' : 'text-gray-500'
                              }`}
                          >
                            Full
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </Card>
          </ScrollView>

          {/* Footer */}
          <View className="bg-white px-4 pb-6 pt-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!amount || isLoading || !!error}
              className={`py-3 rounded-md items-center ${(!amount || isLoading || !!error)
                ? 'bg-gray-300'
                : 'bg-[#2D5A4A]'
                }`}
            >
              {isLoading ? (
                <LoadingSpinner size="small" message="" className="my-0" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Continue to Payment Method
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}