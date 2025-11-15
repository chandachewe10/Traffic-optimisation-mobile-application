import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../lib/theme';
import { useGetAddressSuggestions } from '../hooks/useTrafficAPI';

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress?: (address: string, lat: number, lng: number) => void;
  suggestions?: Array<{ description: string; placeId: string; lat: number; lng: number }>;
  googleMapsApiKey?: string;
}

export default function AddressInput({
  label,
  placeholder,
  value,
  onChangeText,
  onSelectAddress,
  suggestions = [],
  googleMapsApiKey,
}: AddressInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{ description: string; placeId: string; lat: number; lng: number }>
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const getAddressSuggestionsAction = useGetAddressSuggestions();

  // Fetch address suggestions when value changes
  useEffect(() => {
    if (value.length > 2) {
      const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
          const results = await getAddressSuggestionsAction({
            query: value,
            apiKey: googleMapsApiKey,
          });
          setAddressSuggestions(results.length > 0 ? results : []);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setAddressSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      };

      const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      setAddressSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, googleMapsApiKey]);

  const displaySuggestions = addressSuggestions.length > 0 
    ? addressSuggestions 
    : (suggestions && suggestions.length > 0 ? suggestions : []);

  const handleSelectSuggestion = (suggestion: any) => {
    onChangeText(suggestion.description);
    setShowSuggestions(false);
    if (onSelectAddress) {
      onSelectAddress(suggestion.description, suggestion.lat, suggestion.lng);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[TYPOGRAPHY.labelMedium, styles.label]}>{label}</Text>
      <View style={styles.inputContainer}>
        <Ionicons
          name="location"
          size={20}
          color={COLORS.gray500}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray500}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setShowSuggestions(text.length > 2);
          }}
          onFocus={() => setShowSuggestions(value.length > 2)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              onChangeText('');
              setShowSuggestions(false);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.gray500} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && displaySuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {loadingSuggestions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text
                style={[
                  TYPOGRAPHY.bodySmall,
                  { color: COLORS.onSurfaceVariant, marginLeft: SPACING.sm },
                ]}
              >
                Searching...
              </Text>
            </View>
          ) : (
            <FlatList
              data={displaySuggestions}
              keyExtractor={(item) => item.placeId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={COLORS.primary}
                    style={styles.suggestionIcon}
                  />
                  <Text style={[TYPOGRAPHY.bodySmall, styles.suggestionText]}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
              scrollEnabled={displaySuggestions.length > 3}
              nestedScrollEnabled
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.onSurface,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  suggestionsContainer: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  suggestionIcon: {
    marginRight: SPACING.sm,
  },
  suggestionText: {
    flex: 1,
    color: COLORS.onSurface,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
});

