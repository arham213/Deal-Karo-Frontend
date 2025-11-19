"use client"

import { AvatarInitials } from "@/components/AvatarInitials"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { useAuthContext } from "@/contexts/AuthContext"
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { User } from "@/types/auth"
import apiClient from "@/utils/axiosConfig"
import { getToken, getUser, saveUser } from "@/utils/secureStore"
import { showErrorToast, showLoadingToast, showSuccessToast } from "@/utils/toast"
import { Validation, type ValidationErrors } from "@/utils/validation"
import axios from "axios"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"

export default function ProfileScreen() {
  const router = useRouter()
  const { logout, setUser } = useAuthContext()
  type EditableProfileField = "name" | "email" | "contactNo" | "estateName"
  const [profile, setProfile] = useState<User>({
    _id: "",
    name: "",
    email: "",
    contactNo: "",
    estateName: "",
    verificationStatus: "pending",
    role: "dealer",
    createdAt: "",
    updatedAt: "",
  })

  const [editData, setEditData] = useState(profile)
  const [errors, setErrors] = useState<ValidationErrors<EditableProfileField>>({})
  const [touched, setTouched] = useState<Record<EditableProfileField, boolean>>({
    name: false,
    email: false,
    contactNo: false,
    estateName: false,
  })
  const [loading, setLoading] = useState(false)
  const [showUpdateButton, setShowUpdateButton] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const BASE_URL = 'https://deal-karo-backend.vercel.app/api';

  useEffect(() => {
    getUserFromSecureStore()
  }, [])

  const getUserFromSecureStore = async () => {
    const user = await getUser()
    //console.log('user:', user)
    if (user) {
      setProfile(user)
      setEditData(user)
      setShowUpdateButton(false)
    }
  }

  // Check if any field has changed
  const hasChanges = useMemo(() => {
    const cleanedEditContact = Validation.digitsOnly(editData.contactNo)
    const cleanedProfileContact = Validation.digitsOnly(profile.contactNo)
    
    return (
      editData.name.trim() !== profile.name.trim() ||
      editData.email.trim() !== profile.email.trim() ||
      cleanedEditContact !== cleanedProfileContact ||
      editData.estateName.trim() !== profile.estateName.trim()
    )
  }, [editData, profile])

  const validateField = (field: EditableProfileField, value: string) => {
    const trimmed = value.trim()
    switch (field) {
      case "name":
        if (!Validation.isRequired(trimmed)) return "Full name is required"
        if (!Validation.hasMinLength(trimmed, 3)) return "Full name must be at least 3 characters"
        return undefined
      case "email":
        if (!Validation.isRequired(trimmed)) return "Email is required"
        if (!Validation.isEmail(trimmed)) return "Enter a valid email address"
        return undefined
      case "contactNo":
        if (!Validation.isRequired(trimmed)) return "Contact number is required"
        if (!Validation.isPakistaniMobile11(trimmed)) return "Enter 11-digit Pakistani number (e.g. 03XXXXXXXXX)"
        return undefined
      case "estateName":
        if (!Validation.isRequired(trimmed)) return "Estate name is required"
        return undefined
      default:
        return undefined
    }
  }

  const markAllTouched = () => {
    setTouched({
      name: true,
      email: true,
      contactNo: true,
      estateName: true,
    })
  }

  const validateForm = (data: User) => {
    const newErrors: ValidationErrors<EditableProfileField> = {}
    ;(["name", "email", "contactNo", "estateName"] as EditableProfileField[]).forEach((field) => {
      const errorMessage = validateField(field, data[field] ?? "")
      if (errorMessage) newErrors[field] = errorMessage
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (key: EditableProfileField, value: string) => {
    if (key === "contactNo") {
      const digits = Validation.digitsOnly(value).slice(0, 11)
      setEditData((prev) => ({
        ...prev,
        [key]: digits,
      }))

      if (!touched.contactNo) {
        setTouched((prev) => ({ ...prev, contactNo: true }))
      }

      const errorMessage = validateField(key, digits)
      setErrors((prev) => {
        const next = { ...prev }
        if (errorMessage) next[key] = errorMessage
        else delete next[key]
        return next
      })
      return
    }

    setEditData((prev) => ({
      ...prev,
      [key]: value,
    }))

    if (touched[key]) {
      const errorMessage = validateField(key, value)
      setErrors((prev) => {
        const next = { ...prev }
        if (errorMessage) next[key] = errorMessage
        else delete next[key]
        return next
      })
    }
  }

  // Update showUpdateButton when hasChanges changes
  useEffect(() => {
    setShowUpdateButton(hasChanges)
  }, [hasChanges])

  const handleSave = async () => {
    if (!validateForm(editData)) {
      markAllTouched()
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      if (!token) {
        const { forceLogout } = await import("@/utils/forcedLogout")
        await forceLogout("You have been logged out. Please sign in again.")
        return
      }
      // Prepare data according to backend schema
      const cleanedContactNo = Validation.digitsOnly(editData.contactNo)
      const updateData: {
        _id: string
        name?: string
        email?: string
        contactNo?: string
        estateName?: string
      } = {
        _id: profile._id,
      }

      // Only include fields that have changed
      if (editData.name.trim() !== profile.name.trim()) {
        updateData.name = editData.name.trim()
      }
      if (editData.email.trim() !== profile.email.trim()) {
        updateData.email = editData.email.trim()
      }
      if (cleanedContactNo !== Validation.digitsOnly(profile.contactNo)) {
        updateData.contactNo = cleanedContactNo
      }
      if (editData.estateName.trim() !== profile.estateName.trim()) {
        updateData.estateName = editData.estateName.trim()
      }

      // Make API call
      const response = await apiClient.put(`/users/`, updateData)

      //console.log('response:', response.data)

      if (response.data?.success) {
        // Update local state with response data if available, otherwise use editData
        const updatedUser = response.data.data?.user || {
          ...editData,
          contactNo: cleanedContactNo,
        }

        // Update profile state
        setProfile(updatedUser)
        
        // Update secure store
        await saveUser(updatedUser)
        
        // Update AuthContext
        setUser(updatedUser)

        // Reset state
        setErrors({})
        setTouched({
          name: false,
          email: false,
          contactNo: false,
          estateName: false,
        })
        setShowUpdateButton(false)

        showSuccessToast("Profile updated successfully!")
      } else {
        // Restore original form state on failure
        setEditData(profile)
        setErrors({})
        setTouched({
          name: false,
          email: false,
          contactNo: false,
          estateName: false,
        })
        showErrorToast(response.data?.message || "Failed to update profile")
      }
    } catch (error: any) {
      // Check if it's an auth error - interceptors will handle logout
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || ""
        
        // Don't show error toast for auth errors - interceptors will handle logout
        if (status === 401 || status === 404) {
          // Check if it's a user not found error
          if (errorMessage.toLowerCase().includes("user not found")) {
            // Interceptor will handle logout, just return
            return
          }
          // Other 401/404 errors - interceptor will handle
          return
        }
      }
      
      // Restore original form state on failure
      setEditData(profile)
      setErrors({})
      setTouched({
        name: false,
        email: false,
        contactNo: false,
        estateName: false,
      })
      if (axios.isAxiosError(error)) {
        showErrorToast(error?.response?.data?.error?.message || "Failed to update profile. Please try again.")
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
    } finally {
      setLoading(false)
      setShowUpdateButton(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      showLoadingToast("Logging out...", "Please wait")
      
      // Use AuthContext logout which handles clearing data and navigation
      await logout()
      
      // Hide loading toast and show success toast
      Toast.hide()
      showSuccessToast("Logged out successfully!")
    } catch (error) {
      //console.error("Logout error:", error)
      Toast.hide()
      showErrorToast("Failed to logout. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleBlur = (field: EditableProfileField) => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))

    const errorMessage = validateField(field, editData[field] ?? "")
    setErrors((prev) => {
      const next = { ...prev }
      if (errorMessage) next[field] = errorMessage
      else delete next[field]
      return next
    })
  }

  const editableErrors = useMemo(
    () => (["name", "email", "contactNo", "estateName"] as EditableProfileField[]).some((field) => Boolean(validateField(field, editData[field] ?? ""))),
    [editData],
  )

  const isUpdateDisabled = !hasChanges || editableErrors || loading

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 110}} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>My Profile</Text>
            <View style={styles.avatarSection}>
              <AvatarInitials name={profile.name} size={80} />
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formSection}>
              <TextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={editData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                onBlur={handleBlur("name")}
                error={touched.name ? errors.name : undefined}
                editable={!loading && !isLoggingOut}
              />

              <TextInput
                label="Email"
                placeholder="Enter your email"
                value={editData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                onBlur={handleBlur("email")}
                keyboardType="email-address"
                autoCapitalize="none"
                error={touched.email ? errors.email : undefined}
                editable={!loading && !isLoggingOut}
              />

              <TextInput
                label="Contact Number"
                placeholder="Enter your contact number"
                value={editData.contactNo}
                onChangeText={(value) => handleInputChange("contactNo", value)}
                onBlur={handleBlur("contactNo")}
                keyboardType="phone-pad"
                maxLength={11}
                error={touched.contactNo ? errors.contactNo : undefined}
                editable={!loading && !isLoggingOut}
              />

              <TextInput
                label="Estate Name"
                placeholder="Enter your estate name"
                value={editData.estateName}
                onChangeText={(value) => handleInputChange("estateName", value)}
                onBlur={handleBlur("estateName")}
                error={touched.estateName ? errors.estateName : undefined}
                editable={!loading && !isLoggingOut}
              />
            </View>

            <View style={styles.buttonGroup}>
              {showUpdateButton && (
                <Button 
                  title={loading ? "Updating..." : "Update"} 
                  onPress={handleSave} 
                  disabled={isUpdateDisabled}
                  loading={loading}
                />
              )}
              <TouchableOpacity 
                style={[styles.logoutButton, (loading || isLoggingOut) && styles.logoutButtonDisabled]} 
                onPress={handleLogout}
                disabled={loading || isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.logoutButtonText}>Logout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.headerBackground,
  },
  header: {
    paddingVertical: spacing.screen,
    paddingHorizontal: spacing.screen,
    backgroundColor: Colors.neutral10,
    backdropFilter: "blur(2px)",
    borderBottomRightRadius: 48,
    borderBottomLeftRadius: 48,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.24,
    marginBottom: spacing.lg,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: spacing.screen,
    gap: 16,
  },
  avatarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  divider: {
    color: Colors.border,
  },
  removeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.error,
  },
  formContainer: {
    paddingHorizontal: spacing.screen,
  },
  formSection: {
    gap: 20,
    paddingVertical: spacing.screen,
  },
  buttonGroup: {
    gap: 12,
    paddingVertical: spacing.screen,
  },
  cancelButton: {
    paddingVertical: spacing.md2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.neutral20,
  },
  cancelButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral90,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.12,
  },
  logoutButton: {
    paddingVertical: spacing.md2,
    borderRadius: radius.pill,
    backgroundColor: Colors.error,
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.white,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.12,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
})