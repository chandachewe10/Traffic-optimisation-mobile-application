import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RouteMap from './RouteMap';
import AddressInput from './AddressInput';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../lib/theme';

interface MapWithFiltersProps {
  startAddress: string;
  endAddress: string;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
  routeCoordinates: Array<{ latitude: number; longitude: number }>;
  optimizedRouteCoordinates: Array<{ latitude: number; longitude: number }>;
  routeDistance?: number | null;
  estimatedTime?: number | null;
  optimizedDistance?: number | null;
  optimizedTime?: number | null;
  timeSaved?: number | null;
  onStartAddressChange: (address: string) => void;
  onEndAddressChange: (address: string) => void;
  onStartAddressSelect: (address: string, lat: number, lng: number) => void;
  onEndAddressSelect: (address: string, lat: number, lng: number) => void;
  googleMapsApiKey?: string;
  height?: number;
}

export default function MapWithFilters({
  startAddress,
  endAddress,
  startLat,
  startLng,
  endLat,
  endLng,
  routeCoordinates,
  optimizedRouteCoordinates,
  routeDistance,
  estimatedTime,
  optimizedDistance,
  optimizedTime,
  timeSaved,
  onStartAddressChange,
  onEndAddressChange,
  onStartAddressSelect,
  onEndAddressSelect,
  googleMapsApiKey,
  height = 400,
}: MapWithFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'start' | 'end' | null>(null);

  const hasRoute = startLat && startLng && endLat && endLng;
  const showRouteInfo = hasRoute && routeDistance && estimatedTime;

  return (
    <View style={[styles.container, { height }]}>
      {/* Map */}
      {hasRoute ? (
        <RouteMap
          startLat={startLat!}
          startLng={startLng!}
          endLat={endLat!}
          endLng={endLng!}
          routeCoordinates={routeCoordinates}
          optimizedRouteCoordinates={optimizedRouteCoordinates}
          height={height}
        />
      ) : (
        <View style={[styles.mapPlaceholder, { height }]}>
          <Ionicons name="map-outline" size={64} color={COLORS.gray400} />
        </View>
      )}

      {/* Filter Buttons Overlay */}
      <View style={styles.filterButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            startAddress && styles.filterButtonActive,
          ]}
          onPress={() => {
            setActiveFilter('start');
            setShowFilters(true);
          }}
        >
          <Ionicons
            name="location"
            size={18}
            color={startAddress ? COLORS.primary : COLORS.gray600}
          />
            <View style={styles.filterButtonText}>
              <View style={styles.filterButtonLabel}>
                <Ionicons
                  name="play-circle"
                  size={12}
                  color={COLORS.success}
                  style={styles.filterIcon}
                />
                <Text style={styles.filterLabel}>Start</Text>
              </View>
              <Text style={styles.filterValue} numberOfLines={1}>
                {startAddress || 'Enter starting point'}
              </Text>
            </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            endAddress && styles.filterButtonActive,
          ]}
          onPress={() => {
            setActiveFilter('end');
            setShowFilters(true);
          }}
        >
          <Ionicons
            name="location"
            size={18}
            color={endAddress ? COLORS.error : COLORS.gray600}
          />
            <View style={styles.filterButtonText}>
              <View style={styles.filterButtonLabel}>
                <Ionicons
                  name="flag"
                  size={12}
                  color={COLORS.error}
                  style={styles.filterIcon}
                />
                <Text style={styles.filterLabel}>Destination</Text>
              </View>
              <Text style={styles.filterValue} numberOfLines={1}>
                {endAddress || 'Enter destination'}
              </Text>
            </View>
        </TouchableOpacity>
      </View>

      {/* Route Information Overlay */}
      {showRouteInfo && (
        <View style={styles.routeInfoOverlay}>
          <View style={styles.routeInfoCard}>
            <View style={styles.routeInfoRow}>
              <Ionicons name="navigate" size={20} color={COLORS.secondary} />
              <View style={styles.routeInfoText}>
                <Text style={styles.routeInfoLabel}>Distance</Text>
                <Text style={styles.routeInfoValue}>
                  {routeDistance!.toFixed(2)} km
                </Text>
              </View>
            </View>
            <View style={styles.routeInfoDivider} />
            <View style={styles.routeInfoRow}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <View style={styles.routeInfoText}>
                <Text style={styles.routeInfoLabel}>Travel Time</Text>
                <Text style={styles.routeInfoValue}>
                  {estimatedTime} min
                </Text>
              </View>
            </View>
            {optimizedDistance && optimizedTime && (
              <>
                <View style={styles.routeInfoDivider} />
                <View style={styles.routeInfoRow}>
                  <Ionicons name="flash" size={20} color={COLORS.success} />
                  <View style={styles.routeInfoText}>
                    <Text style={styles.routeInfoLabel}>Optimized</Text>
                    <Text style={styles.routeInfoValue}>
                      {optimizedDistance.toFixed(2)} km • {optimizedTime} min
                    </Text>
                    {timeSaved && timeSaved > 0 && (
                      <Text style={styles.routeInfoSavings}>
                        Save {timeSaved} min
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Address Input Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Ionicons
                  name={activeFilter === 'start' ? 'play-circle' : 'flag'}
                  size={24}
                  color={activeFilter === 'start' ? COLORS.success : COLORS.error}
                />
                <View style={styles.modalTitle}>
                  <Text style={styles.modalTitleText}>
                    {activeFilter === 'start'
                      ? 'Initial Address (Starting Point)'
                      : 'Destination Address'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {activeFilter === 'start' ? (
                <AddressInput
                  label=""
                  placeholder="Enter starting address..."
                  value={startAddress}
                  onChangeText={(text) => {
                    onStartAddressChange(text);
                  }}
                  onSelectAddress={(address, lat, lng) => {
                    onStartAddressSelect(address, lat, lng);
                    setShowFilters(false);
                  }}
                  googleMapsApiKey={googleMapsApiKey}
                />
              ) : (
                <AddressInput
                  label=""
                  placeholder="Enter destination address..."
                  value={endAddress}
                  onChangeText={(text) => {
                    onEndAddressChange(text);
                  }}
                  onSelectAddress={(address, lat, lng) => {
                    onEndAddressSelect(address, lat, lng);
                    setShowFilters(false);
                  }}
                  googleMapsApiKey={googleMapsApiKey}
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.gray200,
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
  },
  filterButtonsContainer: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    gap: SPACING.sm,
    zIndex: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  filterButtonActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  filterButtonText: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  filterButtonLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  filterIcon: {
    marginRight: SPACING.xs,
  },
  filterLabel: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  filterValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.onSurface,
    marginTop: SPACING.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  modalTitleText: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  routeInfoOverlay: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
  },
  routeInfoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.large,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  routeInfoLabel: {
    ...TYPOGRAPHY.labelSmall,
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  routeInfoValue: {
    ...TYPOGRAPHY.titleSmall,
    color: COLORS.onSurface,
    marginTop: SPACING.xs,
  },
  routeInfoSavings: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  routeInfoDivider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: SPACING.sm,
  },
});

