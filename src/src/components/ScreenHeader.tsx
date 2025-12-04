import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { useNavigation } from '@react-navigation/native';

interface ScreenHeaderProps {
    title: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, showBackButton = false, onBackPress, rightAction }) => {
    const { theme } = useSettingsStore();
    const navigation = useNavigation();

    const isDark = theme === 'dark' || (theme === 'system' && true);
    const textColor = isDark ? 'white' : '#111827';
    const borderColor = isDark ? '#374151' : '#e5e7eb';
    const bgColor = isDark ? 'black' : '#f3f4f6';

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
            <View style={styles.leftContainer}>
                {showBackButton && (
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={textColor} />
                    </TouchableOpacity>
                )}
            </View>

            <Text style={[styles.title, { color: textColor }]}>{title}</Text>

            <View style={styles.rightContainer}>
                {rightAction}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    leftContainer: {
        width: 40,
        alignItems: 'flex-start',
    },
    rightContainer: {
        width: 40,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        flex: 1,
        fontFamily: 'Orbitron_600SemiBold',
    },
    backButton: {
        padding: 4,
        marginLeft: -4, // Align icon visually with padding
    },
});
