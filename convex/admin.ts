import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Hash password using SHA-256 (using Web Crypto API)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify admin login
 */
export const verifyAdmin = query({
  args: { username: v.string(), password: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!admin) {
      return false;
    }

    const passwordHash = await hashPassword(args.password);
    return admin.passwordHash === passwordHash;
  },
});

/**
 * Create admin account (initial setup)
 */
export const createAdmin = mutation({
  args: { username: v.string(), password: v.string() },
  returns: v.id("admins"),
  handler: async (ctx, args) => {
    // Check if admin already exists
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existing) {
      throw new Error("Admin username already exists");
    }

    const passwordHash = await hashPassword(args.password);
    const adminId = await ctx.db.insert("admins", {
      username: args.username,
      passwordHash,
      createdAt: Date.now(),
    });

    return adminId;
  },
});

/**
 * Get all ML models
 */
export const getMLModels = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("mlModels"),
      modelType: v.string(),
      modelName: v.string(),
      trainingMetrics: v.object({
        r2Score: v.number(),
        mse: v.number(),
        mae: v.number(),
      }),
      trainedAt: v.number(),
      trainedBy: v.string(),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const models = await ctx.db.query("mlModels").collect();
    return models.map((model) => ({
      _id: model._id,
      modelType: model.modelType,
      modelName: model.modelName,
      trainingMetrics: model.trainingMetrics,
      trainedAt: model.trainedAt,
      trainedBy: model.trainedBy,
      isActive: model.isActive,
    }));
  },
});

/**
 * Get active ML model for a specific prediction type
 */
export const getActiveModel = query({
  args: { modelName: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("mlModels"),
      modelType: v.string(),
      modelData: v.string(),
      featureColumns: v.array(v.string()),
      targetColumn: v.string(),
      trainingMetrics: v.object({
        r2Score: v.number(),
        mse: v.number(),
        mae: v.number(),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const model = await ctx.db
      .query("mlModels")
      .withIndex("by_model_name", (q) => q.eq("modelName", args.modelName))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!model) {
      return null;
    }

    return {
      _id: model._id,
      modelType: model.modelType,
      modelData: model.modelData,
      featureColumns: model.featureColumns,
      targetColumn: model.targetColumn,
      trainingMetrics: model.trainingMetrics,
    };
  },
});

/**
 * Get training jobs
 */
export const getTrainingJobs = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("trainingJobs"),
      _creationTime: v.number(),
      modelName: v.string(),
      modelType: v.string(),
      status: v.string(),
      trainingData: v.optional(v.any()),
      trainingDataSize: v.number(),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      metrics: v.optional(
        v.object({
          r2Score: v.number(),
          mse: v.number(),
          mae: v.number(),
        })
      ),
      errorMessage: v.optional(v.string()),
      trainedBy: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const jobs = await ctx.db
      .query("trainingJobs")
      .order("desc")
      .take(limit);

    const sanitize = (m: any | undefined) => {
      if (!m) return undefined;
      const toNum = (x: any) => (Number.isFinite(x) ? (x as number) : 0);
      const r2 = toNum(m.r2Score);
      const mse = toNum(m.mse);
      const mae = toNum(m.mae);
      return { r2Score: r2, mse, mae };
    };

    return jobs.map((j: any) => ({
      _id: j._id,
      _creationTime: j._creationTime,
      modelName: j.modelName,
      modelType: j.modelType,
      status: j.status,
      trainingData: undefined,
      trainingDataSize: j.trainingDataSize,
      startedAt: j.startedAt,
      completedAt: j.completedAt,
      metrics: sanitize(j.metrics),
      trainedBy: j.trainedBy,
      errorMessage: j.errorMessage,
    }));
  },
});

/**
 * Create training job (internal)
 */
export const createTrainingJob = internalMutation({
  args: {
    modelName: v.string(),
    modelType: v.string(),
    trainingDataSize: v.number(),
    trainedBy: v.string(),
  },
  returns: v.id("trainingJobs"),
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("trainingJobs", {
      modelName: args.modelName,
      modelType: args.modelType,
      status: "pending",
      trainingDataSize: args.trainingDataSize,
      startedAt: Date.now(),
      trainedBy: args.trainedBy,
    });
    return jobId;
  },
});

/**
 * Update training job status (internal)
 */
export const updateTrainingJob = internalMutation({
  args: {
    jobId: v.id("trainingJobs"),
    status: v.string(),
    metrics: v.optional(
      v.object({
        r2Score: v.number(),
        mse: v.number(),
        mae: v.number(),
      })
    ),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: any = {
      status: args.status,
    };

    if (args.status === "completed" || args.status === "failed") {
      updateData.completedAt = Date.now();
    }

    if (args.metrics) {
      const toNum = (x: any) => (Number.isFinite(x) ? (x as number) : 0);
      const m = args.metrics as any;
      const r2 = toNum(m.r2Score);
      const mse = toNum(m.mse);
      const mae = toNum(m.mae);
      updateData.metrics = { r2Score: r2, mse, mae };
    }

    if (args.errorMessage) {
      updateData.errorMessage = args.errorMessage;
    }

    await ctx.db.patch(args.jobId, updateData);
    return null;
  },
});

/**
 * Save trained ML model (internal)
 */
export const saveMLModel = internalMutation({
  args: {
    modelType: v.string(),
    modelName: v.string(),
    modelData: v.string(), // Base64 or JSON string
    trainingDataHash: v.string(),
    trainingMetrics: v.object({
      r2Score: v.number(),
      mse: v.number(),
      mae: v.number(),
    }),
    featureColumns: v.array(v.string()),
    targetColumn: v.string(),
    trainedBy: v.string(),
    isActive: v.boolean(),
  },
  returns: v.id("mlModels"),
  handler: async (ctx, args) => {
    // Deactivate other models of the same name
    if (args.isActive) {
      const existingModels = await ctx.db
        .query("mlModels")
        .withIndex("by_model_name", (q) => q.eq("modelName", args.modelName))
        .collect();

      for (const model of existingModels) {
        if (model.isActive) {
          await ctx.db.patch(model._id, { isActive: false });
        }
      }
    }

    const modelId = await ctx.db.insert("mlModels", {
      modelType: args.modelType,
      modelName: args.modelName,
      modelData: args.modelData,
      trainingDataHash: args.trainingDataHash,
      trainingMetrics: args.trainingMetrics,
      featureColumns: args.featureColumns,
      targetColumn: args.targetColumn,
      trainedAt: Date.now(),
      trainedBy: args.trainedBy,
      isActive: args.isActive,
    });

    return modelId;
  },
});

/**
 * Set active model
 */
export const setActiveModel = mutation({
  args: { modelId: v.id("mlModels") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const model = await ctx.db.get(args.modelId);
    if (!model) {
      throw new Error("Model not found");
    }

    // Deactivate all models with the same name
    const existingModels = await ctx.db
      .query("mlModels")
      .withIndex("by_model_name", (q) => q.eq("modelName", model.modelName))
      .collect();

    for (const existingModel of existingModels) {
      await ctx.db.patch(existingModel._id, {
        isActive: existingModel._id === args.modelId,
      });
    }

    return null;
  },
});

/**
 * Get training data from database (for ML training) (internal)
 */
export const getTrainingData = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    routes: v.array(
      v.object({
        _id: v.id("routes"),
        distance: v.number(),
        averageCapacity: v.number(),
      })
    ),
    trafficMetrics: v.array(
      v.object({
        routeId: v.id("routes"),
        congestionLevel: v.number(),
        expectedPassengers: v.number(),
        eta: v.number(),
        timestamp: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 10000;

    const routes = await ctx.db.query("routes").take(limit);
    const trafficMetrics = await ctx.db
      .query("trafficMetrics")
      .order("desc")
      .take(limit);

    return {
      routes: routes.map((r) => ({
        _id: r._id,
        distance: r.distance,
        averageCapacity: r.averageCapacity,
      })),
      trafficMetrics: trafficMetrics.map((tm) => ({
        routeId: tm.routeId,
        congestionLevel: tm.congestionLevel,
        expectedPassengers: tm.expectedPassengers,
        eta: tm.eta,
        timestamp: tm.timestamp,
      })),
    };
  },
});

