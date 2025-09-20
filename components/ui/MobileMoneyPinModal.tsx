import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Vibration
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { LoadingSpinner } from './LoadingSpinner';
import { formatUGX, formatPhoneNumber } from '../../lib/currency';

interface MobileMoneyPinModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  amount: number;
  phoneNumber: string;
  providerName: string;
  isLoading?: boolean;
  error?: string;
}

export function MobileMoneyPinModal({
  visible,
  onClose,
  onConfirm,
  amount,
  phoneNumber,
  providerName,
  isLoading = false,
  error
}: MobileMoneyPinModalProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setPin('');
      setShowPin(false);
      setAttempts(0);

      // Focus first input after modal animation completes
      const timer = setTimeout(() => {
        if (inputRefs.current[0] && !isLoading) {
          inputRefs.current[0].focus();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [visible, isLoading]);

  useEffect(() => {
    if (error && attempts < maxAttempts) {
      // Vibrate on error
      Vibration.vibrate(200);
      setAttempts(prev => prev + 1);

      // Clear PIN on error and refocus first input
      setPin('');
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);

      // Show alert for too many attempts
      if (attempts + 1 >= maxAttempts) {
        Alert.alert(
          'Too Many Attempts',
          'You have exceeded the maximum number of PIN attempts. Please try again later.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    }
  }, [error, attempts, maxAttempts, onClose]);

  const handlePinChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin.padEnd(4, '')];

    if (value === '') {
      // Handle backspace - clear current field and go to previous
      newPin[index] = '';
      const newPinString = newPin.join('').replace(/\s/g, '');
      setPin(newPinString);

      // Focus previous input if available
      if (index > 0) {
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      }
    } else if (value.length === 1) {
      // Handle single digit input
      newPin[index] = value;
      const newPinString = newPin.join('').replace(/\s/g, '');
      setPin(newPinString);

      // Auto-focus next input if available
      if (index < 3) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 10);
      }

      // Auto-submit when all 4 digits are entered
      if (newPinString.length === 4) {
        setTimeout(() => {
          handleSubmit(newPinString);
        }, 200);
      }
    }
  };

  const handleSubmit = (pinToSubmit?: string) => {
    const finalPin = pinToSubmit || pin;
    if (finalPin.length === 4 && attempts < maxAttempts) {
      onConfirm(finalPin);
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace') {
      const currentValue = pin[index];

      if (!currentValue && index > 0) {
        // If current field is empty, focus previous field and clear it
        const newPin = [...pin.padEnd(4, '')];
        newPin[index - 1] = '';
        const newPinString = newPin.join('').replace(/\s/g, '');
        setPin(newPinString);

        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      }
    }
  };

  const renderPinInput = (index: number) => {
    const value = pin[index] || '';
    const hasValue = value !== '';
    const hasError = error && attempts > 0;

    return (
      <TextInput
        key={index}
        // @ts-ignore
        ref={(ref) => (inputRefs.current[index] = ref)}
        value={showPin ? value : hasValue ? '•' : ''}
        onChangeText={(text) => handlePinChange(text, index)}
        onKeyPress={(event) => handleKeyPress(event, index)}
        keyboardType="numeric"
        maxLength={1}
        selectTextOnFocus={true}
        autoCorrect={false}
        autoCapitalize="none"
        secureTextEntry={false} // We handle masking manually
        className={`w-12 h-12 border-2 rounded-md text-center text-xl font-bold ${hasValue
            ? hasError
              ? 'border-red-500 bg-red-50'
              : 'border-[#2D5A4A] bg-[#2D5A4A]/5'
            : hasError
              ? 'border-red-500 bg-white'
              : 'border-gray-300 bg-white'
          }`}
        editable={!isLoading && attempts < maxAttempts}
      />
    );
  };

  if (attempts >= maxAttempts) {
    return null; // Modal will be closed by the alert
  }

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
              <TouchableOpacity onPress={onClose} disabled={isLoading}>
                <MaterialIcons name="arrow-back" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-800">
                Enter PIN
              </Text>
              <View className="w-6" />
            </View>
          </View>

          <View className="flex-1 px-4 pt-8">
            {/* Provider and Amount Info */}
            <Card className="mb-8">
              <View className="items-center space-y-4">
                <View className="w-16 h-16 bg-[#2D5A4A] rounded-full items-center justify-center">
                  <MaterialIcons name="phone-android" size={32} color="white" />
                </View>

                <View className="items-center space-y-2">
                  <Text className="text-xl font-bold text-gray-800">
                    {formatUGX(amount)}
                  </Text>
                  <Text className="text-gray-600">
                    to {providerName} {formatPhoneNumber(phoneNumber)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* PIN Input */}
            <View className="items-center space-y-6">
              <Text className="text-lg font-semibold text-gray-800 text-center">
                Enter your {providerName} Mobile Money PIN
              </Text>

              <View className="flex-row space-x-4">
                {[0, 1, 2, 3].map(renderPinInput)}
              </View>

              {/* Show/Hide PIN Toggle */}
              <TouchableOpacity
                onPress={() => setShowPin(!showPin)}
                className="flex-row items-center space-x-2"
                disabled={isLoading}
              >
                <MaterialIcons
                  name={showPin ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#6B7280"
                />
                <Text className="text-gray-600">
                  {showPin ? 'Hide' : 'Show'} PIN
                </Text>
              </TouchableOpacity>

              {/* Error Message */}
              {error && attempts > 0 && (
                <View className="flex-row items-center space-x-2 bg-red-50 px-4 py-3 rounded-md">
                  <MaterialIcons name="error" size={20} color="#EF4444" />
                  <Text className="text-red-600 flex-1">
                    {error}
                  </Text>
                </View>
              )}

              {/* Attempts Counter */}
              {attempts > 0 && (
                <Text className="text-gray-500 text-sm">
                  Attempts remaining: {maxAttempts - attempts}
                </Text>
              )}

              {/* Loading State */}
              {isLoading && (
                <View className="items-center space-y-3 mt-8">
                  <LoadingSpinner size="large" message="" className="my-0" />
                  <Text className="text-gray-600 text-center">
                    Processing your payment...
                  </Text>
                  <Text className="text-gray-500 text-sm text-center">
                    This may take up to 2 minutes
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Footer */}
          <View className="bg-white px-4 pb-6 pt-4 border-t border-gray-200">
            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => handleSubmit()}
                disabled={pin.length !== 4 || isLoading || attempts >= maxAttempts}
                className={`py-3 rounded-md items-center ${(pin.length !== 4 || isLoading || attempts >= maxAttempts)
                    ? 'bg-gray-300'
                    : 'bg-[#2D5A4A]'
                  }`}
              >
                <Text className="text-white font-semibold text-lg">
                  {isLoading ? 'Processing...' : 'Confirm Payment'}
                </Text>
              </TouchableOpacity>

              <View className="bg-yellow-50 px-3 py-2 rounded-md">
                <Text className="text-yellow-800 text-xs text-center">
                  🔒 Your PIN is secure and encrypted. We never store your mobile money credentials.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}