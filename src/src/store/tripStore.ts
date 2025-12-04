import { create } from 'zustand';
import { DatabaseService } from '../services/DatabaseService';
import { LocationData } from '../services/LocationService';
import { useCarStore } from './useCarStore';

interface TripState {
    isRecording: boolean;
    currentTripId: number | null;
    currentDistance: number;
    maxSpeed: number;
    startTime: number | null;
    currentLocation: LocationData | null;
    path: { latitude: number; longitude: number }[];

    startTrip: () => void;
    stopTrip: () => void;
    updateTripData: (location: LocationData) => void;
}

export const useTripStore = create<TripState>((set, get) => ({
    isRecording: false,
    currentTripId: null,
    currentDistance: 0,
    maxSpeed: 0,
    startTime: null,
    currentLocation: null,
    path: [],

    startTrip: () => {
        const selectedCarId = useCarStore.getState().selectedCarId;
        const tripId = DatabaseService.startTrip(selectedCarId);
        set({
            isRecording: true,
            currentTripId: tripId,
            currentDistance: 0,
            maxSpeed: 0,
            startTime: Date.now(),
            path: [],
        });
    },

    stopTrip: () => {
        const { currentTripId, currentDistance, maxSpeed, startTime } = get();
        if (currentTripId) {
            const duration = Date.now() - (startTime || Date.now());
            const avgSpeed = duration > 0 ? currentDistance / (duration / 1000) : 0;
            DatabaseService.endTrip(currentTripId, currentDistance, maxSpeed, avgSpeed);
        }
        set({ isRecording: false, currentTripId: null, path: [] });
    },

    updateTripData: (location: LocationData) => {
        const { isRecording, currentTripId, maxSpeed, currentLocation, currentDistance, path } = get();

        // Check if location actually changed (ignore pure heading updates for path/db)
        const hasLocationChanged = !currentLocation ||
            currentLocation.latitude !== location.latitude ||
            currentLocation.longitude !== location.longitude;

        if (!hasLocationChanged) {
            // Just update current location (heading/speed/etc) without adding to path or DB
            set({ currentLocation: location });
            return;
        }

        // Calculate distance if we have a previous location
        let distIncrement = 0;
        if (isRecording && currentLocation) {
            const R = 6371e3; // metres
            const φ1 = currentLocation.latitude * Math.PI / 180;
            const φ2 = location.latitude * Math.PI / 180;
            const Δφ = (location.latitude - currentLocation.latitude) * Math.PI / 180;
            const Δλ = (location.longitude - currentLocation.longitude) * Math.PI / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            const d = R * c; // in metres

            if ((location.speed ?? 0) > 0) {
                distIncrement = d;
            }
        }

        const newPath = isRecording ? [...path, { latitude: location.latitude, longitude: location.longitude }] : path;

        set({
            currentLocation: location,
            currentDistance: isRecording ? currentDistance + distIncrement : currentDistance,
            path: newPath
        });

        if (!isRecording || !currentTripId) return;

        const speed = location.speed ?? 0;
        const newMaxSpeed = Math.max(maxSpeed, speed);

        DatabaseService.addTripPoint(currentTripId, {
            timestamp: Date.now(),
            latitude: location.latitude,
            longitude: location.longitude,
            speed: speed,
            accuracy: location.accuracy ?? 0,
            altitude: location.altitude ?? 0,
        });

        set({ maxSpeed: newMaxSpeed });
    },
}));
