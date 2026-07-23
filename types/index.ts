// types/index.ts
// Shared TypeScript types used across the app

export type Restaurant = {
  id: string
  name: string
  suburb: string
  city: string
  price_tier: number
  description: string
  cover_image?: string | null
}

export type Cuisine = {
  id: string
  name: string
}

export type Vibe = {
  id: string
  name: string
}

export type GreatForTag = {
  id: string
  name: string
}

export type ActiveFilters = {
  cuisine_id: string | null
  vibe_id: string | null
  price_tier: number | null
  great_for_id: string | null
}