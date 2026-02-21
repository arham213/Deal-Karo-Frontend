"use client"

import { Button } from "@/components/Button"
import { Dropdown } from "@/components/Dropdown"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { COMMERCIAL_BLOCKS, PHASE_OPTIONS, RESEDENTIAL_BLOCKS } from "@/constants/listingOptions"
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { User } from "@/types/auth"
import { AreaSize } from "@/types/listings"
import { getToken, getUser } from "@/utils/secureStore"
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/toast"
import { Validation } from "@/utils/validation"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import axios from "axios"
import { Image as ExpoImage } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"

import { UploadIcon } from "@/components/listings/Icons"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  buildAddListingPayload,
  createAddListingTouchedState,
  createInitialAddListingState,
  createListing,
  FORM_FIELDS,
  getTotalPrice,
  hasBlockingListingErrors,
  isValidatableListingField,
  validateAddListingForm,
  validateListingField,
  type AddListingErrors,
  type AddListingState,
  type ListingField,
} from "../../packages/utils/listings/addListing"

export default function AddListingScreen() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddListingState>(createInitialAddListingState)
  const [showCustomAreaModal, setShowCustomAreaModal] = useState(false)
  const [showImagePickerModal, setShowImagePickerModal] = useState(false)
  const [customAreaValue, setCustomAreaValue] = useState("")
  const [customAreaType, setCustomAreaType] = useState<string>("Marla")
  const [customAreaError, setCustomAreaError] = useState<string | undefined>(undefined)
  const [errors, setErrors] = useState<AddListingErrors>({})
  const [touched, setTouched] = useState<Record<ListingField, boolean>>(
    createAddListingTouchedState(false),
  )

  const AREA_TYPE_OPTIONS = ["Marla", "Kanal"]
  const BASE_URL = 'https://deal-karo-backend-production.up.railway.app/api';

  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus()
  }, [])

  // Auto-calculate price for plots/commercial plots when pricePerMarla, area, or additionalArea changes
  useEffect(() => {
    const isPlotOrCommercialPlot = formData.propertyType === "plot" || formData.propertyType === "commercial plot"
    const isCashListing = formData.listingType === "cash"

    if (isPlotOrCommercialPlot && isCashListing) {
      if (formData.pricePerMarla && formData.area) {
        // Calculate and update price
        const calculatedPrice = getTotalPrice(formData.pricePerMarla, formData.area, formData.additionalArea || "")
        const nextState = {
          ...formData,
          price: calculatedPrice,
        }

        updateForm((prev) => ({
          ...prev,
          price: calculatedPrice,
        }))

        // Mark price as touched if pricePerMarla or area has been touched (so validation runs)
        const shouldValidatePrice = touched.pricePerMarla || touched.area
        if (shouldValidatePrice && !touched.price) {
          setTouched((prev) => ({
            ...prev,
            price: true,
          }))
        }

        // Validate the calculated price if relevant fields have been touched
        if (shouldValidatePrice || touched.price) {
          const errorMessage = validateListingField("price", calculatedPrice, nextState)
          setErrors((prev) => {
            const nextErrors = { ...prev }
            if (errorMessage) {
              nextErrors.price = errorMessage
            } else {
              delete nextErrors.price
            }
            return nextErrors
          })
        }
      } else if (touched.pricePerMarla || touched.area) {
        // If pricePerMarla or area is cleared but was previously touched, clear price error
        // (price will remain as last calculated value, but error should be cleared if fields are empty)
        if (!formData.pricePerMarla || !formData.area) {
          setErrors((prev) => {
            const nextErrors = { ...prev }
            delete nextErrors.price
            return nextErrors
          })
        }
      }
    }
  }, [formData.pricePerMarla, formData.area, formData.additionalArea, formData.propertyType, formData.listingType, touched.pricePerMarla, touched.area])

  const checkVerificationStatus = async () => {
    try {
      setLoadingUser(true)
      const token = await getToken()
      if (!token) {
        const { forceLogout } = await import("@/utils/forcedLogout")
        await forceLogout("You have been logged out. Please sign in again.")
        return
      }

      const response = await axios.get(`${BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        const userData = response.data.data.user
        setUser(userData)

        // Redirect to listings if not verified
        if (userData.verificationStatus !== "verified") {
          showInfoToast(
            "Your account needs to be verified by an admin to add listings. Please wait for verification or contact support.",
            "Access Restricted"
          )
          setTimeout(() => {
            router.replace("/listings")
          }, 2000)
          return
        }
      }
    } catch (error) {
      //console.error("Error checking verification status:", error)
      // Check if it's a user not found or auth error
      if (axios.isAxiosError(error)) {
        const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || ""
        const status = error.response?.status
        if (status === 401 || status === 404 || errorMessage.toLowerCase().includes("user not found")) {
          const { forceLogout } = await import("@/utils/forcedLogout")
          await forceLogout("You have been logged out. Please sign in again.")
          return
        }
      }
      router.replace("/listings")
    } finally {
      setLoadingUser(false)
    }
  }

  const updateTouchedErrors = (state: AddListingState) => {
    setErrors((prev) => {
      const nextErrors = { ...prev }
      FORM_FIELDS.forEach((field) => {
        if (touched[field]) {
          const fieldValue = state[field] as string
          const errorMessage = validateListingField(field, fieldValue, state)
          if (errorMessage) {
            nextErrors[field] = errorMessage
          } else {
            delete nextErrors[field]
          }
        }
      })
      return nextErrors
    })
  }

  const updateForm = (updater: (prev: AddListingState) => AddListingState) => {
    setFormData((prev) => {
      const next = updater(prev)
      updateTouchedErrors(next)
      return next
    })
  }

  const handleInputChange = (key: keyof AddListingState, value: string | boolean | null, options?: { forceValidate?: boolean }) => {
    if (key === "propertyType") {
      const propertyType = value as AddListingState["propertyType"]
      updateForm((prev) => {
        const next: AddListingState = {
          ...prev,
          propertyType,
          listingType: "cash",
          plotNo: propertyType === "plot" || propertyType === "commercial plot" ? prev.plotNo : "",
          houseNo: propertyType === "house" ? prev.houseNo : "",
          pricePerMarla: propertyType === "plot" || propertyType === "commercial plot" ? prev.pricePerMarla : "",
          installmentPerMonth: "",
          installmentHalfYearly: "",
        }
        return next
      })
      return
    }

    if (key === "listingType") {
      const listingType = value as AddListingState["listingType"]
      updateForm((prev) => ({
        ...prev,
        listingType,
        installmentPerMonth: listingType === "installments" ? prev.installmentPerMonth : "",
        installmentHalfYearly: listingType === "installments" ? prev.installmentHalfYearly : "",
        pricePerMarla:
          prev.propertyType === "plot" || prev.propertyType === "commercial plot"
            ? prev.pricePerMarla
            : "",
      }))
      return
    }

    updateForm((prev) => ({
      ...prev,
      [key]: value,
    }))

    if (
      typeof value === "string" &&
      isValidatableListingField(key) &&
      (options?.forceValidate || touched[key])
    ) {
      const nextState = {
        ...formData,
        [key]: value,
      } as AddListingState
      const errorMessage = validateListingField(key, value, nextState)
      setErrors((prev) => {
        const nextErrors = { ...prev }
        if (errorMessage) {
          nextErrors[key] = errorMessage
        } else {
          delete nextErrors[key]
        }
        return nextErrors
      })
    }
  }

  const handleFieldBlur = (field: ListingField) => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))

    const value = (formData[field] as unknown as string) || ""
    const errorMessage = validateListingField(field, value, formData)
    setErrors((prev) => {
      const nextErrors = { ...prev }
      if (errorMessage) {
        nextErrors[field] = errorMessage
      } else {
        delete nextErrors[field]
      }
      return nextErrors
    })
  }

  const markAllTouched = () => {
    setTouched(createAddListingTouchedState(true))
  }

  const hasBlockingErrors = useMemo(
    () => hasBlockingListingErrors(formData),
    [formData],
  )

  const isSubmitDisabled = loading || hasBlockingErrors

  const handleAddListing = async () => {
    const { isValid, errors: validationErrors } = validateAddListingForm(formData)
    setErrors(validationErrors)
    if (!isValid) {
      markAllTouched()
      return
    }

    setLoading(true)
    try {
      const user: User = await getUser();
      const token = await getToken();

      if (!token) {
        const { forceLogout } = await import("@/utils/forcedLogout")
        await forceLogout("You have been logged out. Please sign in again.")
        throw new Error("Token missing. Please log in again.")
      }
      if (!user) {
        const { forceLogout } = await import("@/utils/forcedLogout")
        await forceLogout("User information missing. Please sign in again.")
        throw new Error("User not found in storage.")
      }

      const payload = buildAddListingPayload(formData, user)

      await createListing({
        token,
        payload,
        baseUrl: BASE_URL,
      })

      showSuccessToast("Listing added successfully")
      router.replace("/my-listings")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again later"
      showErrorToast(message)
    } finally {
      setLoading(false)
    }
  }

  const areaSizes: AreaSize[] = ["3 Marla", "5 Marla", "10 Marla", "15 Marla", "1 Kanal", "custom"]

  const handleAreaSelect = (size: AreaSize) => {
    setTouched((prev) => ({
      ...prev,
      area: true,
    }))
    if (size === "custom") {
      setCustomAreaError(undefined)
      setShowCustomAreaModal(true)
    } else {
      handleInputChange("area", size, { forceValidate: true })
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
    const customArea = `${trimmedValue} ${customAreaType}` as AreaSize
    setTouched((prev) => ({
      ...prev,
      area: true,
    }))
    handleInputChange("area", customArea, { forceValidate: true })
    setCustomAreaError(undefined)
    setShowCustomAreaModal(false)
    setCustomAreaValue("")
    setCustomAreaType("Marla")
  }

  const pickImageFromLibrary = async () => {
    setShowImagePickerModal(false)

    // iOS requires explicit permission request before accessing the photo library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showErrorToast('Photo library permission is required to upload images')
      return
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    })

    if (!result.canceled) {
      handleInputChange("image", result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    setShowImagePickerModal(false)
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    if (status !== 'granted') {
      showErrorToast('Camera permission is required to take photos')
      return
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    })

    if (!result.canceled) {
      handleInputChange("image", result.assets[0].uri)
    }
  }

  // Show loading while checking verification
  if (loadingUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Don't render if user is not verified (will redirect)
  if (user?.verificationStatus !== "verified") {
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Listing</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Property Type Tabs */}
          <View style={styles.section}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.propertyTab, formData.propertyType === "plot" && styles.activePropertyTab]}
                onPress={() => handleInputChange("propertyType", "plot")}
              >
                <Text
                  style={[styles.propertyTabText, formData.propertyType === "plot" && styles.activePropertyTabText]}
                >
                  Plot
                </Text>
              </TouchableOpacity>
              {/* <View style={styles.tabDivider} /> */}
              <TouchableOpacity
                style={[styles.propertyTab, formData.propertyType === "house" && styles.activePropertyTab]}
                onPress={() => handleInputChange("propertyType", "house")}
              >
                <Text
                  style={[styles.propertyTabText, formData.propertyType === "house" && styles.activePropertyTabText]}
                >
                  House
                </Text>
              </TouchableOpacity>
              {/* <View style={styles.tabDivider} /> */}
              <TouchableOpacity
                style={[styles.propertyTab, formData.propertyType === "commercial plot" && styles.activePropertyTab]}
                onPress={() => handleInputChange("propertyType", "commercial plot")}
              >
                <Text
                  style={[styles.propertyTabText, formData.propertyType === "commercial plot" && styles.activePropertyTabText]}
                >
                  Commercial plot
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* What is it for? */}
          {formData.propertyType !== "house" && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What it is for?</Text>
              <View style={styles.listingTypeContainer}>
                <TouchableOpacity
                  style={[styles.listingTypeButton, formData.listingType === "cash" && styles.activeListingType]}
                  onPress={() => handleInputChange("listingType", "cash")}
                >
                  <Text style={[styles.listingTypeText, formData.listingType === "cash" && styles.activeListingTypeText]}>
                    Cash
                  </Text>
                </TouchableOpacity>
                {/* {formData.propertyType === "house" && (
                  <TouchableOpacity
                    style={[styles.listingTypeButton, formData.listingType === "rent" && styles.activeListingType]}
                    onPress={() => handleInputChange("listingType", "rent")}
                  >
                    <Text style={[styles.listingTypeText, formData.listingType === "rent" && styles.activeListingTypeText]}>
                      Rent
                    </Text>
                  </TouchableOpacity>
                )} */}
                <TouchableOpacity
                  style={[styles.listingTypeButton, formData.listingType === "installments" && styles.activeListingType]}
                  onPress={() => handleInputChange("listingType", "installments")}
                >
                  <Text
                    style={[
                      styles.listingTypeText,
                      formData.listingType === "installments" && styles.activeListingTypeText,
                    ]}
                  >
                    Installments
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* PlotNo/House No */}
          {(formData.propertyType === "plot" || formData.propertyType === "commercial plot") && (
            <View style={styles.section}>
              <TextInput
                label="Plot No"
                placeholder="Eg., 101"
                value={formData.plotNo}
                onChangeText={(value) => handleInputChange("plotNo", value)}
                onBlur={handleFieldBlur("plotNo")}
                keyboardType="decimal-pad"
                error={touched.plotNo ? errors.plotNo : undefined}
              />
            </View>
          )}

          {formData.propertyType === "house" && (
            <View style={styles.section}>
              <TextInput
                label="House No"
                placeholder="Eg., 101"
                value={formData.houseNo}
                onChangeText={(value) => handleInputChange("houseNo", value)}
                onBlur={handleFieldBlur("houseNo")}
                keyboardType="decimal-pad"
                error={touched.houseNo ? errors.houseNo : undefined}
              />
            </View>
          )}

          {/* Image Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Image</Text>
            {formData.image ? (
              <View>
                <View style={styles.imagePreviewContainer}>
                  <ExpoImage source={{ uri: formData.image }} style={styles.image} contentFit="cover" />
                </View>
                <TouchableOpacity onPress={() => handleInputChange("image", null)} style={styles.removeImageButton}>
                  <Text style={styles.removeImageText}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowImagePickerModal(true)} activeOpacity={0.7}>
                <View style={styles.uploadArea}>
                  <UploadIcon color={Colors.neutral60} size={32} />
                  <Text style={styles.uploadText}>Upload Image</Text>
                  <Text style={styles.uploadSubtext}>File under 5 mb should be uploaded. pdf, jpg supported.</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Phase */}
          <View style={styles.section}>
            <Dropdown
              label="Phase"
              placeholder="Select Phase"
              options={PHASE_OPTIONS}
              value={formData.phase}
              onValueChange={(value) => {
                setTouched((prev) => ({ ...prev, phase: true }))
                handleInputChange("phase", value, { forceValidate: true })
              }}
              error={touched.phase ? errors.phase : undefined}
            />
          </View>

          {/* Block */}
          <View style={styles.section}>
            <Dropdown
              label="Block"
              placeholder="Select Block"
              options={formData.propertyType === "commercial plot" ? COMMERCIAL_BLOCKS : RESEDENTIAL_BLOCKS}
              value={formData.block}
              onValueChange={(value) => {
                setTouched((prev) => ({ ...prev, block: true }))
                handleInputChange("block", value, { forceValidate: true })
              }}
              error={touched.block ? errors.block : undefined}
            />
          </View>

          {/* Area */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Area</Text>
            <View style={styles.areaGrid}>
              {areaSizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.areaButton, formData.area === size && styles.activeAreaButton]}
                  onPress={() => handleAreaSelect(size)}
                >
                  <Text style={[styles.areaButtonText, formData.area === size && styles.activeAreaButtonText]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Show custom area if selected */}
            {formData.area && formData.area !== "custom" && !areaSizes.slice(0, -1).includes(formData.area) && (
              <View style={styles.customAreaDisplay}>
                <Text style={styles.customAreaText}>Selected: {formData.area}</Text>
                <TouchableOpacity onPress={() => {
                  // Extract value and type from selected area
                  const parts = formData.area.split(" ")
                  if (parts.length >= 2) {
                    setCustomAreaValue(parts[0])
                    setCustomAreaType(parts.slice(1).join(" "))
                  }
                  setCustomAreaError(undefined)
                  setShowCustomAreaModal(true)
                }}>
                  <Text style={styles.editCustomAreaText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
            {touched.area && errors.area && <Text style={styles.errorText}>{errors.area}</Text>}
          </View>

          {/* Additional Area */}
          <View style={styles.section}>
            <TextInput
              label="Additional Area (Sq/ft)"
              placeholder="E.g., 500"
              value={formData.additionalArea}
              onChangeText={(value) => handleInputChange("additionalArea", value)}
              onBlur={handleFieldBlur("additionalArea")}
              keyboardType="decimal-pad"
              error={touched.additionalArea ? errors.additionalArea : undefined}
            />
          </View>

          {/* Price/Rent - Sale Type */}
          {formData.listingType === "cash" && (
            <>
              {(formData.propertyType === "plot" || formData.propertyType === "commercial plot") && (
                <>
                  <View style={styles.section}>
                    <TextInput
                      label="Price Per Marla"
                      placeholder="2,50,000"
                      value={formData.pricePerMarla}
                      onChangeText={(value) => handleInputChange("pricePerMarla", value)}
                      onBlur={handleFieldBlur("pricePerMarla")}
                      keyboardType="decimal-pad"
                      error={touched.pricePerMarla ? errors.pricePerMarla : undefined}
                      autoCorrect={false}
                    />
                  </View>
                </>
              )}
            </>
          )}

          <View style={styles.section}>
            <TextInput
              label={formData.propertyType === "plot" || formData.propertyType === "commercial plot" ? "Total Price" : "Price"}
              placeholder="25,000,000"
              value={(formData.propertyType === "plot" || formData.propertyType === "commercial plot") && formData.listingType === "cash" && formData.pricePerMarla && formData.area ? getTotalPrice(formData.pricePerMarla, formData.area, formData.additionalArea || "").toString() : formData.price}
              onChangeText={(value) => {
                // Only allow manual editing if price is not auto-calculated
                const isAutoCalculated = (formData.propertyType === "plot" || formData.propertyType === "commercial plot") && formData.listingType === "cash" && formData.pricePerMarla && formData.area
                if (!isAutoCalculated) {
                  handleInputChange("price", value)
                }
              }}
              onBlur={handleFieldBlur("price")}
              keyboardType="decimal-pad"
              error={touched.price ? errors.price : undefined}
              autoCorrect={false}
              autoComplete="off"
              editable={!((formData.propertyType === "plot" || formData.propertyType === "commercial plot") && formData.listingType === "cash" && formData.pricePerMarla && formData.area)}
            />
          </View>

          {/* Rent Type */}
          {/* {formData.listingType === "rent" && (
            <View style={styles.section}>
              <TextInput
                label="Rent per month"
                placeholder="25,000"
                value={formData.rentPerMonth}
                onChangeText={(value) => handleInputChange("rentPerMonth", value)}
                keyboardType="decimal-pad"
              />
            </View>
          )} */}

          {/* Installment Type */}
          {formData.listingType === "installments" && (
            <>
              <View style={styles.section}>
                <TextInput
                  label="Installment Per Month"
                  placeholder="60,000"
                  value={formData.installmentPerMonth}
                  onChangeText={(value) => handleInputChange("installmentPerMonth", value)}
                  onBlur={handleFieldBlur("installmentPerMonth")}
                  keyboardType="decimal-pad"
                  error={touched.installmentPerMonth ? errors.installmentPerMonth : undefined}
                />
              </View>
              <View style={styles.section}>
                <TextInput
                  label="Installment Half Yearly"
                  placeholder="160,000"
                  value={formData.installmentHalfYearly}
                  onChangeText={(value) => handleInputChange("installmentHalfYearly", value)}
                  onBlur={handleFieldBlur("installmentHalfYearly")}
                  keyboardType="decimal-pad"
                  error={touched.installmentHalfYearly ? errors.installmentHalfYearly : undefined}
                />
              </View>
            </>
          )}

          {/* Description */}
          <View style={styles.section}>
            <TextInput
              label="Description"
              placeholder="Type a short description (Optional)"
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              multiline
            />
          </View>

          {/* Possession */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Possession</Text>
            <View style={styles.radioGroup}>

              {/* Radio Button Option: Yes */}
              <TouchableOpacity
                style={styles.radioOption}
                // Set the value to 'Yes' when this button is pressed
                onPress={() => handleInputChange("possession", "Yes")}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  // If formData.possession is 'Yes', show the filled radio button icon
                  name={formData.possession === "Yes" ? "radio-button-checked" : "radio-button-unchecked"}
                  size={24}
                  color={formData.possession === 'Yes' ? Colors.primary : Colors.neutral60} // Use your theme colors
                />
                <Text style={[styles.radioLabel, formData.possession === 'Yes' && styles.activeRadioLabel]}>Yes</Text>
              </TouchableOpacity>

              {/* Radio Button Option: No */}
              <TouchableOpacity
                style={styles.radioOption}
                // Set the value to 'No' when this button is pressed
                onPress={() => handleInputChange("possession", 'No')}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  // If formData.possession is 'No', show the filled radio button icon
                  name={formData.possession === 'No' ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={24}
                  color={formData.possession === 'No' ? Colors.primary : Colors.neutral60} // Use your theme colors
                />
                <Text style={styles.radioLabel}>No</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            <Button title="Add" onPress={handleAddListing} loading={loading} disabled={isSubmitDisabled} />
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
                        error={customAreaError}
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

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.imagePickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
        >
          <View style={styles.imagePickerModalContent} onStartShouldSetResponder={() => true}>
            <TouchableOpacity onPress={pickImageFromLibrary} style={styles.imagePickerOption}>
              <Text style={styles.imagePickerOptionText}>Photo Library</Text>
              <Ionicons name="image-outline" size={24} color={Colors.neutral90} />
            </TouchableOpacity>
            <View style={styles.imagePickerDivider} />
            <TouchableOpacity onPress={takePhoto} style={styles.imagePickerOption}>
              <Text style={styles.imagePickerOptionText}>Take Photo</Text>
              <Ionicons name="camera-outline" size={24} color={Colors.neutral90} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.24
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    marginBottom: spacing.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 30, // Spacing between 'Yes' and 'No' radio buttons
    paddingVertical: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  activeRadioLabel: {
    color: Colors.primary,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    overflow: "hidden",
  },
  propertyTab: {
    flex: 1,
    paddingVertical: spacing.sm2,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: Colors.neutral60,
  },
  activePropertyTab: {
    borderBottomColor: Colors.neutral100,
  },
  propertyTabText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: Colors.neutral60,
    fontFamily: fontFamilies.primary,
    textAlign: "center"
  },
  activePropertyTabText: {
    color: Colors.neutral100,
  },
  tabDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  listingTypeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  listingTypeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg2,
    backgroundColor: Colors.neutral10,
    borderWidth: 1,
    borderColor: Colors.neutral30,
    alignItems: "center",
  },
  activeListingType: {
    backgroundColor: Colors.neutral100,
    borderColor: Colors.neutral100,
  },
  listingTypeText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral100,
    fontFamily: fontFamilies.primary
  },
  activeListingTypeText: {
    color: Colors.neutral10,
  },
  areaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  areaButton: {
    // width: "48%",
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
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.error,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 40,
  },
  cancelButton: {
    paddingVertical: spacing.md2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: Colors.neutral50,
    alignItems: "center",
    backgroundColor: Colors.neutral20,
  },
  cancelButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    color: Colors.neutral90,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  uploadArea: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: radius.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "#e9e9e9",
    borderStyle: "dashed",
  },
  uploadText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: Colors.neutral100,
    fontFamily: fontFamilies.primary,
    marginTop: spacing.sm,
  },
  uploadSubtext: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    color: Colors.neutral90,
    fontFamily: fontFamilies.primary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  imagePickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  imagePickerModalContent: {
    backgroundColor: Colors.neutral10,
    borderRadius: radius.lg,
    width: "90%",
    maxWidth: 400,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  imagePickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: Colors.neutral10,
  },
  imagePickerOptionText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: Colors.neutral90,
    fontFamily: fontFamilies.primary,
  },
  imagePickerDivider: {
    height: 1,
    backgroundColor: Colors.neutral30,
  },
  imagePreviewContainer: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.neutral10,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.neutral20,
    marginTop: spacing.sm,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    marginTop: spacing.sm,
    alignItems: "center",
    padding: spacing.xs,
  },
  removeImageText: {
    color: Colors.error,
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.medium,
  },
})
