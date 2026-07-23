// app/submit.tsx
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography } from '../constants/design'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Price tier selector component
function PriceTierSelector({
  value,
  onChange,
}: {
  value: number | null
  onChange: (tier: number) => void
}) {
  return (
    <View style={styles.priceTierRow}>
      {[1, 2, 3, 4].map((tier) => (
        <Pressable
          key={tier}
          style={[
            styles.priceTierButton,
            value === tier && styles.priceTierButtonActive,
          ]}
          onPress={() => onChange(tier)}
        >
          <Text
            style={[
              styles.priceTierText,
              value === tier && styles.priceTierTextActive,
            ]}
          >
            {'$'.repeat(tier)}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

// A single labelled input field
function FormField({
  label,
  required,
  hint,
  children,
  error,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {required && <Text style={styles.fieldRequired}>Required</Text>}
      </View>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  )
}

type FormData = {
  name: string
  description: string
  suburb: string
  city: string
  price_tier: number | null
  menu_url: string
  instagram_url: string
  booking_url: string
}

type FormErrors = Partial<Record<keyof FormData, string>>

export default function SubmitScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    suburb: '',
    city: 'Pretoria',
    price_tier: null,
    menu_url: '',
    instagram_url: '',
    booking_url: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  async function pickAndUploadPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library to add a photo.'
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })

    if (result.canceled) return

    setUploadingPhoto(true)

    try {
      const uri = result.assets[0].uri
      const filename = uri.split('/').pop() ?? 'photo.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      const formData = new FormData()
      formData.append('file', { uri, name: filename, type } as any)
      formData.append(
        'upload_preset',
        process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      )
      formData.append('folder', 'restaurants')

      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )

      const data = await response.json()
      if (data.secure_url) {
        setCoverPhoto(data.secure_url)
      } else {
        Alert.alert('Upload failed', 'Could not upload photo. Please try again.')
      }
    } catch (err) {
      console.error('Upload error:', err)
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.')
    }

    setUploadingPhoto(false)
  }

  function updateField(field: keyof FormData, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'Restaurant name is required'
    }
    if (!form.suburb.trim()) {
      newErrors.suburb = 'Suburb is required'
    }
    if (!form.city.trim()) {
      newErrors.city = 'City is required'
    }
    if (form.price_tier === null) {
      newErrors.price_tier = 'Please select a price range'
    }
    if (!form.description.trim()) {
      newErrors.description = 'A short description is required'
    } else if (form.description.trim().length < 20) {
      newErrors.description = 'Description should be at least 20 characters'
    }

    const urlFields: (keyof FormData)[] = ['menu_url', 'instagram_url', 'booking_url']
    urlFields.forEach((field) => {
      const value = form[field] as string
      if (value.trim() && !value.trim().startsWith('http')) {
        newErrors[field] = 'URL must start with http:// or https://'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!user || !session) {
    Alert.alert('Sign in required', 'Please sign in to submit a restaurant.')
    return
  }

  if (!validate()) {
    Alert.alert(
      'Please check your submission',
      'Some required fields are missing or incorrect.'
    )
    return
  }

  setLoading(true)



// Use direct REST API call instead of Supabase client
const response = await fetch(
  `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/restaurants`,
  {
    method: 'POST',
    headers: {
  'Content-Type': 'application/json',
  'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  'Authorization': `Bearer ${session?.access_token ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation',
},
    body: JSON.stringify({
      name: form.name.trim(),
      description: form.description.trim(),
      suburb: form.suburb.trim(),
      city: form.city.trim(),
      price_tier: form.price_tier,
      menu_url: form.menu_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      booking_url: form.booking_url.trim() || null,
      status: 'pending',
      submitted_by: user.id,
    }),
  }
)

const responseText = await response.text()
console.log('Direct API response status:', response.status)
console.log('Direct API response body:', responseText)

if (!response.ok) {
  Alert.alert('Submission failed', `Error ${response.status}: ${responseText}`)
  setLoading(false)
  return
}

const restaurantData = JSON.parse(responseText)[0]

if (coverPhoto && restaurantData?.id) {
  await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/restaurant_photos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${session?.access_token ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        restaurant_id: restaurantData.id,
        url: coverPhoto,
        is_cover: true,
        display_order: 0,
      }),
    }
  )
}

setLoading(false)

Alert.alert(
  'Submission received! 🎉',
  'Thank you for contributing to Foodmension. We will review your submission and add it to the app if it meets our criteria.',
  [{ text: 'Back to browsing', onPress: () => router.replace('/(tabs)') }]
)
}

  // Not logged in
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </Pressable>
        <View style={styles.centered}>
          <Ionicons name="restaurant-outline" size={64} color="#E5E7EB" />
          <Text style={styles.gateTitle}>Sign in to submit</Text>
          <Text style={styles.gateSubtitle}>
            You need an account to submit a restaurant for review
          </Text>
          <Pressable
            style={styles.gateButton}
            onPress={() => router.push('/auth' as any)}
          >
            <Text style={styles.gateButtonText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Submit a restaurant</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Know a great spot we're missing? Submit it for review and we'll add
            it to Foodmension if it meets our curation criteria.
          </Text>

          {/* Required fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The basics</Text>

            <FormField label="Restaurant name" required error={errors.name}>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="e.g. The Test Kitchen"
                placeholderTextColor="#9CA3AF"
                value={form.name}
                onChangeText={(v) => updateField('name', v)}
                returnKeyType="next"
              />
            </FormField>

            <FormField label="Suburb" required error={errors.suburb}>
              <TextInput
                style={[styles.input, errors.suburb && styles.inputError]}
                placeholder="e.g. Brooklyn"
                placeholderTextColor="#9CA3AF"
                value={form.suburb}
                onChangeText={(v) => updateField('suburb', v)}
                returnKeyType="next"
              />
            </FormField>

            <FormField label="City" required error={errors.city}>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder="e.g. Pretoria"
                placeholderTextColor="#9CA3AF"
                value={form.city}
                onChangeText={(v) => updateField('city', v)}
                returnKeyType="next"
              />
            </FormField>

            <FormField
              label="Price range"
              required
              error={errors.price_tier}
              hint="$ = budget friendly, $$$$ = fine dining"
            >
              <PriceTierSelector
                value={form.price_tier}
                onChange={(tier) => updateField('price_tier', tier)}
              />
            </FormField>

            <FormField
              label="Description"
              required
              error={errors.description}
              hint="What makes this place special? What's the vibe and what should people order?"
            >
              <TextInput
                style={[
                  styles.input,
                  styles.inputMultiline,
                  errors.description && styles.inputError,
                ]}
                placeholder="Tell us about this restaurant..."
                placeholderTextColor="#9CA3AF"
                value={form.description}
                onChangeText={(v) => updateField('description', v)}
                multiline
                numberOfLines={4}
                returnKeyType="next"
              />
            </FormField>
          </View>

          {/* Optional links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Optional links</Text>
            <Text style={styles.sectionHint}>
              These help users find more information — add what you have
            </Text>

            <FormField label="Menu URL" error={errors.menu_url}>
              <TextInput
                style={[styles.input, errors.menu_url && styles.inputError]}
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                value={form.menu_url}
                onChangeText={(v) => updateField('menu_url', v)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="next"
              />
            </FormField>

            <FormField label="Instagram URL" error={errors.instagram_url}>
              <TextInput
                style={[styles.input, errors.instagram_url && styles.inputError]}
                placeholder="https://instagram.com/..."
                placeholderTextColor="#9CA3AF"
                value={form.instagram_url}
                onChangeText={(v) => updateField('instagram_url', v)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="next"
              />
            </FormField>

            <FormField label="Booking URL" error={errors.booking_url}>
              <TextInput
                style={[styles.input, errors.booking_url && styles.inputError]}
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                value={form.booking_url}
                onChangeText={(v) => updateField('booking_url', v)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
              />
            </FormField>
          </View>

          {/* Cover photo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover photo</Text>
            <Text style={styles.sectionHint}>
              Add a photo to help users recognise the restaurant
            </Text>

            <Pressable
              style={styles.photoUpload}
              onPress={pickAndUploadPhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <View style={styles.photoPlaceholder}>
                  <ActivityIndicator color={Colors.primary} />
                </View>
              ) : coverPhoto ? (
                <Image
                  source={{ uri: coverPhoto }}
                  style={styles.photoPreview}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={32}
                    color={Colors.gray400}
                  />
                  <Text style={styles.photoPlaceholderText}>
                    Tap to add a photo
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Submit button */}
          <Pressable
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="paper-plane-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>Submit for review</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.disclaimer}>
            Submissions are reviewed by our team before appearing in the app.
            We'll add cuisines, vibes, and tags during the review process.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  backButton: { padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  intro: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 28,
  },
  section: {
    marginBottom: 28,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: -12,
  },
  fieldGroup: { gap: 6 },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  fieldRequired: {
    fontSize: 11,
    color: '#E07340',
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  inputMultiline: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  priceTierRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priceTierButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  priceTierButtonActive: {
    backgroundColor: '#FFF3EE',
    borderColor: '#E07340',
  },
  priceTierText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceTierTextActive: {
    color: '#E07340',
  },
  submitButton: {
    height: 54,
    backgroundColor: '#E07340',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  gateSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  gateButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#E07340',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  photoUpload: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gray50,
  },
  photoPlaceholderText: {
    fontSize: Typography.base,
    color: Colors.gray400,
  },
})