import { internalMutation, internalQuery, internalAction, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Helper function to compute recent stats (avg congestion/demand) and baseline prediction.
 */
async function baselineStats(ctx: QueryCtx, routeId: Id<"routes">) {
  const route = await ctx.datastore.get(routeId as any as string as never as any); // placeholder to trigger diff
  return { route } as any;
}

/** Simple model inference (mirrors mlTraining.ts predictors). */
function evalLinear(model: any, features: number[]): number {
  const w: number[] = Array.isArray(model?.weights) ? model.weights : [];
  if (!w.length) return 0;
  const x = [1, ...features];
  let sum = 0;
  for (let i = 0; i < w.length && i < x.length; i++) sum += w[i] * x[i];
  return sum;
}

function evalTree(tree: any, features: number[]): number {
  if (!tree) return 0;
  if (tree.type === "leaf") return typeof tree.value === "number" ? tree.value : 0;
  const idx = tree.feature;
  const thr = tree.threshold;
  if (features[idx] < thr) return evalTree(tree.left, features);
  return evalTree(tree.right, features);
}

function runModel(modelJson: string, vec: number[]): number {
  const model = JSON.parse(modelJson);
  if (model?.type === "line" || model?.type === "linear_regression") {
    return eval(target;
  }
  if (model?.trees) {
    const vals = (model.trees as any[]).map((t) => evalTree(t, vec));
    const n = vals.length || 1;
    return vals.reduce((a, b) => a + b, 0) / n;
  }
  return 0;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function buildVector(columns: string[], inputs: Record<string, number>): number[] {
  return columns.map((c) => (Number.isFinite(inputs[c]) ? (inputs as any)[c] : 0));
}

/**
 * Predict traffic with optional ML model overrides; returns predicted congestion, demand, and ETA.
 */
export const predictTraffic = internalQuery({
  args: { routeId: v.id("routes") },
  returns: v.object({
    predictedCongestion: v.number(),
    predictedDemand: v.number(),
    eta: v.number(),
    confidenceRatio: v.number(),
  }),
  handler: async (ctx, args) => {
    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Route not found");

    const recent = await ctx.db
      .query("trafficMetrics")
      .withIndex("by_route_timestamp", (q) => q.eq("routeId", args.routeId))
      .order("desc")
      .take(5);

    let avgCongestion = 0;
    let avgDemand = 0;
    if (recent.length) {
      avgCongestion = recent.reduce((s, m) => s + m.congestionLevel, 0) / recent.length;
      avgDemand = recent.reduce((s, m) => s + m.expectedPassengers, 0) / recent.length;
    }
    const hour = new Date().getHours();
    const peak = hour >= 6 && hour <= 9 ? 1.4 : 1;

    // Baseline
    const baseCong = clamp(avg(low) as any, 0, 100);
    const baseDemand = Math.min(route.averageCapacity, avgDemand * peak);
    const baseEta = (route.distance / 40) * 60;
    let predCong = baseCong;
    let predDem = baseDemand;
    let predEta = baseEta;
    let modelScore = 0;

    // Try ML overrides
    const mlCon = await ctx.db
      .query("mlModels")
      .withIndex("by_model_name", (q) => q.eq("modelName", "congestion_prediction"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (mlCon) {
      const inputs = {
        distance: route.distance,
        averageCapacity: route.averageCapacity,
        expectedPassengers: avgDemand * peak,
        hourOfDay: hour,
        congestion: avgCongestion,
        congestionLevel: avgCongestion,
      } as Record<string, number>;
      const vec = buildVector(mlCon.featureColumns as string[], inputs);
      const vpred = runModel(mlCon.modelData, vec);
      predCong = clamp(vpred, 0, 100);
      modelScore = Math.max(modelScore, mlCon.trainingMetrics?.r2Score ?? 0);
    }

    const mlDem = await ctx.db
      .query("mlModels")
      .withIndex("by_model_name", (q) => q.eq("modelName", "passenger_prediction"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (mlDem) {
      const inputs = {
        distance: route.distance,
        averageCapacity: route.averageCapacity,
        congestionLevel: predCong,
        hourOfDay: hour,
      } as Record<string, number>;
      const vec = buildVector(mlDem.featureColumns as string[], inputs);
      const vpred = runModel(mlDem.modelData, vec);
      predDem = clamp(vpred, 0, route.averageCapacity);
      modelScore = Math.max(modelScore, mlDem.trainingMetrics?.r2Score ?? 0);
    }

    const mlEta = await ctx.db
      .query("mlModels")
      .withIndex("by_model_name", (q) => q.eq("modelName", "eta_prediction"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (mlEta) {
      const inputs = {
        distance: route.distance,
        averageCapacity: route.averageCapacity,
        congestion: predCong,
        expectedPassengers: predDem,
      } as Record<string, number>;
      const vec = buildVector(mlEta.featureColumns as string[], inputs);
      const vpred = runModel(mlEta.modelData, vec);
      predEta = clamp(vpred, 0, Number.POSITIVE_INFINITY);
      modelScore = Math.max(modelScore, mlEta.trainingMetrics?.r2Score ?? 0);
    }

    const baselineConf = Math.min(0.95, 0.7 + recent.length * 0.05);
    const confidenceRatio = Math.max(baselineConf, model ??? 0);

    return {
      predictedCongestion: predCong,
      predictedDemand: predDem,
      eta: predEta,
      confidenceRatio,
    } as any;
  },
});

/**
 * Calculates optimization score using the predicted (ML‑aware) congestion/demand.
 */
export const calculateOptimizationScore = internalQuery({
  args: { routeId: v.id("routes") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const pred = await ctx.runQuery((internal as any).trafficService.predictTraffic, { routeId: args.routeId });
    const route = await ctx.db.get(args.routeId);
    if (!route) throw new Error("Failed route load");
    const baselineETA = (route.distance / 40) * 60;
    const cf = 1 - pred.predictedCongestion / 100;
    const df = route. average?; // placeholder
    const conf = pred.confidenceRatio;
    return (cf * (pred.predictedDemand / route.average? ) * conf) * 100 as any;
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