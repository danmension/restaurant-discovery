// context/AuthContext.tsx
import { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Restaurant } from '../types'

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  favoriteIds: Set<string>
  favoriteRestaurants: Restaurant[]
  toggleFavorite: (restaurantId: string) => Promise<void>
  favoritesLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  favoriteIds: new Set(),
  favoriteRestaurants: [],
  toggleFavorite: async () => {},
  favoritesLoading: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch favorites whenever user changes
  useEffect(() => {
    if (user?.id) {
      fetchFavorites(user.id)
    } else {
      setFavoriteIds(new Set())
      setFavoriteRestaurants([])
    }
  }, [user?.id])

  async function fetchFavorites(userId: string) {
    setFavoritesLoading(true)

    // Get favorite IDs
    const { data: favData } = await supabase
      .from('user_favorites')
      .select('restaurant_id')
      .eq('user_id', userId)

    if (!favData || favData.length === 0) {
      setFavoriteIds(new Set())
      setFavoriteRestaurants([])
      setFavoritesLoading(false)
      return
    }

    const ids = favData.map((f) => f.restaurant_id)
    setFavoriteIds(new Set(ids))

    // Fetch the actual restaurant data for those IDs
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name, suburb, city, price_tier, description')
      .in('id', ids)
      .eq('status', 'approved')
      .order('name')

    if (restaurants) setFavoriteRestaurants(restaurants)
    setFavoritesLoading(false)
  }

  async function toggleFavorite(restaurantId: string) {
    if (!user?.id) return

    const isFavorited = favoriteIds.has(restaurantId)

    if (isFavorited) {
      // Remove from state immediately
      const newIds = new Set(favoriteIds)
      newIds.delete(restaurantId)
      setFavoriteIds(newIds)
      setFavoriteRestaurants((prev) =>
        prev.filter((r) => r.id !== restaurantId)
      )

      // Remove from database
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurantId)
      if (error) {
        console.error('Delete error:', error)
        // Revert on failure
        fetchFavorites(user.id)
      }
    } else {
      // Add to ID set immediately
      const newIds = new Set(favoriteIds)
      newIds.add(restaurantId)
      setFavoriteIds(newIds)

      // Insert into database
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, restaurant_id: restaurantId })

      if (error) {
        console.error('Insert error:', error)
        // Revert on failure
        fetchFavorites(user.id)
      } else {
        // Fetch the full restaurant data to add to the list
        const { data } = await supabase
          .from('restaurants')
          .select('id, name, suburb, city, price_tier, description')
          .eq('id', restaurantId)
          .single()

        if (data) {
          setFavoriteRestaurants((prev) =>
            [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
          )
        }
      }
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setFavoriteIds(new Set())
    setFavoriteRestaurants([])
  }

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      signOut,
      favoriteIds,
      favoriteRestaurants,
      toggleFavorite,
      favoritesLoading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}