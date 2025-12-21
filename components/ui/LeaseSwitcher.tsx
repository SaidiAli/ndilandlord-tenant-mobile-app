import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useLease } from '../../hooks/LeaseContext';
import { StatusBadge } from './StatusBadge';

export function LeaseSwitcher() {
    const { allLeases, selectedLease, switchLease } = useLease();
    const [modalVisible, setModalVisible] = useState(false);

    // If there's only one lease or no leases, don't show the switcher
    if (allLeases.length <= 1) {
        return null;
    }

    const handleSelectLease = (leaseId: string) => {
        switchLease(leaseId);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-full space-x-2"
                style={{ alignSelf: 'flex-start' }}
            >
                <View>
                    <Text className="text-white text-xs font-medium">
                        {selectedLease?.property?.name || 'Unknown Property'}
                    </Text>
                    <Text className="text-white/80 text-[10px]">
                        Unit {selectedLease?.unit?.unitNumber}
                    </Text>
                </View>
                <MaterialIcons name="arrow-drop-down" size={20} color="white" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/50 justify-end"
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        className="bg-white rounded-t-3xl p-5 max-h-[70%]"
                    >
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-800">Select Lease</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={allLeases}
                            keyExtractor={(item) => item.lease.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleSelectLease(item.lease.id)}
                                    className={`p-4 rounded-xl mb-3 border ${selectedLease?.lease.id === item.lease.id
                                        ? 'border-[#2D5A4A] bg-[#2D5A4A]/5'
                                        : 'border-gray-200'
                                        }`}
                                >
                                    <View className="flex-row justify-between items-start">
                                        <View>
                                            <Text className="font-semibold text-gray-800 text-lg">
                                                {item.property?.name || 'Unknown Property'}
                                            </Text>
                                            <Text className="text-gray-600 mt-1">
                                                Unit {item.unit?.unitNumber} • {item.property?.address}
                                            </Text>
                                            <View className="flex-row items-center mt-2 space-x-2">
                                                <Text className="text-xs text-gray-500">
                                                    {new Date(item.lease.startDate).toLocaleDateString()} - {new Date(item.lease.endDate).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <StatusBadge status={item.lease.status === 'active' ? 'success' : 'info'} text={item.lease.status} />
                                            {selectedLease?.lease.id === item.lease.id && (
                                                <View className="mt-2">
                                                    <MaterialIcons name="check-circle" size={20} color="#2D5A4A" />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
}
