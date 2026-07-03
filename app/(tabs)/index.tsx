// app/(tabs)/index.tsx
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import FilterBar from '../../components/FilterBar'
import RestaurantCard from '../../components/RestaurantCard'
import { useRestaurants } from '../../hooks/useRestaurants'
import type { ActiveFilters } from '../../types'

const EMPTY_FILTERS: ActiveFilters = {
  cuisine_id: null,
  vibe_id: null,
  price_tier: null,
  great_for_id: null,
}

export default function BrowseScreen() {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(EMPTY_FILTERS)
  const { restaurants, loading, error, refetch } = useRestaurants(
    '',
    activeFilters
  )

  const activeFilterCount = Object.values(activeFilters).filter(
    (v) => v !== null
  ).length

  const handleFiltersChange = useCallback((filters: ActiveFilters) => {
    setActiveFilters(filters)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Foodmension</Text>
        <Text style={styles.headerSubtitle}>Discover your next favourite</Text>
      </View>

      <FilterBar
        activeFilters={activeFilters}
        onFiltersChange={handleFiltersChange}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#E07340" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {activeFilterCount > 0
                  ? 'No restaurants match these filters'
                  : 'No restaurants yet'}
              </Text>
              {activeFilterCount > 0 && (
                <Pressable
                  style={styles.retryButton}
                  onPress={() => setActiveFilters(EMPTY_FILTERS)}
                >
                  <Text style={styles.retryText}>Clear filters</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  list: { padding: 16, gap: 16 },
  errorText: { color: '#EF4444', fontSize: 15, marginBottom: 12 },
  retryButton: {
    backgroundColor: '#E07340',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
})