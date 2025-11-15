import { StyleSheet } from "react-native";

export const COLORS = {
  // Primary brand colors
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  primaryLight: "#66BB6A",
  onPrimary: "#FFFFFF",

  // Secondary accent
  secondary: "#0288D1",
  secondaryDark: "#01579B",
  secondaryLight: "#4FC3F7",
  onSecondary: "#FFFFFF",

  // Surface colors
  surface: "#FFFFFF",
  surfaceVariant: "#F5F5F5",
  surfaceBright: "#FAFAFA",
  onSurface: "#1C1C1C",
  onSurfaceVariant: "#49454E",

  // Semantic colors
  error: "#D32F2F",
  errorLight: "#EF5350",
  warning: "#F57C00",
  success: "#388E3C",
  info: "#1976D2",

  // Status colors
  congestionHigh: "#D32F2F",
  congestionMedium: "#F57C00",
  congestionLow: "#388E3C",
  lowUtilization: "#A1887F",

  // Neutral
  black: "#000000",
  white: "#FFFFFF",
  gray800: "#424242",
  gray700: "#616161",
  gray600: "#757575",
  gray500: "#9E9E9E",
  gray400: "#BDBDBD",
  gray300: "#E0E0E0",
  gray200: "#EEEEEE",
  gray100: "#F5F5F5",

  // Backgrounds
  background: "#FFFFFF",
  backgroundSecondary: "#F9F9F9",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const TYPOGRAPHY = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: "700" as const,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: "700" as const,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700" as const,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  titleMedium: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600" as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600" as const,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600" as const,
  },
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const SHARED_STYLES = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flexCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flexBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paddingMd: {
    padding: SPACING.md,
  },
  paddingLg: {
    padding: SPACING.lg,
  },
  paddingXl: {
    padding: SPACING.xl,
  },
  marginMd: {
    margin: SPACING.md,
  },
  marginLg: {
    margin: SPACING.lg,
  },
  marginXl: {
    margin: SPACING.xl,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray300,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray200,
  },
});