import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export interface Car {
    id: number;
    type: 'car' | 'bike';
    make: string;
    model: string;
    variant: string;
    regNumber: string;
    nickname: string;
}

export interface Trip {
    id: number;
    carId: number | null;
    startTime: number;
    endTime: number | null;
    distance: number; // in meters
    maxSpeed: number; // in m/s
    avgSpeed: number; // in m/s
}

export interface TripPoint {
    id: number;
    tripId: number;
    timestamp: number;
    latitude: number;
    longitude: number;
    speed: number;
    accuracy: number;
    altitude: number;
}

const getDb = () => {
    if (!db) {
        db = SQLite.openDatabaseSync('tripmetrix.db');
    }
    return db;
};

export const DatabaseService = {
    init: () => {
        const database = getDb();
        database.execSync(`
      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT DEFAULT 'car',
        make TEXT,
        model TEXT,
        variant TEXT,
        regNumber TEXT,
        nickname TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        carId INTEGER,
        startTime INTEGER NOT NULL,
        endTime INTEGER,
        distance REAL DEFAULT 0,
        maxSpeed REAL DEFAULT 0,
        avgSpeed REAL DEFAULT 0,
        FOREIGN KEY (carId) REFERENCES cars (id)
      );
      CREATE TABLE IF NOT EXISTS trip_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tripId INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        speed REAL NOT NULL,
        accuracy REAL,
        altitude REAL,
        FOREIGN KEY (tripId) REFERENCES trips (id)
      );
    `);

        // Migration to add carId to existing trips if needed (simple check)
        try {
            const result = database.getAllSync("PRAGMA table_info(trips)");
            const hasCarId = result.some((col: any) => col.name === 'carId');
            if (!hasCarId) {
                database.execSync('ALTER TABLE trips ADD COLUMN carId INTEGER REFERENCES cars(id)');
            }
        } catch (e) {
            console.log('Migration check failed or not needed', e);
        }

        // Migration to add type to existing cars if needed
        try {
            const result = database.getAllSync("PRAGMA table_info(cars)");
            const hasType = result.some((col: any) => col.name === 'type');
            if (!hasType) {
                database.execSync("ALTER TABLE cars ADD COLUMN type TEXT DEFAULT 'car'");
            }
        } catch (e) {
            console.log('Car type migration check failed or not needed', e);
        }
    },

    // Car Methods
    addCar: (car: Omit<Car, 'id'>): number => {
        const result = getDb().runSync(
            'INSERT INTO cars (type, make, model, variant, regNumber, nickname) VALUES (?, ?, ?, ?, ?, ?)',
            car.type || 'car', car.make, car.model, car.variant, car.regNumber, car.nickname
        );
        return result.lastInsertRowId;
    },

    updateCar: (car: Car) => {
        getDb().runSync(
            'UPDATE cars SET type = ?, make = ?, model = ?, variant = ?, regNumber = ?, nickname = ? WHERE id = ?',
            car.type || 'car', car.make, car.model, car.variant, car.regNumber, car.nickname, car.id
        );
    },

    getCars: (): Car[] => {
        return getDb().getAllSync('SELECT * FROM cars ORDER BY id DESC');
    },

    deleteCar: (id: number) => {
        getDb().runSync('DELETE FROM cars WHERE id = ?', id);
    },

    startTrip: (carId: number | null): number => {
        const startTime = Date.now();
        const result = getDb().runSync('INSERT INTO trips (startTime, carId) VALUES (?, ?)', startTime, carId);
        return result.lastInsertRowId;
    },

    endTrip: (tripId: number, distance: number, maxSpeed: number, avgSpeed: number) => {
        const endTime = Date.now();
        getDb().runSync(
            'UPDATE trips SET endTime = ?, distance = ?, maxSpeed = ?, avgSpeed = ? WHERE id = ?',
            endTime, distance, maxSpeed, avgSpeed, tripId
        );
    },

    addTripPoint: (tripId: number, point: Omit<TripPoint, 'id' | 'tripId'>) => {
        getDb().runSync(
            `INSERT INTO trip_points (tripId, timestamp, latitude, longitude, speed, accuracy, altitude)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            tripId, point.timestamp, point.latitude, point.longitude, point.speed, point.accuracy, point.altitude
        );
    },

    getTrips: (): Trip[] => {
        return getDb().getAllSync('SELECT * FROM trips ORDER BY startTime DESC');
    },

    getTripsByCar: (carId: number): Trip[] => {
        return getDb().getAllSync('SELECT * FROM trips WHERE carId = ? ORDER BY startTime DESC', carId);
    },

    getTripPoints: (tripId: number): TripPoint[] => {
        return getDb().getAllSync('SELECT * FROM trip_points WHERE tripId = ? ORDER BY timestamp ASC', tripId);
    },

    deleteTrip: (tripId: number) => {
        getDb().runSync('DELETE FROM trip_points WHERE tripId = ?', tripId);
        getDb().runSync('DELETE FROM trips WHERE id = ?', tripId);
    }
};
