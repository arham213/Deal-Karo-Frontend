"use client"

import { AvatarInitials } from "@/components/AvatarInitials"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { useRouter } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ProfileScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState({
    fullName: "M S",
    contactNumber: "",
    estateName: "",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(profile)

  const handleInputChange = (key: keyof typeof editData, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    setProfile(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(profile)
    setIsEditing(false)
  }

  const handleLogout = async () => {
    try {
      router.replace("/")
    } catch (error) {
      alert("Failed to logout")
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>My Profile</Text>
          </View>

          <View style={styles.avatarSection}>
            <AvatarInitials name={profile.fullName} size={80} />
            <View style={styles.avatarActions}>
              <TouchableOpacity>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <Text style={styles.divider}>|</Text>
              <TouchableOpacity>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formSection}>
            <TextInput
              label="Full Name"
              placeholder="Enter your full name"
              value={isEditing ? editData.fullName : profile.fullName}
              onChangeText={(value) => isEditing && handleInputChange("fullName", value)}
              editable={isEditing}
            />

            <TextInput
              label="Contact Number"
              placeholder="Enter your contact number"
              value={isEditing ? editData.contactNumber : profile.contactNumber}
              onChangeText={(value) => isEditing && handleInputChange("contactNumber", value)}
              editable={isEditing}
              keyboardType="phone-pad"
            />

            <TextInput
              label="Estate Name"
              placeholder="Enter your estate name"
              value={isEditing ? editData.estateName : profile.estateName}
              onChangeText={(value) => isEditing && handleInputChange("estateName", value)}
              editable={isEditing}
            />
          </View>

          {isEditing ? (
            <View style={styles.buttonGroup}>
              <Button title="Save" onPress={handleSave} />
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonGroup}>
              <Button title="Update" onPress={() => setIsEditing(true)} />
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