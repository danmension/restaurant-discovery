// hooks/useFavorites.ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'


export function useFavorites(userId: string | undefined) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavoriteIds(new Set())
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from('user_favorites')
      .select('restaurant_id')
      .eq('user_id', userId)

    if (data) {
      setFavoriteIds(new Set(data.map((f) => f.restaurant_id)))
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  async function toggleFavorite(restaurantId: string) {
    console.log('toggleFavorite called:', restaurantId, 'userId:', userId)
    if (!userId) return

    const isFavorited = favoriteIds.has(restaurantId)

    // Optimistic update — update UI immediately before the database confirms
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (isFavorited) {
        next.delete(restaurantId)
      } else {
        next.add(restaurantId)
      }
      return next
    })

    if (isFavorited) {
  const { error: deleteError } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
  console.log('Delete result error:', deleteError)
} else {
  const { error: insertError } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, restaurant_id: restaurantId })
  console.log('Insert result error:', insertError)
}
  }

  return { favoriteIds, loading, toggleFavorite, refetch: fetchFavorites }
}