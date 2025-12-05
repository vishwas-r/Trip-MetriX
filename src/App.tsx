import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DatabaseService } from './src/services/DatabaseService';
import { useEffect, useState, useCallback } from 'react';
import DashboardScreen from './src/screens/DashboardScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';
import CarListScreen from './src/screens/CarListScreen';
import AddCarScreen from './src/screens/AddCarScreen';
import { RootStackParamList, RootTabParamList, HistoryStackParamList, SettingsStackParamList } from './src/navigation/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettingsStore } from './src/store/settingsStore';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from './src/screens/SplashScreen';
import { useFonts, Orbitron_400Regular, Orbitron_500Medium, Orbitron_600SemiBold, Orbitron_700Bold, Orbitron_800ExtraBold, Orbitron_900Black } from '@expo-google-fonts/orbitron';
import { Rajdhani_300Light, Rajdhani_400Regular, Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';

// Keep the splash screen visible while we fetch resources
try {
  SplashScreen.preventAutoHideAsync().catch(() => {
    /* reload the app */
  });
} catch (e) {
  console.warn('SplashScreen.preventAutoHideAsync() failed', e);
}

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

function HistoryStackNavigator() {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && true);
  const contentColor = isDark ? 'black' : '#f3f4f6';

  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: contentColor },
        animation: 'slide_from_right',
      }}
    >
      <HistoryStack.Screen name="HistoryList" component={HistoryScreen} />
      <HistoryStack.Screen name="TripDetail" component={TripDetailScreen} />
    </HistoryStack.Navigator>
  );
}

function SettingsStackNavigator() {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && true);
  const contentColor = isDark ? 'black' : '#f3f4f6';
  const headerColor = isDark ? 'black' : 'white';
  const headerTextColor = isDark ? 'white' : 'black';

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: headerColor },
        headerTintColor: headerTextColor,
        contentStyle: { backgroundColor: contentColor },
        animation: 'slide_from_right',
      }}
    >
      <SettingsStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="CarList" component={CarListScreen} options={{ title: 'My Vehicles' }} />
      <SettingsStack.Screen name="AddCar" component={AddCarScreen} options={{ title: 'Add Vehicle' }} />
    </SettingsStack.Navigator>
  );
}

function MainApp() {
  const { theme, accentColor } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && true);
  const tabBgColor = isDark ? 'black' : 'white';
  const tabBorderColor = isDark ? '#333' : '#e5e7eb';
  const inactiveColor = isDark ? '#666666' : '#999999';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderTopColor: isDark ? '#333333' : '#e5e5e5',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontFamily: 'Rajdhani_500Medium',
          fontSize: 12,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Orbitron_800ExtraBold,
    Orbitron_900Black,
    Rajdhani_300Light,
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && true);

  useEffect(() => {
    // Settings are auto-loaded by persist middleware
    DatabaseService.init();

    // FORCE HIDE SPLASH SCREEN IMMEDIATELY
    SplashScreen.hideAsync().catch(console.warn);
  }, []);

  // REMOVED BLOCKING CHECKS
  // if (!fontsLoaded) return null;
  // if (!isSplashAnimationFinished) ...

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <MainApp />
    </NavigationContainer>
  );
}
