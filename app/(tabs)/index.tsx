import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { supabase } from '../../lib/supabase'

// --- Types ---
// This describes the shape of a restaurant object from the database
type Restaurant = {
  id: string
  name: string
  suburb: string
  city: string
  price_tier: number
  description: string
}

// Converts price_tier number (1-4) into dollar signs
function PriceTier({ tier }: { tier: number }) {
  return (
    <Text style={styles.price}>{'$'.repeat(tier)}</Text>
  )
}

// A single restaurant card component
function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/restaurant/${restaurant.id}` as any)}
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  async function fetchRestaurants() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, suburb, city, price_tier, description')
      .eq('status', 'approved')
      .order('name', { ascending: true })

    if (error) {
      setError('Could not load restaurants. Please try again.')
      console.error(error)
    } else {
      setRestaurants(data ?? [])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E07340" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchRestaurants}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Foodmension</Text>
        <Text style={styles.headerSubtitle}>Discover your next favourite</Text>
      </View>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RestaurantCard restaurant={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No restaurants yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
})