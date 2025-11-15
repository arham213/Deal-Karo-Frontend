"use client"

import { AvatarInitials } from "@/components/AvatarInitials"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { useAuthContext } from "@/contexts/AuthContext"
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { User } from "@/types/auth"
import { getToken, getUser, saveUser } from "@/utils/secureStore"
import { showErrorToast, showSuccessToast } from "@/utils/toast"
import { Validation, type ValidationErrors } from "@/utils/validation"
import axios from "axios"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

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

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(profile)
  const [errors, setErrors] = useState<ValidationErrors<EditableProfileField>>({})
  const [touched, setTouched] = useState<Record<EditableProfileField, boolean>>({
    name: false,
    email: false,
    contactNo: false,
    estateName: false,
  })
  const [loading, setLoading] = useState(false)

  const BASE_URL = 'http://10.190.83.91:8080/api';

  useEffect(() => {
    getUserFromSecureStore()
  }, [])

  const getUserFromSecureStore = async () => {
    const user = await getUser()
    console.log('user:', user)
    if (user) {
      setProfile(user)
      setEditData(user)
    }
  }

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
        // Backend expects 10-15 digits only (no country code, spaces, or special characters)
        const cleanedContact = trimmed.replace(/[^\d]/g, "")
        if (!/^[0-9]{10,15}$/.test(cleanedContact)) return "Contact number must be 10–15 digits"
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
    if (!isEditing) return
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

  const handleSave = async () => {
    if (!validateForm(editData)) {
      markAllTouched()
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      if (!token) {
        router.replace("/(auth)/sign-in")
        return
      }
      // Prepare data according to backend schema
      const cleanedContactNo = editData.contactNo.replace(/[^\d]/g, "")
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
      if (cleanedContactNo !== profile.contactNo.replace(/[^\d]/g, "")) {
        updateData.contactNo = cleanedContactNo
      }
      if (editData.estateName.trim() !== profile.estateName.trim()) {
        updateData.estateName = editData.estateName.trim()
      }

      // Make API call
      const response = await axios.put(`${BASE_URL}/users/`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      console.log('response:', response.data)

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

        // Reset editing state
        setIsEditing(false)
        setErrors({})
        setTouched({
          name: false,
          email: false,
          contactNo: false,
          estateName: false,
        })

        showSuccessToast("Profile updated successfully!")
      } else {
        showErrorToast(response.data?.message || "Failed to update profile")
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        showErrorToast(error?.response?.data?.error?.message || "Failed to update profile. Please try again.")
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditData(profile)
    setIsEditing(false)
    setErrors({})
    setTouched({
      name: false,
      email: false,
      contactNo: false,
      estateName: false,
    })
  }

  const handleLogout = async () => {
    try {
      // Use AuthContext logout which handles clearing data and navigation
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
      showErrorToast("Failed to logout. Please try again.")
    }
  }

  const handleBlur = (field: EditableProfileField) => () => {
    if (!isEditing) return
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

  const isSaveDisabled = !isEditing || editableErrors

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
                value={isEditing ? editData.name : profile.name}
                onChangeText={(value) => handleInputChange("name", value)}
                onBlur={handleBlur("name")}
                error={isEditing && touched.name ? errors.name : undefined}
                editable={isEditing}
              />

              <TextInput
                label="Email"
                placeholder="Enter your email"
                value={isEditing ? editData.email : profile.email}
                onChangeText={(value) => handleInputChange("email", value)}
                onBlur={handleBlur("email")}
                keyboardType="email-address"
                autoCapitalize="none"
                error={isEditing && touched.email ? errors.email : undefined}
                editable={isEditing}
              />

              <TextInput
                label="Contact Number"
                placeholder="Enter your contact number"
                value={isEditing ? editData.contactNo : profile.contactNo}
                onChangeText={(value) => handleInputChange("contactNo", value)}
                onBlur={handleBlur("contactNo")}
                editable={isEditing}
                keyboardType="phone-pad"
                error={isEditing && touched.contactNo ? errors.contactNo : undefined}
              />

              <TextInput
                label="Estate Name"
                placeholder="Enter your estate name"
                value={isEditing ? editData.estateName : profile.estateName}
                onChangeText={(value) => handleInputChange("estateName", value)}
                onBlur={handleBlur("estateName")}
                error={isEditing && touched.estateName ? errors.estateName : undefined}
                editable={isEditing}
              />
            </View>

            {isEditing ? (
              <View style={styles.buttonGroup}>
                <Button 
                  title={loading ? "Saving..." : "Save"} 
                  onPress={handleSave} 
                  disabled={isSaveDisabled || loading}
                />
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                )}
                <TouchableOpacity 
                  style={[styles.cancelButton, loading && styles.cancelButtonDisabled]} 
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonGroup}>
                <Button
                  title="Update"
                  onPress={() => {
                    setEditData(profile)
                    setErrors({})
                    setTouched({
                      name: false,
                      email: false,
                      contactNo: false,
                      estateName: false,
                    })
                    setIsEditing(true)
                  }}
                />
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
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
})