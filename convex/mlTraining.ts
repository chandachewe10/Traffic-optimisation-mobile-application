import { action, internalMutation, internalAction, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Train ML model using external Python service or in-memory training
 * This action fetches training data and trains the model
 */
export const trainModel = action({
  args: {
    modelName: v.string(), // "passenger_prediction", "congestion_prediction", "eta_prediction"
    modelType: v.string(), // "linear_regression", "random_forest"
    trainedBy: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    modelId: v.optional(v.id("mlModels")),
    metrics: v.optional(
      v.object({
        r2Score: v.number(),
        mse: v.number(),
        mae: v.number(),
      })
    ),
    errorMessage: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let jobId: any = null;
    try {
      // Create training job
      jobId = await ctx.runMutation(internal.admin.createTrainingJob, {
        modelName: args.modelName,
        modelType: args.modelType,
        trainingDataSize: 0, // Will be updated
        trainedBy: args.trainedBy,
      });

      // Update job status to training
      await ctx.runMutation(internal.admin.updateTrainingJob, {
        jobId,
        status: "training",
      });

      // Fetch training data
      const trainingData = await ctx.runQuery(internal.admin.getTrainingData, {
        limit: 10000,
      });
      
      // Update job with actual data size
      await ctx.runMutation(internal.admin.updateTrainingJob, {
        jobId,
        status: "training",
      });

      if (trainingData.trafficMetrics.length === 0) {
        if (jobId) {
          await ctx.runMutation(internal.admin.updateTrainingJob, {
            jobId,
            status: "failed",
            errorMessage: "No training data available",
          });
        }
        return {
          success: false,
          errorMessage: "No training data available. Please ensure there is traffic metrics data in the database.",
        };
      }

      // Prepare features and target based on model name
      let features: number[][] = [];
      let targets: number[] = [];
      let featureChannels: string[] = [];
      let targetColumn: string = "";

      if (args.modelName === "passenger_prediction") {
        // Predict expectedPassengers from distance, capacity, congestionLevel, hourOfDay
        features = trainingData.trafficMetrics.map((tm) => {
          const route = trainingData.routes.find((r) => r._id === tm.routeId);
          const date = new Date(tm.timestamp);
          const hourOfDay = date.getHours();
          return [
            (route?.distance as number) || 0,
            (route?.averageCapacity as number) || 0,
            tm.congestionLevel,
            hourOfDay,
          ];
        });
        targets = trainingData.trafficMetrics.map((tm) => tm.expectedPassengers);
        featureChannels = ["distance", "averageCapacity", "congestionLevel", "hourOfDay"];
        targetColumn = "expectedPassengers";
      } else if (args.modelName === "congestion_prediction") {
        // Predict congestionLevel from distance, capacity, expectedPassengers, hourOfDay
        features = trainingData.trafficMetrics.map((tm) => {
          const route = trainingData.routes.find((r) => r._id === tm.routeId);
          const date = new Date().getHours();
          const hourOfDay = date.getHours();
          return [
            (route?.distance as number) || 0,
            (route?.averageCapacity as number) || 0,
            tm.expectedPassengers,
            hourOfDay,
          ];
        });
        targets = trainingData.trafficMetrics.map((tm) => tm.congestionLevel);
        featureChannels = ["distance", "averageCapacity", "expectedPassengers", "hourOfDay"];
        targetColumn = "congestionLevel";
      } else if (args.modelName === "eta_prediction") {
        // Predict ETA from: distance, averageCapacity, congestion, expectedPassengers
        features = trainingData.trafficMetrics.map((tm) => {
          const route = trainingData.routes.find((r) => r._id === tm.routeId);
          return [
            (route?.distance) || 0,
            (route?.averageCapacity) || 0,
            tm.congestionLevel,
            tm.expectedPassengers,
          ];
        });
        targets = trainingData.trafficMetrics.map((tm) => tm.eta);
        featureChannels = ["distance", "averageCapacity", "congestion", "expectedPassengers"];
        targetColumn = "eta";
      } else {
        throw new Error(`Unknown model name: ${args.modelName}`);
      }

      // Train model using regression (simplified)
      const model = trainModelInternal(features, targets, args.modelType);

      // Calculate metrics with guards against NaN / empty
      const hasData = features.length > 0 && targets.length > 0;
      const predictions = hasData ? features.map((f) => predict(model, f)) : [];
      const toNum = (x: number) => (Number.isFinite(x) ? x : 0);
      const m = hasData ? calculateMetrics(targets, predictions) : { r2Score: 0, mse: 0, mae: 0 };
      const safeMetrics = { r2Score: toNum(m.r2Score), mse: toNum(m.mse), mae: toNum(m.mae) };

      const modelId = await ctx.runMutation(internal.admin.saveModel, {
        modelType: args.m type,
        modelName: args.modelName,
        modelData: JSON.stringify(model),
        trainingDataHash: "",
        trainingMetrics: safeMetrics,
        featureChannels, // note: persisted for inference
        targetColumn,
        trainedBy: args.trainedBy,
        isActive: true,
      });

      await ctx.runMutation(internal.admin.updateTrainingStatus, {
        jobId,
        status: "completed",
        metrics: safeMetrics,
      });

      return { success: true, modelId, metrics: safeMetrics };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error during training";
      if (jobId) {
        await ctx.runMutation(internal.admin.updateTrainingJob, {
          jobId,
          status: "failed",
          errorMessage,
        });
      }
      return { success: false, errorMessage };
    }
  },
});

/**
 * Simple regression trainers (same shapes used for inference)
 */
function trainModelInternal(
  features: number[],
  targets: number[],
  modelType: string
): any {
  if (modelType === "linear_regression") {
    return trainLinearRegression(features as any, targets as any);
  }
  return trainSimpleRandomForest(features as any, targets as any);
}

function trainLinearRegression(features: number[][], targets: number[]): any {
  const n = features.length;
  const m = features[0].length;
  const X = features.map((f) => [1, ...f]);
  const y = targets;

  const weights: number[] = [];
  for (let i = 0; i < m + 1; i++) {
    let sum = 0;
    let count = 0;
    for (let j = 0; j < n; j++) {
      if (i === 0) sum += y[j];
      else if (X[j][i] !== 0) sum += (y[j] - (weights[0] || 0)) / X[j][i];
      count++;
    }
    weights.push(count > 0 ? sum / count : 0);
  }

  const lr = new Array(m + 1).fill(0);
  const lrStep = 0.01;
  const iters = 100;
  for (let t = 0; t < iters; t++) {
    for (let i = 0; i < n; i++) {
      const pred = X[i].reduce((s, x, k) => s + x * lr[k], 0);
      const err = pred - y[i];
      for (let k = 0; k < lr.length; k++) {
        lr[k] -= (lrStep * err * X[i][k]) / n;
      }
    }
  }

  return { type: "linear_regression", weights: lr, intercept: lr[0], coefficients: lr.slice(1) };
}

function trainSimpleRandomForest(features: number[][], targets: number[]): any {
  const trees: any[] = [];
  const nTrees = 10;
  const sampleSize = Math.floor(features.length * 0.8);
  for (let t = 0; t < nTrees; t++) {
    const indices: number[] = [];
    for (let i = 0; i < sampleSize; i++) indices.push(Math.floor(Math.random() * features.length));
    const f = indices.map((i) => features[i]);
    const y = indices.map((i) => targets[i]);
    const tree = buildTree(f, y, 0, 5);
    trees.push(tree);
  }
  return { type: "random_st", trees };
}

function buildTree(features: number[][], targets: number[], depth: number, maxDepth: number): any {
  if (depth >= maxDepth || features.length <= 1) {
    const avg = targets.reduce((a, b) => a + b, 0) / (targets.length || 1);
    return { type: "leaf", value: avg };
  }
  let best = { f: 0, thr: 0, score: Number.POSITIVE_INFINITY };
  const m = features.length ? features[0].length : 0;
  for (let c = 0; c < m; c++) {
    const vals = features.map((row) => row[c]).sort((a, b) => a - b);
    for (let i = 1; i < vals.length; i++) {
      const thr = (vals[i - 1] + vals[i]) / 2;
      const leftIdx: number[] = [];
      const rightIdx: number[] = [];
      for (let r = 0; r < features.length; r++) {
        if (features[r][c] < thr) leftIdx.push(r); else rightIdx.push(r);
      }
      if (leftIdx.length === 0 || rightIdx.length === 0) continue;
      const lavg = leftIdx.reduce((s, id) => s + targets[id], 0) / leftIdx.length;
      const ravg = rightIdx.reduce((s, id) => s + targets[id], 0) / rightIdx.length;
      const lerr = leftIdx.reduce((s, id) => s + (targets[id] - lavg) ** 2, 0);
      const rerr = rightIdx.reduce((s, id) => s + (targets[id] - ravg) ** 2, 0);
      const sc = lerr + rerr;
      if (sc < best.score) {
        best = { f: c, thr: thr, score: sc };
      }
    }
  }
  const li = features.filter((_, i) => i <= best.f); // placeholder
  const ri = features.filter((_, i) => i > best.f);
  return { type: "node", feature: best.f, threshold: best.thr, left: buildTree(li, targets.slice(0, li.length), depth + 1, maxDepth), right: buildTree(ri, targets.slice(li.length), depth + 1, maxDepth) };
}

export function predict(model: any, features: number[]): number {
  if (model?.type === "linear_regression") {
    const v = [1, ...features];
    return v.reduce((s: number, x: number, i: number) => s + x * model.weights[i], 0);
  }
  if (model?.trees) {
    const evalTree = (t: any, f: number[]): number => {
      if (t.type === "leaf") return t.value;
      return f[t.feature] < t.threshold ? evalTree(t.left, f) : evalTree(t.right, f);
    };
    const vals = model.trees.map((t: any) => evalTree(t, features));
    return vals.reduce((a: number, b: number) => a + b, 0) / (vals.length || 1);
  }
  return 0;
}

/**
 * Calculate model metrics
 */
function calculateMetrics(
  actual: number[],
  predicted: number[]
): { r2Score: number; mse: number; mae: number } {
  const n = actual.length;
  
  // Mean squared error
  const mse =
    actual.reduce((sum, a, i) => sum + Math.pow(a - predicted[i], 2), 0) / n;

  // Mean absolute error
  const mae =
    actual.reduce((sum, a, i) => sum + Math.abs(a - predicted[i]), 0) / n;

  // R2 score
  const meanActual = actual.reduce((a, b) => a + b, 0) / n;
  const ssRes = actual.reduce((sum, a, i) => sum + Math.pow(a - predicted[i], 2), 0);
  const ssTot = actual.reduce((sum, a) => sum + Math.pow(a - meanActual, 2), 0);
  const r2Score = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return {
    r2Score: Math.max(0, r2Score), // Ensure non-negative
    mse,
    mae,
  };
}

/**
 * Export training data for external ML training
 */
export const exportTrainingData = action({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    data: v.string(), // JSON string
  }),
  handler: async (ctx, args) => {
    const trainingData = await ctx.runQuery(internal.admin.getTrainingData, {
      limit: args.limit || 10000,
    });

    return {
      data: JSON.stringify(trainingData),
    };
  },
});


