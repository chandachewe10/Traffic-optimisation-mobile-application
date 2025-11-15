import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../lib/theme";

interface CongestionBadgeProps {
  level: number;
  size?: "small" | "medium" | "large";
}

export default function CongestionBadge({
  level,
  size = "medium",
}: CongestionBadgeProps) {
  const getStatusColor = () => {
    if (level < 40) return COLORS.congestionLow;
    if (level < 70) return COLORS.congestionMedium;
    return COLORS.congestionHigh;
  };

  const getStatusLabel = () => {
    if (level < 40) return "Low";
    if (level < 70) return "Medium";
    return "High";
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          padding: SPACING.xs,
          fontSize: TYPOGRAPHY.labelSmall.fontSize,
        };
      case "large":
        return {
          padding: SPACING.md,
          fontSize: TYPOGRAPHY.labelLarge.fontSize,
        };
      default:
        return {
          padding: SPACING.sm,
          fontSize: TYPOGRAPHY.labelMedium.fontSize,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const statusColor = getStatusColor();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusColor,
          padding: sizeStyles.padding,
          borderRadius: BORDER_RADIUS.md,
        },
      ]}
    >
      <Text
        style={[
          { fontSize: sizeStyles.fontSize, color: COLORS.onPrimary },
          TYPOGRAPHY.labelMedium,
        ]}
      >
        {getStatusLabel()} ({Math.round(level)}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});