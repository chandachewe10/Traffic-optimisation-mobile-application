import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  routes: defineTable({
    name: v.string(),
    startLat: v.number(),
    startLng: v.number(),
    endLat: v.number(),
    endLng: v.number(),
    distance: v.number(),
    averageCapacity: v.number(),
  }).index("by_name", ["name"]),

  gpsData: defineTable({
    routeId: v.id("routes"),
    latitude: v.number(),
    longitude: v.number(),
    timestamp: v.number(),
    busCount: v.number(),
    speed: v.number(),
  }).index("by_route_timestamp", ["routeId", "timestamp"]),

  trafficMetrics: defineTable({
    routeId: v.id("routes"),
    congestionLevel: v.number(),
    expectedPassengers: v.number(),
    eta: v.number(),
    timestamp: v.number(),
  }).index("by_route_timestamp", ["routeId", "timestamp"]),

  predictions: defineTable({
    routeId: v.id("routes"),
    predictedCongestion: v.number(),
    predictedDemand: v.number(),
    timeToPredict: v.number(),
    confidenceScore: v.number(),
    optimizationScore: v.number(),
  }).index("by_route", ["routeId"]),

  optimizedRoutes: defineTable({
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
  }).index("by_source_route", ["sourceRouteId"]),

  savedRoutes: defineTable({
    userId: v.string(), // For future user authentication
    name: v.string(),
    startAddress: v.string(),
    endAddress: v.string(),
    startLat: v.number(),
    startLng: v.number(),
    endLat: v.number(),
    endLng: v.number(),
    distance: v.number(),
    estimatedTime: v.number(), // in minutes
    optimizedDistance: v.optional(v.number()),
    optimizedTime: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});