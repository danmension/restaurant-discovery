// app/(tabs)/search.tsx
import { Ionicons } from '@expo/vector-icons'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import FilterBar from '../../components/FilterBar'
import RestaurantCard from '../../components/RestaurantCard'
import { useDebounce } from '../../hooks/useDebounce'
import { useRestaurants } from '../../hooks/useRestaurants'
import type { ActiveFilters } from '../../types'

const EMPTY_FILTERS: ActiveFilters = {
  cuisine_id: null,
  vibe_id: null,
  price_tier: null,
  great_for_id: null,
}

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(EMPTY_FILTERS)

  // Only update the actual search query 350ms after typing stops
  const debouncedSearch = useDebounce(searchText, 350)

  const { restaurants, loading, error, refetch } = useRestaurants(
    debouncedSearch,
    activeFilters
  )

  const handleFiltersChange = useCallback((filters: ActiveFilters) => {
    setActiveFilters(filters)
  }, [])

  function clearSearch() {
    setSearchText('')
    setActiveFilters(EMPTY_FILTERS)
  }

  const hasQuery = searchText.length > 0
  const activeFilterCount = Object.values(activeFilters).filter(
    (v) => v !== null
  ).length
  const hasAnyFilter = hasQuery || activeFilterCount > 0

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>

        {/* Search input */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#9CA3AF"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Restaurant name or suburb..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          {hasAnyFilter && (
            <Pressable style={styles.cancelButton} onPress={clearSearch}>
              <Text style={styles.cancelText}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter bar */}
      <FilterBar
        activeFilters={activeFilters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Results */}
      {!hasAnyFilter ? (
        // Empty state before user types anything
        <View style={styles.centered}>
          <Ionicons name="search" size={48} color="#E5E7EB" />
          <Text style={styles.promptText}>
            Search by name or suburb
          </Text>
          <Text style={styles.promptSubtext}>
            Or use the filters above to browse by vibe
          </Text>
        </View>
      ) : loading ? (
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
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            restaurants.length > 0 ? (
              <Text style={styles.resultsCount}>
                {restaurants.length}{' '}
                {restaurants.length === 1 ? 'result' : 'results'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                No restaurants found
              </Text>
              <Text style={styles.emptySubtext}>
                Try a different search or adjust your filters
              </Text>
              {hasAnyFilter && (
                <Pressable
                  style={styles.retryButton}
                  onPress={clearSearch}
                >
                  <Text style={styles.retryText}>Clear all</Text>
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    height: 44,
  },
  cancelButton: {
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 15,
    color: '#E07340',
    fontWeight: '600',
  },
  list: { padding: 16, gap: 16 },
  resultsCount: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
    fontWeight: '500',
  },
  promptText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 6,
  },
  promptSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: { color: '#EF4444', fontSize: 15, marginBottom: 12 },
  retryButton: {
    backgroundColor: '#E07340',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
})