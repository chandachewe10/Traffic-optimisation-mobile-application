import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useSaveRoute, useSavedRoutes, useGetGoogleMapsRoute } from "../hooks/useTrafficAPI";
import AddressInput from "../components/AddressInput";
import RouteMap from "../components/RouteMap";
import Card from "../components/Card";
import Button from "../components/Button";
import MetricRow from "../components/MetricRow";
import {
  calculateDistance,
  calculateTravelTime,
  generateRouteCoordinates,
  calculateOptimizedRoute,
} from "../lib/routeCalculator";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHARED_STYLES,
  BORDER_RADIUS,
  SHADOWS,
} from "../lib/theme";

type NavigationProp = NativeStackNavigationProp<any>;

export default function RoutePlannerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const saveRouteMutation = useSaveRoute();
  const { routes: savedRoutes, loading: savedRoutesLoading } = useSavedRoutes("default");
  const getGoogleMapsRouteAction = useGetGoogleMapsRoute();

  // Address states
  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [startLat, setStartLat] = useState<number | null>(null);
  const [startLng, setStartLng] = useState<number | null>(null);
  const [endLat, setEndLat] = useState<number | null>(null);
  const [endLng, setEndLng] = useState<number | null>(null);

  // Route calculation states
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [optimizedDistance, setOptimizedDistance] = useState<number | null>(null);
  const [optimizedTime, setOptimizedTime] = useState<number | null>(null);
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [optimizedRouteCoordinates, setOptimizedRouteCoordinates] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);

  // Calculate route when both addresses are set
  useEffect(() => {
    if (startLat && startLng && endLat && endLng) {
      calculateRoute();
    }
  }, [startLat, startLng, endLat, endLng]);

  const calculateRoute = async () => {
    if (!startLat || !startLng || !endLat || !endLng) return;

    setIsCalculating(true);
    try {
      const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

      // Try to get route from Google Maps Directions API if available
      let coords = await getGoogleMapsRouteAction({
        startLat,
        startLng,
        endLat,
        endLng,
        apiKey: googleMapsApiKey,
      });

      // If Google Maps API is not available or fails, use simple calculation
      if (!coords || coords.length === 0) {
        coords = generateRouteCoordinates(startLat, startLng, endLat, endLng);
      }

      setRouteCoordinates(coords);

      // Calculate distance (use actual route distance if available from Google Maps)
      // For now, use Haversine distance or sum of route segments
      const distance = calculateDistance(startLat, startLng, endLat, endLng);
      setRouteDistance(distance);

      // Calculate estimated time
      const time = calculateTravelTime(distance);
      setEstimatedTime(time);

      // Calculate optimized route
      const optimized = calculateOptimizedRoute(distance, time);
      setOptimizedDistance(optimized.optimizedDistance);
      setOptimizedTime(optimized.optimizedTime);
      setTimeSaved(optimized.timeSaved);

      // Generate optimized route coordinates (slightly different path)
      // In production, call Google Maps Directions API with optimizeWaypoints option
      const optimizedCoords = await getGoogleMapsRouteAction({
        startLat,
        startLng,
        endLat,
        endLng,
        apiKey: googleMapsApiKey,
      }) || generateRouteCoordinates(startLat, startLng, endLat, endLng, 15);
      
      setOptimizedRouteCoordinates(optimizedCoords);
    } catch (error) {
      console.error("Error calculating route:", error);
      Alert.alert("Error", "Failed to calculate route. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleStartAddressSelect = (address: string, lat: number, lng: number) => {
    setStartAddress(address);
    setStartLat(lat);
    setStartLng(lng);
  };

  const handleEndAddressSelect = (address: string, lat: number, lng: number) => {
    setEndAddress(address);
    setEndLat(lat);
    setEndLng(lng);
  };

  const handleSaveRoute = async () => {
    if (!startAddress || !endAddress || !routeDistance || !estimatedTime) {
      Alert.alert("Error", "Please calculate a route first.");
      return;
    }

    try {
      const routeName = `${startAddress} → ${endAddress}`;
      await saveRouteMutation({
        userId: "default",
        name: routeName,
        startAddress,
        endAddress,
        startLat: startLat!,
        startLng: startLng!,
        endLat: endLat!,
        endLng: endLng!,
        distance: routeDistance,
        estimatedTime,
        optimizedDistance: optimizedDistance || undefined,
        optimizedTime: optimizedTime || undefined,
      });
      Alert.alert("Success", "Route saved successfully!");
    } catch (error) {
      console.error("Error saving route:", error);
      Alert.alert("Error", "Failed to save route. Please try again.");
    }
  };

  const handleStartNavigation = () => {
    if (!startLat || !startLng || !endLat || !endLng) {
      Alert.alert("Error", "Please select start and destination addresses first.");
      return;
    }

    // Use optimized route if available, otherwise use default route
    const useOptimized = optimizedRouteCoordinates && optimizedRouteCoordinates.length > 0;
    
    // Create Google Maps navigation URL
    const origin = `${startLat},${startLng}`;
    const destination = `${endLat},${endLng}`;
    
    if (Platform.OS === 'ios') {
      // iOS: Use Apple Maps or Google Maps app
      const googleMapsUrl = `comgooglemaps://?saddr=${origin}&daddr=${destination}&directionsmode=driving`;
      const appleMapsUrl = `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`;
      
      Linking.canOpenURL(googleMapsUrl).then(supported => {
        if (supported) {
          Linking.openURL(googleMapsUrl);
        } else {
          Linking.openURL(appleMapsUrl);
        }
      }).catch(() => {
        Linking.openURL(appleMapsUrl);
      });
    } else if (Platform.OS === 'android') {
      // Android: Use Google Maps
      const googleMapsUrl = `google.navigation:q=${endLat},${endLng}`;
      const webUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
      
      Linking.canOpenURL(googleMapsUrl).then(supported => {
        if (supported) {
          Linking.openURL(googleMapsUrl);
        } else {
          Linking.openURL(webUrl);
        }
      }).catch(() => {
        Linking.openURL(webUrl);
      });
    } else {
      // Web: Open in new tab
      const webUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
      if (typeof window !== 'undefined') {
        window.open(webUrl, '_blank');
      } else {
        Linking.openURL(webUrl);
      }
    }
  };

  const hasRoute = startLat && startLng && endLat && endLng && routeDistance;

  return (
    <ScrollView
      style={[SHARED_STYLES.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }}
    >
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.headlineSmall, styles.title]}>Plan Your Route</Text>
        <Text style={[TYPOGRAPHY.bodySmall, styles.subtitle]}>
          Enter start and destination addresses
        </Text>
      </View>

      <View style={styles.content}>
        {/* Address Inputs */}
        <Card title="Search Addresses" style={styles.addressCard}>
          <AddressInput
            label="Initial Address (Starting Point)"
            placeholder="Enter starting address..."
            value={startAddress}
            onChangeText={setStartAddress}
            onSelectAddress={handleStartAddressSelect}
            googleMapsApiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
          />
          <AddressInput
            label="Destination Address"
            placeholder="Enter destination address..."
            value={endAddress}
            onChangeText={setEndAddress}
            onSelectAddress={handleEndAddressSelect}
            googleMapsApiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
          />
        </Card>

        {/* Map */}
        <Card style={styles.mapCard}>
          <View style={styles.mapContainer}>
            {hasRoute ? (
              <>
                <RouteMap
                  startLat={startLat!}
                  startLng={startLng!}
                  endLat={endLat!}
                  endLng={endLng!}
                  routeCoordinates={routeCoordinates}
                  optimizedRouteCoordinates={optimizedRouteCoordinates}
                  height={400}
                />
                {/* Route Info Overlay on Map */}
                <View style={styles.mapRouteInfo}>
                  {/* Route Legend */}
                  <View style={styles.routeLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendLine, { backgroundColor: '#FF0000' }]} />
                      <Text style={styles.legendText}>Default Route</Text>
                    </View>
                    {optimizedRouteCoordinates && optimizedRouteCoordinates.length > 1 && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendLine, { backgroundColor: '#00FF00' }]} />
                        <Text style={styles.legendText}>Optimized Route</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.mapRouteInfoCard}>
                    <View style={styles.mapRouteInfoRow}>
                      <Ionicons name="navigate" size={18} color={COLORS.secondary} />
                      <Text style={styles.mapRouteInfoText}>
                        {routeDistance!.toFixed(2)} km
                      </Text>
                    </View>
                    <View style={styles.mapRouteInfoDivider} />
                    <View style={styles.mapRouteInfoRow}>
                      <Ionicons name="time" size={18} color={COLORS.primary} />
                      <Text style={styles.mapRouteInfoText}>
                        {estimatedTime} min
                      </Text>
                    </View>
                    {optimizedDistance && optimizedTime && (
                      <>
                        <View style={styles.mapRouteInfoDivider} />
                        <View style={styles.mapRouteInfoRow}>
                          <Ionicons name="flash" size={18} color={COLORS.success} />
                          <View style={styles.mapRouteInfoColumn}>
                            <Text style={styles.mapRouteInfoText}>
                              {optimizedDistance.toFixed(2)} km • {optimizedTime} min
                            </Text>
                            {timeSaved && timeSaved > 0 && (
                              <Text style={styles.mapRouteInfoSavings}>
                                Save {timeSaved} min
                              </Text>
                            )}
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                  
                  {/* Navigation Button */}
                  <TouchableOpacity
                    style={styles.navigationButton}
                    onPress={handleStartNavigation}
                  >
                    <Ionicons name="navigate" size={24} color="#fff" />
                    <Text style={styles.navigationButtonText}>Start Navigation</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={64} color={COLORS.gray400} />
                <Text
                  style={[
                    TYPOGRAPHY.bodyLarge,
                    { color: COLORS.gray600, marginTop: SPACING.md },
                  ]}
                >
                  Select start and destination to view route
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Route Information */}
        {isCalculating ? (
          <Card>
            <View style={[SHARED_STYLES.flexCenter, { padding: SPACING.xl }]}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text
                style={[
                  TYPOGRAPHY.bodyMedium,
                  { color: COLORS.onSurfaceVariant, marginTop: SPACING.md },
                ]}
              >
                Calculating route...
              </Text>
            </View>
          </Card>
        ) : (
          hasRoute && (
            <>
              <Card title="Route Information">
                <MetricRow
                  label="Distance"
                  value={routeDistance!.toFixed(2)}
                  unit="km"
                />
                <View style={SHARED_STYLES.separator} />
                <MetricRow
                  label="Estimated Travel Time"
                  value={estimatedTime!.toString()}
                  unit="minutes"
                  accent
                />
              </Card>

              {optimizedDistance && optimizedTime && (
                <Card title="Optimized Route" variant="filled">
                  <MetricRow
                    label="Optimized Distance"
                    value={optimizedDistance.toFixed(2)}
                    unit="km"
                    accent
                  />
                  <View style={SHARED_STYLES.separator} />
                  <MetricRow
                    label="Optimized Time"
                    value={optimizedTime.toString()}
                    unit="minutes"
                    accent
                  />
                  <View style={SHARED_STYLES.separator} />
                  <MetricRow
                    label="Time Saved"
                    value={timeSaved!.toString()}
                    unit="minutes"
                    accent
                  />
                </Card>
              )}
            </>
          )
        )}

        {/* Action Buttons */}
        {hasRoute && (
          <View style={styles.actions}>
            <Button
              label="Save Route"
              onPress={handleSaveRoute}
              variant="primary"
              size="large"
              fullWidth
              icon="bookmark-outline"
            />
            <Button
              label={showSavedRoutes ? "Hide Saved Routes" : "View Saved Routes"}
              onPress={() => setShowSavedRoutes(!showSavedRoutes)}
              variant="secondary"
              size="medium"
              fullWidth
              style={{ marginTop: SPACING.md }}
              icon={showSavedRoutes ? "chevron-up" : "chevron-down"}
            />
          </View>
        )}

        {/* Saved Routes List */}
        {showSavedRoutes && (
          <Card title="Saved Routes" style={styles.savedRoutesCard}>
            {savedRoutesLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : savedRoutes.length === 0 ? (
              <Text
                style={[
                  TYPOGRAPHY.bodyMedium,
                  { color: COLORS.onSurfaceVariant, textAlign: "center" },
                ]}
              >
                No saved routes yet
              </Text>
            ) : (
              savedRoutes.map((route) => (
                <TouchableOpacity
                  key={route._id}
                  style={styles.savedRouteItem}
                  onPress={() => {
                    setStartAddress(route.startAddress);
                    setEndAddress(route.endAddress);
                    setStartLat(route.startLat);
                    setStartLng(route.startLng);
                    setEndLat(route.endLat);
                    setEndLng(route.endLng);
                    setShowSavedRoutes(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPOGRAPHY.titleSmall, { color: COLORS.onSurface }]}>
                      {route.name}
                    </Text>
                    <Text
                      style={[
                        TYPOGRAPHY.bodySmall,
                        { color: COLORS.onSurfaceVariant, marginTop: SPACING.xs },
                      ]}
                    >
                      {route.distance.toFixed(2)} km • {route.estimatedTime} min
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray500} />
                </TouchableOpacity>
              ))
            )}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  addressCard: {
    marginTop: SPACING.md,
  },
  mapCard: {
    marginTop: SPACING.md,
  },
  mapContainer: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
  },
  mapRouteInfo: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
  },
  routeLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  legendLine: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginRight: SPACING.xs,
  },
  legendText: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.onSurface,
    fontSize: 11,
  },
  mapRouteInfoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  mapRouteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  mapRouteInfoColumn: {
    marginLeft: SPACING.xs,
  },
  mapRouteInfoText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  mapRouteInfoSavings: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success,
    marginTop: 2,
    fontWeight: '600',
  },
  mapRouteInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.gray300,
    marginHorizontal: SPACING.xs,
  },
  navigationButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.medium,
  },
  navigationButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: '#fff',
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  actions: {
    marginTop: SPACING.md,
  },
  savedRoutesCard: {
    marginTop: SPACING.md,
  },
  savedRouteItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
});
