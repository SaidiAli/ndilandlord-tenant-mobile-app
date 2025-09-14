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
      
      // Focus first input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [visible]);

  useEffect(() => {
    if (error && attempts < maxAttempts) {
      // Vibrate on error
      Vibration.vibrate(200);
      setAttempts(prev => prev + 1);
      
      // Clear PIN on error
      setPin('');
      
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

    const newPin = pin.split('');
    
    if (value === '' && newPin[index]) {
      // Handle backspace
      newPin[index] = '';
      setPin(newPin.join(''));
      
      // Focus previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (value.length === 1) {
      // Handle single digit input
      newPin[index] = value;
      setPin(newPin.join(''));
      
      // Auto-focus next input
      if (index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
      
      // Auto-submit when all 4 digits are entered
      if (newPin.join('').length === 4) {
        setTimeout(() => handleSubmit(newPin.join('')), 100);
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
    if (event.nativeEvent.key === 'Backspace' && pin[index] === undefined && index > 0) {
      // Handle backspace when current input is empty
      const newPin = pin.split('');
      newPin[index - 1] = '';
      setPin(newPin.join(''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  const renderPinInput = (index: number) => {
    const value = pin[index] || '';
    const hasValue = value !== '';
    
    return (
      <TextInput
        key={index}
        ref={(ref) => (inputRefs.current[index] = ref)}
        value={showPin ? value : hasValue ? '•' : ''}
        onChangeText={(text) => handlePinChange(text, index)}
        onKeyPress={(event) => handleKeyPress(event, index)}
        keyboardType="numeric"
        maxLength={1}
        secureTextEntry={false} // We handle masking manually
        className={`w-12 h-12 border-2 rounded-md text-center text-xl font-bold ${
          hasValue 
            ? 'border-[#2D5A4A] bg-[#2D5A4A]/5' 
            : 'border-gray-300 bg-white'
        } ${error && attempts > 0 ? 'border-red-500' : ''}`}
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
                className={`py-3 rounded-md items-center ${
                  (pin.length !== 4 || isLoading || attempts >= maxAttempts)
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