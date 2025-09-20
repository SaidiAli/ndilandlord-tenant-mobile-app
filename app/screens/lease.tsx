import { ScrollView, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../../lib/api';
import { Lease } from '../../types';
import { useState, useEffect } from 'react';

export default function LeaseScreen() {
  const [currentLease, setCurrentLease] = useState<Lease | null>(null);

  // Fetch lease information
  const { data: leases, isLoading, error } = useQuery({
    queryKey: ['tenant-lease'],
    queryFn: tenantApi.getLeaseInfo,
  });

  useEffect(() => {
    console.log(leases);
    if (leases && leases.length > 0) {
      // Get the most recent active lease
      const activeLease = leases.find(lease => lease.status === 'active');
      setCurrentLease(activeLease || leases[0]);
    }
  }, [leases]);

  const handleCallLandlord = async (phoneNumber: string) => {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const canCall = await Linking.canOpenURL(phoneUrl);
      
      if (canCall) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Unable to make phone calls on this device');
      }
    } catch {
      Alert.alert('Error', 'Failed to initiate phone call');
    }
  };

  const handleEmailLandlord = async (email: string) => {
    try {
      const emailUrl = `mailto:${email}`;
      const canEmail = await Linking.canOpenURL(emailUrl);
      
      if (canEmail) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'No email app available on this device');
      }
    } catch {
      Alert.alert('Error', 'Failed to open email app');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <LoadingSpinner size="large" />
        <Text className="text-gray-600 mt-4">Loading lease information...</Text>
      </View>
    );
  }

  if (error || !currentLease) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-4">
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text className="text-xl font-semibold text-gray-800 mt-4 text-center">
          Unable to Load Lease Information
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          {error ? 'Failed to fetch lease data. Please try again later.' : 'No lease information found. Contact your landlord if this seems incorrect.'}
        </Text>
      </View>
    );
  }

  // Ensure we have the minimum required data
  if (!currentLease.startDate || !currentLease.endDate) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-4">
        <MaterialIcons name="warning" size={48} color="#F59E0B" />
        <Text className="text-xl font-semibold text-gray-800 mt-4 text-center">
          Incomplete Lease Data
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          Some lease information is missing. Please contact your landlord to update your lease details.
        </Text>
      </View>
    );
  }

  const endDate = new Date(currentLease.endDate);
  const currentDate = new Date();
  const daysUntilExpiry = Math.ceil(
    (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Handle invalid dates
  const isValidEndDate = !isNaN(endDate.getTime());
  const isValidStartDate = !isNaN(new Date(currentLease.startDate).getTime());

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'active':
        return { status: 'success' as const, text: 'Active' };
      case 'draft':
        return { status: 'warning' as const, text: 'Draft' };
      case 'expired':
        return { status: 'error' as const, text: 'Expired' };
      case 'terminated':
        return { status: 'error' as const, text: 'Terminated' };
      default:
        return { status: 'default' as const, text: status };
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-4">
          {/* Header */}
          <Text className="text-2xl font-semibold text-gray-800 mb-6">
            Lease Information
          </Text>

          {/* Lease Status Card */}
          <Card className="mb-4">
            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-800">
                  Lease Status
                </Text>
                {/* <StatusBadge {...getStatusBadgeProps(currentLease.status)} /> */}
              </View>
              
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Lease Period:</Text>
                  <Text className="font-medium text-gray-800">
                    {isValidStartDate && isValidEndDate 
                      ? `${new Date(currentLease.startDate).toLocaleDateString()} - ${new Date(currentLease.endDate).toLocaleDateString()}`
                      : 'Date information unavailable'
                    }
                  </Text>
                </View>
                {isValidEndDate && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Days Remaining:</Text>
                    <Text className={`font-bold ${daysUntilExpiry < 60 ? 'text-yellow-600' : daysUntilExpiry < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} days`}
                    </Text>
                  </View>
                )}
              </View>

              {isValidEndDate && daysUntilExpiry < 60 && daysUntilExpiry > 0 && (
                <View className="bg-yellow-50 p-3 rounded-md mt-2">
                  <Text className="text-yellow-700 text-sm font-medium">
                    Your lease expires soon. Contact your landlord about renewal options.
                  </Text>
                </View>
              )}
              {isValidEndDate && daysUntilExpiry < 0 && (
                <View className="bg-red-50 p-3 rounded-md mt-2">
                  <Text className="text-red-700 text-sm font-medium">
                    Your lease has expired. Please contact your landlord immediately.
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Property Information */}
          {currentLease.unit?.property && (
            <Card className="mb-4">
              <View className="space-y-3">
                <Text className="text-lg font-semibold text-gray-800">
                  Property Information
                </Text>
                
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Property:</Text>
                    <Text className="font-medium text-gray-800 text-right flex-1 ml-2">
                      {currentLease.unit.property.name}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Address:</Text>
                    <Text className="font-medium text-gray-800 text-right flex-1 ml-2">
                      {currentLease.unit.property.address}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">City, State:</Text>
                    <Text className="font-medium text-gray-800">
                      {currentLease.unit.property.city}, {currentLease.unit.property.state} {currentLease.unit.property.zipCode || ''}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          )}

          {/* Unit Details */}
          {currentLease.unit && (
            <Card className="mb-4">
              <View className="space-y-3">
                <Text className="text-lg font-semibold text-gray-800">
                  Unit Details
                </Text>
                
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Unit Number:</Text>
                    <Text className="font-medium text-gray-800">
                      {currentLease.unit.unitNumber}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Bedrooms:</Text>
                    <Text className="font-medium text-gray-800">
                      {currentLease.unit.bedrooms}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Bathrooms:</Text>
                    <Text className="font-medium text-gray-800">
                      {currentLease.unit.bathrooms}
                    </Text>
                  </View>
                  {currentLease.unit.squareFeet && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Square Feet:</Text>
                      <Text className="font-medium text-gray-800">
                        {currentLease.unit.squareFeet} sq ft
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Financial Terms */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Financial Terms
              </Text>
              
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Monthly Rent:</Text>
                  <Text className="text-lg font-bold text-[#2D5A4A]">
                    UGX {currentLease.monthlyRent.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Security Deposit:</Text>
                  <Text className="font-medium text-gray-800">
                    UGX {currentLease.deposit.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Landlord Contact */}
          {currentLease.landlord && (
            <Card className="mb-4">
              <View className="space-y-3">
                <Text className="text-lg font-semibold text-gray-800">
                  Landlord Contact
                </Text>
                
                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Name:</Text>
                    <Text className="font-medium text-gray-800">
                      {currentLease.landlord.firstName} {currentLease.landlord.lastName}
                    </Text>
                  </View>
                  
                  {currentLease.landlord.email && (
                    <TouchableOpacity 
                      className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100 -ml-2"
                      onPress={() => handleEmailLandlord(currentLease.landlord!.email!)}
                    >
                      <Text className="text-gray-600">Email:</Text>
                      <View className="flex-row items-center space-x-2">
                        <Text className="font-medium text-[#2D5A4A]">
                          {currentLease.landlord.email}
                        </Text>
                        <MaterialIcons name="email" size={16} color="#2D5A4A" />
                      </View>
                    </TouchableOpacity>
                  )}

                  {currentLease.landlord.phone && (
                    <TouchableOpacity 
                      className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100 -ml-2"
                      onPress={() => handleCallLandlord(currentLease.landlord!.phone!)}
                    >
                      <Text className="text-gray-600">Phone:</Text>
                      <View className="flex-row items-center space-x-2">
                        <Text className="font-medium text-[#2D5A4A]">
                          {currentLease.landlord.phone}
                        </Text>
                        <MaterialIcons name="phone" size={16} color="#2D5A4A" />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Documents */}
          <Card className="mb-6">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Lease Documents
              </Text>
              
              <View className="bg-yellow-50 p-3 rounded-md">
                <View className="flex-row items-center space-x-2">
                  <MaterialIcons name="info" size={20} color="#D97706" />
                  <Text className="text-yellow-700 text-sm font-medium flex-1">
                    Document management is coming soon. Contact your landlord for lease documents.
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}