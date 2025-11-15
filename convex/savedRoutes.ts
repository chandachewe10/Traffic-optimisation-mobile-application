import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all saved routes for a user
 */
export const getSavedRoutes = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("savedRoutes"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      startAddress: v.string(),
      endAddress: v.string(),
      startLat: v.number(),
      startLng: v.number(),
      endLat: v.number(),
      endLng: v.number(),
      distance: v.number(),
      estimatedTime: v.number(),
      optimizedDistance: v.optional(v.number()),
      optimizedTime: v.optional(v.number()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const routes = await ctx.db
      .query("savedRoutes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return routes;
  },
});

/**
 * Save a new route
 */
export const saveRoute = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    startAddress: v.string(),
    endAddress: v.string(),
    startLat: v.number(),
    startLng: v.number(),
    endLat: v.number(),
    endLng: v.number(),
    distance: v.number(),
    estimatedTime: v.number(),
    optimizedDistance: v.optional(v.number()),
    optimizedTime: v.optional(v.number()),
  },
  returns: v.id("savedRoutes"),
  handler: async (ctx, args) => {
    const routeId = await ctx.db.insert("savedRoutes", {
      userId: args.userId,
      name: args.name,
      startAddress: args.startAddress,
      endAddress: args.endAddress,
      startLat: args.startLat,
      startLng: args.startLng,
      endLat: args.endLat,
      endLng: args.endLng,
      distance: args.distance,
      estimatedTime: args.estimatedTime,
      optimizedDistance: args.optimizedDistance,
      optimizedTime: args.optimizedTime,
      createdAt: Date.now(),
    });
    return routeId;
  },
});

/**
 * Delete a saved route
 */
export const deleteSavedRoute = mutation({
  args: { routeId: v.id("savedRoutes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.routeId);
    return null;
  },
});

