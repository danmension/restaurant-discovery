// components/RestaurantCard.tsx
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Restaurant } from '../types'

function PriceTier({ tier }: { tier: number }) {
  return <Text style={styles.price}>{'$'.repeat(tier)}</Text>
}

export default function RestaurantCard({
  restaurant,
}: {
  restaurant: Restaurant
}) {
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

const styles = StyleSheet.create({
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
})