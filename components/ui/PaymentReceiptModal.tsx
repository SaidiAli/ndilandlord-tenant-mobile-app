import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from './Card';
import { LoadingSpinner } from './LoadingSpinner';
import { paymentApi } from '../../lib/api';
import { PaymentReceipt } from '../../types';
import { formatUGX } from '../../lib/currency';

interface PaymentReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  paymentId: string;
}

export function PaymentReceiptModal({
  visible,
  onClose,
  paymentId,
}: PaymentReceiptModalProps) {
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && paymentId) {
      fetchReceipt();
    }
  }, [visible, paymentId]);

  const fetchReceipt = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const receiptData = await paymentApi.getReceipt(paymentId);
      setReceipt(receiptData);
    } catch (err: any) {
      setError(err.message || 'Failed to load receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!receipt) return;

    const receiptText = `
Verit - Payment Receipt

Receipt #: ${receipt.receiptNumber}
Amount: ${formatUGX(receipt.amount)}
Payment Method: ${receipt.paymentMethod}
Date: ${new Date(receipt.paidDate).toLocaleDateString()}
Transaction ID: ${receipt.transactionId}

Tenant: ${receipt.tenant?.name}
Phone: ${receipt.tenant?.phone}

Generated: ${new Date(receipt.generatedAt).toLocaleString()}

Thank you for your payment!
    `.trim();

    try {
      await Share.share({
        message: receiptText,
        title: 'Payment Receipt',
      });
    } catch (err: any) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-800">
              Payment Receipt
            </Text>
            {receipt && (
              <TouchableOpacity onPress={handleShare}>
                <MaterialIcons name="share" size={24} color="#6B7280" />
              </TouchableOpacity>
            )}
            {!receipt && <View className="w-6" />}
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-4 pt-6">
          {isLoading && (
            <LoadingSpinner message="Loading receipt..." />
          )}

          {error && (
            <Card className="items-center py-8">
              <MaterialIcons name="error" size={48} color="#EF4444" />
              <Text className="text-lg font-semibold text-gray-800 mt-4">
                Unable to Load Receipt
              </Text>
              <Text className="text-gray-600 mt-2 text-center">
                {error}
              </Text>
              <TouchableOpacity
                onPress={fetchReceipt}
                className="bg-[#524768] px-6 py-3 rounded-md mt-4"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </Card>
          )}

          {receipt && (
            <Card className="mb-6 bg-white">
              <View className="space-y-6 p-2">
                {/* Company Header */}
                <View className="items-center py-4 border-b border-gray-200">
                  <Text className="text-2xl font-bold text-[#524768]">
                    {receipt.companyInfo.name}
                  </Text>
                  <Text className="text-gray-600">{receipt.companyInfo.address}</Text>
                  <Text className="text-gray-600">{receipt.companyInfo.phone}</Text>
                </View>

                {/* Receipt Details */}
                <View className="space-y-4">
                  <View className="items-center">
                    <Text className="text-xl font-bold text-gray-800">
                      PAYMENT RECEIPT
                    </Text>
                    <Text className="text-lg font-semibold text-[#524768] mt-1">
                      ID: {receipt.transactionId}
                    </Text>
                  </View>

                  {/* Payment Information */}
                  <View className="space-y-3 border-t border-b border-gray-200 py-4">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Amount Paid:</Text>
                      <Text className="font-bold text-lg text-gray-800">
                        {formatUGX(receipt.amount)}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Payment Method:</Text>
                      <Text className="font-medium text-gray-800">
                        {receipt.paymentMethod === 'mobile_money' ? 'Mobile Money' : receipt.paymentMethod}
                      </Text>
                    </View>

                    {receipt.dueDate && (
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600">Payment Period:</Text>
                        <Text className="font-medium text-gray-800">
                          {new Date(receipt.dueDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Payment Date:</Text>
                      <Text className="font-medium text-gray-800">
                        {new Date(receipt.paidDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Tenant Information */}
                  {receipt.tenant && (
                    <View className="space-y-3">
                      <Text className="font-semibold text-gray-800">Tenant Information</Text>
                      <View className="bg-gray-50 p-3 rounded-md space-y-2">
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600">Name:</Text>
                          <Text className="font-medium text-gray-800">
                            {receipt.tenant.name}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600">Email:</Text>
                          <Text className="text-gray-800">
                            {receipt.tenant.email}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600">Phone:</Text>
                          <Text className="text-gray-800">
                            {receipt.tenant.phone}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Lease Information */}
                  {receipt.lease && (
                    <View className="space-y-3">
                      <Text className="font-semibold text-gray-800">Lease Information</Text>
                      <View className="bg-gray-50 p-3 rounded-md space-y-2">
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600">Monthly Rent:</Text>
                          <Text className="font-medium text-gray-800">
                            {formatUGX(receipt.lease.monthlyRent)}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-gray-600">Lease Period:</Text>
                          <Text className="text-gray-800">
                            {new Date(receipt.lease.startDate).toLocaleDateString()} - {receipt.lease.endDate ? new Date(receipt.lease.endDate).toLocaleDateString() : 'Ongoing'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Footer */}
                  <View className="items-center pt-4 border-t border-gray-200">
                    <Text className="text-xs text-gray-500 text-center">
                      Generated on {new Date(receipt.generatedAt).toLocaleString()}
                    </Text>
                    <Text className="text-xs text-gray-500 text-center mt-1">
                      Thank you for your payment!
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          )}
        </ScrollView>

        {/* Actions */}
        {receipt && (
          <View className="bg-white px-4 pb-6 pt-4 border-t border-gray-200">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleShare}
                className="flex-1 bg-[#524768] py-3 rounded-md items-center flex-row justify-center"
              >
                <MaterialIcons name="share" size={20} color="white" />
                <Text className="text-white font-semibold">Share Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="px-6 py-3 border border-gray-300 rounded-md items-center"
              >
                <Text className="text-gray-700 font-semibold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}