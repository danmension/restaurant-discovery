// app/collection/[id].tsx
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import RestaurantCard from '../../components/RestaurantCard'
import { supabase } from '../../lib/supabase'
import type { Restaurant } from '../../types'

type Collection = {
  id: string
  title: string
  description: string | null
}

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) fetchCollection()
  }, [id])

  async function fetchCollection() {
    setLoading(true)
    setError(null)

    // Fetch collection details
    const { data: collectionData, error: collectionError } = await supabase
      .from('collections')
      .select('id, title, description')
      .eq('id', id)
      .single()

    if (collectionError || !collectionData) {
      setError('Could not load collection.')
      setLoading(false)
      return
    }

    setCollection(collectionData)

    // Fetch restaurants in this collection via junction table
    // ordered by display_order so curators control the sequence
    const { data: junctionData, error: junctionError } = await supabase
      .from('collection_restaurants')
      .select('restaurant_id, display_order')
      .eq('collection_id', id)
      .order('display_order', { ascending: true })

    if (junctionError || !junctionData || junctionData.length === 0) {
      setRestaurants([])
      setLoading(false)
      return
    }

    const restaurantIds = junctionData.map((j) => j.restaurant_id)

    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, suburb, city, price_tier, description')
      .in('id', restaurantIds)
      .eq('status', 'approved')

    if (restaurantError) {
      setError('Could not load restaurants.')
      setLoading(false)
      return
    }

    // Re-sort by display_order since .in() doesn't preserve order
    const ordered = restaurantIds
      .map((rid) => restaurantData?.find((r) => r.id === rid))
      .filter(Boolean) as Restaurant[]

    setRestaurants(ordered)
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E07340" />
      </View>
    )
  }

  if (error || !collection) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Collection not found.'}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RestaurantCard restaurant={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Back button */}
            <Pressable
              style={styles.backRow}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#E07340" />
              <Text style={styles.backText}>Collections</Text>
            </Pressable>

            {/* Collection header */}
            <Text style={styles.title}>{collection.title}</Text>
            {collection.description && (
              <Text style={styles.description}>{collection.description}</Text>
            )}
            <Text style={styles.count}>
              {restaurants.length}{' '}
              {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No restaurants in this collection yet
            </Text>
          </View>
        }
      />
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
  list: { padding: 16, gap: 16 },
  header: {
    marginBottom: 8,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  backText: {
    fontSize: 15,
    color: '#E07340',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 12,
  },
  count: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#E07340',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})