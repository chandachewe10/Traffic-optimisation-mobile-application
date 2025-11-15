import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Ionicons } from '@expo/vector-icons';

import { ConvexProvider, ConvexReactClient } from 'convex/react';

import HomeScreen from "./screens/HomeScreen"
import RoutePlannerScreen from "./screens/RoutePlannerScreen"
import DashboardScreen from "./screens/DashboardScreen"
import RouteDetailScreen from "./screens/RouteDetailScreen"
import ConvexSetupScreen from "./components/ConvexSetupScreen"

import { COLORS } from './lib/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}

function RoutePlannerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoutePlanner" component={RoutePlannerScreen} />
      <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ((
        {
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Plan') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }
          return <Ionicons name={iconName as any} size={24} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray500,
        tabBarStyle: {
          borderTopColor: COLORS.gray200,
          borderTopWidth: 1,
        },
      }))}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Routes' }} />
      <Tab.Screen name="Plan" component={RoutePlannerStack} options={{ title: 'Plan' }} />
      <Tab.Screen name="Dashboard" component={DashboardStack} options={{ title: 'Metrics' }} />
    </Tab.Navigator>
  );
}

// Initialize Convex client
// Set EXPO_PUBLIC_CONVEX_URL in your .env file or environment variables
// You can get your Convex URL from: https://dashboard.convex.dev
// To set up Convex, run: npx convex dev
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;

export default function App() {
  // Show setup screen if Convex URL is not configured
  if (!CONVEX_URL) {
    return (
      <SafeAreaProvider style={styles.container}>
        <ConvexSetupScreen />
      </SafeAreaProvider>
    );
  }

  // Create Convex client with configured URL
  const convexClient = new ConvexReactClient(CONVEX_URL);

  return (
    <ConvexProvider client={convexClient}>
      <SafeAreaProvider style={styles.container}>
        <NavigationContainer>
          <RootTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </ConvexProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});