// app/(tabs)/collections.tsx
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
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
import { supabase } from '../../lib/supabase'

type Collection = {
  id: string
  title: string
  description: string | null
  restaurant_count: number
}

// Assigns a different icon to each collection based on its index
// You can customise these to match your collection themes
const COLLECTION_ICONS = [
  'heart',
  'diamond',
  'sunny',
  'star',
  'leaf',
  'flame',
  'moon',
  'ribbon',
] as const

const COLLECTION_COLORS = [
  '#FFE4D6',
  '#D6E4FF',
  '#D6FFE4',
  '#FFD6D6',
  '#F0D6FF',
  '#FFF3D6',
  '#D6F0FF',
  '#FFD6F0',
]

function CollectionCard({
  collection,
  index,
  onPress,
}: {
  collection: Collection
  index: number
  onPress: () => void
}) {
  const iconName = COLLECTION_ICONS[index % COLLECTION_ICONS.length]
  const bgColor = COLLECTION_COLORS[index % COLLECTION_COLORS.length]

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Icon block */}
      <View style={[styles.cardIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={28} color="#1A1A1A" />
      </View>

      {/* Text content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{collection.title}</Text>
        {collection.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {collection.description}
          </Text>
        )}
        <Text style={styles.cardCount}>
          {collection.restaurant_count}{' '}
          {collection.restaurant_count === 1 ? 'restaurant' : 'restaurants'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </Pressable>
  )
}

export default function CollectionsScreen() {
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCollections()
  }, [])

  async function fetchCollections() {
    setLoading(true)
    setError(null)

    // Fetch collections
    const { data: collectionsData, error: collectionsError } = await supabase
      .from('collections')
      .select('id, title, description')
      .order('title', { ascending: true })

    if (collectionsError || !collectionsData) {
      setError('Could not load collections.')
      setLoading(false)
      return
    }

    // For each collection, count how many approved restaurants are in it
    const collectionsWithCount = await Promise.all(
      collectionsData.map(async (collection) => {
        const { data: junctionData } = await supabase
          .from('collection_restaurants')
          .select('restaurant_id')
          .eq('collection_id', collection.id)

        const restaurantIds = (junctionData ?? []).map((j) => j.restaurant_id)

        if (restaurantIds.length === 0) {
          return { ...collection, restaurant_count: 0 }
        }

        const { count } = await supabase
          .from('restaurants')
          .select('id', { count: 'exact', head: true })
          .in('id', restaurantIds)
          .eq('status', 'approved')

        return { ...collection, restaurant_count: count ?? 0 }
      })
    )

    setCollections(collectionsWithCount)
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
        <Text style={styles.headerSubtitle}>
          Curated lists for every occasion
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#E07340" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchCollections}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <CollectionCard
              collection={item}
              index={index}
              onPress={() =>
                router.push(`/collection/${item.id}` as any)
              }
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No collections yet</Text>
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
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cardCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 15,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#E07340',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
})