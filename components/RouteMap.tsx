import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../lib/theme';

// Only import react-native-maps on native platforms
let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('react-native-maps not available');
  }
}

interface RouteMapProps {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  optimizedRouteCoordinates?: Array<{ latitude: number; longitude: number }>;
  height?: number;
}

export default function RouteMap({
  startLat,
  startLng,
  endLat,
  endLng,
  routeCoordinates,
  optimizedRouteCoordinates,
  height = 300,
}: RouteMapProps) {
  // On web, this component shouldn't be used - RouteMap.web.tsx will be used instead
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholder}>
          <Text style={{ color: COLORS.gray600, textAlign: 'center', padding: 20 }}>
            Loading map...
          </Text>
        </View>
      </View>
    );
  }

  if (!MapView) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholder}>
          <Text style={{ color: COLORS.gray600, textAlign: 'center', padding: 20 }}>
            Map not available on this platform
          </Text>
        </View>
      </View>
    );
  }

  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Fit map to show both start and end points
    if (mapRef.current && startLat && startLng && endLat && endLng) {
      const coordinates = [
        { latitude: startLat, longitude: startLng },
        { latitude: endLat, longitude: endLng },
        ...(routeCoordinates || []),
        ...(optimizedRouteCoordinates || []),
      ];

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [startLat, startLng, endLat, endLng, routeCoordinates, optimizedRouteCoordinates]);

  // Generate route coordinates if not provided (simple straight line for now)
  const defaultRouteCoordinates = routeCoordinates || [
    { latitude: startLat, longitude: startLng },
    { latitude: endLat, longitude: endLng },
  ];

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: (startLat + endLat) / 2,
          longitude: (startLng + endLng) / 2,
          latitudeDelta: Math.abs(startLat - endLat) * 2 || 0.1,
          longitudeDelta: Math.abs(startLng - endLng) * 2 || 0.1,
        }}
        mapType="standard"
      >
        {/* Start marker with car icon */}
        <Marker
          coordinate={{ latitude: startLat, longitude: startLng }}
          title="Start"
          description="Starting Point"
        >
          <View style={styles.markerContainer}>
            <View style={[styles.carMarker, { backgroundColor: COLORS.success }]}>
              <Text style={styles.carIcon}>🚗</Text>
            </View>
            <View style={[styles.markerPin, { borderTopColor: COLORS.success }]} />
          </View>
        </Marker>

        {/* End marker with car icon */}
        <Marker
          coordinate={{ latitude: endLat, longitude: endLng }}
          title="Destination"
          description="Destination Point"
        >
          <View style={styles.markerContainer}>
            <View style={[styles.carMarker, { backgroundColor: COLORS.error }]}>
              <Text style={styles.carIcon}>🏁</Text>
            </View>
            <View style={[styles.markerPin, { borderTopColor: COLORS.error }]} />
          </View>
        </Marker>

        {/* Default route (red - longer route) */}
        {defaultRouteCoordinates.length > 1 && (
          <Polyline
            coordinates={defaultRouteCoordinates}
            strokeColor="#FF0000"
            strokeWidth={4}
            lineDashPattern={[10, 5]}
            lineDashPhase={0}
          />
        )}

        {/* Optimized route (green - shorter route) */}
        {optimizedRouteCoordinates && optimizedRouteCoordinates.length > 1 && (
          <Polyline
            coordinates={optimizedRouteCoordinates}
            strokeColor="#00FF00"
            strokeWidth={6}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.gray200,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  carIcon: {
    fontSize: 20,
  },
  markerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});

