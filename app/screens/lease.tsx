import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';

// Mock lease data
const mockLease = {
  id: '1',
  property: {
    name: 'Maple Gardens Apartments',
    address: '123 Maple Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
  },
  unit: {
    number: '2A',
    bedrooms: 2,
    bathrooms: 1.5,
    squareFeet: 950,
  },
  terms: {
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    monthlyRent: 1200,
    deposit: 1200,
    status: 'active',
  },
  landlord: {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
  },
  documents: [
    { id: '1', name: 'Lease Agreement', type: 'pdf', date: '2023-05-15' },
    { id: '2', name: 'Move-in Checklist', type: 'pdf', date: '2023-06-01' },
    { id: '3', name: 'Property Rules', type: 'pdf', date: '2023-05-15' },
  ],
};

export default function LeaseScreen() {
  const handleDownloadDocument = (documentId: string) => {
    // TODO: Implement document download
    console.log('Download document:', documentId);
  };

  const daysUntilExpiry = Math.ceil(
    (new Date(mockLease.terms.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

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
                <StatusBadge status="success" text="Active" />
              </View>
              
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Lease Period:</Text>
                  <Text className="font-medium text-gray-800">
                    {new Date(mockLease.terms.startDate).toLocaleDateString()} - {new Date(mockLease.terms.endDate).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Days Remaining:</Text>
                  <Text className={`font-bold ${daysUntilExpiry < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {daysUntilExpiry} days
                  </Text>
                </View>
              </View>

              {daysUntilExpiry < 60 && (
                <View className="bg-yellow-50 p-3 rounded-md mt-2">
                  <Text className="text-yellow-700 text-sm font-medium">
                    Your lease expires soon. Contact your landlord about renewal options.
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Property Information */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Property Information
              </Text>
              
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Property:</Text>
                  <Text className="font-medium text-gray-800 text-right flex-1 ml-2">
                    {mockLease.property.name}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Address:</Text>
                  <Text className="font-medium text-gray-800 text-right flex-1 ml-2">
                    {mockLease.property.address}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">City, State:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockLease.property.city}, {mockLease.property.state} {mockLease.property.zipCode}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Unit Details */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Unit Details
              </Text>
              
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Unit Number:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockLease.unit.number}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Bedrooms:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockLease.unit.bedrooms}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Bathrooms:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockLease.unit.bathrooms}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Square Feet:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockLease.unit.squareFeet} sq ft
                  </Text>
                </View>
              </View>
            </View>
          </Card>

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
                    ${mockLease.terms.monthlyRent}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Security Deposit:</Text>
                  <Text className="font-medium text-gray-800">
                    ${mockLease.terms.deposit}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Landlord Contact */}
          <Card className="mb-4">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Landlord Contact
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Name:</Text>
                  <Text className="font-medium text-gray-800">
                    {mockLease.landlord.name}
                  </Text>
                </View>
                
                <TouchableOpacity className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100 -ml-2">
                  <Text className="text-gray-600">Email:</Text>
                  <View className="flex-row items-center space-x-2">
                    <Text className="font-medium text-[#2D5A4A]">
                      {mockLease.landlord.email}
                    </Text>
                    <MaterialIcons name="email" size={16} color="#2D5A4A" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row justify-between items-center py-2 px-2 rounded-md active:bg-gray-100 -ml-2">
                  <Text className="text-gray-600">Phone:</Text>
                  <View className="flex-row items-center space-x-2">
                    <Text className="font-medium text-[#2D5A4A]">
                      {mockLease.landlord.phone}
                    </Text>
                    <MaterialIcons name="phone" size={16} color="#2D5A4A" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Documents */}
          <Card className="mb-6">
            <View className="space-y-3">
              <Text className="text-lg font-semibold text-gray-800">
                Lease Documents
              </Text>
              
              <View className="space-y-0">
                {mockLease.documents.map((document, index) => (
                  <TouchableOpacity
                    key={document.id}
                    className="py-3 rounded-md active:bg-gray-50"
                    onPress={() => handleDownloadDocument(document.id)}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center space-x-3 flex-1">
                        <MaterialIcons name="description" size={20} color="#6B7280" />
                        <View className="flex-1">
                          <Text className="font-medium text-gray-800">
                            {document.name}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            {new Date(document.date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <MaterialIcons name="download" size={20} color="#2D5A4A" />
                    </View>
                    
                    {index < mockLease.documents.length - 1 && (
                      <View className="border-t border-gray-200 mt-3" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}