import { internalMutation, internalQuery, internalAction, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Helper function to predict traffic - can be called directly from other functions
 */
async function predictTrafficHelper(ctx: QueryCtx, routeId: Id<"routes">) {
  const route = await ctx.db.get(routeId);
  if (!route) throw new Error("Route not found");

  const recentMetrics = await ctx.db
    .query("trafficMetrics")
    .withIndex("by_route_timestamp", (q) =>
      q.eq("routeId", routeId)
    )
    .order("desc")
    .take(5);

  let avgCongestion = 0;
  let avgDemand = 0;

  if (recentMetrics.length > 0) {
    avgCongestion =
      recentMetrics.reduce((sum, m) => sum + m.congestionLevel, 0) /
      recentMetrics.length;
    avgDemand =
      recentMetrics.reduce((sum, m) => sum + m.expectedPassengers, 0) /
      recentMetrics.length;
  }

  const timeOfDay = new Date().getHours();
  const peakHourFactor = timeOfDay >= 6 && timeOfDay <= 9 ? 1.4 : 1;

  const predictedCongestion = Math.min(100, avgCongestion * peakHourFactor);
  const predictedDemand = Math.min(
    route.averageCapacity,
    avgDemand * peakHourFactor
  );

  return {
    predictedCongestion,
    predictedDemand,
    confidenceScore: Math.min(0.95, 0.7 + recentMetrics.length * 0.05),
  };
}

/**
 * Simulates AI-based traffic prediction using historical data patterns.
 * In production, this would call an LLM API or ML model.
 */
export const predictTraffic = internalQuery({
  args: { routeId: v.id("routes") },
  returns: v.object({
    predictedCongestion: v.number(),
    predictedDemand: v.number(),
    confidenceScore: v.number(),
  }),
  handler: async (ctx, args) => {
    return await predictTrafficHelper(ctx, args.routeId);
  },
});

/**
 * Calculates optimization score for a route considering congestion and demand.
 */
export const calculateOptimizationScore = internalQuery({
  args: { routeId: v.id("routes") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const prediction = await predictTrafficHelper(ctx, args.routeId);
    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    const congestionFactor = 1 - prediction.predictedCongestion / 100;
    const demandFactor = prediction.predictedDemand / route.averageCapacity;
    const confidenceFactor = prediction.confidenceScore;

    return (congestionFactor * demandFactor * confidenceFactor) * 100;
  },
});

/**
 * Helper function to generate optimized route data - can be called directly
 */
async function generateOptimizedRouteHelper(ctx: QueryCtx, routeId: Id<"routes">) {
  const route = await ctx.db.get(routeId);
  if (!route) throw new Error("Route not found");

  const prediction = await predictTrafficHelper(ctx, routeId);

  const baselineETA = (route.distance / 40) * 60;
  const optimizedDistance = route.distance * 0.92;
  const optimizedETA = (optimizedDistance / 50) * 60;
  const timeSaved = baselineETA - optimizedETA;

  return {
    sourceRouteId: routeId,
    optimizedDistance,
    estimatedTimeSaved: Math.max(0, timeSaved),
    efficiencyGain: (timeSaved / baselineETA) * 100,
    baselineMetrics: {
      distance: route.distance,
      eta: baselineETA,
      congestion: Math.max(0, (prediction.predictedCongestion || 40)),
    },
    optimizedMetrics: {
      distance: optimizedDistance,
      eta: optimizedETA,
      congestion: Math.max(0, (prediction.predictedCongestion * 0.7 || 28)),
    },
  };
}

/**
 * Internal query to get optimized route data (without persisting it)
 */
export const getOptimizedRouteData = internalQuery({
  args: { routeId: v.id("routes") },
  returns: v.object({
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
  handler: async (ctx, args) => {
    return await generateOptimizedRouteHelper(ctx, args.routeId);
  },
});

/**
 * Generates an optimized route with reduced distance/congestion.
 */
export const generateOptimizedRoute = internalMutation({
  args: { routeId: v.id("routes") },
  returns: v.id("optimizedRoutes"),
  handler: async (ctx, args) => {
    const optimizedData = await generateOptimizedRouteHelper(ctx, args.routeId);
    const optimizedRoute = await ctx.db.insert("optimizedRoutes", optimizedData);
    return optimizedRoute;
  },
});

/**
 * Seeds sample GPS and traffic data for development.
 */
export const seedSampleData = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    if (routes.length > 0) return null;

    const sampleRoutes = [
      {
        name: "Cairo Road - Airport",
        startLat: -10.333,
        startLng: 28.2833,
        endLat: -10.419,
        endLng: 28.3736,
        distance: 22.5,
        averageCapacity: 120,
      },
      {
        name: "Woodlands - UNZA",
        startLat: -10.286,
        startLng: 28.288,
        endLat: -10.325,
        endLng: 28.315,
        distance: 6.8,
        averageCapacity: 100,
      },
      {
        name: "Northmead - CBD",
        startLat: -10.28,
        startLng: 28.24,
        endLat: -10.333,
        endLng: 28.2833,
        distance: 14.2,
        averageCapacity: 150,
      },
    ];

    for (const route of sampleRoutes) {
      const routeId = await ctx.db.insert("routes", route);

      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        const timestamp = now - i * 600000;
        const congestion = 30 + Math.random() * 50;
        const demand = 60 + Math.random() * 60;

        await ctx.db.insert("trafficMetrics", {
          routeId,
          congestionLevel: congestion,
          expectedPassengers: demand,
          eta: (route.distance / 40) * 60,
          timestamp,
        });

        const segments = 5;
        for (let j = 0; j < segments; j++) {
          const latStep = (route.endLat - route.startLat) / segments;
          const lngStep = (route.endLng - route.startLng) / segments;

          await ctx.db.insert("gpsData", {
            routeId,
            latitude: route.startLat + latStep * j,
            longitude: route.startLng + lngStep * j,
            timestamp,
            busCount: Math.floor(2 + Math.random() * 8),
            speed: 30 + Math.random() * 40,
          });
        }
      }
    }

    return null;
  },
});