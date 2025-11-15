import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from "../lib/theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  icon?: string;
}

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.gray300;
    switch (variant) {
      case "primary":
        return COLORS.primary;
      case "secondary":
        return COLORS.secondary;
      case "outline":
        return "transparent";
      case "danger":
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.gray600;
    switch (variant) {
      case "outline":
        return COLORS.primary;
      default:
        return COLORS.onPrimary;
    }
  };

  const getPadding = () => {
    switch (size) {
      case "small":
        return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
      case "large":
        return { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl };
      default:
        return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return TYPOGRAPHY.labelMedium;
      case "large":
        return TYPOGRAPHY.labelLarge;
      default:
        return TYPOGRAPHY.labelLarge;
    }
  };

  const containerStyle: ViewStyle = {
    ...getPadding(),
    backgroundColor: getBackgroundColor(),
    borderRadius: BORDER_RADIUS.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
    ...SHADOWS.small,
    ...(fullWidth && { width: "100%" }),
    ...(variant === "outline" && {
      borderWidth: 2,
      borderColor: COLORS.primary,
      backgroundColor: "transparent",
    }),
  };

  const textStyle: TextStyle = {
    ...getFontSize(),
    color: getTextColor(),
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon as any}
              size={size === "small" ? 16 : size === "large" ? 24 : 20}
              color={getTextColor()}
            />
          )}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}