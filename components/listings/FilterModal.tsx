"use client"

import { Colors } from "@/constants/colors"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { TextInput } from "../TextInput"

import { SafeAreaView } from "react-native-safe-area-context"

interface FilterModalProps {
  visible: boolean
  onClose: () => void
  onApply: (filters: Record<string, any>) => void
}

export default function FilterModal({ visible, onClose, onApply }: FilterModalProps) {
  const [typeOfPlot, setTypeOfPlot] = useState<string | null>("On Sale")
  const [phase, setPhase] = useState<string | null>(null)
  const [block, setBlock] = useState<string | null>(null)
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["5 Marla"])
  const [minPrice, setMinPrice] = useState("Rs.1 Crore")
  const [maxPrice, setMaxPrice] = useState("Rs. 2 Crore")
  const [features, setFeatures] = useState<Record<string, boolean>>({
    pole: false,
    wire: false,
  })

  const AREA_OPTIONS = ["3 Marla", "5 Marla", "10 Marla", "15 Marla", "1 Kanal", "Custom"]
  const PHASE_OPTIONS = ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5"]
  const BLOCK_OPTIONS = ["Block A", "Block B", "Block C", "Block D", "Block E"]

  const handleAreaToggle = (area: string) => {
    setSelectedAreas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
  }

  const handleApplyFilters = () => {
    const filters = {
      typeOfPlot,
      phase,
      block,
      selectedAreas,
      minPrice,
      maxPrice,
      features,
    }
    onApply(filters)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filters</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Type of Plot */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Type of plot</Text>
                <View style={styles.toggleButtonGroup}>
                  {["On Sale", "On Instalments"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.toggleButton, typeOfPlot === type && styles.activeToggleButton]}
                      onPress={() => setTypeOfPlot(type)}
                    >
                      <Text style={[styles.toggleButtonText, typeOfPlot === type && styles.activeToggleButtonText]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Phase Dropdown */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Phase</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity style={styles.dropdown}>
                    <Text style={styles.dropdownPlaceholder}>Select</Text>
                    <Ionicons name="chevron-down" size={18} color={Colors.placeholder} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Block Dropdown */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Block</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity style={styles.dropdown}>
                    <Text style={styles.dropdownPlaceholder}>Select</Text>
                    <Ionicons name="chevron-down" size={18} color={Colors.placeholder} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Area */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Area</Text>
                <View style={styles.areaGrid}>
                  {AREA_OPTIONS.map((area) => (
                    <TouchableOpacity
                      key={area}
                      style={[styles.areaButton, selectedAreas.includes(area) && styles.activeAreaButton]}
                      onPress={() => handleAreaToggle(area)}
                    >
                      <Text
                        style={[styles.areaButtonText, selectedAreas.includes(area) && styles.activeAreaButtonText]}
                      >
                        {area}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Price Range</Text>
                <View style={styles.priceRangeRow}>
                  <TextInput
                    placeholder="Min Price"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    style={styles.priceInput}
                  />
                  <TextInput
                    placeholder="Max Price"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    style={styles.priceInput}
                  />
                </View>
              </View>

              {/* Features */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Features</Text>
                <View style={styles.featureCheckboxes}>
                  {["Don't have a pole", "No wire"].map((feature) => (
                    <TouchableOpacity
                      key={feature}
                      style={styles.checkboxRow}
                      onPress={() =>
                        setFeatures((prev) => ({
                          ...prev,
                          [feature]: !prev[feature],
                        }))
                      }
                    >
                      <View style={[styles.checkbox, features[feature] && styles.checkedCheckbox]}>
                        {features[feature] && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                      </View>
                      <Text style={styles.checkboxLabel}>{feature}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.spacing} />
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    backgroundColor: Colors.neutral10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  toggleButtonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  activeToggleButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeToggleButtonText: {
    color: Colors.white,
  },
  dropdownContainer: {
    gap: 8,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: Colors.placeholder,
  },
  areaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  areaButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeAreaButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  areaButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeAreaButtonText: {
    color: Colors.white,
  },
  priceRangeRow: {
    flexDirection: "row",
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  featureCheckboxes: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedCheckbox: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  spacing: {
    height: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
})