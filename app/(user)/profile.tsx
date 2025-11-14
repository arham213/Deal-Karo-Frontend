"use client"

import { AvatarInitials } from "@/components/AvatarInitials"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { useAuthContext } from "@/contexts/AuthContext"
import { User } from "@/types/auth"
import { getUser } from "@/utils/secureStore"
import { Validation, type ValidationErrors } from "@/utils/validation"
import { useRouter } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ProfileScreen() {
  const router = useRouter()
  const { logout } = useAuthContext()
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
        if (!Validation.isPhone(trimmed)) return "Enter a valid phone number with country code"
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

  const handleSave = () => {
    if (!validateForm(editData)) {
      markAllTouched()
      return
    }
    setProfile(editData)
    setIsEditing(false)
    setErrors({})
    setTouched({
      name: false,
      email: false,
      contactNo: false,
      estateName: false,
    })
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
      alert("Failed to logout. Please try again.")
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{paddingBottom: 110}} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>My Profile</Text>
          </View>

          <View style={styles.avatarSection}>
            <AvatarInitials name={profile.name} size={80} />
          </View>

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
              <Button title="Save" onPress={handleSave} disabled={isSaveDisabled} />
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
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
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
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
  formSection: {
    gap: 20,
    paddingVertical: 16,
  },
  buttonGroup: {
    gap: 12,
    paddingVertical: 24,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  logoutButton: {
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: Colors.error,
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
})