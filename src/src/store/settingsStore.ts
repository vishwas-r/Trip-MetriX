import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SpeedUnit = 'km/h' | 'mph' | 'm/s';

export type Theme = 'dark' | 'light' | 'system';

interface SettingsState {
    unit: SpeedUnit;
    isHudMode: boolean;
    speedLimit: number; // in km/h
    isSpeedLimitEnabled: boolean;
    theme: Theme;
    accentColor: string;
    historyRetentionDays: number;
    isDebugEnabled: boolean;
    isPipEnabled: boolean;
    isMapEnabled: boolean;
    isKeepScreenOnEnabled: boolean;
    mapOrientation: 'north-up' | 'heading-up';
    isShowAllTripsEnabled: boolean;

    setUnit: (unit: SpeedUnit) => void;
    toggleHudMode: () => void;
    setSpeedLimit: (limit: number) => void;
    toggleSpeedLimit: () => void;
    setTheme: (theme: Theme) => void;
    setAccentColor: (color: string) => void;
    setHistoryRetentionDays: (days: number) => void;
    toggleDebug: () => void;
    togglePipEnabled: () => void;
    toggleMapEnabled: () => void;
    toggleKeepScreenOn: () => void;
    setMapOrientation: (orientation: 'north-up' | 'heading-up') => void;
    refreshRate: number;
    setRefreshRate: (rate: number) => void;
    toggleShowAllTrips: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            unit: 'km/h',
            isHudMode: false,
            speedLimit: 80,
            isSpeedLimitEnabled: false,
            theme: 'dark',
            accentColor: '#00C2FF', // Cyan
            historyRetentionDays: 30,
            isDebugEnabled: false,
            isPipEnabled: true,
            isMapEnabled: true,
            isKeepScreenOnEnabled: true,
            mapOrientation: 'north-up',
            refreshRate: 500,
            isShowAllTripsEnabled: false,

            setUnit: (unit) => set({ unit }),
            toggleHudMode: () => set((state) => ({ isHudMode: !state.isHudMode })),
            setSpeedLimit: (limit) => set({ speedLimit: limit }),
            toggleSpeedLimit: () => set((state) => ({ isSpeedLimitEnabled: !state.isSpeedLimitEnabled })),
            setTheme: (theme) => set({ theme }),
            setAccentColor: (accentColor) => set({ accentColor }),
            setHistoryRetentionDays: (historyRetentionDays) => set({ historyRetentionDays }),
            toggleDebug: () => set((state) => ({ isDebugEnabled: !state.isDebugEnabled })),
            togglePipEnabled: () => set((state) => ({ isPipEnabled: !state.isPipEnabled })),
            toggleMapEnabled: () => set((state) => ({ isMapEnabled: !state.isMapEnabled })),
            toggleKeepScreenOn: () => set((state) => ({ isKeepScreenOnEnabled: !state.isKeepScreenOnEnabled })),
            setMapOrientation: (orientation) => set({ mapOrientation: orientation }),
            setRefreshRate: (refreshRate) => set({ refreshRate }),
            toggleShowAllTrips: () => set((state) => ({ isShowAllTripsEnabled: !state.isShowAllTripsEnabled })),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
