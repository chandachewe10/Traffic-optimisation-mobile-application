import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../lib/theme';

export default function ConvexSetupScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>⚠️ Convex URL Not Configured</Text>
        <Text style={styles.description}>
          This app requires a Convex backend to function. Please set up Convex to continue.
        </Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setup Instructions:</Text>
          <Text style={styles.step}>1. Open a terminal in this project directory</Text>
          <Text style={styles.step}>2. Run: npx convex dev</Text>
          <Text style={styles.step}>3. This will create a .env file with your Convex URL</Text>
          <Text style={styles.step}>4. Restart your Expo dev server</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alternative:</Text>
          <Text style={styles.step}>1. Visit: https://dashboard.convex.dev</Text>
          <Text style={styles.step}>2. Get your deployment URL</Text>
          <Text style={styles.step}>3. Create a .env file with:</Text>
          <Text style={styles.code}>EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.gray700,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: COLORS.gray100,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
    marginBottom: 12,
  },
  step: {
    fontSize: 14,
    color: COLORS.gray700,
    marginBottom: 8,
    lineHeight: 20,
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: COLORS.gray200,
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    color: COLORS.gray800,
  },
});

