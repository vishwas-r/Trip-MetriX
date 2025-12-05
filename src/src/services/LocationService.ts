import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useTripStore } from '../store/tripStore';
import { useSettingsStore } from '../store/settingsStore';

const LOCATION_TASK_NAME = 'background-location-task';

export interface LocationData {
    speed: number | null;
    accuracy: number | null;
    altitude: number | null;
    heading: number | null;
    latitude: number;
    longitude: number;
    extras?: any;
}

export const LocationService = {
    _headingSubscription: null as Location.LocationSubscription | null,

    async requestPermissions() {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') return false;

        // Attempt background permission but don't block if denied
        // Android 11+ requires separate requests and might deny background even if foreground is granted
        try {
            await Location.requestBackgroundPermissionsAsync();
        } catch (e) {
            console.log('Background permission request failed or rejected', e);
        }

        // Return true as long as foreground is granted. 
        // The foreground service will handle keeping the app alive.
        return true;
    },

    async startTracking() {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            throw new Error('Location permission not granted');
        }

        const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

        // Start compass tracking if not already started
        if (!this._headingSubscription) {
            // Filter heading updates to reduce jitter (only update if change > 5 degrees)
            // Note: Expo Location.watchHeadingAsync doesn't support 'filter' directly in options for all versions,
            // but we can implement it manually or check documentation. 
            // Actually, watchHeadingAsync takes a callback. It doesn't take options in the signature I used.
            // Let's check if I can pass options. The signature is (callback).
            // Wait, I should check if I can filter manually.

            let lastHeading = 0;
            this._headingSubscription = await Location.watchHeadingAsync((headingData) => {
                // Manual filter: only update if change > 3 degrees
                if (Math.abs(headingData.magHeading - lastHeading) > 3) {
                    lastHeading = headingData.magHeading;
                    const currentLoc = useTripStore.getState().currentLocation;
                    if (currentLoc) {
                        // Update store with new heading, keeping other location data
                        useTripStore.getState().updateTripData({
                            ...currentLoc,
                            heading: headingData.magHeading
                        });
                    }
                }
            });
        }

        if (isStarted) return;

        const refreshRate = useSettingsStore.getState().refreshRate;

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: refreshRate,
            distanceInterval: 0,
            foregroundService: {
                notificationTitle: "Xcelerate",
                notificationBody: "Tracking your trip...",
                notificationColor: "#3b82f6",
            },
        });
    },

    async stopTracking() {
        const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (isStarted) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }

        if (this._headingSubscription) {
            this._headingSubscription.remove();
            this._headingSubscription = null;
        }
    },

    async restartTracking() {
        await this.stopTracking();
        await this.startTracking();
    }
};

// Define the background task in the global scope
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error('Background location task error:', error);
        return;
    }
    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const location = locations[0];
        if (location) {
            // Filter noise: if speed is very low (< 0.9 km/h approx 0.25 m/s), consider it 0
            let speed = location.coords.speed;
            if (speed !== null && speed < 0.25) {
                speed = 0;
            }

            // @ts-ignore
            const extras = location.extras;

            // Determine heading: use existing store heading if compass is active, otherwise use GPS heading
            let heading = location.coords.heading;
            if (LocationService._headingSubscription) {
                const currentHeading = useTripStore.getState().currentLocation?.heading;
                if (currentHeading !== undefined && currentHeading !== null) {
                    heading = currentHeading;
                }
            }

            const locationData: LocationData = {
                speed: speed,
                accuracy: location.coords.accuracy,
                altitude: location.coords.altitude,
                heading: heading,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                extras: extras
            };

            // Update the store directly from the background task
            useTripStore.getState().updateTripData(locationData);
        }
    }
});
