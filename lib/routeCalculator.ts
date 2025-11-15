/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate estimated travel time in minutes
 * Assumes average speed of 40 km/h in normal conditions
 */
export function calculateTravelTime(distance: number, averageSpeed: number = 40): number {
  return Math.round((distance / averageSpeed) * 60);
}

/**
 * Generate route coordinates between two points
 * This is a simplified version - in production, use Google Maps Directions API
 */
export function generateRouteCoordinates(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  points: number = 10
): Array<{ latitude: number; longitude: number }> {
  const coordinates = [];
  for (let i = 0; i <= points; i++) {
    const ratio = i / points;
    coordinates.push({
      latitude: startLat + (endLat - startLat) * ratio,
      longitude: startLng + (endLng - startLng) * ratio,
    });
  }
  return coordinates;
}

/**
 * Calculate optimized route (simplified - assumes 8% shorter distance and faster speed)
 */
export function calculateOptimizedRoute(
  distance: number,
  estimatedTime: number
): { optimizedDistance: number; optimizedTime: number; timeSaved: number } {
  const optimizedDistance = distance * 0.92; // 8% shorter
  const optimizedTime = Math.round(estimatedTime * 0.85); // 15% faster
  const timeSaved = estimatedTime - optimizedTime;
  return {
    optimizedDistance,
    optimizedTime,
    timeSaved,
  };
}

/**
 * Get route coordinates from Google Maps Directions API
 * Note: This requires a Google Maps API key
 */
export async function getGoogleMapsRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  apiKey?: string
): Promise<Array<{ latitude: number; longitude: number }> | null> {
  if (!apiKey) {
    // Fallback to simple route if no API key
    return generateRouteCoordinates(startLat, startLng, endLat, endLng);
  }

  try {
    const origin = `${startLat},${startLng}`;
    const destination = `${endLat},${endLng}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates: Array<{ latitude: number; longitude: number }> = [];

      route.legs.forEach((leg: any) => {
        leg.steps.forEach((step: any) => {
          const points = step.polyline.points;
          // Decode polyline points (simplified - use a proper polyline decoder in production)
          coordinates.push({
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          });
        });
      });

      // Add final destination
      coordinates.push({
        latitude: endLat,
        longitude: endLng,
      });

      return coordinates;
    }
  } catch (error) {
    console.error('Error fetching Google Maps route:', error);
  }

  // Fallback to simple route
  return generateRouteCoordinates(startLat, startLng, endLat, endLng);
}

