import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { StatusBadge, getMaintenanceStatusBadge } from '../../components/ui/StatusBadge';

// Mock property data
const mockProperty = {
  name: 'Maple Gardens Apartments',
  address: '123 Maple Street, Springfield, IL 62701',
  description: 'Modern apartment complex with excellent amenities and convenient location.',
  amenities: [
    'Swimming Pool',
    'Fitness Center',
    'Laundry Facilities',
    'Parking Garage',
    '24/7 Security',
    'Pet-Friendly',
  ],
  emergencyContact: {
    name: 'Property Management Office',
    phone: '(555) 123-4567',
    email: 'emergency@maplegardens.com',
  },
  officeHours: {
    weekdays: '9:00 AM - 6:00 PM',
    weekends: '10:00 AM - 4:00 PM',
  },
};

const mockMaintenanceRequests = [
  {
    id: '1',
    title: 'Leaky kitchen faucet',
    description: 'The kitchen faucet is dripping constantly',
    status: 'in_progress',
    priority: 'medium',
    submittedDate: '2023-12-15',
  },
  {
    id: '2',
    title: 'AC not cooling properly',
    description: 'Air conditioning unit not maintaining temperature',
    status: 'completed',
    priority: 'high',
    submittedDate: '2023-12-10',
    completedDate: '2023-12-12',
  },
];

export default function PropertyScreen() {
  const handleEmergencyCall = () => {
    // TODO: Implement phone call
    console.log('Emergency call');
  };

  const handleSubmitMaintenance = () => {
    // TODO: Navigate to maintenance form
    console.log('Submit maintenance request');
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-4">
          {/* Header */}
          <Text className="text-2xl font-semibold text-gray-800 mb-6">
            Property Information
          </Text>

          {/* Property Overview */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                {mockProperty.name}
              </Text>
              
              <View className="flex-row items-start space-x-2">
                <MaterialIcons name="location-on" size={16} color="#6B7280" style={{ marginTop: 2 }} />
                <Text className="text-gray-600 text-sm flex-1">
                  {mockProperty.address}
                </Text>
              </View>

              <Text className="text-gray-700 text-sm leading-5">
                {mockProperty.description}
              </Text>
            </View>
          </Card>

          {/* Emergency Contact */}
          <Card className="mb-4">
            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-800">
                  Emergency Contact
                </Text>
                <MaterialIcons name="emergency" size={20} color="#EF4444" />
              </View>
              
              <View className="space-y-3">
                <Text className="font-medium text-gray-800">
                  {mockProperty.emergencyContact.name}
                </Text>
                
                <TouchableOpacity
                  className="bg-red-500 py-3 rounded-md flex-row items-center justify-center space-x-2 active:bg-red-600"
                  onPress={handleEmergencyCall}
                >
                  <MaterialIcons name="phone" size={20} color="white" />
                  <Text className="text-white font-medium">
                    Call Emergency: {mockProperty.emergencyContact.phone}
                  </Text>
                </TouchableOpacity>

                <Text className="text-sm text-gray-600 text-center">
                  For non-emergency maintenance requests, use the form below
                </Text>
              </View>
            </View>
          </Card>

          {/* Office Hours */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Office Hours
              </Text>
              
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Monday - Friday:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockProperty.officeHours.weekdays}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Weekends:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockProperty.officeHours.weekends}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Amenities */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Property Amenities
              </Text>
              
              <View className="space-y-2">
                {mockProperty.amenities.map((amenity, index) => (
                  <View key={index} className="flex-row items-center space-x-2">
                    <MaterialIcons name="check-circle" size={16} color="#10B981" />
                    <Text className="text-gray-700 text-sm">
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Maintenance Request Form */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Submit Maintenance Request
              </Text>
              
              <Text className="text-gray-600 text-sm">
                Need something fixed? Submit a maintenance request and we'll get it taken care of.
              </Text>

              <TouchableOpacity
                className="border border-[#2D5A4A] py-3 rounded-md flex-row items-center justify-center space-x-2 active:bg-[#2D5A4A]/10"
                onPress={handleSubmitMaintenance}
              >
                <MaterialIcons name="build" size={20} color="#2D5A4A" />
                <Text className="text-[#2D5A4A] font-medium">
                  Submit New Request
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Recent Maintenance Requests */}
          <Card className="mb-6">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Your Maintenance Requests
              </Text>

              <View className="space-y-0">
                {mockMaintenanceRequests.map((request, index) => (
                  <TouchableOpacity
                    key={request.id}
                    className="py-3 rounded-md active:bg-gray-50"
                  >
                    <View className="space-y-2">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 space-y-1">
                          <Text className="font-medium text-gray-800">
                            {request.title}
                          </Text>
                          <Text className="text-sm text-gray-600" numberOfLines={2}>
                            {request.description}
                          </Text>
                          <View className="flex-row space-x-2 items-center mt-1">
                            <Text className="text-xs text-gray-500">
                              Submitted: {new Date(request.submittedDate).toLocaleDateString()}
                            </Text>
                            {request.completedDate && (
                              <Text className="text-xs text-gray-500">
                                • Completed: {new Date(request.completedDate).toLocaleDateString()}
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        <View className="items-end space-y-1">
                          <StatusBadge {...getMaintenanceStatusBadge(request.status)} />
                          <Text className="text-xs text-gray-500 capitalize">
                            {request.priority} Priority
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {index < mockMaintenanceRequests.length - 1 && (
                      <View className="border-t border-gray-200 mt-3" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {mockMaintenanceRequests.length === 0 && (
                <Text className="text-gray-500 text-sm text-center py-4">
                  No maintenance requests submitted yet
                </Text>
              )}
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}