import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp, NavigatorScreenParams } from '@react-navigation/native';
import { Trip } from '../services/DatabaseService';

export type HistoryStackParamList = {
    HistoryList: undefined;
    TripDetail: { trip: Trip };
};

export type SettingsStackParamList = {
    Settings: undefined;
    CarList: undefined;
    AddCar: { carId?: number } | undefined;
};

export type RootTabParamList = {
    Dashboard: undefined;
    History: NavigatorScreenParams<HistoryStackParamList>;
    Settings: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
    Main: NavigatorScreenParams<RootTabParamList>;
};

export type DashboardScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList, 'Dashboard'>,
    NativeStackNavigationProp<RootStackParamList>
>;

export type HistoryScreenNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<HistoryStackParamList, 'HistoryList'>,
    CompositeNavigationProp<
        BottomTabNavigationProp<RootTabParamList, 'History'>,
        NativeStackNavigationProp<RootStackParamList>
    >
>;

export type TripDetailScreenNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<HistoryStackParamList, 'TripDetail'>,
    CompositeNavigationProp<
        BottomTabNavigationProp<RootTabParamList>,
        NativeStackNavigationProp<RootStackParamList>
    >
>;

export type TripDetailScreenRouteProp = RouteProp<HistoryStackParamList, 'TripDetail'>;
