import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import * as Location from 'expo-location';

interface CalibrationModalProps {
    visible: boolean;
    onClose: () => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ visible, onClose }) => {
    const { theme, accentColor } = useSettingsStore();
    const isDark = theme === 'dark' || (theme === 'system' && true);

    const bgColor = isDark ? '#1c1c1e' : 'white';
    const textColor = isDark ? 'white' : 'black';
    const secondaryTextColor = isDark ? '#9ca3af' : '#4b5563';

    const [heading, setHeading] = useState<Location.LocationHeadingObject | null>(null);
    const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

    useEffect(() => {
        if (visible) {
            startHeadingUpdates();
        } else {
            stopHeadingUpdates();
        }
        return () => {
            stopHeadingUpdates();
        };
    }, [visible]);

    const startHeadingUpdates = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const sub = await Location.watchHeadingAsync((newHeading) => {
                setHeading(newHeading);
            });
            setSubscription(sub);
        } catch (error) {
            console.log('Error watching heading:', error);
        }
    };

    const stopHeadingUpdates = () => {
        if (subscription) {
            subscription.remove();
            setSubscription(null);
        }
        setHeading(null);
    };

    const getAccuracyStatus = (accuracy: number) => {
        // accuracy is in degrees (lower is better)
        if (accuracy < 15) return { label: 'GOOD', color: '#10b981' }; // Green
        if (accuracy < 45) return { label: 'MEDIUM', color: '#f59e0b' }; // Amber
        return { label: 'LOW', color: '#ef4444' }; // Red
    };

    const accuracyInfo = heading ? getAccuracyStatus(heading.accuracy) : { label: 'WAITING...', color: secondaryTextColor };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={[styles.modalView, { backgroundColor: bgColor }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textColor }]}>Calibrate Compass</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={secondaryTextColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Ionicons name="infinite" size={80} color={accentColor} style={styles.icon} />

                        <Text style={[styles.instruction, { color: textColor }]}>
                            Wave your device in a figure-8 motion as shown above.
                        </Text>

                        <View style={[styles.statusContainer, { borderColor: accuracyInfo.color }]}>
                            <Text style={[styles.statusLabel, { color: secondaryTextColor }]}>ACCURACY</Text>
                            <Text style={[styles.statusValue, { color: accuracyInfo.color }]}>
                                {accuracyInfo.label}
                            </Text>
                            {heading && (
                                <Text style={[styles.statusDetail, { color: secondaryTextColor }]}>
                                    (±{heading.accuracy.toFixed(0)}°)
                                </Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.doneButton, { backgroundColor: accentColor }]}
                        onPress={onClose}
                    >
                        <Text style={styles.doneButtonText}>DONE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
    },
    modalView: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Orbitron_600SemiBold',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
    },
    icon: {
        marginBottom: 20,
        transform: [{ rotate: '90deg' }]
    },
    instruction: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'Rajdhani_500Medium',
        lineHeight: 24,
    },
    statusContainer: {
        width: '100%',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    statusLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontFamily: 'Rajdhani_600SemiBold',
        letterSpacing: 1,
    },
    statusValue: {
        fontSize: 24,
        fontFamily: 'Orbitron_700Bold',
        marginBottom: 4,
    },
    statusDetail: {
        fontSize: 12,
        fontFamily: 'Rajdhani_500Medium',
    },
    doneButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    doneButtonText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Orbitron_600SemiBold',
        letterSpacing: 1,
    },
});
