import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useTripStore } from '../store/tripStore';
import { useSettingsStore } from '../store/settingsStore';

const LOCATION_TASK_NAME = 'background-location-task';

export interface LocationData {
    timestamp?: number;
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
    _positionSubscription: null as Location.LocationSubscription | null,

    async checkServicesEnabled() {
        const enabled = await Location.hasServicesEnabledAsync();
        return enabled;
    },

    async requestForegroundPermission() {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        return foregroundStatus === 'granted';
    },

    async requestBackgroundPermission() {
        try {
            const { status } = await Location.requestBackgroundPermissionsAsync();
            return status === 'granted';
        } catch (e) {
            console.log('Background permission request failed or rejected', e);
            return false;
        }
    },

    async requestPermissions() {
        return this.requestForegroundPermission();
    },

    async ensureReadyForLocation() {
        const servicesEnabled = await this.checkServicesEnabled();
        if (!servicesEnabled) {
            throw new Error('Location services disabled');
        }

        const hasPermission = await this.requestForegroundPermission();
        if (!hasPermission) {
            throw new Error('Location permission not granted');
        }
    },

    async startHeadingTracking() {
        if (this._headingSubscription) return;

        let lastHeading = 0;
        this._headingSubscription = await Location.watchHeadingAsync((headingData) => {
            if (Math.abs(headingData.magHeading - lastHeading) > 3) {
                lastHeading = headingData.magHeading;
                const currentLoc = useTripStore.getState().currentLocation;
                if (currentLoc) {
                    useTripStore.getState().updateTripData({
                        ...currentLoc,
                        heading: headingData.magHeading
                    });
                }
            }
        });
    },

    async startLiveTracking() {
        await this.ensureReadyForLocation();
        await this.startHeadingTracking();

        if (this._positionSubscription) return;

        const refreshRate = useSettingsStore.getState().refreshRate;

        this._positionSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: refreshRate,
                distanceInterval: 1,
            },
            handleLocationObject
        );
    },

    async stopLiveTracking() {
        if (this._positionSubscription) {
            this._positionSubscription.remove();
            this._positionSubscription = null;
        }
    },

    async startTripTracking() {
        await this.startLiveTracking();

        const backgroundGranted = await this.requestBackgroundPermission();
        if (!backgroundGranted) {
            console.log('Background location permission not granted; recording will continue while the app is active.');
            return;
        }

        const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (isStarted) return;

        const refreshRate = useSettingsStore.getState().refreshRate;

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: refreshRate,
            distanceInterval: 0,
            foregroundService: {
                notificationTitle: "Trip MetriX",
                notificationBody: "Tracking your trip...",
                notificationColor: "#3b82f6",
            },
        });
    },

    async stopTripTracking() {
        const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (isStarted) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
    },

    async stopTracking() {
        await this.stopTripTracking();
        await this.stopLiveTracking();
        if (this._headingSubscription) {
            this._headingSubscription.remove();
            this._headingSubscription = null;
        }
    },

    async startTracking() {
        await this.startTripTracking();
    },

    async restartTracking() {
        const isRecording = useTripStore.getState().isRecording;
        await this.stopTracking();
        if (isRecording) {
            await this.startTripTracking();
        } else {
            await this.startLiveTracking();
        }
    }
};

const handleLocationObject = (location: Location.LocationObject) => {
    let speed = location.coords.speed;
    if (speed !== null && speed < 0.25) {
        speed = 0;
    }

    // @ts-ignore - native extras are platform-specific and not typed by Expo.
    const extras = location.extras;

    let heading = location.coords.heading;
    if (LocationService._headingSubscription) {
        const currentHeading = useTripStore.getState().currentLocation?.heading;
        if (currentHeading !== undefined && currentHeading !== null) {
            heading = currentHeading;
        }
    }

    const locationData: LocationData = {
        timestamp: location.timestamp,
        speed,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        extras
    };

    useTripStore.getState().updateTripData(locationData);
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
            handleLocationObject(location);
        }
    }
});
