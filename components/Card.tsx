import React from "react";
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "../lib/theme";

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: "elevated" | "filled" | "outlined";
}

export default function Card({
  title,
  subtitle,
  children,
  onPress,
  style,
  variant = "elevated",
}: CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor:
      variant === "filled" ? COLORS.surfaceVariant : COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...(variant === "elevated" && SHADOWS.medium),
    ...(variant === "outlined" && {
      borderWidth: 1,
      borderColor: COLORS.gray300,
    }),
  };

  const content = (
    <View>
      {title && (
        <Text style={[TYPOGRAPHY.titleMedium, { color: COLORS.onSurface }]}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text
          style={[
            TYPOGRAPHY.bodySmall,
            { color: COLORS.onSurfaceVariant, marginTop: SPACING.sm },
          ]}
        >
          {subtitle}
        </Text>
      )}
      {children && (
        <View style={{ marginTop: title || subtitle ? SPACING.md : 0 }}>
          {children}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{content}</View>;
}