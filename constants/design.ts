// constants/design.ts
// Single source of truth for all design decisions
// Change a value here and it updates everywhere

export const Colors = {
  // Brand
  primary: '#E07340',
  primaryLight: '#FFF3EE',
  primaryDark: '#C5612E',

  // Neutrals
  black: '#1A1A1A',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#FAFAFA',
  white: '#FFFFFF',

  // Semantic
  error: '#EF4444',
  errorLight: '#FFF5F5',
  success: '#10B981',
  successLight: '#ECFDF5',
}

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 17,
  xl: 18,
  '2xl': 22,
  '3xl': 26,
  '4xl': 28,
  '5xl': 32,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line heights
  tight: 20,
  normal: 22,
  relaxed: 24,
  loose: 28,
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
}

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
}