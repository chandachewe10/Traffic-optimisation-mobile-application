import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

import Button from "../components/Button";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, SHARED_STYLES, BORDER_RADIUS } from "../lib/theme";

export default function AdminLoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Use Convex query to verify admin (reactive - updates when username/password change)
  // Note: This is a reactive query, so we'll use it to check validity
  const verifyAdminResult = useQuery(
    api.admin.verifyAdmin,
    username.trim() && password.trim()
      ? { username: username.trim(), password: password.trim() }
      : "skip"
  );

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setIsLoggingIn(true);
    try {
      // Wait for query result (it's reactive, so we need to wait a bit)
      // In production, use a mutation for login that returns immediately
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check the verification result
      const isValid = verifyAdminResult === true;
      
      setIsLoggingIn(false);
      
      if (isValid) {
        // Store admin session (in production use secure storage like AsyncStorage)
        navigation.navigate("AdminDashboard" as never);
      } else {
        Alert.alert("Error", "Invalid username or password. Please ensure you have created an admin account first.");
      }
    } catch (error: any) {
      setIsLoggingIn(false);
      Alert.alert("Error", error.message || "Login failed. Please ensure you have created an admin account first.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[SHARED_STYLES.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={64} color={COLORS.primary} />
          </View>
          <Text style={[TYPOGRAPHY.headlineMedium, styles.title]}>Admin Login</Text>
          <Text style={[TYPOGRAPHY.bodyMedium, styles.subtitle]}>
            Enter your credentials to access the admin dashboard
          </Text>
        </View>

        <Card style={styles.loginCard}>
          <View style={styles.inputContainer}>
            <Text style={[TYPOGRAPHY.labelMedium, styles.label]}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.gray500}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoggingIn}
              />
            </View>
          </View>

          <View style={[styles.inputContainer, { marginTop: SPACING.lg }]}>
            <Text style={[TYPOGRAPHY.labelMedium, styles.label]}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.gray500}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoggingIn}
              />
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={COLORS.gray500}
                style={styles.inputIcon}
                onPress={() => setShowPassword(!showPassword)}
              />
            </View>
          </View>

          <Button
            label="Login"
            onPress={handleLogin}
            variant="primary"
            size="large"
            fullWidth
            loading={isLoggingIn}
            style={{ marginTop: SPACING.xl }}
            icon="log-in-outline"
          />
        </Card>

        <View style={styles.footer}>
          <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.gray600 }]}>
            Forgot your password? Contact system administrator
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: SPACING.lg,
  },
  loginCard: {
    marginTop: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.onSurface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: "center",
  },
});

