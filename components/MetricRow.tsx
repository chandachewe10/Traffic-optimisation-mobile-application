import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../lib/theme";

interface MetricRowProps {
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
}

export default function MetricRow({
  label,
  value,
  unit,
  accent = false,
}: MetricRowProps) {
  return (
    <View style={styles.container}>
      <Text style={[TYPOGRAPHY.bodySmall, styles.label]}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text
          style={[
            TYPOGRAPHY.titleMedium,
            {
              color: accent ? COLORS.primary : COLORS.onSurface,
            },
          ]}
        >
          {value}
        </Text>
        {unit && (
          <Text style={[TYPOGRAPHY.labelSmall, styles.unit]}>{unit}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
  },
  label: {
    color: COLORS.onSurfaceVariant,
    flex: 1,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.xs,
  },
  unit: {
    color: COLORS.onSurfaceVariant,
  },
});