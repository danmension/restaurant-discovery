// components/FilterBar.tsx
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import type { ActiveFilters, Cuisine, GreatForTag, Vibe } from '../types'

// --- Filter Pill ---
// A single tappable pill in the filter bar
function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  )
}

// --- Option Sheet ---
// A modal bottom sheet for selecting a filter option
function OptionSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean
  title: string
  options: { id: string; label: string }[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onClose: () => void
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <SafeAreaView style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={22} color="#1A1A1A" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.sheetOptions}>
          {/* Clear option */}
          <Pressable
            style={[
              styles.sheetOption,
              selectedId === null && styles.sheetOptionActive,
            ]}
            onPress={() => {
              onSelect(null)
              onClose()
            }}
          >
            <Text
              style={[
                styles.sheetOptionText,
                selectedId === null && styles.sheetOptionTextActive,
              ]}
            >
              Any
            </Text>
            {selectedId === null && (
              <Ionicons name="checkmark" size={18} color="#E07340" />
            )}
          </Pressable>

          {options.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.sheetOption,
                selectedId === option.id && styles.sheetOptionActive,
              ]}
              onPress={() => {
                onSelect(option.id)
                onClose()
              }}
            >
              <Text
                style={[
                  styles.sheetOptionText,
                  selectedId === option.id && styles.sheetOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {selectedId === option.id && (
                <Ionicons name="checkmark" size={18} color="#E07340" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

// --- FilterBar ---
// The main horizontally scrolling filter bar
export default function FilterBar({
  cuisines,
  vibes,
  greatForTags,
  activeFilters,
  onFiltersChange,
}: {
  cuisines: Cuisine[]
  vibes: Vibe[]
  greatForTags: GreatForTag[]
  activeFilters: ActiveFilters
  onFiltersChange: (filters: ActiveFilters) => void
}) {
  const [openSheet, setOpenSheet] = useState <
    'cuisine' | 'vibe' | 'price' | 'greatfor' | null
  >(null)

  const activeCount = Object.values(activeFilters).filter(
    (v) => v !== null
  ).length

  function clearAll() {
    onFiltersChange({
      cuisine_id: null,
      vibe_id: null,
      price_tier: null,
      great_for_id: null,
    })
  }

  const selectedCuisineName =
    cuisines.find((c) => c.id === activeFilters.cuisine_id)?.name ?? 'Cuisine'

  const selectedVibeName =
    vibes.find((v) => v.id === activeFilters.vibe_id)?.name ?? 'Vibe'

  const selectedGreatForName =
    greatForTags.find((t) => t.id === activeFilters.great_for_id)?.name ??
    'Great for'

  const priceTierLabel =
    activeFilters.price_tier !== null
      ? '$'.repeat(activeFilters.price_tier)
      : 'Price'

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bar}
      >
        {/* Clear all button — only shows when filters are active */}
        {activeCount > 0 && (
          <Pressable style={styles.clearButton} onPress={clearAll}>
            <Ionicons name="close-circle" size={14} color="#FFFFFF" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        )}

        <FilterPill
          label={selectedCuisineName}
          active={activeFilters.cuisine_id !== null}
          onPress={() => setOpenSheet('cuisine')}
        />
        <FilterPill
          label={selectedVibeName}
          active={activeFilters.vibe_id !== null}
          onPress={() => setOpenSheet('vibe')}
        />
        <FilterPill
          label={priceTierLabel}
          active={activeFilters.price_tier !== null}
          onPress={() => setOpenSheet('price')}
        />
        <FilterPill
          label={selectedGreatForName}
          active={activeFilters.great_for_id !== null}
          onPress={() => setOpenSheet('greatfor')}
        />
      </ScrollView>

      {/* Cuisine sheet */}
      <OptionSheet
        visible={openSheet === 'cuisine'}
        title="Cuisine"
        options={cuisines.map((c) => ({ id: c.id, label: c.name }))}
        selectedId={activeFilters.cuisine_id}
        onSelect={(id) =>
          onFiltersChange({ ...activeFilters, cuisine_id: id })
        }
        onClose={() => setOpenSheet(null)}
      />

      {/* Vibe sheet */}
      <OptionSheet
        visible={openSheet === 'vibe'}
        title="Vibe"
        options={vibes.map((v) => ({ id: v.id, label: v.name }))}
        selectedId={activeFilters.vibe_id}
        onSelect={(id) =>
          onFiltersChange({ ...activeFilters, vibe_id: id })
        }
        onClose={() => setOpenSheet(null)}
      />

      {/* Price sheet */}
      <OptionSheet
        visible={openSheet === 'price'}
        title="Price"
        options={[
          { id: '1', label: '$' },
          { id: '2', label: '$$' },
          { id: '3', label: '$$$' },
          { id: '4', label: '$$$$' },
        ]}
        selectedId={
          activeFilters.price_tier !== null
            ? String(activeFilters.price_tier)
            : null
        }
        onSelect={(id) =>
          onFiltersChange({
            ...activeFilters,
            price_tier: id !== null ? Number(id) : null,
          })
        }
        onClose={() => setOpenSheet(null)}
      />

      {/* Great for sheet */}
      <OptionSheet
        visible={openSheet === 'greatfor'}
        title="Great for"
        options={greatForTags.map((t) => ({ id: t.id, label: t.name }))}
        selectedId={activeFilters.great_for_id}
        onSelect={(id) =>
          onFiltersChange({ ...activeFilters, great_for_id: id })
        }
        onClose={() => setOpenSheet(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  pillActive: {
    backgroundColor: '#FFF3EE',
    borderColor: '#E07340',
  },
  pillText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#E07340',
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E07340',
  },
  clearButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sheetOptions: {
    paddingVertical: 8,
  },
  sheetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetOptionActive: {
    backgroundColor: '#FFF3EE',
  },
  sheetOptionText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  sheetOptionTextActive: {
    color: '#E07340',
    fontWeight: '600',
  },
})