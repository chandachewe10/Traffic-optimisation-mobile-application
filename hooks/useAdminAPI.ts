import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

export function useAdminLogin() {
  return useQuery(api.admin.verifyAdmin, { username: "", password: "" });
}

export function useMLModels() {
  const models = useQuery(api.admin.getMLModels);
  return { models: models || [], loading: models === undefined };
}

export function useTrainingJobs(limit?: number) {
  const jobs = useQuery(api.admin.getTrainingJobs, { limit: limit || 10 });
  return { jobs: jobs || [], loading: jobs === undefined };
}

export function useTrainModel() {
  return useAction(api.mlTraining.trainModel);
}

export function useGetActiveModel() {
  const model = useQuery(api.admin.getActiveModel, { modelName: "passenger_prediction" });
  return { model, loading: model === undefined };
}

export function useSetActiveModel() {
  return useMutation(api.admin.setActiveModel);
}

export function useExportTrainingData() {
  return useAction(api.mlTraining.exportTrainingData);
}

