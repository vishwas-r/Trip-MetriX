import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car, DatabaseService } from '../services/DatabaseService';

interface CarState {
    cars: Car[];
    selectedCarId: number | null;

    // Actions
    loadCars: () => void;
    addCar: (car: Omit<Car, 'id'>) => void;
    updateCar: (car: Car) => void;
    deleteCar: (id: number) => void;
    selectCar: (id: number | null) => void;
    getSelectedCar: () => Car | undefined;
}

export const useCarStore = create<CarState>()(
    persist(
        (set, get) => ({
            cars: [],
            selectedCarId: null,

            loadCars: () => {
                try {
                    const cars = DatabaseService.getCars();
                    set({ cars });
                } catch (error) {
                    console.error('Failed to load cars:', error);
                }
            },

            addCar: (car) => {
                try {
                    const id = DatabaseService.addCar(car);
                    const newCar = { ...car, id };
                    set((state) => ({
                        cars: [newCar, ...state.cars],
                        selectedCarId: state.selectedCarId ?? id // Auto-select if first car
                    }));
                } catch (error) {
                    console.error('Failed to add car:', error);
                }
            },

            updateCar: (car) => {
                try {
                    DatabaseService.updateCar(car);
                    set((state) => ({
                        cars: state.cars.map((c) => (c.id === car.id ? car : c)),
                    }));
                } catch (error) {
                    console.error('Failed to update car:', error);
                }
            },

            deleteCar: (id) => {
                try {
                    DatabaseService.deleteCar(id);
                    set((state) => ({
                        cars: state.cars.filter((c) => c.id !== id),
                        selectedCarId: state.selectedCarId === id ? null : state.selectedCarId
                    }));
                } catch (error) {
                    console.error('Failed to delete car:', error);
                }
            },

            selectCar: (id) => {
                set({ selectedCarId: id });
            },

            getSelectedCar: () => {
                const { cars, selectedCarId } = get();
                return cars.find((c) => c.id === selectedCarId);
            }
        }),
        {
            name: 'car-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ selectedCarId: state.selectedCarId }), // Only persist selectedCarId
        }
    )
);
