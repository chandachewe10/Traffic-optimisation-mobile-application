import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useAllRoutes, useInitializeSampleData } from "../hooks/useTrafficAPI";
import Card from "../components/Card";
import CongestionBadge from "../components/CongestionBadge";
import MetricRow from "../components/MetricRow";
import { COLORS, SPACING, TYPOGRAPHY, SHARED_STYLES } from "../lib/theme";

type NavigationProp = NativeStackNavigationProp<any>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { routes, loading } = useAllRoutes();
  const initData = useInitializeSampleData();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    const initSampleData = async () => {
      try {
        await initData();
      } catch (error) {
        console.log("Data already initialized or error:", error);
      }
    };
    initSampleData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const renderRoute = ({ item }: any) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("RouteDetail", { routeId: item._id })
      }
      activeOpacity={0.7}
    >
      <Card
        title={item.name}
        subtitle={`${item.distance} km • ${item.averageCapacity} capacity`}
      >
        <View style={styles.cardContent}>
          <View style={styles.badgeContainer}>
            <CongestionBadge level={40 + Math.random() * 35} size="medium" />
          </View>
          <View style={styles.metricsContainer}>
            <MetricRow
              label="Expected Demand"
              value={Math.round(item.averageCapacity * 0.65)}
              unit={`/ ${item.averageCapacity}`}
            />
            <MetricRow
              label="ETA"
              value={Math.round((item.distance / 40) * 60)}
              unit="min"
            />
          </View>
          <View
            style={[
              SHARED_STYLES.flexRow,
              {
                justifyContent: "flex-end",
                marginTop: SPACING.md,
              },
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.primary}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        SHARED_STYLES.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.headlineSmall, styles.title]}>
          Public Transit Routes
        </Text>
        <Text style={[TYPOGRAPHY.bodySmall, styles.subtitle]}>
          Zambia's optimized bus network
        </Text>
      </View>

      {loading && routes.length === 0 ? (
        <View style={SHARED_STYLES.flexCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item._id}
          renderItem={renderRoute}
          scrollEnabled
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={SHARED_STYLES.flexCenter}>
              <Text style={[TYPOGRAPHY.bodyMedium, { color: COLORS.gray600 }]}>
                No routes available
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  cardContent: {
    gap: SPACING.md,
  },
  badgeContainer: {
    marginTop: SPACING.sm,
  },
  metricsContainer: {
    gap: SPACING.sm,
  },
});