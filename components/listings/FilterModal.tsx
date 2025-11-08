"use client"

import { Dropdown } from "@/components/Dropdown"
import { Colors } from "@/constants/colors"
import { BLOCK_OPTIONS, PHASE_OPTIONS } from "@/constants/listingOptions"
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
  const [typeOfPlot, setTypeOfPlot] = useState<string | null>("On Cash")
  const [phase, setPhase] = useState<string | null>(null)
  const [block, setBlock] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState<string>("5 Marla")
  const [minPrice, setMinPrice] = useState("Rs.1 Crore")
  const [maxPrice, setMaxPrice] = useState("Rs. 2 Crore")
  // const [features, setFeatures] = useState<Record<string, boolean>>({
  //   pole: false,
  //   wire: false,
  // })
  const [showCustomAreaModal, setShowCustomAreaModal] = useState(false)
  const [customAreaValue, setCustomAreaValue] = useState("")
  const [customAreaType, setCustomAreaType] = useState<string>("Marla")

  const AREA_OPTIONS = ["All", "3 Marla", "5 Marla", "10 Marla", "15 Marla", "1 Kanal", "Custom"]
  const AREA_TYPE_OPTIONS = ["Marla", "Kanal"]

  const handleAreaSelect = (area: string) => {
    if (area === "Custom") {
      setShowCustomAreaModal(true)
    } else {
      setSelectedArea(area)
    }
  }

  const handleCustomAreaSave = () => {
    if (customAreaValue && customAreaType) {
      const customArea = `${customAreaValue} ${customAreaType}`
      setSelectedArea(customArea)
      setShowCustomAreaModal(false)
      setCustomAreaValue("")
      setCustomAreaType("Marla")
    }
  }

  const handleApplyFilters = () => {
    const filters = {
      typeOfPlot,
      phase: phase || null,
      block: block || null,
      selectedArea,
      minPrice,
      maxPrice,
      // features,
    }
    console.log('filters:', filters);
    onApply(filters)
  }

  const handleClearFilters = () => {
    setTypeOfPlot("On Cash")
    setPhase(null)
    setBlock(null)
    setSelectedArea("5 Marla")
    setMinPrice("Rs.1 Crore")
    setMaxPrice("Rs. 2 Crore")
    // setFeatures({
    //   pole: false,
    //   wire: false,
    // })
    setCustomAreaValue("")
    setCustomAreaType("Marla")
    // Apply empty filters to reset
    onApply({})
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
                  {["On Cash", "On Installments"].map((type) => (
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
                <Dropdown
                  label="Phase"
                  placeholder="Select Phase"
                  options={PHASE_OPTIONS}
                  value={phase || ""}
                  onValueChange={(value) => setPhase(value)}
                />
              </View>

              {/* Block Dropdown */}
              <View style={styles.section}>
                <Dropdown
                  label="Block"
                  placeholder="Select Block"
                  options={BLOCK_OPTIONS}
                  value={block || ""}
                  onValueChange={(value) => setBlock(value)}
                />
              </View>

              {/* Area */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Area</Text>
                <View style={styles.areaGrid}>
                  {AREA_OPTIONS.map((area) => (
                    <TouchableOpacity
                      key={area}
                      style={[styles.areaButton, selectedArea === area && styles.activeAreaButton]}
                      onPress={() => handleAreaSelect(area)}
                    >
                      <Text
                        style={[styles.areaButtonText, selectedArea === area && styles.activeAreaButtonText]}
                      >
                        {area}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Show custom area if selected */}
                {selectedArea && selectedArea !== "All" && !AREA_OPTIONS.slice(1, -1).includes(selectedArea) && (
                  <View style={styles.customAreaDisplay}>
                    <Text style={styles.customAreaText}>Selected: {selectedArea}</Text>
                    <TouchableOpacity onPress={() => {
                      // Extract value and type from selected area
                      const parts = selectedArea.split(" ")
                      if (parts.length >= 2) {
                        setCustomAreaValue(parts[0])
                        setCustomAreaType(parts.slice(1).join(" "))
                      }
                      setShowCustomAreaModal(true)
                    }}>
                      <Text style={styles.editCustomAreaText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
              {/* <View style={styles.section}>
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
              </View> */}

              <View style={styles.spacing} />
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
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

      {/* Custom Area Modal */}
      <Modal visible={showCustomAreaModal} animationType="slide" transparent={true} onRequestClose={() => setShowCustomAreaModal(false)}>
        <SafeAreaView style={styles.customModalSafeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.customModalKeyboardView}>
            <View style={styles.customModalOverlay}>
              <View style={styles.customModalContent}>
                {/* Header */}
                <View style={styles.customModalHeader}>
                  <Text style={styles.customModalTitle}>Custom Area</Text>
                  <TouchableOpacity onPress={() => setShowCustomAreaModal(false)}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.customModalBody}>
                  <View style={styles.customAreaInputRow}>
                    <View style={styles.customAreaValueContainer}>
                      <Text style={styles.customAreaLabel}>Area Value</Text>
                      <TextInput
                        placeholder="Enter value"
                        value={customAreaValue}
                        onChangeText={setCustomAreaValue}
                        keyboardType="decimal-pad"
                        style={styles.customAreaValueInput}
                      />
                    </View>
                    <View style={styles.customAreaTypeContainer}>
                      <Text style={styles.customAreaLabel}>Type</Text>
                      <Dropdown
                        placeholder="Select type"
                        options={AREA_TYPE_OPTIONS}
                        value={customAreaType}
                        onValueChange={setCustomAreaType}
                      />
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.customModalFooter}>
                  <TouchableOpacity style={styles.customModalCancelButton} onPress={() => setShowCustomAreaModal(false)}>
                    <Text style={styles.customModalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.customModalSaveButton, (!customAreaValue || !customAreaType) && styles.customModalSaveButtonDisabled]} 
                    onPress={handleCustomAreaSave}
                    disabled={!customAreaValue || !customAreaType}
                  >
                    <Text style={styles.customModalSaveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
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
  customAreaDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customAreaText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  editCustomAreaText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  customModalSafeArea: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  customModalKeyboardView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  customModalOverlay: {
    width: "90%",
    maxWidth: 400,
  },
  customModalContent: {
    backgroundColor: Colors.neutral10,
    borderRadius: 20,
    overflow: "hidden",
  },
  customModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  customModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  customModalBody: {
    padding: 16,
  },
  customAreaInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  customAreaValueContainer: {
    flex: 1,
  },
  customAreaTypeContainer: {
    flex: 1,
  },
  customAreaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  customAreaValueInput: {
    // flex: 1,
  },
  customModalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  customModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  customModalCancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  customModalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  customModalSaveButtonDisabled: {
    opacity: 0.5,
  },
  customModalSaveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
})