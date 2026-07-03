// app/(tabs)/index.tsx
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
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
import { supabase } from '../../lib/supabase'
import type {
  ActiveFilters,
  Cuisine,
  GreatForTag,
  Restaurant,
  Vibe,
} from '../../types'

// Converts price_tier number into dollar signs
function PriceTier({ tier }: { tier: number }) {
  return <Text style={styles.price}>{'$'.repeat(tier)}</Text>
}

// A single restaurant card
function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push(`/restaurant/${restaurant.id}` as any)
      }
    >
      <View style={styles.cardImagePlaceholder}>
        <Text style={styles.cardImageText}>📸</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{restaurant.name}</Text>
        <Text style={styles.cardSuburb}>
          {restaurant.suburb}, {restaurant.city}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {restaurant.description}
        </Text>
        <PriceTier tier={restaurant.price_tier} />
      </View>
    </Pressable>
  )
}

// --- Main Browse Screen ---
export default function BrowseScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [cuisines, setCuisines] = useState<Cuisine[]>([])
  const [vibes, setVibes] = useState<Vibe[]>([])
  const [greatForTags, setGreatForTags] = useState<GreatForTag[]>([])
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    cuisine_id: null,
    vibe_id: null,
    price_tier: null,
    great_for_id: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load filter options once on mount
  useEffect(() => {
    fetchFilterOptions()
  }, [])

  // Re-fetch restaurants whenever filters change
  useEffect(() => {
    fetchRestaurants()
  }, [activeFilters])

  async function fetchFilterOptions() {
    const [cuisinesRes, vibesRes, tagsRes] = await Promise.all([
      supabase.from('cuisines').select('id, name').order('name'),
      supabase.from('vibes').select('id, name').order('name'),
      supabase.from('great_for_tags').select('id, name').order('name'),
    ])
    if (cuisinesRes.data) setCuisines(cuisinesRes.data)
    if (vibesRes.data) setVibes(vibesRes.data)
    if (tagsRes.data) setGreatForTags(tagsRes.data)
  }

  async function fetchRestaurants() {
    setLoading(true)
    setError(null)

    // Start with the base query
    let query = supabase
      .from('restaurants')
      .select(`
        id,
        name,
        suburb,
        city,
        price_tier,
        description
      `)
      .eq('status', 'approved')
      .order('name', { ascending: true })

    // Add price filter directly on the restaurants table
    if (activeFilters.price_tier !== null) {
      query = query.eq('price_tier', activeFilters.price_tier)
    }

    // Add cuisine filter via junction table
    if (activeFilters.cuisine_id !== null) {
      const { data: cuisineMatches } = await supabase
        .from('restaurant_cuisines')
        .select('restaurant_id')
        .eq('cuisine_id', activeFilters.cuisine_id)

      const ids = (cuisineMatches ?? []).map((r) => r.restaurant_id)
      if (ids.length === 0) {
        setRestaurants([])
        setLoading(false)
        return
      }
      query = query.in('id', ids)
    }

    // Add vibe filter via junction table
    if (activeFilters.vibe_id !== null) {
      const { data: vibeMatches } = await supabase
        .from('restaurant_vibes')
        .select('restaurant_id')
        .eq('vibe_id', activeFilters.vibe_id)

      const ids = (vibeMatches ?? []).map((r) => r.restaurant_id)
      if (ids.length === 0) {
        setRestaurants([])
        setLoading(false)
        return
      }
      query = query.in('id', ids)
    }

    // Add great for filter via junction table
    if (activeFilters.great_for_id !== null) {
      const { data: greatForMatches } = await supabase
        .from('restaurant_great_for')
        .select('restaurant_id')
        .eq('tag_id', activeFilters.great_for_id)

      const ids = (greatForMatches ?? []).map((r) => r.restaurant_id)
      if (ids.length === 0) {
        setRestaurants([])
        setLoading(false)
        return
      }
      query = query.in('id', ids)
    }

    const { data, error } = await query

    if (error) {
      setError('Could not load restaurants. Please try again.')
      console.error(error)
    } else {
      setRestaurants(data ?? [])
    }

    setLoading(false)
  }

  const handleFiltersChange = useCallback(
    (filters: ActiveFilters) => {
      setActiveFilters(filters)
    },
    []
  )

  const activeFilterCount = Object.values(activeFilters).filter(
    (v) => v !== null
  ).length

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Foodmension</Text>
        <Text style={styles.headerSubtitle}>Discover your next favourite</Text>
      </View>

      {/* Filter bar */}
      <FilterBar
        cuisines={cuisines}
        vibes={vibes}
        greatForTags={greatForTags}
        activeFilters={activeFilters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#E07340" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchRestaurants}>
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
                  onPress={() =>
                    setActiveFilters({
                      cuisine_id: null,
                      vibe_id: null,
                      price_tier: null,
                      great_for_id: null,
                    })
                  }
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImagePlaceholder: {
    height: 180,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageText: { fontSize: 40 },
  cardBody: { padding: 16 },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardSuburb: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  price: {
    fontSize: 14,
    color: '#E07340',
    fontWeight: '600',
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
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
})