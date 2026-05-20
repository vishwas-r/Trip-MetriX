import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from '../services/DatabaseService';
import type { LocationData } from '../services/LocationService';
import { useCarStore } from './useCarStore';

interface TripState {
    isRecording: boolean;
    currentTripId: number | null;
    currentDistance: number;
    maxSpeed: number;
    startTime: number | null;
    currentLocation: LocationData | null;
    path: { latitude: number; longitude: number }[];

    startTrip: (initialLocation?: LocationData | null) => void;
    stopTrip: () => void;
    updateTripData: (location: LocationData) => void;
}

const haversineDistance = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
) => {
    const R = 6371e3;
    const phi1 = from.latitude * Math.PI / 180;
    const phi2 = to.latitude * Math.PI / 180;
    const deltaPhi = (to.latitude - from.latitude) * Math.PI / 180;
    const deltaLambda = (to.longitude - from.longitude) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const isUsableRecordingPoint = (location: LocationData) => {
    const accuracy = location.accuracy ?? Number.POSITIVE_INFINITY;
    return accuracy <= 75;
};

export const useTripStore = create<TripState>()(
    persist(
        (set, get) => ({
    isRecording: false,
    currentTripId: null,
    currentDistance: 0,
    maxSpeed: 0,
    startTime: null,
    currentLocation: null,
    path: [],

    startTrip: (initialLocation = null) => {
        const selectedCarId = useCarStore.getState().selectedCarId;
        const tripId = DatabaseService.startTrip(selectedCarId);
        const startLocation = initialLocation ?? null;
        if (startLocation && isUsableRecordingPoint(startLocation)) {
            DatabaseService.addTripPoint(tripId, {
                timestamp: startLocation.timestamp ?? Date.now(),
                latitude: startLocation.latitude,
                longitude: startLocation.longitude,
                speed: startLocation.speed ?? 0,
                accuracy: startLocation.accuracy ?? 0,
                altitude: startLocation.altitude ?? 0,
            });
        }
        set({
            isRecording: true,
            currentTripId: tripId,
            currentDistance: 0,
            maxSpeed: 0,
            startTime: Date.now(),
            currentLocation: startLocation,
            path: startLocation ? [{ latitude: startLocation.latitude, longitude: startLocation.longitude }] : [],
        });
    },

    stopTrip: () => {
        const { currentTripId, currentDistance, maxSpeed, startTime } = get();
        if (currentTripId) {
            const duration = Date.now() - (startTime || Date.now());
            const avgSpeed = duration > 0 ? currentDistance / (duration / 1000) : 0;
            DatabaseService.endTrip(currentTripId, currentDistance, maxSpeed, avgSpeed);
        }
        set({ isRecording: false, currentTripId: null, startTime: null, path: [] });
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

        const pointIsUsable = isUsableRecordingPoint(location);

        // Calculate distance if we have a previous location. Guardrails reject
        // noisy jumps while still keeping the live dashboard updated.
        let distIncrement = 0;
        const d = currentLocation ? haversineDistance(currentLocation, location) : 0;
        const previousTimestamp = currentLocation?.timestamp ?? Date.now();
        const currentTimestamp = location.timestamp ?? Date.now();
        const elapsedSeconds = Math.max((currentTimestamp - previousTimestamp) / 1000, 0.1);
        const impliedSpeed = d / elapsedSeconds;
        const measuredSpeed = location.speed ?? impliedSpeed;
        const isPlausibleMovement = impliedSpeed <= 120 && measuredSpeed <= 120;

        if (isRecording && currentLocation && pointIsUsable && isPlausibleMovement) {
            if (measuredSpeed > 0.25 || d > 3) {
                distIncrement = d;
            }
        }

        const shouldAddPathPoint = isRecording && pointIsUsable && isPlausibleMovement && (path.length === 0 || d >= 2 || elapsedSeconds >= 2);
        const newPath = shouldAddPathPoint ? [...path, { latitude: location.latitude, longitude: location.longitude }] : path;

        set({
            currentLocation: location,
            currentDistance: isRecording ? currentDistance + distIncrement : currentDistance,
            path: newPath
        });

        if (!isRecording || !currentTripId || !pointIsUsable || !isPlausibleMovement) return;

        const speed = measuredSpeed;
        const newMaxSpeed = Math.max(maxSpeed, speed);

        DatabaseService.addTripPoint(currentTripId, {
            timestamp: currentTimestamp,
            latitude: location.latitude,
            longitude: location.longitude,
            speed: speed,
            accuracy: location.accuracy ?? 0,
            altitude: location.altitude ?? 0,
        });

        set({ maxSpeed: newMaxSpeed });
    },
        }),
        {
            name: 'active-trip-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isRecording: state.isRecording,
                currentTripId: state.currentTripId,
                currentDistance: state.currentDistance,
                maxSpeed: state.maxSpeed,
                startTime: state.startTime,
            }),
        }
    )
);
