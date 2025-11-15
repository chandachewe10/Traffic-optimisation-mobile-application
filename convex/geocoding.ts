import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Proxy action to get address suggestions from Google Places Autocomplete API
 * This avoids CORS issues by making the request from the server
 */
export const getAddressSuggestions = action({
  args: {
    query: v.string(),
    apiKey: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      description: v.string(),
      placeId: v.string(),
      lat: v.number(),
      lng: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    if (!args.query || args.query.length < 2) {
      return [];
    }

    if (!args.apiKey) {
      // Return mock suggestions if no API key
      return getMockSuggestions(args.query);
    }

    try {
      const encodedQuery = encodeURIComponent(args.query);
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodedQuery}&key=${args.apiKey}&types=geocode`;

      const autocompleteResponse = await fetch(autocompleteUrl);
      const autocompleteData = await autocompleteResponse.json();

      if (autocompleteData.status === "OK" && autocompleteData.predictions) {
        // Fetch place details for each prediction to get coordinates
        const suggestions = await Promise.all(
          autocompleteData.predictions.slice(0, 5).map(async (prediction: any) => {
            try {
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address&key=${args.apiKey}`;
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();

              if (detailsData.status === "OK" && detailsData.result) {
                return {
                  description: prediction.description,
                  placeId: prediction.place_id,
                  lat: detailsData.result.geometry.location.lat,
                  lng: detailsData.result.geometry.location.lng,
                };
              }
            } catch (error) {
              console.error("Error fetching place details:", error);
            }
            return null;
          })
        );

        return suggestions.filter(
          (s): s is NonNullable<typeof s> => s !== null
        );
      }
    } catch (error) {
      console.error("Error getting address suggestions:", error);
    }

    // Fallback to mock suggestions
    return getMockSuggestions(args.query);
  },
});

/**
 * Proxy action to geocode an address to coordinates
 */
export const geocodeAddress = action({
  args: {
    address: v.string(),
    apiKey: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      address: v.string(),
      lat: v.number(),
      lng: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    if (!args.address || args.address.length < 3) {
      return null;
    }

    if (!args.apiKey) {
      return getMockGeocode(args.address);
    }

    try {
      const encodedAddress = encodeURIComponent(args.address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${args.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        return {
          address: result.formatted_address,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        };
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    }

    // Fallback to mock geocode
    return getMockGeocode(args.address);
  },
});

/**
 * Proxy action to get route from Google Maps Directions API
 */
export const getGoogleMapsRoute = action({
  args: {
    startLat: v.number(),
    startLng: v.number(),
    endLat: v.number(),
    endLng: v.number(),
    apiKey: v.optional(v.string()),
  },
  returns: v.union(
    v.array(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    v.null()
  ),
  handler: async (ctx, args) => {
    if (!args.apiKey) {
      return null;
    }

    try {
      const origin = `${args.startLat},${args.startLng}`;
      const destination = `${args.endLat},${args.endLng}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${args.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: Array<{ latitude: number; longitude: number }> = [];

        // Decode polyline from the route
        route.legs.forEach((leg: any) => {
          leg.steps.forEach((step: any) => {
            // Add start location of each step
            coordinates.push({
              latitude: step.start_location.lat,
              longitude: step.start_location.lng,
            });
          });
        });

        // Add final destination
        if (route.legs.length > 0) {
          const lastLeg = route.legs[route.legs.length - 1];
          coordinates.push({
            latitude: lastLeg.end_location.lat,
            longitude: lastLeg.end_location.lng,
          });
        }

        return coordinates.length > 0 ? coordinates : null;
      }
    } catch (error) {
      console.error("Error fetching Google Maps route:", error);
    }

    return null;
  },
});

// Mock data functions for fallback
function getMockSuggestions(
  query: string
): Array<{ description: string; placeId: string; lat: number; lng: number }> {
  const mockSuggestions = [
    {
      description: `${query}, Cairo Road, Lusaka, Zambia`,
      placeId: "1",
      lat: -10.333,
      lng: 28.2833,
    },
    {
      description: `${query} Street, Woodlands, Lusaka`,
      placeId: "2",
      lat: -10.286,
      lng: 28.288,
    },
    {
      description: `${query}, Northmead, Lusaka, Zambia`,
      placeId: "3",
      lat: -10.28,
      lng: 28.24,
    },
  ];

  return mockSuggestions.slice(0, 3);
}

function getMockGeocode(address: string): {
  address: string;
  lat: number;
  lng: number;
} | null {
  const lowerAddress = address.toLowerCase();

  // Mock locations in Lusaka, Zambia
  const mockLocations: Record<
    string,
    { address: string; lat: number; lng: number }
  > = {
    cairo: {
      address: "Cairo Road, Lusaka, Zambia",
      lat: -10.333,
      lng: 28.2833,
    },
    airport: {
      address: "Kenneth Kaunda International Airport, Lusaka",
      lat: -10.419,
      lng: 28.3736,
    },
    woodlands: {
      address: "Woodlands, Lusaka, Zambia",
      lat: -10.286,
      lng: 28.288,
    },
    unza: {
      address: "University of Zambia, Lusaka",
      lat: -10.325,
      lng: 28.315,
    },
    northmead: {
      address: "Northmead, Lusaka, Zambia",
      lat: -10.28,
      lng: 28.24,
    },
    cbd: {
      address: "Central Business District, Lusaka",
      lat: -10.333,
      lng: 28.2833,
    },
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

