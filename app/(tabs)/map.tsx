// app/(tabs)/map.tsx
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'

const { width, height } = Dimensions.get('window')

type MapRestaurant = {
  id: string
  name: string
  suburb: string
  price_tier: number
  latitude: number
  longitude: number
}

// Default region — centres on Pretoria
const DEFAULT_REGION: Region = {
  latitude: -25.7461,
  longitude: 28.1881,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
}

export default function MapScreen() {
  const router = useRouter()
  const mapRef = useRef<MapView>(null)
  const [restaurants, setRestaurants] = useState<MapRestaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<MapRestaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
  console.log("Selected restaurant:", selectedRestaurant)
}, [selectedRestaurant])

  async function fetchRestaurants() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, suburb, price_tier, latitude, longitude')
      .eq('status', 'approved')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      setError('Could not load restaurants.')
      console.error(error)
    } else {
      setRestaurants(data ?? [])
    }

    setLoading(false)
  }

  function handleMarkerPress(restaurant: MapRestaurant) {
      console.log("Marker pressed:", restaurant.name)
    setSelectedRestaurant(restaurant)

    // Animate map to centre on the selected marker
    mapRef.current?.animateToRegion(
      {
        latitude: restaurant.latitude - 0.005,
        longitude: restaurant.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      400
    )
  }

  function handleMapPress() {
    setSelectedRestaurant(null)
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
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {restaurants.map((restaurant) => (
          <Marker
          key={restaurant.id}
          coordinate={{
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          }}
          onPress={(e) => {
            e.stopPropagation();
            handleMarkerPress(restaurant);
          }}
        >
            {/* Custom marker */}
            <View
              style={[
                styles.marker,
                selectedRestaurant?.id === restaurant.id &&
                  styles.markerSelected,
              ]}
            >
              <Ionicons
                name="restaurant"
                size={14}
                color={
                  selectedRestaurant?.id === restaurant.id
                    ? '#FFFFFF'
                    : '#E07340'
                }
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Map</Text>
          <Text style={styles.headerCount}>
            {restaurants.length}{' '}
            {restaurants.length === 1 ? 'restaurant' : 'restaurants'}
          </Text>
        </View>
      </SafeAreaView>

      {/* Selected restaurant card */}
      {selectedRestaurant && (
        <View style={styles.selectedCard}>
          <Pressable
            style={styles.selectedCardInner}
            onPress={() =>
              router.push(`/restaurant/${selectedRestaurant.id}` as any)
            }
          >
            <View style={styles.selectedCardIcon}>
              <Ionicons name="restaurant" size={20} color="#E07340" />
            </View>
            <View style={styles.selectedCardText}>
              <Text style={styles.selectedCardName}>
                {selectedRestaurant.name}
              </Text>
              <Text style={styles.selectedCardSuburb}>
                {selectedRestaurant.suburb} ·{' '}
                {'$'.repeat(selectedRestaurant.price_tier)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </Pressable>
        </View>
      )}

      {/* Recenter button */}
      <Pressable
        style={styles.recenterButton}
        onPress={() =>
          mapRef.current?.animateToRegion(DEFAULT_REGION, 400)
        }
      >
        <Ionicons name="locate-outline" size={22} color="#1A1A1A" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  map: {
    width,
    height,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  marker: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#FFFFFF',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1.5,
  borderColor: '#E07340',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 3,
},

markerSelected: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: '#E07340',
  borderColor: '#E07340',
},
  selectedCard: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
  },
  selectedCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCardText: { flex: 1 },
  selectedCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  selectedCardSuburb: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
})