import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { LocationService } from '../services/LocationService';
import { CalibrationModal } from '../components/CalibrationModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { RootStackParamList, SettingsStackParamList } from '../navigation/types';

const COLORS = ['#00C2FF', '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

const SectionHeader = ({ title, color }: { title: string, color: string }) => (
    <Text style={[styles.sectionHeader, { color }]}>{title}</Text>
);

const SettingsSection = ({ children, backgroundColor }: { children: React.ReactNode, backgroundColor: string }) => (
    <View style={[styles.sectionContainer, { backgroundColor }]}>
        {children}
    </View>
);

const SettingItem = ({ label, icon, children, isLast = false, accentColor, textColor, borderColor }: { label: string, icon: keyof typeof Ionicons.glyphMap, children: React.ReactNode, isLast?: boolean, accentColor: string, textColor: string, borderColor: string }) => (
    <View style={[
        styles.settingItem,
        { borderBottomColor: borderColor },
        isLast && { borderBottomWidth: 0 }
    ]}>
        <View style={styles.labelContainer}>
            <View style={[styles.iconContainer, { backgroundColor: accentColor }]}>
                <Ionicons name={icon} size={16} color="white" />
            </View>
            <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
        </View>
        {children}
    </View>
);

const NumericInput = ({ value, onChange, min, max, step = 1, textColor, backgroundColor }: { value: number, onChange: (val: number) => void, min: number, max: number, step?: number, textColor: string, backgroundColor: string }) => {
    const handleChange = (text: string) => {
        if (text === '') return;
        const num = parseFloat(text);
        if (!isNaN(num)) {
            if (num > max) onChange(max);
            else onChange(num);
        }
    };

    const handleBlur = () => {
        if (value < min) onChange(min);
    }

    return (
        <View style={[styles.numberControl, { backgroundColor }]}>
            <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => {
                    const newValue = Math.max(min, value - step);
                    onChange(parseFloat(newValue.toFixed(step < 1 ? 1 : 0)));
                }}
            >
                <Ionicons name="remove" size={16} color={textColor} />
            </TouchableOpacity>
            <TextInput
                style={[styles.numberInput, { color: textColor }]}
                value={value.toString()}
                onChangeText={handleChange}
                onBlur={handleBlur}
                keyboardType="numeric"
                maxLength={String(max).length + (step < 1 ? 2 : 0)}
            />
            <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => {
                    const newValue = Math.min(max, value + step);
                    onChange(parseFloat(newValue.toFixed(step < 1 ? 1 : 0)));
                }}
            >
                <Ionicons name="add" size={16} color={textColor} />
            </TouchableOpacity>
        </View>
    );
};

export default function SettingsScreen() {
    const settings = useSettingsStore();
    const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
    const { theme, accentColor } = settings;

    // Theme Colors
    const isDark = theme === 'dark' || (theme === 'system' && true);
    const bgColor = isDark ? 'black' : '#f2f2f7'; // iOS system gray 6 for light mode
    const sectionBgColor = isDark ? '#1c1c1e' : 'white'; // iOS system gray 6 dark / white light
    const textColor = isDark ? 'white' : 'black';
    const secondaryTextColor = isDark ? '#8e8e93' : '#8e8e93';
    const borderColor = isDark ? '#38383a' : '#e5e5ea';
    const inputBgColor = isDark ? '#2c2c2e' : '#f2f2f7';

    const [isCalibrationVisible, setCalibrationVisible] = useState(false);

    const handleRefreshRateChange = async (seconds: number) => {
        const ms = seconds * 1000;
        settings.setRefreshRate(ms);
        await LocationService.restartTracking();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top']}>
            <ScreenHeader title="Settings" />
            <CalibrationModal visible={isCalibrationVisible} onClose={() => setCalibrationVisible(false)} />
            <ScrollView contentContainerStyle={styles.contentContainer}>

                <SectionHeader title="Vehicle" color={secondaryTextColor} />
                <SettingsSection backgroundColor={sectionBgColor}>
                    <SettingItem label="My Garage" icon="car-sport-outline" isLast={true} accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CarList')}
                            style={[styles.actionButton, { backgroundColor: accentColor }]}
                        >
                            <Text style={styles.actionButtonText}>MANAGE</Text>
                        </TouchableOpacity>
                    </SettingItem>
                </SettingsSection>

                <SectionHeader title="General" color={secondaryTextColor} />
                <SettingsSection backgroundColor={sectionBgColor}>
                    <SettingItem label="Speed Unit" icon="speedometer-outline" accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <View style={[styles.segmentedControl, { backgroundColor: inputBgColor }]}>
                            {(['km/h', 'mph', 'm/s'] as const).map((u) => (
                                <TouchableOpacity
                                    key={u}
                                    style={[
                                        styles.segmentButton,
                                        settings.unit === u && { backgroundColor: isDark ? '#636366' : 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 }
                                    ]}
                                    onPress={() => settings.setUnit(u)}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        { color: settings.unit === u ? textColor : secondaryTextColor }
                                    ]}>{u}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </SettingItem>

                    <SettingItem label="Keep Screen On During Trip" icon="sunny-outline" accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <Switch
                            value={settings.isKeepScreenOnEnabled}
                            onValueChange={settings.toggleKeepScreenOn}
                            trackColor={{ false: '#3a3a3c', true: accentColor }}
                            thumbColor={'white'}
                        />
                    </SettingItem>

                    <SettingItem label="Enable Map" icon="map-outline" accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <Switch
                            value={settings.isMapEnabled}
                            onValueChange={settings.toggleMapEnabled}
                            trackColor={{ false: '#3a3a3c', true: accentColor }}
                            thumbColor={'white'}
                        />
                    </SettingItem>

                    <SettingItem label="Refresh Rate (sec)" icon="refresh-outline" accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <NumericInput
                            value={settings.refreshRate / 1000}
                            onChange={handleRefreshRateChange}
                            min={0.1}
                            max={100}
                            step={0.1}
                            textColor={textColor}
                            backgroundColor={inputBgColor}
                        />
                    </SettingItem>

                    <SettingItem label="Calibrate Compass" icon="compass-outline" accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <TouchableOpacity onPress={() => setCalibrationVisible(true)} style={[styles.actionButton, { backgroundColor: accentColor }]}>
                            <Text style={styles.actionButtonText}>CALIBRATE</Text>
                        </TouchableOpacity>
                    </SettingItem>

                    <SettingItem label="Map Orientation" icon="navigate-outline" isLast={true} accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <View style={styles.mapOrientationContainer}>
                            <TouchableOpacity
                                style={[styles.mapOrientationButton, settings.mapOrientation === 'north-up' && { backgroundColor: accentColor }]}
                                onPress={() => settings.setMapOrientation('north-up')}
                            >
                                <Text style={[styles.mapOrientationText, settings.mapOrientation === 'north-up' ? { color: 'white' } : { color: secondaryTextColor }]}>NORTH UP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mapOrientationButton, settings.mapOrientation === 'heading-up' && { backgroundColor: accentColor }]}
                                onPress={() => settings.setMapOrientation('heading-up')}
                            >
                                <Text style={[styles.mapOrientationText, settings.mapOrientation === 'heading-up' ? { color: 'white' } : { color: secondaryTextColor }]}>HEADING UP</Text>
                            </TouchableOpacity>
                        </View>
                    </SettingItem>
                </SettingsSection>

                <SectionHeader title="History" color={secondaryTextColor} />
                <SettingsSection backgroundColor={sectionBgColor}>

                    <SettingItem label="History Retention (Days)" icon="time-outline" accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <NumericInput
                            value={settings.historyRetentionDays}
                            onChange={settings.setHistoryRetentionDays}
                            min={1}
                            max={3650} // 10 years
                            textColor={textColor}
                            backgroundColor={inputBgColor}
                        />
                    </SettingItem>

                    <SettingItem label="Show All Vehicle Trips" icon="list-outline" accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <Switch
                            value={settings.isShowAllTripsEnabled}
                            onValueChange={settings.toggleShowAllTrips}
                            trackColor={{ false: '#3a3a3c', true: accentColor }}
                            thumbColor={'white'}
                        />
                    </SettingItem>

                    <SettingItem label="Speed Limit Alert" icon="alert-circle-outline" isLast={!settings.isSpeedLimitEnabled} accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <Switch
                            value={settings.isSpeedLimitEnabled}
                            onValueChange={settings.toggleSpeedLimit}
                            trackColor={{ false: '#3a3a3c', true: accentColor }}
                            thumbColor={'white'}
                        />
                    </SettingItem>

                    {settings.isSpeedLimitEnabled && (
                        <SettingItem label={`Limit (${settings.unit})`} icon="warning-outline" isLast={true} accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                            <NumericInput
                                value={settings.speedLimit}
                                onChange={settings.setSpeedLimit}
                                min={0}
                                max={999}
                                textColor={textColor}
                                backgroundColor={inputBgColor}
                            />
                        </SettingItem>
                    )}
                </SettingsSection>

                <SectionHeader title="Appearance" color={secondaryTextColor} />
                <SettingsSection backgroundColor={sectionBgColor}>
                    <SettingItem label="Theme" icon="color-palette-outline" accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <View style={[styles.segmentedControl, { backgroundColor: inputBgColor }]}>
                            {(['dark', 'light', 'system'] as const).map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.segmentButton,
                                        settings.theme === t && { backgroundColor: isDark ? '#636366' : 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 }
                                    ]}
                                    onPress={() => settings.setTheme(t)}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        { color: settings.theme === t ? textColor : secondaryTextColor }
                                    ]}>{t.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </SettingItem>

                    <SettingItem label="Accent Color" icon="brush-outline" isLast={true} accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <View style={styles.colorRow}>
                            {COLORS.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: c },
                                        settings.accentColor === c && [styles.colorCircleActive, { borderColor: textColor }]
                                    ]}
                                    onPress={() => settings.setAccentColor(c)}
                                />
                            ))}
                        </View>
                    </SettingItem>
                </SettingsSection>

                <SectionHeader title="Advanced" color={secondaryTextColor} />
                <SettingsSection backgroundColor={sectionBgColor}>
                    <SettingItem label="Auto PIP Mode" icon="albums-outline" accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <Switch
                            value={settings.isPipEnabled}
                            onValueChange={settings.togglePipEnabled}
                            trackColor={{ false: '#3a3a3c', true: accentColor }}
                            thumbColor={'white'}
                        />
                    </SettingItem>

                    <SettingItem label="Debug Mode" icon="bug-outline" isLast={true} accentColor={accentColor} textColor={textColor} borderColor={borderColor}>
                        <Switch
                            value={settings.isDebugEnabled}
                            onValueChange={settings.toggleDebug}
                            trackColor={{ false: '#3a3a3c', true: accentColor }}
                            thumbColor={'white'}
                        />
                    </SettingItem>
                </SettingsSection>

                <View style={styles.footer}>
                    <Image
                        source={require('../../assets/icon.png')}
                        style={styles.footerIcon}
                    />
                    <Text style={[styles.appNameText, { color: textColor }]}>Trip MatriX</Text>
                    <Text style={[styles.versionText, { color: secondaryTextColor }]}>v1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 13,
        textTransform: 'uppercase',
        marginTop: 24,
        marginBottom: 8,
        marginLeft: 16,
        letterSpacing: -0.2,
        fontFamily: 'Orbitron_600SemiBold',
    },
    sectionContainer: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 0,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        height: 60,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: 16,
        fontFamily: 'Rajdhani_500Medium',
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 2,
    },
    segmentButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    segmentText: {
        fontSize: 12,
        fontFamily: 'Rajdhani_600SemiBold',
    },
    numberControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        padding: 4,
    },
    controlBtn: {
        padding: 4,
    },
    numberInput: {
        fontSize: 15,
        minWidth: 32,
        textAlign: 'center',
        paddingVertical: 0,
        fontFamily: 'Rajdhani_600SemiBold',
    },
    colorRow: {
        flexDirection: 'row',
        gap: 10,
    },
    colorCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
    },
    colorCircleActive: {
        borderWidth: 2,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        gap: 6,
    },
    footerIcon: {
        width: 100,
        height: 100,
        borderRadius: 18,
        marginBottom: 0,
    },
    appNameText: {
        fontSize: 16,
        fontFamily: 'Orbitron_600SemiBold',
    },
    versionText: {
        fontSize: 12,
        fontFamily: 'Rajdhani_500Medium',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Orbitron_600SemiBold',
    },
    mapOrientationContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        padding: 2,
    },
    mapOrientationButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    mapOrientationText: {
        fontSize: 10,
        fontFamily: 'Orbitron_600SemiBold',
    },
});
