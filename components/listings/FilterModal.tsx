"use client"

import { Dropdown } from "@/components/Dropdown"
import { Colors } from "@/constants/colors"
import { COMMERCIAL_BLOCKS, PHASE_OPTIONS, RESEDENTIAL_BLOCKS } from "@/constants/listingOptions"
import { Validation } from "@/utils/validation"
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

import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { SafeAreaView } from "react-native-safe-area-context"

interface FilterModalProps {
  visible: boolean
  onClose: () => void
  onApply: (filters: Record<string, any>) => void
  propertyType: string
}

export default function FilterModal({ visible, onClose, onApply, propertyType }: FilterModalProps) {
  const [typeOfPlot, setTypeOfPlot] = useState<string | null>("On Cash")
  const [phase, setPhase] = useState<string | null>(null)
  const [block, setBlock] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState<string>("5 Marla")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  // const [features, setFeatures] = useState<Record<string, boolean>>({
  //   pole: false,
  //   wire: false,
  // })
  const [showCustomAreaModal, setShowCustomAreaModal] = useState(false)
  const [customAreaValue, setCustomAreaValue] = useState("")
  const [customAreaType, setCustomAreaType] = useState<string>("Marla")
  const [errors, setErrors] = useState<{ minPrice?: string; maxPrice?: string }>({})
  const [touched, setTouched] = useState({ minPrice: false, maxPrice: false })
  const [customAreaError, setCustomAreaError] = useState<string | undefined>(undefined)

  const AREA_OPTIONS = ["3 Marla", "5 Marla", "10 Marla", "15 Marla", "1 Kanal", "Custom", "All"]
  const AREA_TYPE_OPTIONS = ["Marla", "Kanal"]

  const computePriceErrors = (min: string, max: string) => {
    const validation: { minPrice?: string; maxPrice?: string } = {}

    if (min) {
      if (!Validation.isNumeric(min)) {
        validation.minPrice = "Min price must be numeric"
      } else if (Validation.toNumber(min) < 0) {
        validation.minPrice = "Min price cannot be negative"
      }
    }

    if (max) {
      if (!Validation.isNumeric(max)) {
        validation.maxPrice = "Max price must be numeric"
      } else if (Validation.toNumber(max) < 0) {
        validation.maxPrice = "Max price cannot be negative"
      }
    }

    if (!validation.minPrice && !validation.maxPrice && min && max) {
      const minValue = Validation.toNumber(min)
      const maxValue = Validation.toNumber(max)
      if (!Number.isNaN(minValue) && !Number.isNaN(maxValue) && minValue > maxValue) {
        validation.minPrice = "Min price cannot exceed max price"
        validation.maxPrice = "Max price must be greater than min price"
      }
    }

    return validation
  }

  const handlePriceChange = (field: "minPrice" | "maxPrice") => (value: string) => {
    if (field === "minPrice") {
      setMinPrice(value)
    } else {
      setMaxPrice(value)
    }

    const nextMin = field === "minPrice" ? value : minPrice
    const nextMax = field === "maxPrice" ? value : maxPrice
    const validation = computePriceErrors(nextMin, nextMax)

    setErrors((prev) => ({
      ...prev,
      ...(field === "minPrice"
        ? { minPrice: touched.minPrice ? validation.minPrice : undefined }
        : { maxPrice: touched.maxPrice ? validation.maxPrice : undefined }),
      ...(touched.minPrice && field === "maxPrice" ? { minPrice: validation.minPrice } : {}),
      ...(touched.maxPrice && field === "minPrice" ? { maxPrice: validation.maxPrice } : {}),
    }))
  }

  const handlePriceBlur = (field: "minPrice" | "maxPrice") => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))
    const validation = computePriceErrors(minPrice, maxPrice)
    setErrors(validation)
  }

  const handleAreaSelect = (area: string) => {
    if (area === "Custom") {
      setShowCustomAreaModal(true)
    } else {
      setSelectedArea(area)
      setCustomAreaError(undefined)
    }
  }

  const handleCustomAreaSave = () => {
    const trimmedValue = customAreaValue.trim()

    if (!trimmedValue) {
      setCustomAreaError("Area value is required")
      return
    }

    if (!Validation.isNumeric(trimmedValue)) {
      setCustomAreaError("Area value must be numeric")
      return
    }

    const customArea = `${trimmedValue} ${customAreaType}`
    setSelectedArea(customArea)
    setShowCustomAreaModal(false)
    setCustomAreaValue("")
    setCustomAreaType("Marla")
    setCustomAreaError(undefined)
  }

  const handleApplyFilters = () => {
    const validation = computePriceErrors(minPrice, maxPrice)
    setErrors(validation)
    setTouched({ minPrice: true, maxPrice: true })

    if (validation.minPrice || validation.maxPrice || customAreaError) {
      return
    }

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
    setMinPrice("")
    setMaxPrice("")
    // setFeatures({
    //   pole: false,
    //   wire: false,
    // })
    setCustomAreaValue("")
    setCustomAreaType("Marla")
    setErrors({})
    setTouched({ minPrice: false, maxPrice: false })
    setCustomAreaError(undefined)
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
                  // options={BLOCK_OPTIONS}
                  options={propertyType === "Commercial Plots" ? COMMERCIAL_BLOCKS : RESEDENTIAL_BLOCKS}
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
                    onChangeText={handlePriceChange("minPrice")}
                    onBlur={handlePriceBlur("minPrice")}
                    style={styles.priceInput}
                    keyboardType="decimal-pad"
                    error={touched.minPrice ? errors.minPrice : undefined}
                    // helperText={!errors.minPrice ? "PKR" : undefined}
                  />
                  <TextInput
                    placeholder="Max Price"
                    value={maxPrice}
                    onChangeText={handlePriceChange("maxPrice")}
                    onBlur={handlePriceBlur("maxPrice")}
                    style={styles.priceInput}
                    keyboardType="decimal-pad"
                    error={touched.maxPrice ? errors.maxPrice : undefined}
                    // helperText={!errors.maxPrice ? "PKR" : undefined}
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
              {/* <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Custom Area Modal */}
      <Modal
        visible={showCustomAreaModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setCustomAreaError(undefined)
          setShowCustomAreaModal(false)
        }}
      >
        <SafeAreaView style={styles.customModalSafeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.customModalKeyboardView}>
            <View style={styles.customModalOverlay}>
              <View style={styles.customModalContent}>
                {/* Header */}
                <View style={styles.customModalHeader}>
                  <Text style={styles.customModalTitle}>Custom Area</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setCustomAreaError(undefined)
                      setShowCustomAreaModal(false)
                    }}
                  >
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
                        onChangeText={(value) => {
                          setCustomAreaValue(value)
                          if (customAreaError) {
                            setCustomAreaError(undefined)
                          }
                        }}
                        keyboardType="decimal-pad"
                        style={styles.customAreaValueInput}
                        error={customAreaError}
                      />
                    </View>
                    <View style={styles.customAreaTypeContainer}>
                      <Text style={styles.customAreaLabel}>Type</Text>
                      <Dropdown
                        placeholder="Select type"
                        options={AREA_TYPE_OPTIONS}
                        value={customAreaType}
                        onValueChange={(value) => {
                          setCustomAreaType(value)
                          if (customAreaError) {
                            setCustomAreaError(undefined)
                          }
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.customModalFooter}>
                  <TouchableOpacity
                    style={styles.customModalCancelButton}
                    onPress={() => {
                      setCustomAreaError(undefined)
                      setShowCustomAreaModal(false)
                    }}
                  >
                    <Text style={styles.customModalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.customModalSaveButton,
                      (!customAreaValue.trim() || !customAreaType || Boolean(customAreaError)) && styles.customModalSaveButtonDisabled,
                    ]}
                    onPress={handleCustomAreaSave}
                    disabled={!customAreaValue.trim() || !customAreaType || Boolean(customAreaError)}
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
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: Colors.neutral100,
    fontFamily: fontFamilies.primary,
  },
  content: {
    padding: spacing.xxl
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    marginBottom: spacing.sm,
  },
  toggleButtonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  toggleButton: {
    // flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg2,
    backgroundColor: Colors.neutral10,
    borderWidth: 1,
    borderColor: Colors.neutral30,
    alignItems: "center",
  },
  activeToggleButton: {
    backgroundColor: Colors.neutral100,
    borderColor: Colors.neutral100,
  },
  toggleButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral100,
    fontFamily: fontFamilies.primary
  },
  activeToggleButtonText: {
    color: Colors.neutral10,
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
    fontSize: fontSizes.sm,
    color: Colors.neutral60,
    fontFamily: fontFamilies.primary
  },
  areaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  areaButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg2,
    backgroundColor: Colors.neutral10,
    borderWidth: 1,
    borderColor: Colors.neutral30,
    alignItems: "center",
  },
  activeAreaButton: {
    backgroundColor: Colors.neutral100,
    borderColor: Colors.neutral100,
  },
  areaButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral100,
    fontFamily: fontFamilies.primary
  },
  activeAreaButtonText: {
    color: Colors.neutral10,
  },
  priceRangeRow: {
    flexDirection: "row",
    gap: 12,
  },
  priceInput: {
    flex: 1,
    padding: spacing.sm2
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