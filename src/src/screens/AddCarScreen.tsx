import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/settingsStore';
import { useCarStore } from '../store/useCarStore';

export default function AddCarScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
    const insets = useSafeAreaInsets();
    const { theme, accentColor } = useSettingsStore();
    const { addCar, updateCar, cars } = useCarStore();
    const route = useRoute<RouteProp<SettingsStackParamList, 'AddCar'>>();
    const editingCarId = route.params?.carId;

    const isDark = theme === 'dark' || (theme === 'system' && true);

    const [type, setType] = useState<'car' | 'bike'>('car');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [variant, setVariant] = useState('');
    const [regNumber, setRegNumber] = useState('');
    const [nickname, setNickname] = useState('');

    React.useEffect(() => {
        if (editingCarId) {
            const carToEdit = cars.find(c => c.id === editingCarId);
            if (carToEdit) {
                setType(carToEdit.type);
                setMake(carToEdit.make || '');
                setModel(carToEdit.model || '');
                setVariant(carToEdit.variant || '');
                setRegNumber(carToEdit.regNumber || '');
                setNickname(carToEdit.nickname);
                navigation.setOptions({ headerTitle: 'Edit Vehicle' });
            }
        }
    }, [editingCarId, cars, navigation]);

    const handleSave = () => {
        if (!nickname.trim()) {
            Alert.alert('Missing Fields', 'Please enter a Nickname for your vehicle.');
            return;
        }

        if (editingCarId) {
            updateCar({
                id: editingCarId,
                type,
                make: make.trim(),
                model: model.trim(),
                variant: variant.trim(),
                regNumber: regNumber.trim(),
                nickname: nickname.trim(),
            });
        } else {
            addCar({
                type,
                make: make.trim(),
                model: model.trim(),
                variant: variant.trim(),
                regNumber: regNumber.trim(),
                nickname: nickname.trim(),
            });
        }

        navigation.goBack();
    };

    const inputStyle = [
        styles.input,
        {
            backgroundColor: isDark ? '#1f2937' : 'white',
            color: isDark ? 'white' : 'black',
            borderColor: isDark ? '#374151' : '#d1d5db'
        }
    ];

    const labelStyle = [
        styles.label,
        { color: isDark ? '#9ca3af' : '#4b5563' }
    ];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: isDark ? 'black' : '#f3f4f6' }]}
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
        >
            <Text style={[styles.header, { color: isDark ? 'white' : 'black' }]}>
                {editingCarId ? 'Edit Vehicle' : 'Add New Vehicle'}
            </Text>

            {/* Type Selector */}
            <View style={styles.typeContainer}>
                <TouchableOpacity
                    style={[
                        styles.typeButton,
                        type === 'car' && { backgroundColor: accentColor, borderColor: accentColor }
                    ]}
                    onPress={() => setType('car')}
                >
                    <Text style={[styles.typeText, type === 'car' ? { color: 'white' } : { color: isDark ? 'white' : 'black' }]}>CAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.typeButton,
                        type === 'bike' && { backgroundColor: accentColor, borderColor: accentColor }
                    ]}
                    onPress={() => setType('bike')}
                >
                    <Text style={[styles.typeText, type === 'bike' ? { color: 'white' } : { color: isDark ? 'white' : 'black' }]}>BIKE</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
                <Text style={labelStyle}>Nickname (Mandatory)</Text>
                <TextInput
                    style={inputStyle}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="e.g. My Beast"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={labelStyle}>Make (Optional)</Text>
                    <TextInput
                        style={inputStyle}
                        value={make}
                        onChangeText={setMake}
                        placeholder="e.g. Hyundai"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={labelStyle}>Model (Optional)</Text>
                    <TextInput
                        style={inputStyle}
                        value={model}
                        onChangeText={setModel}
                        placeholder="e.g. Creta"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    />
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={labelStyle}>Variant (Optional)</Text>
                <TextInput
                    style={inputStyle}
                    value={variant}
                    onChangeText={setVariant}
                    placeholder="e.g. SX(O) Turbo"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={labelStyle}>Registration Number (Optional)</Text>
                <TextInput
                    style={inputStyle}
                    value={regNumber}
                    onChangeText={setRegNumber}
                    placeholder="e.g. KA 01 AB 1234"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    autoCapitalize="characters"
                />
            </View>

            <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: accentColor }]}
                onPress={handleSave}
            >
                <Text style={styles.saveButtonText}>
                    {editingCarId ? 'Update Vehicle' : 'Save Vehicle'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        fontFamily: 'Orbitron_700Bold',
        fontSize: 24,
        marginBottom: 24,
        textAlign: 'center',
    },
    formGroup: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontFamily: 'Rajdhani_600SemiBold',
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    saveButton: {
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        fontFamily: 'Orbitron_600SemiBold',
        fontSize: 16,
        color: 'white',
    },
    typeContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#374151',
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeText: {
        fontFamily: 'Orbitron_600SemiBold',
        fontSize: 14,
    },
});
