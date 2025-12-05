import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { LocationService, LocationData } from '../services/LocationService';
import { Speedometer } from '../components/Speedometer';
import { useSettingsStore } from '../store/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '../store/tripStore';
import { useCarStore } from '../store/useCarStore';
import { useNavigation } from '@react-navigation/native';
import { DashboardScreenNavigationProp } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LeafletMap } from '../components/LeafletMap';
import { useKeepAwake } from 'expo-keep-awake';
import { CalibrationModal } from '../components/CalibrationModal';

export default function DashboardScreen() {
    useKeepAwake();
    const { isHudMode, toggleHudMode, unit, setUnit, speedLimit, isSpeedLimitEnabled, toggleSpeedLimit, setSpeedLimit, accentColor, theme, isDebugEnabled, isMapEnabled, isKeepScreenOnEnabled, mapOrientation, setMapOrientation } = useSettingsStore();
    const { isRecording, startTrip, stopTrip, currentLocation, path } = useTripStore();
    const { getSelectedCar, loadCars } = useCarStore();
    const selectedCar = getSelectedCar();

    useEffect(() => {
        loadCars();
    }, []);

    const navigation = useNavigation<DashboardScreenNavigationProp>();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // Responsive Sizing
    const headerBtnFontSize = Math.max(10, width * 0.03); // Min 10, scale with width
    const headerBtnPadding = Math.max(8, width * 0.02);
    const headerBtnMinWidth = Math.max(60, width * 0.15);

    const tripBtnFontSize = Math.max(14, width * 0.04); // Reduced from 0.045
    const tripBtnPadding = Math.max(16, width * 0.05); // Reduced from 0.08
    const tripBtnMinWidth = Math.max(140, width * 0.35); // Reduced min width

    const statusTextSize = Math.max(10, width * 0.032); // Reduced from 0.035
    const vehicleTextSize = Math.max(12, width * 0.035);

    // New responsive padding for status container
    const statusContainerPadding = Math.max(8, width * 0.03);



    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isMapView, setIsMapView] = useState(false);
    const [isFollowingUser, setIsFollowingUser] = useState(true);
    const [isCalibrationVisible, setCalibrationVisible] = useState(false);
    const [showAccuracyWarning, setShowAccuracyWarning] = useState(false);

    // Accuracy Monitoring
    useEffect(() => {
        if (isRecording && currentLocation?.accuracy) {
            // If accuracy is worse than 20 meters for a sustained period (simplified here to just check current)
            if (currentLocation.accuracy > 20) {
                setShowAccuracyWarning(true);
            } else {
                setShowAccuracyWarning(false);
            }
        } else {
            setShowAccuracyWarning(false);
        }
    }, [currentLocation, isRecording]);

    // Theme Colors
    const isDark = theme === 'dark' || (theme === 'system' && true); // Default to dark for system for now or use useColorScheme
    const bgColor = isDark ? 'black' : '#f3f4f6';
    const textColor = isDark ? 'white' : '#111827';
    const secondaryTextColor = isDark ? '#9ca3af' : '#4b5563';

    // Overlay Colors
    const overlayBgColor = isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)';
    const overlayTextColor = isDark ? '#e5e7eb' : '#374151';
    const overlayBorderColor = isDark ? '#374151' : '#d1d5db';

    useEffect(() => {
        (async () => {
            try {
                await LocationService.startTracking();
            } catch (e) {
                setErrorMsg('Permission to access location was denied. Please enable "While using the app" location access.');
            }
        })();
    }, []);



    const location = currentLocation;
    const speed = location?.speed ?? 0;
    const speedKmh = speed * 3.6;
    const isOverLimit = isSpeedLimitEnabled && speedKmh > speedLimit;

    const handleMapEvent = (event: { type: string }) => {
        if (event.type === 'map_drag') {
            setIsFollowingUser(false);
        } else if (event.type === 'toggle_orientation') {
            setMapOrientation(mapOrientation === 'north-up' ? 'heading-up' : 'north-up');
        } else if (event.type === 'locate_user') {
            setIsFollowingUser(true);
        }
    };



    return (
        <View style={[styles.container, { backgroundColor: bgColor, paddingTop: insets.top + 60 }, isOverLimit && styles.alertBackground]}>
            <View style={[styles.headerContainer, { top: insets.top + 10 }]}>
                {/* Limit Button */}
                <View style={styles.limitWrapper}>
                    <TouchableOpacity
                        onPress={toggleSpeedLimit}
                        style={[styles.headerButton, {
                            borderColor: isSpeedLimitEnabled ? accentColor : secondaryTextColor,
                            backgroundColor: isSpeedLimitEnabled ? accentColor : 'transparent',
                            paddingHorizontal: headerBtnPadding,
                            minWidth: headerBtnMinWidth
                        }]}
                    >
                        <Text style={[styles.headerButtonText, {
                            color: isSpeedLimitEnabled ? 'white' : secondaryTextColor,
                            fontSize: headerBtnFontSize
                        }]}>
                            LIMIT: {speedLimit}
                        </Text>
                    </TouchableOpacity>
                    {isSpeedLimitEnabled && (
                        <View style={styles.limitControlsFloating}>
                            <TouchableOpacity onPress={() => setSpeedLimit(Math.max(0, speedLimit - 5))} style={styles.limitControlBtn}>
                                <Text style={[styles.controlText, { color: secondaryTextColor }]}>-</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setSpeedLimit(speedLimit + 5)} style={styles.limitControlBtn}>
                                <Text style={[styles.controlText, { color: secondaryTextColor }]}>+</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Unit Button */}
                <TouchableOpacity
                    style={[styles.headerButton, {
                        borderColor: accentColor,
                        backgroundColor: 'transparent',
                        paddingHorizontal: headerBtnPadding,
                        minWidth: headerBtnMinWidth
                    }]}
                    onPress={() => {
                        const nextUnit = unit === 'km/h' ? 'mph' : unit === 'mph' ? 'm/s' : 'km/h';
                        setUnit(nextUnit);
                    }}
                >
                    <Text style={[styles.headerButtonText, { color: accentColor, fontSize: headerBtnFontSize }]}>{unit.toUpperCase()}</Text>
                </TouchableOpacity>

                {/* HUD Button */}
                <TouchableOpacity
                    style={[styles.headerButton, {
                        borderColor: accentColor,
                        backgroundColor: isHudMode ? accentColor : 'transparent',
                        paddingHorizontal: headerBtnPadding,
                        minWidth: headerBtnMinWidth
                    }]}
                    onPress={toggleHudMode}
                >
                    <Text style={[styles.headerButtonText, { color: isHudMode ? 'white' : accentColor, fontSize: headerBtnFontSize }]}>
                        {isHudMode ? 'HUD ON' : 'HUD OFF'}
                    </Text>
                </TouchableOpacity>

                {/* Map Toggle Button */}
                {isMapEnabled && (
                    <TouchableOpacity
                        style={[styles.headerButton, {
                            borderColor: accentColor,
                            backgroundColor: isMapView ? accentColor : 'transparent',
                            paddingHorizontal: headerBtnPadding,
                            minWidth: headerBtnMinWidth
                        }]}
                        onPress={() => setIsMapView(!isMapView)}
                    >
                        <Text style={[styles.headerButtonText, { color: isMapView ? 'white' : accentColor, fontSize: headerBtnFontSize }]}>
                            {isMapView ? 'MAP ON' : 'MAP OFF'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <CalibrationModal visible={isCalibrationVisible} onClose={() => setCalibrationVisible(false)} />

            {showAccuracyWarning && (
                <TouchableOpacity
                    style={[styles.accuracyWarning, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]}
                    onPress={() => setCalibrationVisible(true)}
                >
                    <Ionicons name="warning" size={16} color="white" />
                    <Text style={styles.accuracyWarningText}>LOW ACCURACY</Text>
                </TouchableOpacity>
            )}

            {errorMsg ? (
                <Text style={[styles.errorText, { color: 'red' }, isHudMode && styles.hudMode]}>{errorMsg}</Text>
            ) : (
                <ScrollView
                    style={[styles.scrollContainer, isHudMode && styles.hudMode]}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.topSection}>
                        {isMapView && location ? (
                            <View style={styles.squareMapContainer}>
                                <LeafletMap
                                    latitude={location.latitude}
                                    longitude={location.longitude}
                                    heading={location.heading || 0}
                                    accuracy={location.accuracy || 0}
                                    orientation={mapOrientation}
                                    path={isRecording ? path : []}
                                    accentColor={accentColor}
                                    fitToPath={!isFollowingUser && path.length > 0}
                                    showMarkers={!isRecording}
                                    followUser={isFollowingUser}
                                    isDark={isDark}
                                    onMapEvent={handleMapEvent}
                                />
                                {/* Speed Overlay */}
                                <View style={[styles.mapOverlay, { backgroundColor: overlayBgColor, borderColor: overlayBorderColor, borderWidth: 1 }]}>
                                    <Text style={[styles.mapSpeedText, { color: accentColor }]}>
                                        {(speed * (unit === 'km/h' ? 3.6 : unit === 'mph' ? 2.23694 : 1)).toFixed(0)}
                                    </Text>
                                    <Text style={[styles.mapUnitText, { color: overlayTextColor }]}>
                                        {unit}
                                    </Text>
                                </View>

                                {/* Status Pill - Map */}
                                <View style={[styles.statusContainer, styles.statusPillPosition, {
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    paddingHorizontal: statusContainerPadding
                                }]}>
                                    <Text style={[styles.statusText, { color: isRecording ? '#ef4444' : 'white', fontSize: statusTextSize }]}>
                                        {isRecording ? '● REC' : 'LIVE VIEW'}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.speedometerContainer}>
                                <Speedometer speed={speed} />
                                {/* Status Pill - Speedometer */}
                                <View style={[styles.statusContainer, styles.statusPillPosition, {
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    paddingHorizontal: statusContainerPadding
                                }]}>
                                    <Text style={[styles.statusText, { color: isRecording ? '#ef4444' : 'white', fontSize: statusTextSize }]}>
                                        {isRecording ? '● REC' : 'LIVE VIEW'}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: secondaryTextColor }]}>ACCURACY</Text>
                                <Text style={[styles.statValue, { color: textColor }]}>
                                    {location?.accuracy?.toFixed(0) || '--'} m
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statLabel, { color: secondaryTextColor }]}>ALTITUDE</Text>
                                <Text style={[styles.statValue, { color: textColor }]}>
                                    {location?.altitude?.toFixed(0) || '--'} m
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.bottomSection}>
                        <TouchableOpacity
                            style={[styles.tripButton, isRecording ? styles.stopButton : styles.startButton, {
                                borderColor: isRecording ? '#ef4444' : accentColor,
                                paddingHorizontal: tripBtnPadding,
                                minWidth: tripBtnMinWidth
                            }]}
                            onPress={isRecording ? stopTrip : startTrip}
                        >
                            <Text style={[styles.tripButtonText, {
                                color: isRecording ? '#ef4444' : accentColor,
                                fontSize: tripBtnFontSize
                            }]}>
                                {isRecording ? 'STOP TRIP' : 'START TRIP'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('Settings', { screen: 'CarList' })}
                            style={{ marginTop: 16, alignItems: 'center' }}
                        >
                            <Text style={{ color: secondaryTextColor, fontFamily: 'Rajdhani_500Medium', fontSize: vehicleTextSize }}>
                                DRIVING: <Text style={{ color: accentColor, fontFamily: 'Orbitron_600SemiBold' }}>
                                    {selectedCar ? selectedCar.nickname : 'NO CAR SELECTED'}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        {!isHudMode && isDebugEnabled && (
                            <View style={[styles.debugContainer, { backgroundColor: isDark ? '#1f2937' : '#e5e7eb' }]}>
                                <Text style={[styles.debugLabel, { color: secondaryTextColor }]}>DEBUG INFO (Select to Copy):</Text>
                                <Text
                                    selectable={true}
                                    style={[styles.debugText, { color: textColor }]}
                                >
                                    {location ? JSON.stringify(location, null, 2) : 'Waiting for GPS...'}
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 16,
    },
    hudMode: {
        transform: [{ scaleY: -1 }],
    },
    headerContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
    },
    headerButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerButtonText: {
        fontSize: 12,
        fontFamily: 'Orbitron_600SemiBold',
    },
    limitWrapper: {
        alignItems: 'center',
    },
    limitControlsFloating: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    limitControlBtn: {
        padding: 4,
    },
    controlText: {
        color: '#d1d5db',
        fontSize: 18,
        fontFamily: 'Orbitron_700Bold',
    },
    alertBackground: {
        backgroundColor: '#450a0a',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
    },
    scrollContentContainer: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 40,
    },
    topSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    bottomSection: {
        width: '100%',
        paddingBottom: 40,
        alignItems: 'center',
    },
    squareMapContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#374151',
        position: 'relative',
    },
    mapOverlay: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    mapSpeedText: {
        fontSize: 24,
        fontFamily: 'Orbitron_700Bold',
    },
    mapUnitText: {
        fontSize: 12,
        fontFamily: 'Orbitron_600SemiBold',
    },
    speedometerContainer: {
        width: '100%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    statusPillPosition: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
    },
    statusContainer: {
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statusText: {
        fontSize: 16,
        letterSpacing: 2,
        fontFamily: 'Orbitron_600SemiBold',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        elevation: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontFamily: 'Rajdhani_600SemiBold',
    },
    statValue: {
        fontSize: 18,
        fontFamily: 'Orbitron_700Bold',
    },
    tripButton: {
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        borderWidth: 2,
        minWidth: 200,
        alignItems: 'center',
    },
    startButton: {
    },
    stopButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    tripButtonText: {
        fontSize: 18,
        fontFamily: 'Orbitron_700Bold',
        letterSpacing: 2,
    },
    debugContainer: {
        marginTop: 20,
        padding: 10,
        borderRadius: 8,
        width: '90%',
    },
    debugLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontFamily: 'Rajdhani_600SemiBold',
    },
    debugText: {
        fontSize: 10,
        fontFamily: 'monospace',
    },
    accuracyWarning: {
        position: 'absolute',
        top: 100,
        zIndex: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    accuracyWarningText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Orbitron_600SemiBold',
    },
});
