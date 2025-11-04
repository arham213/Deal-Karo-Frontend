"use client"

import { Header } from "@/components/auth/Header"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import axios from "axios"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})

  const BASE_URL = 'http://10.224.131.91:8080/api';

  const validatePasswords = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleResetPassword = async () => {
    if (!validatePasswords()) {
      return
    }

    setLoading(true)
    try {
      const userData = {
        userId: userId,
        password: password,
      }

      const response = await axios.post(`${BASE_URL}/users/resetPassword`, userData);

      console.log('response:', response.data);

      setLoading(false);

      if (response?.data.success) {
        alert("Password reset successfully");
        router.push('/sign-in');
      } else {
        alert(response?.data.error.message);
      }
    } catch (error) {
      setLoading(false)

      if (axios.isAxiosError(error)) {
        alert(error?.response?.data?.error?.message);
      } else {
        alert("Something went wrong. Please try again later")
      }
    }

  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Header title="Reset Password" subtitle="Enter your new password below" />

            <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
                <TextInput
                label="New Password"
                placeholder="Enter new password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text: string) => {
                    setPassword(text)
                    if (errors.password) setErrors({ ...errors, password: undefined })
                }}
                editable={!loading}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputWrapper}>
                <TextInput
                label="Confirm Password"
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(text: string) => {
                    setConfirmPassword(text)
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined })
                }}
                editable={!loading}
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <View style={styles.passwordRequirements}>
                <Text style={styles.requirementTitle}>Password Requirements:</Text>
                <Text style={[styles.requirement, password.length >= 8 && styles.requirementMet]}>
                • At least 8 characters
                </Text>
                <Text style={[styles.requirement, password === confirmPassword && password && styles.requirementMet]}>
                • Passwords match
                </Text>
            </View>
            </View>

            <Button title="Reset Password" onPress={handleResetPassword} loading={loading} style={styles.button} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  formContainer: {
    marginVertical: 40,
    gap: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
  },
  passwordRequirements: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 12,
  },
  requirementTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  requirement: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  requirementMet: {
    color: "#10B981",
    fontWeight: "500",
  },
  button: {
    marginTop: 20,
  },
})