/**
 * Geocoding utilities for address to coordinates conversion
 * In production, use Google Geocoding API
 */

interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

/**
 * Geocode an address to coordinates
 * Currently uses mock data - replace with Google Geocoding API in production
 */
export async function geocodeAddress(
  address: string,
  apiKey?: string
): Promise<GeocodeResult | null> {
  if (!address || address.length < 3) {
    return null;
  }

  // Mock geocoding - in production, use Google Geocoding API
  // Example: https://maps.googleapis.com/maps/api/geocode/json?address=ADDRESS&key=API_KEY
  if (apiKey) {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          address: result.formatted_address,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        };
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  }

  // Fallback to mock data for development
  return getMockGeocode(address);
}

/**
 * Get mock geocode data for development/testing
 */
function getMockGeocode(address: string): GeocodeResult | null {
  const lowerAddress = address.toLowerCase();
  
  // Mock locations in Lusaka, Zambia
  const mockLocations: Record<string, GeocodeResult> = {
    'cairo': { address: 'Cairo Road, Lusaka, Zambia', lat: -10.333, lng: 28.2833 },
    'airport': { address: 'Kenneth Kaunda International Airport, Lusaka', lat: -10.419, lng: 28.3736 },
    'woodlands': { address: 'Woodlands, Lusaka, Zambia', lat: -10.286, lng: 28.288 },
    'unza': { address: 'University of Zambia, Lusaka', lat: -10.325, lng: 28.315 },
    'northmead': { address: 'Northmead, Lusaka, Zambia', lat: -10.28, lng: 28.24 },
    'cbd': { address: 'Central Business District, Lusaka', lat: -10.333, lng: 28.2833 },
  };

  // Try to match address with mock locations
  for (const [key, location] of Object.entries(mockLocations)) {
    if (lowerAddress.includes(key)) {
      return location;
    }
  }

  // Default mock location
  return {
    address: `${address}, Lusaka, Zambia`,
    lat: -10.333 + (Math.random() - 0.5) * 0.1,
    lng: 28.2833 + (Math.random() - 0.5) * 0.1,
  };
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey?: string
): Promise<string | null> {
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  }

  return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

/**
 * Get address suggestions using Google Places Autocomplete API
 */
export async function getAddressSuggestions(
  query: string,
  apiKey?: string
): Promise<Array<{ description: string; placeId: string; lat: number; lng: number }>> {
  if (!query || query.length < 2) {
    return [];
  }

  if (apiKey) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedQuery}&key=${apiKey}&types=geocode`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        // Fetch place details for each prediction to get coordinates
        const suggestions = await Promise.all(
          data.predictions.slice(0, 5).map(async (prediction: any) => {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address&key=${apiKey}`;
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();

            if (detailsData.status === 'OK' && detailsData.result) {
              return {
                description: prediction.description,
                placeId: prediction.place_id,
                lat: detailsData.result.geometry.location.lat,
                lng: detailsData.result.geometry.location.lng,
              };
            }
            return null;
          })
        );

        return suggestions.filter((s): s is NonNullable<typeof s> => s !== null);
      }
    } catch (error) {
      console.error('Error getting address suggestions:', error);
    }
  }

  // Fallback to mock suggestions
  return getMockSuggestions(query);
}

function getMockSuggestions(query: string): Array<{ description: string; placeId: string; lat: number; lng: number }> {
  const mockSuggestions = [
    { description: `${query}, Cairo Road, Lusaka, Zambia`, placeId: '1', lat: -10.333, lng: 28.2833 },
    { description: `${query} Street, Woodlands, Lusaka`, placeId: '2', lat: -10.286, lng: 28.288 },
    { description: `${query}, Northmead, Lusaka, Zambia`, placeId: '3', lat: -10.28, lng: 28.24 },
  ];
  
  return mockSuggestions.slice(0, 3);
}

