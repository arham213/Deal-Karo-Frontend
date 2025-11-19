"use client"

import { Button } from "@/components/Button"
import { Dropdown } from "@/components/Dropdown"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { COMMERCIAL_BLOCKS, PHASE_OPTIONS, RESEDENTIAL_BLOCKS } from "@/constants/listingOptions"
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { User } from "@/types/auth"
import { AreaSize, ListingType, PropertyType } from "@/types/listings"
import { getToken, getUser } from "@/utils/secureStore"
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/toast"
import { Validation, type ValidationErrors } from "@/utils/validation"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
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

import { SafeAreaView } from "react-native-safe-area-context"

interface AddListingState {
  propertyType: PropertyType
  listingType: ListingType
  plotNo: string
  houseNo: string
  block: string
  phase: string
  area: AreaSize
  additionalArea: string
  price: string
  pricePerMarla: string
  rentPerMonth: string
  installmentPerMonth: string
  installmentHalfYearly: string
  description: string
  contact: string
  hasPole: boolean
  hasWire: boolean
}

type ListingField =
  | "plotNo"
  | "houseNo"
  | "block"
  | "phase"
  | "area"
  | "additionalArea"
  | "price"
  | "pricePerMarla"
  | "installmentPerMonth"
  | "installmentHalfYearly"
  | "contact"

const FORM_FIELDS: ListingField[] = [
  "plotNo",
  "houseNo",
  "block",
  "phase",
  "area",
  "additionalArea",
  "price",
  "pricePerMarla",
  "installmentPerMonth",
  "installmentHalfYearly",
  "contact",
]

const createTouchedState = (value: boolean): Record<ListingField, boolean> =>
  FORM_FIELDS.reduce((acc, field) => {
    acc[field] = value
    return acc
  }, {} as Record<ListingField, boolean>)

export default function AddListingScreen() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddListingState>({
    propertyType: "plot",
    listingType: "cash",
    plotNo: "",
    houseNo: "",
    block: "",
    phase: "",
    area: "5 Marla",
    additionalArea: "",
    price: "",
    pricePerMarla: "",
    rentPerMonth: "",
    installmentPerMonth: "",
    installmentHalfYearly: "",
    description: "",
    contact: "",
    hasPole: false,
    hasWire: false,
  })
  const [showCustomAreaModal, setShowCustomAreaModal] = useState(false)
  const [customAreaValue, setCustomAreaValue] = useState("")
  const [customAreaType, setCustomAreaType] = useState<string>("Marla")
  const [customAreaError, setCustomAreaError] = useState<string | undefined>(undefined)
  const [errors, setErrors] = useState<ValidationErrors<ListingField>>({})
  const [touched, setTouched] = useState<Record<ListingField, boolean>>(createTouchedState(false))

  const AREA_TYPE_OPTIONS = ["Marla", "Kanal"]
  const BASE_URL = 'https://deal-karo-backend.vercel.app/api';

  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus()
  }, [])

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

  const isValidatableField = (key: keyof AddListingState): key is ListingField => {
    return (FORM_FIELDS as string[]).includes(key as string)
  }

  const validateField = (field: ListingField, value: string, state: AddListingState = formData) => {
    const trimmed = value.trim()
    switch (field) {
      case "plotNo":
        if (!(state.propertyType === "plot" || state.propertyType === "commercial plot")) return undefined
        if (!Validation.isRequired(trimmed)) return "Plot number is required"
        if (!Validation.isNumeric(trimmed)) return "Plot number must be numeric"
        return undefined
      case "houseNo":
        if (state.propertyType !== "house") return undefined
        if (!Validation.isRequired(trimmed)) return "House number is required"
        if (!Validation.isNumeric(trimmed)) return "House number must be numeric"
        return undefined
      case "block":
        if (!Validation.isRequired(trimmed)) return "Block is required"
        return undefined
      case "phase":
        if (!Validation.isRequired(trimmed)) return "Phase is required"
        return undefined
      case "area":
        if (!Validation.isRequired(value)) return "Area is required"
        if (value === "custom") return "Please specify the custom area"
        return undefined
      case "additionalArea":
        if (!trimmed) return undefined
        if (!Validation.isNumeric(trimmed)) return "Additional area must be numeric"
        return undefined
      case "price":
        if (!Validation.isRequired(trimmed)) return "Price is required"
        if (!Validation.isNumeric(trimmed)) return "Price must be numeric"
        if (Validation.toNumber(trimmed) <= 0) return "Price must be greater than 0"
        return undefined
      case "pricePerMarla":
        if (!((state.propertyType === "plot" || state.propertyType === "commercial plot") && state.listingType === "cash"))
          return undefined
        if (!Validation.isRequired(trimmed)) return "Price per marla is required"
        if (!Validation.isNumeric(trimmed)) return "Price per marla must be numeric"
        if (Validation.toNumber(trimmed) <= 0) return "Price per marla must be greater than 0"
        return undefined
      case "installmentPerMonth":
        if (state.listingType !== "installments") return undefined
        if (!Validation.isRequired(trimmed)) return "Monthly installment is required"
        if (!Validation.isNumeric(trimmed)) return "Monthly installment must be numeric"
        return undefined
      case "installmentHalfYearly":
        if (state.listingType !== "installments") return undefined
        if (!Validation.isRequired(trimmed)) return "Half Yearly installment is required"
        if (!Validation.isNumeric(trimmed)) return "Half Yearly installment must be numeric"
        return undefined
      case "contact":
        if (!Validation.isRequired(trimmed)) return "Contact number is required"
        if (!Validation.isPakistaniMobile11(trimmed)) return "Enter 11-digit Pakistani number (e.g. 03XXXXXXXXX)"
        return undefined
      default:
        return undefined
    }
  }

  const updateTouchedErrors = (state: AddListingState) => {
    setErrors((prev) => {
      const nextErrors = { ...prev }
      FORM_FIELDS.forEach((field) => {
        if (touched[field]) {
          const fieldValue = state[field] as string
          const errorMessage = validateField(field, fieldValue, state)
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

  const handleInputChange = (key: keyof AddListingState, value: string | boolean, options?: { forceValidate?: boolean }) => {
    if (key === "propertyType") {
      const propertyType = value as PropertyType
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

    if (key === "contact" && typeof value === "string") {
      const digits = Validation.digitsOnly(value).slice(0, 11)

      if (!touched.contact) {
        setTouched((prev) => ({ ...prev, contact: true }))
      }

      updateForm((prev) => ({
        ...prev,
        contact: digits,
      }))

      const nextState = { ...formData, contact: digits } as AddListingState
      const errorMessage = validateField("contact", digits, nextState)
      setErrors((prev) => {
        const nextErrors = { ...prev }
        if (errorMessage) nextErrors.contact = errorMessage
        else delete nextErrors.contact
        return nextErrors
      })
      return
    }

    if (key === "listingType") {
      const listingType = value as ListingType
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

    if (typeof value === "string" && isValidatableField(key) && (options?.forceValidate || touched[key])) {
      const nextState = {
        ...formData,
        [key]: value,
      } as AddListingState
      const errorMessage = validateField(key, value, nextState)
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
    const errorMessage = validateField(field, value, formData)
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

  const validateFormState = (state: AddListingState = formData) => {
    const newErrors: ValidationErrors<ListingField> = {}
    FORM_FIELDS.forEach((field) => {
      const value = (state[field] as unknown as string) || ""
      const errorMessage = validateField(field, value, state)
      if (errorMessage) {
        newErrors[field] = errorMessage
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const markAllTouched = () => {
    setTouched(createTouchedState(true))
  }

  const hasBlockingErrors = useMemo(
    () =>
      FORM_FIELDS.some((field) => {
        const value = (formData[field] as unknown as string) || ""
        return Boolean(validateField(field, value, formData))
      }),
    [formData],
  )

  const isSubmitDisabled = loading || hasBlockingErrors

  const handleAddListing = async () => {
    const isValid = validateFormState()
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

      const userData = {
        userId: user?._id,
        ...((formData.propertyType === "plot" || formData.propertyType === "commercial plot") ? { plotNo: formData.plotNo } : { houseNo: formData.houseNo }),
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        block: formData.block,
        phase: formData.phase,
        area: formData.area,
        additionalArea: formData.additionalArea,
        ...((formData.propertyType === "plot" || formData.propertyType === "commercial plot") && formData.listingType === "cash" && {
          pricePerMarla: formData.pricePerMarla,
        }),
        price: formData.price,
        // ...(formData.propertyType === "house" && formData.listingType === "rent" && {
        //   rentPerMonth: formData.rentPerMonth
        // }),
        ...(formData.listingType === "installments" && {
          installment: {
            perMonth: formData.installmentPerMonth,
            halfYearly: formData.installmentHalfYearly
          }
        }),
        description: formData.description,
        forContact: Validation.digitsOnly(formData.contact),
        // features: JSON.stringify({
        //   hasPole: formData.hasPole,
        //   hasWire: formData.hasWire
        // })
      }

      //console.log('userData:', userData);

      const response = await axios.post(`${BASE_URL}/properties`, userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      ////console.log('response:', response?.data);

      if (response?.data.success) {
        showSuccessToast("Listing added successfully");
        router.replace("/my-listings")
      } else {
        showErrorToast("Listing creation failed");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showErrorToast(error?.response?.data?.error?.message || "Listing creation failed");
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
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
                    />
                  </View>
                </>
              )}
            </>
          )}

          <View style={styles.section}>
            <TextInput
              label={ formData.propertyType === "plot" || formData.propertyType === "commercial plot" ? "Total Price" : "Price" }
              placeholder="25,000,000"
              value={formData.price}
              onChangeText={(value) => handleInputChange("price", value)}
              onBlur={handleFieldBlur("price")}
              keyboardType="decimal-pad"
              error={touched.price ? errors.price : undefined}
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

          {/* More Options */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionLabel}>More Options</Text>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Don't have a pole</Text>
              <Switch value={formData.hasPole} onValueChange={(value) => handleInputChange("hasPole", value)} />
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>No wire</Text>
              <Switch value={formData.hasWire} onValueChange={(value) => handleInputChange("hasWire", value)} />
            </View>
          </View> */}

          {/* Contact */}
          <View style={styles.section}>
            <TextInput
              label="For Contact"
              placeholder="03XXXXXXXXX"
              value={formData.contact}
              onChangeText={(value) => handleInputChange("contact", value)}
              onBlur={handleFieldBlur("contact")}
              keyboardType="phone-pad"
              maxLength={11}
              error={touched.contact ? errors.contact : undefined}
            />
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
})
