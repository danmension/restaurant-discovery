import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { supabase } from '../../lib/supabase'

// --- Types ---
type Tag = { id: string; name: string }

type RestaurantDetail = {
  id: string
  name: string
  description: string
  suburb: string
  city: string
  price_tier: number
  menu_url: string | null
  instagram_url: string | null
  booking_url: string | null
  latitude: number | null
  longitude: number | null
  cuisines: { cuisines: Tag }[]
  vibes: { vibes: Tag }[]
  great_for: { great_for_tags: Tag }[]
}

// --- Small reusable components ---

function PriceTier({ tier }: { tier: number }) {
  return (
    <View style={styles.priceTierRow}>
      {[1, 2, 3, 4].map((n) => (
        <Text
          key={n}
          style={[styles.priceDollar, n <= tier && styles.priceDollarActive]}
        >
          $
        </Text>
      ))}
    </View>
  )
}

function TagPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>
}

function ActionButton({
  icon,
  label,
  onPress,
  variant = 'outline',
}: {
  icon: string
  label: string
  onPress: () => void
  variant?: 'solid' | 'outline'
}) {
  return (
    <Pressable
      style={[
        styles.actionButton,
        variant === 'solid' ? styles.actionButtonSolid : styles.actionButtonOutline,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={variant === 'solid' ? '#FFFFFF' : '#E07340'}
      />
      <Text
        style={[
          styles.actionButtonText,
          variant === 'solid'
            ? styles.actionButtonTextSolid
            : styles.actionButtonTextOutline,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

// --- Main Detail Screen ---
export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) fetchRestaurant()
  }, [id])

  async function fetchRestaurant() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        id,
        name,
        description,
        suburb,
        city,
        price_tier,
        menu_url,
        instagram_url,
        booking_url,
        latitude,
        longitude,
        cuisines:restaurant_cuisines(cuisines(id, name)),
        vibes:restaurant_vibes(vibes(id, name)),
        great_for:restaurant_great_for(great_for_tags(id, name))
      `)
      .eq('id', id)
      .eq('status', 'approved')
      .single()

    if (error) {
      setError('Could not load restaurant details.')
      console.error(error)
    } else {
      setRestaurant(data as any)
    }

    setLoading(false)
  }

  async function openUrl(url: string | null, fallbackMessage: string) {
    if (!url) {
      Alert.alert('Not available', fallbackMessage)
      return
    }
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
    } else {
      Alert.alert('Could not open link', 'Please try again later.')
    }
  }

  function openMaps() {
    if (!restaurant) return
    const { latitude, longitude, name } = restaurant
    const url =
      latitude && longitude
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + restaurant.suburb)}`
    openUrl(url, 'No location available for this restaurant.')
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E07340" />
      </View>
    )
  }

  if (error || !restaurant) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Restaurant not found.'}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  const cuisineNames = restaurant.cuisines
    .map((c: any) => c.cuisines?.name)
    .filter(Boolean)

  const vibeNames = restaurant.vibes
    .map((v: any) => v.vibes?.name)
    .filter(Boolean)

  const greatForNames = restaurant.great_for
    .map((g: any) => g.great_for_tags?.name)
    .filter(Boolean)

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo placeholder */}
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>📸</Text>
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <Text style={styles.location}>
                {restaurant.suburb}, {restaurant.city}
              </Text>
            </View>
            <PriceTier tier={restaurant.price_tier} />
          </View>

          {/* Description */}
          {restaurant.description && (
            <>
              <SectionTitle title="About" />
              <Text style={styles.description}>{restaurant.description}</Text>
            </>
          )}

          {/* Cuisines */}
          {cuisineNames.length > 0 && (
            <>
              <SectionTitle title="Cuisine" />
              <View style={styles.pillRow}>
                {cuisineNames.map((name: string) => (
                  <TagPill key={name} label={name} />
                ))}
              </View>
            </>
          )}

          {/* Vibes */}
          {vibeNames.length > 0 && (
            <>
              <SectionTitle title="Vibe" />
              <View style={styles.pillRow}>
                {vibeNames.map((name: string) => (
                  <TagPill key={name} label={name} />
                ))}
              </View>
            </>
          )}

          {/* Great for */}
          {greatForNames.length > 0 && (
            <>
              <SectionTitle title="Great for" />
              <View style={styles.pillRow}>
                {greatForNames.map((name: string) => (
                  <TagPill key={name} label={name} />
                ))}
              </View>
            </>
          )}

          {/* Action buttons */}
          <SectionTitle title="Visit" />
          <View style={styles.actionRow}>
            <ActionButton
              icon="navigate-outline"
              label="Directions"
              onPress={openMaps}
              variant="solid"
            />
            {restaurant.instagram_url && (
              <ActionButton
                icon="logo-instagram"
                label="Instagram"
                onPress={() =>
                  openUrl(
                    restaurant.instagram_url,
                    'No Instagram page available.'
                  )
                }
                variant="outline"
              />
            )}
            {restaurant.booking_url && (
              <ActionButton
                icon="calendar-outline"
                label="Book"
                onPress={() =>
                  openUrl(
                    restaurant.booking_url,
                    'No booking link available.'
                  )
                }
                variant="outline"
              />
            )}
            {restaurant.menu_url && (
              <ActionButton
                icon="receipt-outline"
                label="Menu"
                onPress={() =>
                  openUrl(restaurant.menu_url, 'No menu available.')
                }
                variant="outline"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 48 },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoPlaceholder: {
    height: 280,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: { fontSize: 64 },
  content: { padding: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerText: { flex: 1, marginRight: 12 },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  location: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  priceTierRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  priceDollar: { fontSize: 16, color: '#D1D5DB', fontWeight: '600' },
  priceDollarActive: { color: '#E07340' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 24,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: '#FFF3EE',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 13,
    color: '#E07340',
    fontWeight: '500',
  },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonSolid: { backgroundColor: '#E07340' },
  actionButtonOutline: {
    borderWidth: 1.5,
    borderColor: '#E07340',
  },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  actionButtonTextSolid: { color: '#FFFFFF' },
  actionButtonTextOutline: { color: '#E07340' },
  errorText: { color: '#EF4444', fontSize: 15, marginBottom: 12 },
  retryButton: {
    backgroundColor: '#E07340',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
})