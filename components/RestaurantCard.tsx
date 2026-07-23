// components/RestaurantCard.tsx
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors, Radii, Shadows, Typography } from '../constants/design'
import { useAuth } from '../context/AuthContext'
import type { Restaurant } from '../types'

function PriceTier({ tier }: { tier: number }) {
  return (
    <Text style={styles.price}>{'$'.repeat(tier)}</Text>
  )
}

export default function RestaurantCard({
  restaurant,
  coverImage,
}: {
  restaurant: Restaurant
  coverImage?: string | null
}) {
  const router = useRouter()
  const { user, favoriteIds, toggleFavorite } = useAuth()

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/restaurant/${restaurant.id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={`View ${restaurant.name} in ${restaurant.suburb}`}
    >
      {/* Photo */}
      <View style={styles.imageContainer}>
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            accessibilityLabel={`Photo of ${restaurant.name}`}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="restaurant-outline"
              size={32}
              color={Colors.gray400}
            />
          </View>
        )}

        {/* Favorite button overlay */}
        {user && (
          <Pressable
            style={styles.heartButton}
            onPress={(e) => {
              e.stopPropagation()
              toggleFavorite(restaurant.id)
            }}
            accessibilityRole="button"
            accessibilityLabel={
              favoriteIds.has(restaurant.id)
                ? `Remove ${restaurant.name} from favourites`
                : `Save ${restaurant.name} to favourites`
            }
            hitSlop={8}
          >
            <Ionicons
              name={favoriteIds.has(restaurant.id) ? 'heart' : 'heart-outline'}
              size={18}
              color={favoriteIds.has(restaurant.id) ? Colors.primary : Colors.white}
            />
          </Pressable>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <PriceTier tier={restaurant.price_tier} />
        </View>
        <Text style={styles.suburb}>
          {restaurant.suburb}, {restaurant.city}
        </Text>
        {restaurant.description && (
          <Text style={styles.description} numberOfLines={2}>
            {restaurant.description}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 14,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: Typography.xl,
    fontWeight: Typography.semibold,
    color: Colors.black,
    flex: 1,
  },
  suburb: {
    fontSize: Typography.sm,
    color: Colors.gray400,
  },
  description: {
    fontSize: Typography.base,
    color: Colors.gray500,
    lineHeight: Typography.tight,
    marginTop: 2,
  },
  price: {
    fontSize: Typography.base,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
})