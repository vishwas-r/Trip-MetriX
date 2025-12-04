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
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from './src/store/settingsStore';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from './src/screens/SplashScreen';
import { useFonts, Orbitron_400Regular, Orbitron_500Medium, Orbitron_600SemiBold, Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { Rajdhani_300Light, Rajdhani_400Regular, Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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

function TabNavigator() {
  const { theme, accentColor } = useSettingsStore();

  const isDark = theme === 'dark' || (theme === 'system' && true);
  const tabBgColor = isDark ? 'black' : 'white';
  const tabBorderColor = isDark ? '#333' : '#e5e7eb';
  const inactiveColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBgColor,
          borderTopColor: tabBorderColor,
        },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'speedometer' : 'speedometer-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontFamily: 'Orbitron_600SemiBold',
          fontSize: 10,
          marginBottom: 4,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="History"
        component={HistoryStackNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

function MainApp() {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || (theme === 'system' && true);
  const headerColor = isDark ? 'black' : 'white';
  const headerTextColor = isDark ? 'white' : 'black';
  const contentColor = isDark ? 'black' : '#f3f4f6';

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: headerColor },
          headerTintColor: headerTextColor,
          contentStyle: { backgroundColor: contentColor },
          animation: 'slide_from_right',
          presentation: 'card',
        }}
      >
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron_400Regular,
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Rajdhani_300Light,
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);

  useEffect(() => {
    DatabaseService.init();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      // await SplashScreen.hideAsync(); // CustomSplashScreen handles this
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (!isSplashAnimationFinished) {
    return <CustomSplashScreen onAnimationFinish={() => setIsSplashAnimationFinished(true)} />;
  }

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <MainApp />
    </NavigationContainer>
  );
}
