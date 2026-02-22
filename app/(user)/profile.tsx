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
import { Validation } from "@/utils/validation"
import axios from "axios"
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
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import {
  buildProfileUpdatePayload,
  hasProfileChanges,
  validateProfileField,
  validateProfileForm,
  type EditableProfileField,
  type ProfileErrors,
} from "../../packages/utils/auth/profile"

export default function ProfileScreen() {
  const router = useRouter()
  const { logout, setUser } = useAuthContext()
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
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [touched, setTouched] = useState<Record<EditableProfileField, boolean>>({
    name: false,
    email: false,
    contactNo: false,
    estateName: false,
  })
  const [loading, setLoading] = useState(false)
  const [showUpdateButton, setShowUpdateButton] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showImagePickerModal, setShowImagePickerModal] = useState(false)
  const [localProfileImage, setLocalProfileImage] = useState<string | null>(null)
  const [pendingImageChange, setPendingImageChange] = useState<'add' | 'remove' | null>(null)

  const BASE_URL = 'http://10.103.65.91:8080/api';

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

  // Check if any field has changed (including profile image)
  const hasChanges = useMemo(
    () => hasProfileChanges(profile, editData) || pendingImageChange !== null,
    [editData, profile, pendingImageChange],
  )

  const markAllTouched = () => {
    setTouched({
      name: true,
      email: true,
      contactNo: true,
      estateName: true,
    })
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

      const errorMessage = validateProfileField(key, digits)
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
      const errorMessage = validateProfileField(key, value)
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
    const { isValid, errors: validationErrors } = validateProfileForm(editData)
    setErrors(validationErrors)
    if (!isValid) {
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
      // Prepare data according to backend schema (only changed fields)
      const updateData = buildProfileUpdatePayload(profile, editData)

      // Upload profile image if there's a pending change
      if (pendingImageChange === 'add' && localProfileImage) {
        const imageSuccess = await uploadProfileImage(localProfileImage)
        if (!imageSuccess) {
          // If image upload fails, don't proceed with profile update
          setLoading(false)
          return
        }
      } else if (pendingImageChange === 'remove') {
        const removeSuccess = await deleteProfileImage()
        if (!removeSuccess) {
          setLoading(false)
          return
        }
      }

      // Only make profile update API call if there are other changes
      if (Object.keys(updateData).length > 0) {
        // Make API call
        const response = await apiClient.put(`/users/`, updateData)

        //console.log('response:', response.data)

        if (response.data?.success) {
          // Update local state with response data if available, otherwise use editData
          const updatedUser = response.data.data?.user || {
            ...editData,
            contactNo: Validation.digitsOnly(editData.contactNo),
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
          setPendingImageChange(null)
          setLocalProfileImage(null)

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
          setLocalProfileImage(null)
          setPendingImageChange(null)
          showErrorToast(response.data?.message || "Failed to update profile. Please try again.")
        }
      } else {
        // No profile field changes, just image was updated
        setErrors({})
        setTouched({
          name: false,
          email: false,
          contactNo: false,
          estateName: false,
        })
        setShowUpdateButton(false)
        setPendingImageChange(null)
        setLocalProfileImage(null)
        showSuccessToast("Profile updated successfully!")
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

  const handleDeleteAccount = async () => {
    console.log("handleDeleteAccount")
    try {
      setIsDeleting(true)

      const token = await getToken()
      if (!token) {
        const { forceLogout } = await import("@/utils/forcedLogout")
        await forceLogout("You have been logged out. Please sign in again.")
        return
      }

      console.log('sending request to delete account')

      // Make API call to delete account
      const response = await apiClient.delete(`/users/delete-account`)

      if (response.data?.success) {
        // Close modal
        setShowDeleteModal(false)

        // Show success toast before logout
        showSuccessToast("Account deleted successfully!")

        // Use AuthContext logout which handles clearing data and navigation
        await logout()
      } else {
        showErrorToast(response.data?.message || "Failed to delete account")
      }
    } catch (error: any) {
      // Check if it's an auth error - interceptors will handle logout
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || ""

        // Don't show error toast for auth errors - interceptors will handle logout
        if (status === 401 || status === 404) {
          if (errorMessage.toLowerCase().includes("user not found") || errorMessage.toLowerCase().includes("invalid token")) {
            setShowDeleteModal(false)
            return
          }
          return
        }
        showErrorToast(errorMessage || "Failed to delete account. Please try again.")
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBlur = (field: EditableProfileField) => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))

    const errorMessage = validateProfileField(field, editData[field] ?? "")
    setErrors((prev) => {
      const next = { ...prev }
      if (errorMessage) next[field] = errorMessage
      else delete next[field]
      return next
    })
  }

  // Upload profile image to backend
  const uploadProfileImage = async (imageUri: string) => {
    try {
      const token = await getToken()
      if (!token) {
        const { forceLogout } = await import("@/utils/forcedLogout")
        await forceLogout("You have been logged out. Please sign in again.")
        return false
      }

      // Create FormData for multipart upload
      const formData = new FormData()
      const filename = imageUri.split('/').pop() || 'profile.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : 'image/jpeg'

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      } as any)

      const response = await apiClient.post('/users/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data?.success) {
        const updatedUser = response.data.data?.user || { ...profile, profileImage: response.data.data?.profileImage }
        setProfile(updatedUser)
        await saveUser(updatedUser)
        setUser(updatedUser)
        showSuccessToast("Profile image updated!")
        return true
      } else {
        showErrorToast(response.data?.message || "Failed to upload image")
        return false
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401 || status === 404) {
          return false // Auth interceptor will handle
        }
        showErrorToast(error?.response?.data?.error?.message || "Failed to upload image")
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
      return false
    }
  }

  // Delete profile image from backend
  const deleteProfileImage = async () => {
    try {
      const token = await getToken()
      if (!token) {
        const { forceLogout } = await import("@/utils/forcedLogout")
        await forceLogout("You have been logged out. Please sign in again.")
        return false
      }

      const response = await apiClient.delete('/users/profile-image')

      if (response.data?.success) {
        const updatedUser = { ...profile, profileImage: undefined }
        setProfile(updatedUser)
        await saveUser(updatedUser)
        setUser(updatedUser)
        showSuccessToast("Profile image removed!")
        return true
      } else {
        showErrorToast(response.data?.message || "Failed to remove image")
        return false
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401 || status === 404) {
          return false
        }
        showErrorToast(error?.response?.data?.error?.message || "Failed to remove image")
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
      return false
    }
  }

  // Image picker functions
  const pickImageFromLibrary = async () => {
    setShowImagePickerModal(false)

    // iOS requires explicit permission request before accessing the photo library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showErrorToast('Photo library permission is required to upload a profile image')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      setLocalProfileImage(result.assets[0].uri)
      setPendingImageChange('add')
    }
  }

  const takePhoto = async () => {
    setShowImagePickerModal(false)
    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    if (status !== 'granted') {
      showErrorToast('Camera permission is required to take photos')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      setLocalProfileImage(result.assets[0].uri)
      setPendingImageChange('add')
    }
  }

  const handleRemoveImage = () => {
    setLocalProfileImage(null)
    setPendingImageChange('remove')
  }

  // Get the current profile image (local selection takes priority)
  const currentProfileImage = localProfileImage || profile.profileImage

  const editableErrors = useMemo(
    () =>
      (["name", "email", "contactNo", "estateName"] as EditableProfileField[]).some((field) =>
        Boolean(validateProfileField(field, editData[field] ?? "")),
      ),
    [editData],
  )

  const isUpdateDisabled = !hasChanges || editableErrors || loading

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>My Profile</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
                <Text style={styles.deleteAccountText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.avatarSection}>
              <AvatarInitials name={profile.name} size={80} imageUri={currentProfileImage} />
              <View style={styles.avatarActions}>
                <TouchableOpacity onPress={() => setShowImagePickerModal(true)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                {currentProfileImage && (
                  <>
                    <Text style={styles.divider}> </Text>
                    <TouchableOpacity onPress={handleRemoveImage}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
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

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete your account? Deleting your account will cause the permanent deletion of your data including listings and profile information.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <View style={styles.deleteButtonLoadingContainer}>
                    <ActivityIndicator size="small" color={Colors.white} />
                    <Text style={styles.deleteButtonText}>Deleting...</Text>
                  </View>
                ) : (
                  <Text style={styles.deleteButtonText}>Yes, Delete</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelModalButton, isDeleting && styles.cancelModalButtonDisabled]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.imagePickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
        >
          <View style={styles.imagePickerModalContent}>
            <Text style={styles.imagePickerModalTitle}>Change Profile Photo</Text>
            <TouchableOpacity style={styles.imagePickerOption} onPress={takePhoto}>
              <Text style={styles.imagePickerOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickerOption} onPress={pickImageFromLibrary}>
              <Text style={styles.imagePickerOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imagePickerOption, styles.imagePickerCancelOption]}
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.imagePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.24,
    marginBottom: spacing.lg,
  },
  deleteAccountText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: Colors.error,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.neutral10,
    borderRadius: radius.lg,
    padding: spacing.screen,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  modalMessage: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    color: Colors.textSecondary,
    fontFamily: fontFamilies.primary,
    textAlign: "center",
    marginBottom: spacing.screen,
    lineHeight: 20,
  },
  modalButtons: {
    gap: spacing.md,
  },
  deleteButton: {
    paddingVertical: spacing.md2,
    borderRadius: radius.pill,
    backgroundColor: Colors.error,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.white,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.12,
  },
  deleteButtonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  cancelModalButton: {
    paddingVertical: spacing.md2,
    borderRadius: radius.pill,
    backgroundColor: Colors.neutral20,
    alignItems: "center",
  },
  cancelModalButtonDisabled: {
    opacity: 0.6,
  },
  cancelModalButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral90,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.12,
  },
  imagePickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  imagePickerModalContent: {
    backgroundColor: Colors.neutral10,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.screen,
  },
  imagePickerModalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  imagePickerOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  imagePickerOptionText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: Colors.text,
    fontFamily: fontFamilies.primary,
    textAlign: "center",
  },
  imagePickerCancelOption: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  imagePickerCancelText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: Colors.error,
    fontFamily: fontFamilies.primary,
    textAlign: "center",
  },
})