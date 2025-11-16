import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

import Card from "../components/Card";
import Button from "../components/Button";
import MetricRow from "../components/MetricRow";
import { useInitializeSampleData } from "../hooks/useTrafficAPI";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHARED_STYLES,
  BORDER_RADIUS,
  SHADOWS,
} from "../lib/theme";

const MODEL_TYPES = [
  { value: "linear_regression", label: "Linear Regression" },
  { value: "random_forest", label: "Random Forest" },
];

const MODEL_NAMES = [
  { value: "passenger_prediction", label: "Passenger Prediction" },
  { value: "congestion_prediction", label: "Congestion Prediction" },
  { value: "eta_prediction", label: "ETA Prediction" },
];

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selectedModelType, setSelectedModelType] = useState("linear_regression");
  const [selectedModelName, setSelectedModelName] = useState("passenger_prediction");
  const [isTraining, setIsTraining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const models = useQuery(api.admin.getMLModels) || [];
  const trainingJobs = useQuery(api.admin.getTrainingJobs, { limit: 10 }) || [];
  const trainModelAction = useAction(api.mlTraining.trainModel);
  const initializeSampleData = useInitializeSampleData();

  const activeModels = models.filter((m) => m.isActive);
  const latestJob = trainingJobs[0];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await initializeSampleData({});
      Alert.alert("Sample Data", "Sample routes and traffic metrics have been initialized.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to initialize sample data.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTrainModel = async () => {
    if (!selectedModelType || !selectedModelName) {
      Alert.alert("Error", "Please select both model type and model name");
      return;
    }

    Alert.alert(
      "Start Training",
      `Train ${MODEL_NAMES.find((m) => m.value === selectedModelName)?.label} using ${MODEL_TYPES.find((m) => m.value === selectedModelType)?.label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Training",
          onPress: async () => {
            setIsTraining(true);
            try {
              const result = await trainModelAction({
                modelName: selectedModelName,
                modelType: selectedModelType,
                trainedBy: "admin", // In production, get from auth context
              });

              if (result.success) {
                Alert.alert(
                  "Training Complete",
                  `Model trained successfully!\n\nR² Score: ${result.metrics?.r2Score.toFixed(3)}\nMSE: ${result.metrics?.mse.toFixed(2)}\nMAE: ${result.metrics?.mae.toFixed(2)}`
                );
              } else {
                Alert.alert("Training Failed", result.errorMessage || "Unknown error");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Training failed");
            } finally {
              setIsTraining(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[SHARED_STYLES.container, { paddingTop: insets.top }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + SPACING.xl,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[TYPOGRAPHY.headlineSmall, styles.title]}>Admin Dashboard</Text>
            <Text style={[TYPOGRAPHY.bodySmall, styles.subtitle]}>ML Model Training & Management</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Models */}
      <Card title="Active Models" style={styles.section}>
        {activeModels.length === 0 ? (
          <>
            <Text style={[TYPOGRAPHY.bodyMedium, { color: COLORS.gray600 }]}>
              No active models. Train a model to get started.
            </Text>
            <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginTop: SPACING.sm }]}>
              Tip: If training fails with "No training data", seed sample data first.
            </Text>
            <Button
              label={isSeeding ? "Seeding..." : "Load Sample Data"}
              onPress={handleSeedData}
              variant="secondary"
              size="medium"
              style={{ marginTop: SPACING.md }}
              loading={isSeeding}
              disabled={isSeeding}
              icon="cloud-download-outline"
            />
          </>
        ) : (
          activeModels.map((model) => (
            <View key={model._id} style={styles.modelCard}>
              <View style={styles.modelHeader}>
                <View>
                  <Text style={[TYPOGRAPHY.titleSmall, { color: COLORS.onSurface }]}>
                    {MODEL_NAMES.find((m) => m.value === model.modelName)?.label || model.modelName}
                  </Text>
                  <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.onSurfaceVariant }]}>
                    {MODEL_TYPES.find((m) => m.value === model.modelType)?.label || model.modelType}
                  </Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={[TYPOGRAPHY.labelSmall, { color: COLORS.success }]}>ACTIVE</Text>
                </View>
              </View>
              <View style={SHARED_STYLES.separator} />
              <MetricRow label="R² Score" value={model.trainingMetrics.r2Score.toFixed(3)} />
              <MetricRow label="MSE" value={model.trainingMetrics.mse.toFixed(2)} />
              <MetricRow label="MAE" value={model.trainingMetrics.mae.toFixed(2)} />
              <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginTop: SPACING.sm }]}>
                Trained: {new Date(model.trainedAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </Card>

      {/* Training Interface */}
      <Card title="Train New Model" style={styles.section}>
        <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.onSurfaceVariant, marginBottom: SPACING.md }]}>
          Selected:{" "}
          <Text style={{ fontWeight: "700", color: COLORS.onSurface }}>
            {MODEL_NAMES.find(m => m.value === selectedModelName)?.label}
          </Text>{" "}
          •{" "}
          <Text style={{ fontWeight: "700", color: COLORS.onSurface }}>
            {MODEL_TYPES.find(t => t.value === selectedModelType)?.label}
          </Text>
        </Text>
        <View style={styles.inputGroup}>
          <Text style={[TYPOGRAPHY.labelMedium, styles.label]}>Model Name</Text>
          <View style={styles.pickerContainer}>
            {MODEL_NAMES.map((model) => (
              <TouchableOpacity
                key={model.value}
                style={[
                  styles.pickerOption,
                  selectedModelName === model.value && styles.pickerOptionSelected,
                ]}
                onPress={() => setSelectedModelName(model.value)}
              >
                <Text
                  style={[
                    TYPOGRAPHY.bodyMedium,
                    {
                      color:
                        selectedModelName === model.value ? COLORS.onPrimary : COLORS.onSurface,
                    },
                  ]}
                >
                  {model.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.inputGroup, { marginTop: SPACING.lg }]}>
          <Text style={[TYPOGRAPHY.labelMedium, styles.label]}>Model Type</Text>
          <View style={styles.pickerContainer}>
            {MODEL_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.pickerOption,
                  selectedModelType === type.value && styles.pickerOptionSelected,
                ]}
                onPress={() => setSelectedModelType(type.value)}
              >
                <Text
                  style={[
                    TYPOGRAPHY.bodyMedium,
                    {
                      color:
                        selectedModelType === type.value ? COLORS.onPrimary : COLORS.onSurface,
                    },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          label={isTraining ? "Training..." : "Start Training"}
          onPress={handleTrainModel}
          variant="primary"
          size="large"
          fullWidth
          loading={isTraining}
          disabled={isTraining}
          style={{ marginTop: SPACING.xl }}
          icon="play-outline"
        />
      </Card>

      {/* Recent Training Jobs */}
      <Card title="Recent Training Jobs" style={styles.section}>
        {trainingJobs.length === 0 ? (
          <Text style={[TYPOGRAPHY.bodyMedium, { color: COLORS.gray600 }]}>
            No training jobs yet
          </Text>
        ) : (
          trainingJobs.slice(0, 5).map((job) => (
            <View key={job._id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={[TYPOGRAPHY.titleSmall, { color: COLORS.onSurface }]}>
                  {MODEL_NAMES.find((m) => m.value === job.modelName)?.label || job.modelName}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        job.status === "completed"
                          ? COLORS.success
                          : job.status === "failed"
                          ? COLORS.error
                          : job.status === "training"
                          ? COLORS.warning
                          : COLORS.gray400,
                    },
                  ]}
                >
                  <Text style={[TYPOGRAPHY.labelSmall, { color: COLORS.white }]}>
                    {job.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              {job.metrics && (
                <>
                  <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginTop: SPACING.sm }]}>
                    R²: {job.metrics.r2Score.toFixed(3)} | MSE: {job.metrics.mse.toFixed(2)} | MAE:{" "}
                    {job.metrics.mae.toFixed(2)}
                  </Text>
                </>
              )}
              {job.errorMessage && (
                <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.error, marginTop: SPACING.sm }]}>
                  Error: {job.errorMessage}
                </Text>
              )}
              <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600, marginTop: SPACING.xs }]}>
                Started: {new Date(job.startedAt).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </Card>

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
  },
  logoutButton: {
    padding: SPACING.sm,
  },
  section: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  modelCard: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  activeBadge: {
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  pickerOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    minWidth: "48%",
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  jobCard: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
});

