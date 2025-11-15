import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  useRouteWithPrediction,
  useOptimizedRoute,
} from "../hooks/useTrafficAPI";
import Card from "../components/Card";
import CongestionBadge from "../components/CongestionBadge";
import MetricRow from "../components/MetricRow";
import { COLORS, SPACING, TYPOGRAPHY, SHARED_STYLES, BORDER_RADIUS } from "../lib/theme";

export default function RouteDetailScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const routeId = route?.params?.routeId;
  const { route: routeData, loading: routeLoading } = useRouteWithPrediction(
    routeId
  );
  const { optimized, loading: optimizedLoading } = useOptimizedRoute(routeId);

  // Show error if routeId is missing
  if (!routeId) {
    return (
      <View
        style={[
          SHARED_STYLES.container,
          SHARED_STYLES.flexCenter,
          { paddingTop: insets.top },
        ]}
      >
        <Text style={[TYPOGRAPHY.bodyMedium, { color: COLORS.gray600 }]}>
          Invalid route ID
        </Text>
      </View>
    );
  }

  if (routeLoading) {
    return (
      <View
        style={[
          SHARED_STYLES.container,
          SHARED_STYLES.flexCenter,
          { paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!routeData) {
    return (
      <View
        style={[
          SHARED_STYLES.container,
          SHARED_STYLES.flexCenter,
          { paddingTop: insets.top },
        ]}
      >
        <Text style={[TYPOGRAPHY.bodyMedium, { color: COLORS.gray600 }]}>
          Route not found
        </Text>
      </View>
    );
  }

  // Safely access route data with defaults
  const distance = routeData.distance ?? 0;
  const eta = routeData.eta ?? 0;
  const predictedDemand = routeData.predictedDemand ?? 0;
  const averageCapacity = routeData.averageCapacity ?? 0;
  const predictedCongestion = routeData.predictedCongestion ?? 0;
  const confidenceScore = routeData.confidenceScore ?? 0;
  const optimizationScore = routeData.optimizationScore ?? 0;

  const timeSavings = optimized?.estimatedTimeSaved ?? 0;
  const efficiencyGain = optimized?.efficiencyGain ?? 0;

  return (
    <ScrollView
      style={[
        SHARED_STYLES.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.headlineSmall, { color: COLORS.onSurface }]}>
          {routeData.name}
        </Text>
        <Text
          style={[
            TYPOGRAPHY.bodySmall,
            { color: COLORS.onSurfaceVariant, marginTop: SPACING.sm },
          ]}
        >
          AI-Optimized Transportation Route
        </Text>
      </View>

      {/* Current Status Card */}
      <Card title="Current Status">
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Ionicons
              name="navigate-circle"
              size={32}
              color={COLORS.primary}
            />
            <Text
              style={[
                TYPOGRAPHY.bodySmall,
                { color: COLORS.onSurfaceVariant, marginTop: SPACING.sm },
              ]}
            >
              Distance
            </Text>
            <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.onSurface }]}>
              {distance.toFixed(1)} km
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Ionicons name="time" size={32} color={COLORS.secondary} />
            <Text
              style={[
                TYPOGRAPHY.bodySmall,
                { color: COLORS.onSurfaceVariant, marginTop: SPACING.sm },
              ]}
            >
              ETA
            </Text>
            <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.onSurface }]}>
              {Math.round(eta)} min
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Ionicons name="people" size={32} color={COLORS.warning} />
            <Text
              style={[
                TYPOGRAPHY.bodySmall,
                { color: COLORS.onSurfaceVariant, marginTop: SPACING.sm },
              ]}
            >
              Demand
            </Text>
            <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.onSurface }]}>
              {Math.round(predictedDemand)}/{averageCapacity}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: SPACING.lg }}>
          <Text
            style={[
              TYPOGRAPHY.labelMedium,
              { color: COLORS.onSurfaceVariant, marginBottom: SPACING.md },
            ]}
          >
            Congestion Level
          </Text>
          <CongestionBadge level={predictedCongestion} size="large" />
        </View>
      </Card>

      {/* Prediction Metrics */}
      <Card title="Traffic Predictions">
        <MetricRow
          label="Predicted Congestion"
          value={Math.round(predictedCongestion)}
          unit="%"
          accent
        />
        <View style={SHARED_STYLES.separator} />
        <MetricRow
          label="Expected Passengers"
          value={Math.round(predictedDemand)}
          unit={`of ${averageCapacity}`}
        />
        <View style={SHARED_STYLES.separator} />
        <MetricRow
          label="Confidence Score"
          value={(confidenceScore * 100).toFixed(0)}
          unit="%"
        />
        <View style={SHARED_STYLES.separator} />
        <MetricRow
          label="Optimization Score"
          value={Math.round(optimizationScore)}
          unit="/ 100"
          accent
        />
      </Card>

      {/* Optimization Comparison */}
      {optimized && !optimizedLoading && (
        <>
          <Card title="Optimization Comparison" variant="filled">
            <View
              style={[
                styles.comparisonRow,
                { marginBottom: SPACING.md, paddingBottom: SPACING.md },
              ]}
            >
              <View style={styles.comparisonColumn}>
                <Text
                  style={[
                    TYPOGRAPHY.labelSmall,
                    { color: COLORS.onSurfaceVariant, marginBottom: SPACING.sm },
                  ]}
                >
                  Baseline Route
                </Text>
                <View>
                  <MetricRow
                    label="Distance"
                    value={(optimized.baselineMetrics?.distance ?? 0).toFixed(1)}
                    unit="km"
                  />
                  <MetricRow
                    label="ETA"
                    value={Math.round(optimized.baselineMetrics?.eta ?? 0)}
                    unit="min"
                  />
                  <MetricRow
                    label="Congestion"
                    value={Math.round(optimized.baselineMetrics?.congestion ?? 0)}
                    unit="%"
                  />
                </View>
              </View>

              <View style={styles.comparisonDivider} />

              <View style={styles.comparisonColumn}>
                <Text
                  style={[
                    TYPOGRAPHY.labelSmall,
                    {
                      color: COLORS.success,
                      marginBottom: SPACING.sm,
                      fontWeight: "700",
                    },
                  ]}
                >
                  Optimized Route
                </Text>
                <View>
                  <MetricRow
                    label="Distance"
                    value={(optimized.optimizedMetrics?.distance ?? 0).toFixed(1)}
                    unit="km"
                    accent
                  />
                  <MetricRow
                    label="ETA"
                    value={Math.round(optimized.optimizedMetrics?.eta ?? 0)}
                    unit="min"
                    accent
                  />
                  <MetricRow
                    label="Congestion"
                    value={Math.round(optimized.optimizedMetrics?.congestion ?? 0)}
                    unit="%"
                    accent
                  />
                </View>
              </View>
            </View>

            <View
              style={[
                styles.benefitsContainer,
                { borderTopWidth: 1, borderTopColor: COLORS.gray300 },
              ]}
            >
              <View style={styles.benefitRow}>
                <Ionicons
                  name="trending-down"
                  size={20}
                  color={COLORS.success}
                />
                <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                  <Text
                    style={[
                      TYPOGRAPHY.labelMedium,
                      { color: COLORS.success },
                    ]}
                  >
                    Time Savings
                  </Text>
                  <Text
                    style={[
                      TYPOGRAPHY.bodySmall,
                      { color: COLORS.onSurfaceVariant, marginTop: SPACING.xs },
                    ]}
                  >
                    {timeSavings.toFixed(1)} minutes saved
                  </Text>
                </View>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons
                  name="flash"
                  size={20}
                  color={COLORS.primary}
                />
                <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                  <Text
                    style={[
                      TYPOGRAPHY.labelMedium,
                      { color: COLORS.primary },
                    ]}
                  >
                    Efficiency Gain
                  </Text>
                  <Text
                    style={[
                      TYPOGRAPHY.bodySmall,
                      { color: COLORS.onSurfaceVariant, marginTop: SPACING.xs },
                    ]}
                  >
                    {efficiencyGain.toFixed(1)}% improvement
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </>
      )}

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
  },
  comparisonRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  comparisonColumn: {
    flex: 1,
  },
  comparisonDivider: {
    width: 1,
    backgroundColor: COLORS.gray300,
  },
  benefitsContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
});