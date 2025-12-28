import { View, TouchableOpacity, Text } from "react-native";
import { Card } from "../ui/Card";
import { StatusBadge, getMaintenanceStatusBadge } from "../ui/StatusBadge";

export default function MaintenanceRequestSection() {
    // Mock data - will be replaced with real API calls
    const mockData = {
        currentLease: {
            unit: 'Unit 2A',
            property: '123 Maple Street',
            rentAmount: 1500000, // UGX amount
            nextDueDate: '2024-01-01',
        },
        upcomingPayment: {
            amount: 1500000, // UGX amount
            dueDate: '2024-01-01',
            status: 'pending',
        },
        recentPayments: [
            { id: '1', amount: 1500000, date: '2023-12-01', status: 'completed' },
            { id: '2', amount: 1500000, date: '2023-11-01', status: 'completed' },
        ],
        maintenanceRequests: [
            { id: '1', title: 'Leaky faucet', status: 'in_progress', date: '2023-12-15' },
            { id: '2', title: 'AC not working', status: 'completed', date: '2023-12-10' },
        ],
    };

    return (
        <Card className="mb-6">
            <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                    <Text className="text-lg font-semibold text-gray-800">
                        Maintenance Requests
                    </Text>
                    <TouchableOpacity>
                        <Text className="text-[#524768] text-sm">
                            View All
                        </Text>
                    </TouchableOpacity>
                </View>
                <View className="space-y-3">
                    {mockData.maintenanceRequests.map((request, index) => (
                        <View key={request.id}>
                            <View className="flex-row justify-between items-center">
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-800">
                                        {request.title}
                                    </Text>
                                    <Text className="text-gray-600 text-sm">
                                        {new Date(request.date).toLocaleDateString()}
                                    </Text>
                                </View>
                                <StatusBadge {...getMaintenanceStatusBadge(request.status)} />
                            </View>
                            {index < mockData.maintenanceRequests.length - 1 && (
                                <View className="border-t border-gray-200 mt-3" />
                            )}
                        </View>
                    ))}
                </View>
            </View>
        </Card>
    )
}