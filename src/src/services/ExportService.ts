import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { shareAsync } from 'expo-sharing';
import { Trip, Car } from './DatabaseService';

export const ExportService = {
    generateCSV: (trips: Trip[], cars: Car[]): string => {
        const headers = [
            'Date',
            'Start Time',
            'End Time',
            'Duration',
            'Distance (km)',
            'Max Speed (km/h)',
            'Avg Speed (km/h)',
            'Vehicle'
        ];

        const rows = trips.map(trip => {
            const startDate = new Date(trip.startTime);
            const endDate = trip.endTime ? new Date(trip.endTime) : null;

            const dateStr = startDate.toLocaleDateString();
            const startTimeStr = startDate.toLocaleTimeString();
            const endTimeStr = endDate ? endDate.toLocaleTimeString() : 'In Progress';

            let durationStr = '';
            if (trip.endTime) {
                const diff = trip.endTime - trip.startTime;
                const minutes = Math.floor(diff / 1000 / 60);
                const hours = Math.floor(minutes / 60);
                durationStr = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
            }

            const distanceKm = (trip.distance / 1000).toFixed(2);
            const maxSpeedKmh = (trip.maxSpeed * 3.6).toFixed(1);
            const avgSpeedKmh = (trip.avgSpeed * 3.6).toFixed(1);

            const car = cars.find(c => c.id === trip.carId);
            const vehicleName = car ? `${car.nickname} (${car.make} ${car.model})` : 'Unknown Vehicle';

            return [
                dateStr,
                startTimeStr,
                endTimeStr,
                durationStr,
                distanceKm,
                maxSpeedKmh,
                avgSpeedKmh,
                `"${vehicleName}"` // Quote to handle commas in name
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    },

    exportCSV: async (data: string, filename: string) => {
        const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + filename;
        try {
            await FileSystem.writeAsStringAsync(fileUri, data, { encoding: 'utf8' });
            await shareAsync(fileUri);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            throw error;
        }
    },

    saveToDownloads: async (data: string, filename: string) => {
        if (Platform.OS === 'android') {
            try {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const uri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, 'text/csv');
                    await FileSystem.writeAsStringAsync(uri, data, { encoding: 'utf8' });
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                console.error('Error saving to downloads:', error);
                throw error;
            }
        } else {
            // iOS doesn't have direct access to Downloads folder like Android SAF
            // We use shareAsync which allows "Save to Files"
            const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + filename;
            await FileSystem.writeAsStringAsync(fileUri, data, { encoding: 'utf8' });
            await shareAsync(fileUri);
            return true;
        }
    }
};
