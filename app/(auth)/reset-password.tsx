"use client"

import { Header } from "@/components/auth/Header"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { fontSizes, fontWeights, layoutStyles, radius, spacing, typographyStyles } from "@/styles"
import { showErrorToast, showSuccessToast } from "@/utils/toast"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  getPasswordChecks,
  resetPasswordForUser,
  validateResetPasswordField,
  validateResetPasswordForm,
  type ResetPasswordErrors,
  type ResetPasswordField,
} from "../../packages/utils/auth/resetPassword"

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ResetPasswordErrors>({})
  const [touched, setTouched] = useState<Record<ResetPasswordField, boolean>>({
    password: false,
    confirmPassword: false,
  })

  const runValidation = () => {
    const { isValid, errors: validationErrors } = validateResetPasswordForm(
      password,
      confirmPassword,
    )
    setErrors(validationErrors)
    return isValid
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

    try {
      setLoading(true)

      await resetPasswordForUser({
        userId: String(userId),
        password,
      })

      showSuccessToast("Password reset successfully")
      setPassword("")
      setConfirmPassword("")
      setErrors({})
      setTouched({
        password: false,
        confirmPassword: false,
      })
      router.push("/(auth)/sign-in")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again later"
      showErrorToast(message)
    } finally {
      setLoading(false)
    }

  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (touched.password) {
      const errorMessage = validateResetPasswordField("password", value, value)
      setErrors((prev) => {
        const next = { ...prev }
        if (errorMessage) next.password = errorMessage
        else delete next.password
        return next
      })
    }

    if (touched.confirmPassword) {
      const confirmError = validateResetPasswordField(
        "confirmPassword",
        confirmPassword,
        value,
      )
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
      const errorMessage = validateResetPasswordField(
        "confirmPassword",
        value,
        password,
      )
      setErrors((prev) => {
        const next = { ...prev }
        if (errorMessage) next.confirmPassword = errorMessage
        else delete next.confirmPassword
        return next
      })
    }
  }

  const handleBlur = (field: ResetPasswordField) => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))

    const value = field === "password" ? password : confirmPassword
    const errorMessage = validateResetPasswordField(field, value, password)
    setErrors((prev) => {
      const next = { ...prev }
      if (errorMessage) next[field] = errorMessage
      else delete next[field]
      return next
    })
  }

  const passwordChecks = useMemo(
    () => getPasswordChecks(password, confirmPassword),
    [password, confirmPassword],
  )

  const isSubmitDisabled =
    loading ||
    Boolean(validateResetPasswordField("password", password, password)) ||
    Boolean(
      validateResetPasswordField("confirmPassword", confirmPassword, password),
    )

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
    // backgroundColor: Colors.headerBackground,
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