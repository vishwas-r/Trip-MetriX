import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { TripDetailScreenRouteProp } from '../navigation/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';
import { DatabaseService, TripPoint } from '../services/DatabaseService';
import { LeafletMap } from '../components/LeafletMap';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader } from '../components/ScreenHeader';

export default function TripDetailScreen() {
    const route = useRoute<TripDetailScreenRouteProp>();
    const navigation = useNavigation();
    const { trip } = route.params;
    const { theme, accentColor } = useSettingsStore();
    const insets = useSafeAreaInsets();
    const [tripPoints, setTripPoints] = useState<TripPoint[]>([]);
    const [startAddress, setStartAddress] = useState<string>('Loading address...');
    const [endAddress, setEndAddress] = useState<string>('Loading address...');

    // Theme Colors
    const isDark = theme === 'dark' || (theme === 'system' && true);
    const bgColor = isDark ? 'black' : '#f3f4f6';
    const cardColor = isDark ? '#1f2937' : 'white';
    const textColor = isDark ? 'white' : '#111827';
    const secondaryTextColor = isDark ? '#9ca3af' : '#4b5563';
    const borderColor = isDark ? '#374151' : '#e5e7eb';

    useEffect(() => {
        const points = DatabaseService.getTripPoints(trip.id);
        setTripPoints(points);

        if (points.length > 0) {
            fetchAddress(points[0].latitude, points[0].longitude, setStartAddress);
            fetchAddress(points[points.length - 1].latitude, points[points.length - 1].longitude, setEndAddress);
        } else {
            setStartAddress('No location data');
            setEndAddress('No location data');
        }
    }, [trip.id]);

    const fetchAddress = async (lat: number, lng: number, setter: (addr: string) => void) => {
        try {
            const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (address) {
                const parts = [
                    address.name,
                    address.street,
                    address.district,
                    address.city,
                    address.region,
                    address.postalCode
                ].filter(Boolean);
                setter(parts.join(', '));
            } else {
                setter('Address not found');
            }
        } catch (error) {
            console.log('Error fetching address:', error);
            setter('Address unavailable');
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        // Format: "Oct 12, 10:30 AM"
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
            date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const formatDuration = (start: number, end?: number | null) => {
        if (!end) return 'In Progress';
        const diff = end - start;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} min`;
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied', 'Address copied to clipboard');
    };

    const startPoint = tripPoints.length > 0 ? tripPoints[0] : null;

    return (
        <View style={[styles.safeArea, { backgroundColor: bgColor, paddingTop: insets.top }]}>
            <ScreenHeader
                title="Trip Info"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                rightAction={
                    <TouchableOpacity onPress={() => {
                        Alert.alert(
                            "Delete Trip",
                            "Are you sure you want to delete this trip? This action cannot be undone.",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () => {
                                        DatabaseService.deleteTrip(trip.id);
                                        navigation.goBack();
                                    }
                                }
                            ]
                        );
                    }} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={24} color={isDark ? '#ef4444' : '#dc2626'} />
                    </TouchableOpacity>
                }
            />

            <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
                {/* Map Section */}
                <View style={styles.mapContainer}>
                    {startPoint ? (
                        <LeafletMap
                            latitude={startPoint.latitude}
                            longitude={startPoint.longitude}
                            path={tripPoints}
                            accentColor={accentColor}
                            fitToPath={true}
                            showMarkers={true}
                        />
                    ) : (
                        <View style={[styles.mapPlaceholder, { borderColor: borderColor }]}>
                            <Text style={{ color: secondaryTextColor, fontFamily: 'Rajdhani_500Medium' }}>No map data available</Text>
                        </View>
                    )}
                </View>

                {/* Start/End Points */}
                <View style={[styles.pointsContainer, { borderBottomWidth: 1, borderBottomColor: borderColor, marginBottom: 20 }]}>
                    <View style={[styles.timelineLine, { backgroundColor: borderColor }]} />

                    {/* Start Point */}
                    <View style={styles.pointRow}>
                        <View style={[styles.dot, { backgroundColor: '#4b5563' }]} />
                        <View style={styles.pointContent}>
                            <Text style={[styles.pointLabel, { color: secondaryTextColor }]}>Start</Text>
                            <TouchableOpacity onLongPress={() => copyToClipboard(startAddress)}>
                                <Text style={[styles.pointAddress, { color: textColor }]}>{startAddress}</Text>
                            </TouchableOpacity>
                            <Text style={[styles.pointTime, { color: secondaryTextColor }]}>{formatTime(trip.startTime)}</Text>
                        </View>
                    </View>

                    {/* End Point */}
                    <View style={[styles.pointRow, { marginTop: 16 }]}>
                        <View style={[styles.dot, { backgroundColor: '#4b5563' }]} />
                        <View style={styles.pointContent}>
                            <Text style={[styles.pointLabel, { color: secondaryTextColor }]}>Goal</Text>
                            <TouchableOpacity onLongPress={() => copyToClipboard(endAddress)}>
                                <Text style={[styles.pointAddress, { color: textColor }]}>{endAddress}</Text>
                            </TouchableOpacity>
                            <Text style={[styles.pointTime, { color: secondaryTextColor }]}>{trip.endTime ? formatTime(trip.endTime) : 'In Progress'}</Text>
                        </View>
                    </View>
                </View>

                {/* Travel Info Grid */}
                <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        <View style={styles.gridItem}>
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                <MaterialCommunityIcons name="map-marker-distance" size={24} color={textColor} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.gridLabel, { color: secondaryTextColor }]}>Travel Distance</Text>
                                <Text style={[styles.gridValue, { color: accentColor }]}>{(trip.distance / 1000).toFixed(2)} km</Text>
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                <Ionicons name="time-outline" size={24} color={textColor} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.gridLabel, { color: secondaryTextColor }]}>Travel Time</Text>
                                <Text style={[styles.gridValue, { color: accentColor }]}>{formatDuration(trip.startTime, trip.endTime)}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.gridRow}>
                        <View style={styles.gridItem}>
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                <Ionicons name="speedometer-outline" size={24} color={textColor} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.gridLabel, { color: secondaryTextColor }]}>Top Speed</Text>
                                <Text style={[styles.gridValue, { color: accentColor }]}>{(trip.maxSpeed * 3.6).toFixed(1)} km/h</Text>
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                                <MaterialCommunityIcons name="speedometer" size={24} color={textColor} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.gridLabel, { color: secondaryTextColor }]}>Avg. Speed</Text>
                                <Text style={[styles.gridValue, { color: accentColor }]}>{(trip.avgSpeed * 3.6).toFixed(1)} km/h</Text>
                            </View>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    navTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    container: {
        flex: 1,
    },
    mapContainer: {
        width: '100%',
        aspectRatio: 1.25,
        backgroundColor: '#000',
    },
    mapPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
    },
    pointsContainer: {
        marginHorizontal: 24,
        paddingVertical: 16,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 4.5,
        top: 24,
        bottom: 40,
        width: 1,
        zIndex: 0,
    },
    pointRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        position: 'relative',
        zIndex: 1,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 6,
        marginRight: 16,
    },
    pointContent: {
        flex: 1,
    },
    pointLabel: {
        fontSize: 11,
        marginBottom: 2,
        fontFamily: 'Rajdhani_600SemiBold',
        textTransform: 'uppercase',
    },
    pointAddress: {
        fontSize: 14,
        marginBottom: 2,
        lineHeight: 18,
        fontFamily: 'Rajdhani_500Medium',
    },
    pointTime: {
        fontSize: 12,
        fontFamily: 'Rajdhani_500Medium',
    },
    gridContainer: {
        marginHorizontal: 24,
        paddingTop: 0,
        paddingBottom: 20,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    gridItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        marginLeft: 10,
        flex: 1,
    },
    gridLabel: {
        fontSize: 11,
        marginBottom: 2,
        fontFamily: 'Rajdhani_600SemiBold',
        textTransform: 'uppercase',
    },
    gridValue: {
        fontSize: 16,
        fontFamily: 'Orbitron_700Bold',
    },
});
