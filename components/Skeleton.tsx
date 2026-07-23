// components/Skeleton.tsx
import { useEffect, useRef } from 'react'
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native'
import { Colors } from '../constants/design'

type SkeletonProps = {
  width?: DimensionValue
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <View style={[{ width, height, borderRadius, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: Colors.gray200,
          opacity,
        }}
      />
    </View>
  )
}

// A pre-built card skeleton matching RestaurantCard dimensions
export function RestaurantCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={180} borderRadius={0} />
      <View style={styles.body}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="40%" height={13} style={{ marginTop: 8 }} />
        <Skeleton width="90%" height={13} style={{ marginTop: 8 }} />
        <Skeleton width="80%" height={13} style={{ marginTop: 4 }} />
        <Skeleton width={32} height={14} style={{ marginTop: 10 }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  body: {
    padding: 16,
    gap: 0,
  },
})