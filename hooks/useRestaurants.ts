// hooks/useRestaurants.ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActiveFilters, Restaurant } from '../types'

export function useRestaurants(
  searchQuery: string,
  activeFilters: ActiveFilters
) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Price filter applies directly on restaurants table
      let query = supabase
        .from('restaurants')
        .select('id, name, suburb, city, price_tier, description')
        .eq('status', 'approved')
        .order('name', { ascending: true })

      // Text search across name and suburb
      if (searchQuery.trim().length > 0) {
        query = query.or(
          `name.ilike.%${searchQuery.trim()}%,suburb.ilike.%${searchQuery.trim()}%`
        )
      }

      // Price filter
      if (activeFilters.price_tier !== null) {
        query = query.eq('price_tier', activeFilters.price_tier)
      }

      // Cuisine filter via junction table
      if (activeFilters.cuisine_id !== null) {
        const { data: matches } = await supabase
          .from('restaurant_cuisines')
          .select('restaurant_id')
          .eq('cuisine_id', activeFilters.cuisine_id)

        const ids = (matches ?? []).map((r) => r.restaurant_id)
        if (ids.length === 0) {
          setRestaurants([])
          setLoading(false)
          return
        }
        query = query.in('id', ids)
      }

      // Vibe filter via junction table
      if (activeFilters.vibe_id !== null) {
        const { data: matches } = await supabase
          .from('restaurant_vibes')
          .select('restaurant_id')
          .eq('vibe_id', activeFilters.vibe_id)

        const ids = (matches ?? []).map((r) => r.restaurant_id)
        if (ids.length === 0) {
          setRestaurants([])
          setLoading(false)
          return
        }
        query = query.in('id', ids)
      }

      // Great for filter via junction table
      if (activeFilters.great_for_id !== null) {
        const { data: matches } = await supabase
          .from('restaurant_great_for')
          .select('restaurant_id')
          .eq('tag_id', activeFilters.great_for_id)

        const ids = (matches ?? []).map((r) => r.restaurant_id)
        if (ids.length === 0) {
          setRestaurants([])
          setLoading(false)
          return
        }
        query = query.in('id', ids)
      }

      const { data, error } = await query

      if (error) {
        setError('Could not load restaurants. Please try again.')
        console.error(error)
      } else {
        setRestaurants(data ?? [])
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    }

    setLoading(false)
  }, [searchQuery, activeFilters])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  return { restaurants, loading, error, refetch: fetchRestaurants }
}