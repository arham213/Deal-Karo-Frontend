"use client"

import { Header } from "@/components/auth/Header"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { fontSizes, fontWeights, layoutStyles, radius, spacing, typographyStyles } from "@/styles"
import { Validation, type ValidationErrors } from "@/utils/validation"
import axios from "axios"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors<"password" | "confirmPassword">>({})
  const [touched, setTouched] = useState<Record<"password" | "confirmPassword", boolean>>({
    password: false,
    confirmPassword: false,
  })

  const BASE_URL = 'http://10.190.83.91:8080/api';

  const validateField = (field: "password" | "confirmPassword", value: string) => {
    if (field === "password") {
      if (!Validation.isRequired(value)) return "Password is required"
      if (!Validation.hasMinLength(value, 8)) return "Password must be at least 8 characters long"
      if (!Validation.hasUppercase(value)) return "Include at least one uppercase letter"
      if (!Validation.hasLowercase(value)) return "Include at least one lowercase letter"
      if (!Validation.hasNumber(value)) return "Include at least one number"
      return undefined
    }

    if (!Validation.isRequired(value)) return "Please confirm your password"
    if (value !== password) return "Passwords do not match"
    return undefined
  }

  const runValidation = () => {
    const passwordError = validateField("password", password)
    const confirmError = validateField("confirmPassword", confirmPassword)

    const nextErrors: ValidationErrors<"password" | "confirmPassword"> = {}
    if (passwordError) nextErrors.password = passwordError
    if (confirmError) nextErrors.confirmPassword = confirmError

    setErrors(nextErrors)
    return !passwordError && !confirmError
  }

  const markAllTouched = () => {
    setTouched({
      password: true,
      confirmPassword: true,
    })
  }

  const handleResetPassword = async () => {
    if (!runValidation()) {
      markAllTouched()
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
        setPassword("")
        setConfirmPassword("")
        setErrors({})
        setTouched({
          password: false,
          confirmPassword: false,
        })
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
    } finally {
      setLoading(false)
    }

  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (touched.password) {
      const errorMessage = validateField("password", value)
      setErrors((prev) => {
        const next = { ...prev }
        if (errorMessage) next.password = errorMessage
        else delete next.password
        return next
      })
    }

    if (touched.confirmPassword) {
      const confirmError = validateField("confirmPassword", confirmPassword)
      setErrors((prev) => {
        const next = { ...prev }
        if (confirmError) next.confirmPassword = confirmError
        else delete next.confirmPassword
        return next
      })
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (touched.confirmPassword) {
      const errorMessage = validateField("confirmPassword", value)
      setErrors((prev) => {
        const next = { ...prev }
        if (errorMessage) next.confirmPassword = errorMessage
        else delete next.confirmPassword
        return next
      })
    }
  }

  const handleBlur = (field: "password" | "confirmPassword") => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))

    const value = field === "password" ? password : confirmPassword
    const errorMessage = validateField(field, value)
    setErrors((prev) => {
      const next = { ...prev }
      if (errorMessage) next[field] = errorMessage
      else delete next[field]
      return next
    })
  }

  const passwordChecks = useMemo(
    () => ({
      length: Validation.hasMinLength(password, 8),
      uppercase: Validation.hasUppercase(password),
      lowercase: Validation.hasLowercase(password),
      number: Validation.hasNumber(password),
      match: Boolean(password) && password === confirmPassword,
    }),
    [password, confirmPassword],
  )

  const isSubmitDisabled =
    loading ||
    Boolean(validateField("password", password)) ||
    Boolean(validateField("confirmPassword", confirmPassword))

  return (
    <SafeAreaView style={[layoutStyles.safeArea, styles.safeArea]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
        <ScrollView
          contentContainerStyle={[layoutStyles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
            <Header title="Reset Password" subtitle="Enter your new password below" />

            <View style={styles.mainContent}>

            <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
                <TextInput
                label="New Password"
                placeholder="Enter new password"
                secureTextEntry
                value={password}
                onChangeText={handlePasswordChange}
                onBlur={handleBlur("password")}
                error={touched.password ? errors.password : undefined}
                editable={!loading}
                labelStyle={styles.inputLabel}
                />
            </View>

            <View style={styles.inputWrapper}>
                <TextInput
                label="Confirm Password"
                placeholder="Confirm your password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                onBlur={handleBlur("confirmPassword")}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                editable={!loading}
                labelStyle={styles.inputLabel}
                />
            </View>

            <View style={styles.passwordRequirements}>
                <Text style={styles.requirementTitle}>Password Requirements:</Text>
                <Text style={[styles.requirement, passwordChecks.length && styles.requirementMet]}>
                • At least 8 characters
                </Text>
                <Text style={[styles.requirement, passwordChecks.uppercase && styles.requirementMet]}>
                • Contains an uppercase letter
                </Text>
                <Text style={[styles.requirement, passwordChecks.lowercase && styles.requirementMet]}>
                • Contains a lowercase letter
                </Text>
                <Text style={[styles.requirement, passwordChecks.number && styles.requirementMet]}>
                • Contains a number
                </Text>
                <Text style={[styles.requirement, passwordChecks.match && styles.requirementMet]}>
                • Passwords match
                </Text>
            </View>
            </View>

            <Button title="Reset Password" onPress={handleResetPassword} loading={loading} disabled={isSubmitDisabled} style={styles.button} />
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.headerBackground,
  },
  screen: {
    backgroundColor: Colors.headerBackground,
  },
  mainContent: {
    gap: spacing.xl,
    backgroundColor: Colors.neutral10,
    borderTopRightRadius: radius.xxl2,
    borderTopLeftRadius: radius.xxl2,
    padding: spacing.screen,
  },
  formContainer: {
    gap: spacing.xl,
  },
  inputWrapper: {
    gap: spacing.sm,
  },
  inputLabel: {
    fontWeight: fontWeights.medium,
  },
  errorText: {
    ...typographyStyles.helper,
    color: Colors.error,
    marginTop: 4,
  },
  passwordRequirements: {
    backgroundColor: Colors.inputBackground,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  requirementTitle: {
    ...typographyStyles.semibold,
    fontSize: fontSizes.sm,
    color: Colors.text,
    marginBottom: spacing.xs,
  },
  requirement: {
    ...typographyStyles.helper,
    color: Colors.neutral80,
    fontWeight: fontWeights.medium,
  },
  requirementMet: {
    color: Colors.success2,
    fontWeight: fontWeights.bold,
  },
  button: {
    marginTop: spacing.xl,
  },
})