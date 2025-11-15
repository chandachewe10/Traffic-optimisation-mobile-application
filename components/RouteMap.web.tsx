import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../lib/theme';

interface RouteMapProps {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  optimizedRouteCoordinates?: Array<{ latitude: number; longitude: number }>;
  height?: number;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!mapRef.current || !googleMapsApiKey) {
      // Fallback: show placeholder if no API key
      return;
    }

    // Load Google Maps JavaScript API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=geometry,drawing`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapRef.current || !window.google) return;

      const center = {
        lat: (startLat + endLat) / 2,
        lng: (startLng + endLng) / 2,
      };

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center,
        mapTypeId: 'roadmap',
      });

      mapInstanceRef.current = map;

      // Create custom car icon for start marker
      const startCarIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="${COLORS.success}" stroke="#fff" stroke-width="3"/>
            <text x="20" y="28" font-size="20" text-anchor="middle">🚗</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20),
      };

      // Create custom flag icon for end marker
      const endFlagIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="${COLORS.error}" stroke="#fff" stroke-width="3"/>
            <text x="20" y="28" font-size="20" text-anchor="middle">🏁</text>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20),
      };

      // Add start marker with car icon
      new window.google.maps.Marker({
        position: { lat: startLat, lng: startLng },
        map,
        title: 'Start',
        label: '🚗',
        icon: startCarIcon,
      });

      // Add end marker with flag icon
      new window.google.maps.Marker({
        position: { lat: endLat, lng: endLng },
        map,
        title: 'Destination',
        label: '🏁',
        icon: endFlagIcon,
      });

      // Draw default route (red - longer route)
      if (routeCoordinates && routeCoordinates.length > 1) {
        const routePath = routeCoordinates.map(
          (coord) => new window.google.maps.LatLng(coord.latitude, coord.longitude)
        );

        new window.google.maps.Polyline({
          path: routePath,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          icons: [
            {
              icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                strokeWeight: 2,
                scale: 4,
                strokeColor: '#FF0000',
              },
              offset: '0%',
              repeat: '20px',
            },
          ],
        });
      }

      // Draw optimized route (green - shorter route)
      if (optimizedRouteCoordinates && optimizedRouteCoordinates.length > 1) {
        const optimizedPath = optimizedRouteCoordinates.map(
          (coord) => new window.google.maps.LatLng(coord.latitude, coord.longitude)
        );

        new window.google.maps.Polyline({
          path: optimizedPath,
          geodesic: true,
          strokeColor: '#00FF00',
          strokeOpacity: 1.0,
          strokeWeight: 6,
        });
      }

      // Fit bounds to show all points
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: startLat, lng: startLng });
      bounds.extend({ lat: endLat, lng: endLng });
      map.fitBounds(bounds);
    }

    return () => {
      // Cleanup if needed
    };
  }, [startLat, startLng, endLat, endLng, routeCoordinates, optimizedRouteCoordinates, googleMapsApiKey]);

  // Fallback view if no API key
  if (!googleMapsApiKey) {
    return (
      <View style={[styles.container, styles.placeholder, { height }]}>
        <View style={styles.placeholderContent}>
          <Text style={styles.placeholderText}>
            Google Maps API key not configured.{'\n'}
            Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {/* @ts-ignore - web div element */}
      <div ref={mapRef} style={styles.map} />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
  },
  placeholderContent: {
    padding: 20,
  },
  placeholderText: {
    color: COLORS.gray600,
    textAlign: 'center',
  },
});

