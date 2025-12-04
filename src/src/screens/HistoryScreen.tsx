import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DatabaseService, Trip } from '../services/DatabaseService';
import { HistoryScreenNavigationProp } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';
import { useCarStore } from '../store/useCarStore';
import { Calendar, DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { ExportService } from '../services/ExportService';

export default function HistoryScreen() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().split('T')[0].substring(0, 7)); // YYYY-MM
    const navigation = useNavigation<HistoryScreenNavigationProp>();
    const { theme, accentColor } = useSettingsStore();
    const { cars, loadCars } = useCarStore();
    const insets = useSafeAreaInsets();

    // Theme Colors
    const isDark = theme === 'dark' || (theme === 'system' && true);
    const bgColor = isDark ? 'black' : '#f3f4f6';
    const cardColor = isDark ? '#1f2937' : 'white';
    const textColor = isDark ? 'white' : '#111827';
    const secondaryTextColor = isDark ? '#9ca3af' : '#4b5563';
    const borderColor = isDark ? '#374151' : '#e5e7eb';
    const calendarBg = isDark ? 'black' : '#f3f4f6';
    const calendarText = isDark ? 'white' : '#111827';

    useFocusEffect(
        React.useCallback(() => {
            loadCars();
            const { selectedCarId } = useCarStore.getState();
            const { isShowAllTripsEnabled } = useSettingsStore.getState();

            let data = DatabaseService.getTrips();

            if (!isShowAllTripsEnabled && selectedCarId) {
                data = data.filter(trip => trip.carId === selectedCarId);
            } else if (!isShowAllTripsEnabled && !selectedCarId) {
                // If no car is selected and "Show All" is disabled, maybe show nothing or all?
                // Logic: "show for only selected vehicle". If none selected, show none.
                data = [];
            }

            setTrips(data);

            setSelectedDate(current => {
                if (!current) {
                    return new Date().toISOString().split('T')[0];
                }
                return current;
            });
        }, [])
    );

    const handleExport = async () => {
        if (trips.length === 0) {
            Alert.alert('No Trips', 'There are no trips to export.');
            return;
        }

        const { selectedCarId } = useCarStore.getState();
        const { isShowAllTripsEnabled } = useSettingsStore.getState();

        let filename = `Trips_History_${new Date().toISOString().split('T')[0]}.csv`;

        if (!isShowAllTripsEnabled && selectedCarId) {
            const car = cars.find(c => c.id === selectedCarId);
            if (car) {
                filename = `Trips_${car.nickname.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
            }
        }

        const csvData = ExportService.generateCSV(trips, cars);

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

    // Monthly Stats
    const monthlyStats = useMemo(() => {
        const monthTrips = trips.filter(trip => {
            const tripDate = new Date(trip.startTime).toISOString().split('T')[0];
            return tripDate.startsWith(currentMonth);
        });

        const totalDistance = monthTrips.reduce((sum, trip) => sum + trip.distance, 0);
        const totalTime = monthTrips.reduce((sum, trip) => sum + (trip.endTime ? trip.endTime - trip.startTime : 0), 0);
        const maxSpeed = monthTrips.reduce((max, trip) => Math.max(max, trip.maxSpeed), 0);
        const avgSpeed = monthTrips.length > 0
            ? monthTrips.reduce((sum, trip) => sum + trip.avgSpeed, 0) / monthTrips.length
            : 0;

        return {
            distance: (totalDistance / 1000).toFixed(0),
            time: (totalTime / 1000 / 60).toFixed(0), // minutes
            maxSpeed: (maxSpeed * 3.6).toFixed(0),
            avgSpeed: (avgSpeed * 3.6).toFixed(0),
            tripCount: monthTrips.length
        };
    }, [trips, currentMonth]);

    const markedDates = useMemo(() => {
        const marks: any = {};

        trips.forEach(trip => {
            const date = new Date(trip.startTime).toISOString().split('T')[0];
            marks[date] = {
                marked: true,
                dotColor: accentColor
            };
        });

        if (selectedDate) {
            marks[selectedDate] = {
                ...(marks[selectedDate] || {}),
                selected: true,
                selectedColor: accentColor,
                selectedTextColor: 'white'
            };
        }

        return marks;
    }, [trips, selectedDate, accentColor]);

    const filteredTrips = useMemo(() => {
        if (!selectedDate) return [];
        return trips.filter(trip => {
            const tripDate = new Date(trip.startTime).toISOString().split('T')[0];
            return tripDate === selectedDate;
        }).sort((a, b) => b.startTime - a.startTime);
    }, [trips, selectedDate]);

    const formatDuration = (start: number, end: number | null) => {
        if (!end) return 'In Progress';
        const diff = end - start;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes} min`;
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }: { item: Trip }) => {
        const startTime = formatTime(item.startTime);
        const endTime = item.endTime ? formatTime(item.endTime) : '...';
        const car = cars.find(c => c.id === item.carId);

        return (
            <TouchableOpacity
                style={[styles.itemRow, { borderBottomColor: borderColor }]}
                onPress={() => navigation.navigate('TripDetail', { trip: item })}
            >
                <View>
                    <Text style={[styles.timeRange, { color: textColor }]}>
                        {startTime} - {endTime}
                    </Text>
                    {car && (
                        <Text style={{ color: accentColor, fontFamily: 'Rajdhani_600SemiBold', fontSize: 12 }}>
                            {car.nickname}
                        </Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View>
            {/* Monthly Summary */}
            <View style={[styles.summaryContainer, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>Distance</Text>
                        <Text style={[styles.summaryValue, { color: textColor }]}>{monthlyStats.distance}</Text>
                        <Text style={[styles.summaryUnit, { color: secondaryTextColor }]}>km</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>Time</Text>
                        <Text style={[styles.summaryValue, { color: textColor }]}>{monthlyStats.time}</Text>
                        <Text style={[styles.summaryUnit, { color: secondaryTextColor }]}>min</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>Avg Speed</Text>
                        <Text style={[styles.summaryValue, { color: textColor }]}>{monthlyStats.avgSpeed}</Text>
                        <Text style={[styles.summaryUnit, { color: secondaryTextColor }]}>km/h</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>Top Speed</Text>
                        <Text style={[styles.summaryValue, { color: textColor }]}>{monthlyStats.maxSpeed}</Text>
                        <Text style={[styles.summaryUnit, { color: secondaryTextColor }]}>km/h</Text>
                    </View>
                </View>
            </View>

            {/* Calendar */}
            <Calendar
                current={currentMonth}
                onMonthChange={(month: DateData) => setCurrentMonth(month.dateString.substring(0, 7))}
                onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                theme={{
                    calendarBackground: calendarBg,
                    textSectionTitleColor: secondaryTextColor,
                    selectedDayBackgroundColor: accentColor,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: accentColor,
                    dayTextColor: calendarText,
                    textDisabledColor: '#d9e1e8',
                    dotColor: accentColor,
                    selectedDotColor: '#ffffff',
                    arrowColor: accentColor,
                    monthTextColor: calendarText,
                    indicatorColor: accentColor,
                    textDayFontWeight: '300',
                    textDayHeaderFontWeight: '300',
                    textDayFontSize: 16,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 14,
                    textDayFontFamily: 'Rajdhani_500Medium',
                    textMonthFontFamily: 'Orbitron_600SemiBold',
                    textDayHeaderFontFamily: 'Rajdhani_500Medium',
                }}
                style={styles.calendar}
            />

            <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: secondaryTextColor }]}>
                    {selectedDate ? (() => {
                        const d = new Date(selectedDate);
                        const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const dayPart = d.toLocaleDateString('en-US', { weekday: 'long' });
                        return `${datePart} - ${dayPart}`;
                    })() : 'All Trips'}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: bgColor, paddingTop: insets.top }]}>
            <ScreenHeader
                title="Trip History"
                rightAction={
                    <TouchableOpacity onPress={handleExport} style={{ padding: 4 }}>
                        <Ionicons name="download-outline" size={24} color={textColor} />
                    </TouchableOpacity>
                }
            />
            <FlatList
                data={filteredTrips}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: secondaryTextColor }]}>No trips found for this date</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    summaryContainer: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        width: 1,
        backgroundColor: '#e5e7eb',
        height: '80%',
        alignSelf: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontFamily: 'Rajdhani_600SemiBold',
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontSize: 20,
        fontFamily: 'Orbitron_700Bold',
    },
    summaryUnit: {
        fontSize: 12,
        fontFamily: 'Rajdhani_500Medium',
    },
    calendar: {
        marginBottom: 10,
        marginHorizontal: 16,
    },
    listHeader: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        marginHorizontal: 16,
        alignItems: 'center',
    },
    listTitle: {
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: 'Orbitron_600SemiBold',
    },
    listContent: {
        paddingBottom: 20,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        marginHorizontal: 16,
        borderBottomWidth: 1,
    },
    timeRange: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Rajdhani_500Medium',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Rajdhani_500Medium',
    },
});
