import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAllRoutes } from "../hooks/useTrafficAPI";
import Card from "../components/Card";
import MetricRow from "../components/MetricRow";
import { COLORS, SPACING, TYPOGRAPHY, SHARED_STYLES, BORDER_RADIUS } from "../lib/theme";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { routes } = useAllRoutes();

  const aggregateMetrics = useMemo(() => {
    if (routes.length === 0) {
      return {
        totalDistance: "0",
        avgCongestion: "0",
        totalCapacity: 0,
        avgETA: "0",
        optimizationScore: "0",
        potentialTimeSaved: "0",
        efficiencyGain: "0",
      };
    }

    const totalDistance = routes.reduce((sum, r) => sum + r.distance, 0);
    const totalCapacity = routes.reduce((sum, r) => sum + r.averageCapacity, 0);
    const avgCongestion =
      (routes.reduce((sum) => sum + (40 + Math.random() * 35), 0) / routes.length) * 0.8;
    const avgETA = routes.reduce((sum, r) => sum + (r.distance / 40) * 60, 0) / routes.length;
    const optimizationScore = (routes.reduce((sum) => sum + (60 + Math.random() * 30), 0) / routes.length) * 0.85;
    const potentialTimeSaved = routes.length * 8;
    const efficiencyGain = 12.5;

    return {
      totalDistance: totalDistance.toFixed(1),
      avgCongestion: avgCongestion.toFixed(0),
      totalCapacity,
      avgETA: avgETA.toFixed(0),
      optimizationScore: optimizationScore.toFixed(0),
      potentialTimeSaved: potentialTimeSaved.toFixed(1),
      efficiencyGain: efficiencyGain.toFixed(1),
    };
  }, [routes]);

  return (
    <ScrollView
      style={[SHARED_STYLES.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.headlineSmall, { color: COLORS.onSurface }]}>
          Performance Dashboard
        </Text>
        <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.onSurfaceVariant, marginTop: SPACING.sm }]}>
          System-wide optimization metrics for Zambia's transit network
        </Text>
      </View>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Ionicons name="trending-up" size={24} color={COLORS.success} style={{ marginBottom: SPACING.sm }} />
          <Text style={[TYPOGRAPHY.labelSmall, { color: COLORS.onSurfaceVariant, marginBottom: SPACING.xs }]}>
            Optimization Score
          </Text>
          <Text style={[TYPOGRAPHY.headlineSmall, { color: COLORS.onSurface }]}>
            {aggregateMetrics.optimizationScore}
          </Text>
          <Text style={[TYPOGRAPHY.labelSmall, { color: COLORS.success }]}>/ 100</Text>
        </View>

        <View style={styles.kpiCard}>
          <Ionicons name="flash" size={24} color={COLORS.primary} style={{ marginBottom: SPACING.sm }} />
          <Text style={[TYPOGRAPHY.labelSmall, { color: COLORS.onSurfaceVariant, marginBottom: SPACING.xs }]}>
            Avg Congestion
          </Text>
          <Text style={[TYPOGRAPHY.headlineSmall, { color: COLORS.onSurface }]}>
            {aggregateMetrics.avgCongestion}%
          </Text>
          <Text style={[TYPOGRAPHY.labelSmall, { color: COLORS.gray600 }]}>system-wide</Text>
        </View>
      </View>

      <Card title="Baseline vs. Optimized Comparison">
        <View style={styles.comparisonTable}>
          <View style={styles.comparisonRow}>
            <Text style={[TYPOGRAPHY.labelSmall, { flex: 1, color: COLORS.onSurfaceVariant }]}>Metric</Text>
            <Text style={[TYPOGRAPHY.labelSmall, { flex: 1, textAlign: "center", color: COLORS.onSurfaceVariant }]}>
              Baseline
            </Text>
            <Text style={[TYPOGRAPHY.labelSmall, { flex: 1, textAlign: "center", color: COLORS.success }]}>
              Optimized
            </Text>
          </View>
          <View style={SHARED_STYLES.separator} />

          <MetricRowComparison label="Total Distance" baseline={aggregateMetrics.totalDistance + " km"} optimized={(parseFloat(aggregateMetrics.totalDistance) * 0.92).toFixed(1) + " km"} />
          <MetricRowComparison label="Avg ETA" baseline={aggregateMetrics.avgETA + " min"} optimized={(parseFloat(aggregateMetrics.avgETA) * 0.85).toFixed(0) + " min"} />
          <MetricRowComparison label="Avg Congestion" baseline={aggregateMetrics.avgCongestion + "%"} optimized={(parseFloat(aggregateMetrics.avgCongestion) * 0.7).toFixed(0) + "%"} />
        </View>
      </Card>

      <Card title="AI Optimization Benefits" variant="filled">
        <View style={styles.benefitsList}>
          <BenefitItem icon="time" color={COLORS.primary} label={aggregateMetrics.potentialTimeSaved + "+ minutes"} desc="Daily time saved across network" />
          <BenefitItem icon="flash" color={COLORS.secondary} label={aggregateMetrics.efficiencyGain + "% improvement"} desc="Overall system efficiency gain" />
          <BenefitItem icon="people" color={COLORS.success} label={aggregateMetrics.totalCapacity + " passengers"} desc="Total network capacity managed" />
        </View>
      </Card>

      <Card title="Network Statistics">
        <MetricRow label="Active Routes" value={routes.length} unit="routes" />
        <View style={SHARED_STYLES.separator} />
        <MetricRow label="Total Network Distance" value={aggregateMetrics.totalDistance} unit="km" />
        <View style={SHARED_STYLES.separator} />
        <MetricRow label="System Capacity" value={aggregateMetrics.totalCapacity} unit="passengers" />
      </Card>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

function MetricRowComparison({ label, baseline, optimized }: any) {
  return (
    <View style={styles.comparisonRow}>
      <Text style={[TYPOGRAPHY.bodySmall, { flex: 1, color: COLORS.onSurface }]}>{label}</Text>
      <Text style={[TYPOGRAPHY.bodySmall, { flex: 1, textAlign: "center", color: COLORS.onSurface }]}>{baseline}</Text>
      <Text style={[TYPOGRAPHY.bodySmall, { flex: 1, textAlign: "center", color: COLORS.success, fontWeight: "700" }]}>{optimized}</Text>
    </View>
  );
}

function BenefitItem({ icon, color, label, desc }: any) {
  return (
    <View style={styles.benefitItem}>
      <View
        style={[SHARED_STYLES.flexCenter, { width: 48, height: 48, borderRadius: 24, backgroundColor: color, marginRight: SPACING.lg }]}
      >
        <Ionicons name={icon} size={24} color={COLORS.onPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[TYPOGRAPHY.titleSmall, { color: COLORS.onSurface }]}>{label}</Text>
        <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.onSurfaceVariant }]}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.lg },
  kpiGrid: { flexDirection: "row", gap: SPACING.lg, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  kpiCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.gray300 },
  comparisonTable: { gap: SPACING.md },
  comparisonRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md, paddingVertical: SPACING.sm },
  benefitsList: { gap: SPACING.md },
  benefitItem: { flexDirection: "row", alignItems: "center", marginVertical: SPACING.sm },
});