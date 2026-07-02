import { StyleSheet, Text, View } from 'react-native'

export default function CollectionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Collections coming soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#9CA3AF', fontSize: 16 },
})