import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';
import { useCarStore } from '../store/useCarStore';
import { DatabaseService, Car } from '../services/DatabaseService';
import { ExportService } from '../services/ExportService';

export default function CarListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
    const insets = useSafeAreaInsets();
    const { theme, accentColor } = useSettingsStore();
    const { cars, loadCars, deleteCar, selectCar, selectedCarId } = useCarStore();

    const isDark = theme === 'dark' || (theme === 'system' && true);

    useEffect(() => {
        loadCars();
        navigation.setOptions({
            headerShown: true,
            headerTitle: 'My Vehicles',
            headerStyle: { backgroundColor: isDark ? 'black' : 'white' },
            headerTintColor: isDark ? 'white' : 'black',
            headerTitleStyle: { fontFamily: 'Orbitron_600SemiBold' },
            headerRight: () => null, // Remove header Add button
        });
    }, [navigation, isDark, accentColor]);

    const handleDelete = (car: Car) => {
        Alert.alert(
            "Delete Vehicle",
            `Are you sure you want to delete ${car.nickname}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteCar(car.id)
                }
            ]
        );
    };

    const handleExport = async (car: Car) => {
        const trips = DatabaseService.getTripsByCar(car.id);
        if (trips.length === 0) {
            Alert.alert('No Trips', 'This vehicle has no recorded trips to export.');
            return;
        }

        const csvData = ExportService.generateCSV(trips, [car]);
        const filename = `Trips_${car.nickname.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

        Alert.alert(
            'Export Options',
            'Choose how you want to export the data',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Share',
                    onPress: async () => {
                        try {
                            await ExportService.exportCSV(csvData, filename);
                        } catch (error) {
                            Alert.alert('Export Failed', 'An error occurred while sharing data.');
                        }
                    }
                },
                {
                    text: 'Download',
                    onPress: async () => {
                        try {
                            const success = await ExportService.saveToDownloads(csvData, filename);
                            if (success) {
                                Alert.alert('Success', 'File saved successfully.');
                            }
                        } catch (error) {
                            Alert.alert('Export Failed', 'An error occurred while saving data.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Car }) => {
        const isSelected = item.id === selectedCarId;
        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: isDark ? '#111' : 'white',
                        borderColor: isSelected ? accentColor : (isDark ? '#333' : '#e5e7eb'),
                        borderWidth: isSelected ? 2 : 1
                    }
                ]}
                onPress={() => selectCar(item.id)}
            >
                <View style={styles.cardContent}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.headerRow}>
                            <Ionicons
                                name={item.type === 'bike' ? 'bicycle' : 'car-sport'}
                                size={20}
                                color={accentColor}
                                style={{ marginRight: 8 }}
                            />
                            <Text style={[styles.nickname, { color: isDark ? 'white' : 'black' }]}>{item.nickname}</Text>
                        </View>

                        {(item.make || item.model || item.variant) && (
                            <Text style={[styles.details, { color: isDark ? '#9ca3af' : '#4b5563' }]}>
                                {[item.make, item.model, item.variant].filter(Boolean).join(' ')}
                            </Text>
                        )}

                        {item.regNumber ? (
                            <Text style={[styles.regNumber, { color: accentColor }]}>{item.regNumber}</Text>
                        ) : null}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => handleExport(item)} style={styles.actionBtn}>
                            <Ionicons name="download-outline" size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('AddCar', { carId: item.id })} style={styles.actionBtn}>
                            <Ionicons name="pencil-outline" size={20} color={isDark ? '#fbbf24' : '#d97706'} />
                        </TouchableOpacity>

                        {isSelected && (
                            <View style={styles.checkIcon}>
                                <Ionicons name="checkmark-circle" size={24} color={accentColor} />
                            </View>
                        )}

                        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={20} color={isDark ? '#ef4444' : '#dc2626'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? 'black' : '#f3f4f6' }]}>
            <FlatList
                data={cars}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                            No vehicles added yet. Add your first vehicle!
                        </Text>
                    </View>
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: accentColor, bottom: insets.bottom + 20 }]}
                onPress={() => navigation.navigate('AddCar' as never)}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    card: {
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    nickname: {
        fontFamily: 'Orbitron_600SemiBold',
        fontSize: 18,
    },
    details: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 14,
        marginBottom: 2,
    },
    regNumber: {
        fontFamily: 'Rajdhani_600SemiBold',
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 8,
        marginLeft: 4,
    },
    checkIcon: {
        marginLeft: 4,
        marginRight: 4,
    },
    deleteBtn: {
        padding: 8,
        marginLeft: 8,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 16,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        alignSelf: 'center',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});
