import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Fetches all available routes in the system.
 */
export const listAllRoutes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("routes"),
      name: v.string(),
      startLat: v.number(),
      startLng: v.number(),
      endLat: v.number(),
      endLng: v.number(),
      distance: v.number(),
      averageCapacity: v.number(),
    })
  ),
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    return routes.map((route) => ({
      _id: route._id,
      name: route.name,
      startLat: route.startLat,
      startLng: route.startLng,
      endLat: route.endLat,
      endLng: route.endLng,
      distance: route.distance,
      averageCapacity: route.averageCapacity,
    }));
  },
});

/**
 * Fetches a specific route with current traffic predictions.
 */
export const getRouteWithPrediction = query({
  args: { routeId: v.id("routes") },
  returns: v.object({
    _id: v.id("routes"),
    name: v.string(),
    distance: v.number(),
    averageCapacity: v.number(),
    startLat: v.number(),
    startLng: v.number(),
    endLat: v.number(),
    endLng: v.number(),
    predictedCongestion: v.number(),
    predictedDemand: v.number(),
    confidenceScore: v.number(),
    eta: v.number(),
    optimizationScore: v.number(),
  }),
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    const prediction: any = await ctx.runQuery(
      internal.trafficService.predictTraffic,
      { routeId: args.routeId }
    );

    const optimizationScore: number = await ctx.runQuery(
      internal.trafficService.calculateOptimizationScore,
      { routeId: args.routeId }
    );

    const eta = (route.distance / 40) * 60;

    return {
      _id: route._id,
      name: route.name,
      distance: route.distance,
      averageCapacity: route.averageCapacity,
      startLat: route.startLat,
      startLng: route.startLng,
      endLat: route.endLat,
      endLng: route.endLng,
      predictedCongestion: prediction.predictedCongestion,
      predictedDemand: prediction.predictedDemand,
      confidenceScore: prediction.confidenceScore,
      eta,
      optimizationScore,
    };
  },
});

/**
 * Fetches GPS waypoints for a route to display on map.
 */
export const getRouteWaypoints = query({
  args: { routeId: v.id("routes") },
  returns: v.array(
    v.object({
      latitude: v.number(),
      longitude: v.number(),
      speed: v.number(),
      busCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const gpsData = await ctx.db
      .query("gpsData")
      .withIndex("by_route_timestamp", (q) => q.eq("routeId", args.routeId))
      .order("desc")
      .take(1);

    if (gpsData.length === 0) {
      const route = await ctx.db.get(args.routeId);
      if (!route) throw new Error("Route not found");

      return [
        {
          latitude: route.startLat,
          longitude: route.startLng,
          speed: 0,
          busCount: 0,
        },
        {
          latitude: route.endLat,
          longitude: route.endLng,
          speed: 0,
          busCount: 0,
        },
      ];
    }

    const latestTimestamp = gpsData[0].timestamp;
    const waypoints = await ctx.db
      .query("gpsData")
      .withIndex("by_route_timestamp", (q) =>
        q.eq("routeId", args.routeId).eq("timestamp", latestTimestamp)
      )
      .collect();

    return waypoints
      .sort((a, b) => a.latitude - b.latitude)
      .map((w) => ({
        latitude: w.latitude,
        longitude: w.longitude,
        speed: w.speed,
        busCount: w.busCount,
      }));
  },
});

/**
 * Fetches the optimized version of a route with comparison metrics.
 */
export const getOptimizedRoute = query({
  args: { routeId: v.id("routes") },
  returns: v.union(
    v.object({
      _id: v.id("optimizedRoutes"),
      sourceRouteId: v.id("routes"),
      optimizedDistance: v.number(),
      estimatedTimeSaved: v.number(),
      efficiencyGain: v.number(),
      baselineMetrics: v.object({
        distance: v.number(),
        eta: v.number(),
        congestion: v.number(),
      }),
      optimizedMetrics: v.object({
        distance: v.number(),
        eta: v.number(),
        congestion: v.number(),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const existingOptimized = await ctx.db
      .query("optimizedRoutes")
      .withIndex("by_source_route", (q) => q.eq("sourceRouteId", args.routeId))
      .unique();

    if (existingOptimized) {
      return {
        _id: existingOptimized._id,
        sourceRouteId: existingOptimized.sourceRouteId,
        optimizedDistance: existingOptimized.optimizedDistance,
        estimatedTimeSaved: existingOptimized.estimatedTimeSaved,
        efficiencyGain: existingOptimized.efficiencyGain,
        baselineMetrics: existingOptimized.baselineMetrics,
        optimizedMetrics: existingOptimized.optimizedMetrics,
      };
    }

    // If no optimized route exists, return null
    // The client can call the generateOptimizedRoute mutation if they want to create one
    return null;
  },
});

/**
 * Search routes by name similarity.
 */
export const searchRoutes = query({
  args: { query: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("routes"),
      name: v.string(),
      distance: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const allRoutes = await ctx.db.query("routes").collect();
    const searchQuery = args.query.toLowerCase();

    return allRoutes
      .filter((route) => route.name.toLowerCase().includes(searchQuery))
      .map((route) => ({
        _id: route._id,
        name: route.name,
        distance: route.distance,
      }));
  },
});

/**
 * Initialize sample data on first app load.
 */
export const initializeSampleData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.trafficService.seedSampleData, {});
    return null;
  },
});