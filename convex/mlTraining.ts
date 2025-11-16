import { action, internalMutation, internalAction } from "./_generated/server";
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
      let featureColumns: string[] = [];
      let targetColumn: string = "";

      if (args.modelName === "passenger_prediction") {
        // Predict expectedPassengers from: distance, averageCapacity, congestionLevel, hourOfDay
        features = trainingData.trafficMetrics.map((tm) => {
          const route = trainingData.routes.find((r) => r._id === tm.routeId);
          const date = new Date(tm.timestamp);
          const hourOfDay = date.getHours();
          return [
            route?.distance || 0,
            route?.averageCapacity || 0,
            tm.congestionLevel,
            hourOfDay,
          ];
        });
        targets = trainingData.trafficMetrics.map((tm) => tm.expectedPassengers);
        featureColumns = ["distance", "averageCapacity", "congestionLevel", "hourOfDay"];
        targetColumn = "expectedPassengers";
      } else if (args.modelName === "congestion_prediction") {
        // Predict congestionLevel from: distance, averageCapacity, expectedPassengers, hourOfDay
        features = trainingData.trafficMetrics.map((tm) => {
          const route = trainingData.routes.find((r) => r._id === tm.routeId);
          const date = new Date(tm.timestamp);
          const hourOfDay = date.getHours();
          return [
            route?.distance || 0,
            route?.averageCapacity || 0,
            tm.expectedPassengers,
            hourOfDay,
          ];
        });
        targets = trainingData.trafficMetrics.map((tm) => tm.congestionLevel);
        featureColumns = ["distance", "averageCapacity", "expectedPassengers", "hourOfDay"];
        targetColumn = "congestionLevel";
      } else if (args.modelName === "eta_prediction") {
        // Predict ETA from: distance, averageCapacity, congestionLevel, expectedPassengers
        features = trainingData.trafficMetrics.map((tm) => {
          const route = trainingData.routes.find((r) => r._id === tm.routeId);
          return [
            route?.distance || 0,
            route?.averageCapacity || 0,
            tm.congestionLevel,
            tm.expectedPassengers,
          ];
        });
        targets = trainingData.trafficMetrics.map((tm) => tm.eta);
        featureColumns = ["distance", "averageCapacity", "congestionLevel", "expectedPassengers"];
        targetColumn = "eta";
      } else {
        throw new Error(`Unknown model name: ${args.modelName}`);
      }

      // Train model using regression (simplified)
      const model = trainSimpleModel(features, targets, args.modelType as any);

      // Calculate metrics with guards against empty data and NaN
      const hasData = features.length > 0 && targets.length > 0;
      const predictions = hasData ? features.map((f) => predict(model, f)) : [];
      let safeMetrics = { r2Score: 0, mse: 0, mae: 0 };
      if (hasData) {
        const raw = calculateMetrics(targets, predictions);
        const toNum = (x: number) => (Number.isFinite(x) ? x : 0);
        safeMetrics = {
          r2Score: toNum((raw as any).r2Score ?? 0),
          mse: toNum((raw as any).mse ?? 0),
          mae: toNum((raw as any).mae ?? 0),
        };
      }

      // Serialize model (simple JSON)
      const modelData = JSON.stringify(model);

      // Persist trained model only if we had data; otherwise mark job failed
      if (!hasData) {
        await ctx.runMutation(internal.admin.updateTrainingJob, {
          jobId,
          status: "failed",
          errorMessage: "No training data available",
        });
        return { success: false, errorMessage: "No training data available." };
      }

      const modelId = await ctx.runMutation(internal.admin.saveMLModel, {
        modelType: args.modelType,
        modelName: args.modelName,
        modelData,
        trainingDataHash: "",
        trainingMetrics: {
          r2Score: safeMetrics.r2Score,
          mse: safeMetrics.mse,
          mae: safeMetrics.mae,
        },
        featureColumns,
        targetColumn,
        trainedBy: args.trainedBy,
        isActive: true,
      });

      await ctx.runMutation(internal.admin.updateTrainingJob, {
        jobId,
        status: "completed",
        metrics: {
          r2Score: safeMetrics.r2Score,
          mse: safeMetrics.mse,
          mae: safeMetrics.mae,
        },
      });

      return {
        success: true,
        modelId,
        metrics: safeMetrics,
      };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error during training";
      if (jobId) {
        await ctx.runMutation(internal.admin.updateTrainingJob, {
          jobId,
          status: "failed",
          errorMessage,
        });
      }
      return {
        success: false,
        errorMessage,
      };
    }
  },
});

/**
 * Simple linear regression model training (in-memory)
 */
function trainSimpleModel(
  features: number[][],
  targets: number[],
  modelType: string
): any {
  if (modelType === "linear_regression") {
    return trainLinearRegression(features, targets);
  } else if (modelType === "random_forest") {
    // Simplified random forest (for demo - in production use scikit-learn)
    return trainSimpleRandomForest(features, targets);
  } else {
    throw new Error(`Unknown model type: ${modelType}`);
  }
}

/**
 * Simple linear regression using least squares
 */
function trainLinearRegression(features: number[][], targets: number[]): any {
  const n = features.length;
  const m = features[0].length;

  // Add bias term (1) to each feature vector
  const X = features.map((f) => [1, ...f]);
  const y = targets;

  // Normal equation: theta = (X^T * X)^-1 * X^T * y
  // Simplified version for small datasets
  const weights: number[] = [];
  
  // Simple approach: average of coefficients
  // For production, use proper matrix operations or call Python service
  const weightsArray: number[][] = [];
  
  for (let i = 0; i < m + 1; i++) {
    let sum = 0;
    let count = 0;
    for (let j = 0; j < n; j++) {
      if (i === 0) {
        sum += y[j];
      } else {
        if (X[j][i] !== 0) {
          sum += (y[j] - (weights[0] || 0)) / X[j][i];
        }
      }
      count++;
    }
    weights.push(count > 0 ? sum / count : 0);
  }

  // Better approach: gradient descent approximation
  // Initialize weights
  const w = new Array(m + 1).fill(0);
  const learningRate = 0.01;
  const iterations = 100;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < n; i++) {
      const prediction = X[i].reduce((sum, x, idx) => sum + x * w[idx], 0);
      const error = prediction - y[i];
      
      for (let j = 0; j < w.length; j++) {
        w[j] -= learningRate * error * X[i][j] / n;
      }
    }
  }

  return {
    type: "linear_regression",
    weights: w,
    intercept: w[0],
    coefficients: w.slice(1),
  };
}

/**
 * Simplified random forest (decision tree ensemble)
 */
function trainSimpleRandomForest(features: number[][], targets: number[]): any {
  // For demo purposes, return a simple tree structure
  // In production, use scikit-learn's RandomForestRegressor
  
  const trees: any[] = [];
  const nTrees = 10;
  const sampleSize = Math.floor(features.length * 0.8);

  for (let t = 0; t < nTrees; t++) {
    // Sample random subset
    const indices: number[] = [];
    for (let i = 0; i < sampleSize; i++) {
      indices.push(Math.floor(Math.random() * features.length));
    }

    const sampleFeatures = indices.map((i) => features[i]);
    const sampleTargets = indices.map((i) => targets[i]);

    // Train simple tree (mean split)
    const tree = buildSimpleTree(sampleFeatures, sampleTargets, 0, 5);
    trees.push(tree);
  }

  return {
    type: "random_forest",
    trees,
    nTrees,
  };
}

/**
 * Build simple decision tree
 */
function buildSimpleTree(
  features: number[][],
  targets: number[],
  depth: number,
  maxDepth: number
): any {
  if (depth >= maxDepth || features.length <= 1) {
    const avg = targets.reduce((a, b) => a + b, 0) / targets.length;
    return { type: "leaf", value: avg };
  }

  const m = features[0].length;
  let bestFeature = 0;
  let bestThreshold = 0;
  let bestScore = Infinity;

  // Find best split
  for (let f = 0; f < m; f++) {
    const values = features.map((x) => x[f]).sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      const threshold = (values[i - 1] + values[i]) / 2;
      const left = features
        .map((x, idx) => ({ x, y: targets[idx] }))
        .filter((item) => item.x[f] < threshold);
      const right = features
        .map((x, idx) => ({ x, y: targets[idx] }))
        .filter((item) => item.x[f] >= threshold);

      if (left.length === 0 || right.length === 0) continue;

      const leftAvg = left.reduce((a, b) => a + b.y, 0) / left.length;
      const rightAvg = right.reduce((a, b) => a + b.y, 0) / right.length;

      const leftVar = left.reduce((a, b) => a + Math.pow(b.y - leftAvg, 2), 0) / left.length;
      const rightVar = right.reduce((a, b) => a + Math.pow(b.y - rightAvg, 2), 0) / right.length;

      const score = leftVar * left.length + rightVar * right.length;

      if (score < bestScore) {
        bestScore = score;
        bestFeature = f;
        bestThreshold = threshold;
      }
    }
  }

  const left = features
    .map((x, idx) => ({ x, y: targets[idx] }))
    .filter((item) => item.x[bestFeature] < bestThreshold);
  const right = features
    .map((x, idx) => ({ x, y: targets[idx] }))
    .filter((item) => item.x[bestFeature] >= bestThreshold);

  return {
    type: "node",
    feature: bestFeature,
    threshold: bestThreshold,
    left: buildSimpleTree(
      left.map((item) => item.x),
      left.map((item) => item.y),
      depth + 1,
      maxDepth
    ),
    right: buildSimpleTree(
      right.map((item) => item.x),
      right.map((item) => item.y),
      depth + 1,
      maxDepth
    ),
  };
}

/**
 * Predict using trained model
 */
function predict(model: any, features: number[]): number {
  if (model.type === "linear_regression") {
    const X = [1, ...features];
    return X.reduce((sum, x, idx) => sum + x * model.weights[idx], 0);
  } else if (model.type === "random_forest") {
    const predictions = model.trees.map((tree: any) => predictTree(tree, features));
    return predictions.reduce((a: number, b: number) => a + b, 0) / predictions.length;
  }
  return 0;
}

/**
 * Predict using single tree
 */
function predictTree(tree: any, features: number[]): number {
  if (tree.type === "leaf") {
    return tree.value;
  }
  if (features[tree.feature] < tree.threshold) {
    return predictTree(tree.left, features);
  } else {
    return predictTree(tree.right, features);
    }
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


