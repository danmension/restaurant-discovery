// app/(tabs)/favorites.tsx
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import RestaurantCard from '../../components/RestaurantCard'
import { useAuth } from '../../context/AuthContext'

export default function FavoritesScreen() {
  const { user, loading: authLoading, signOut, favoriteRestaurants, favoritesLoading } = useAuth()
  const router = useRouter()

  if (authLoading) {
    return <View style={styles.container} />
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Ionicons name="heart-outline" size={64} color="#E5E7EB" />
        <Text style={styles.title}>Save your favourites</Text>
        <Text style={styles.subtitle}>
          Sign in to save restaurants and access them anytime
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/auth' as any)}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/auth' as any)}
        >
          <Text style={styles.secondaryButtonText}>Create account</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favourites</Text>
        <Pressable onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      {favoritesLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#E07340" />
        </View>
      ) : favoriteRestaurants.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={64} color="#E5E7EB" />
          <Text style={styles.title}>No favourites yet</Text>
          <Text style={styles.subtitle}>
            Tap the heart on any restaurant to save it here
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => router.push('/(tabs)' as any)}
          >
            <Text style={styles.buttonText}>Browse restaurants</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favoriteRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.count}>
              {favoriteRestaurants.length}{' '}
              {favoriteRestaurants.length === 1 ? 'restaurant' : 'restaurants'} saved
            </Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  signOutText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  list: { padding: 16, gap: 16 },
  count: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#E07340',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E07340',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#E07340',
    fontSize: 16,
    fontWeight: '600',
  },
})