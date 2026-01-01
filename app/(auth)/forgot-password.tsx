"use client"

import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Header } from "@/components/auth/Header"
import { Colors } from "@/constants/colors"
import { fontSizes, fontWeights, layoutStyles, radius, spacing, typographyStyles } from "@/styles"
import { showErrorToast, showSuccessToast } from "@/utils/toast"
import { useRouter } from "expo-router"
import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  getForgotPasswordEmailError,
  sendForgotPasswordOtp,
} from "../../packages/utils/auth/forgotPassword"

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailValidationError = useMemo(() => {
    return getForgotPasswordEmailError(email)
  }, [email])

  const isSubmitDisabled = loading || Boolean(emailValidationError)

  const handleSendOTP = async () => {
    if (emailValidationError) {
      setTouched(true)
      return
    }

    try {
      setLoading(true)

      const { userId } = await sendForgotPasswordOtp(email)

      showSuccessToast("OTP sent successfully")
      setEmail("")
      setTouched(false)
      router.push({
        pathname: "/verify-otp",
        params: { userId },
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again later"
      showErrorToast(message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
  }

  const handleBlur = () => {
    setTouched(true)
  }

  return (
    <SafeAreaView style={[layoutStyles.safeArea, styles.safeArea]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[layoutStyles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Forgot Password" subtitle="Enter your email to reset your password" />

        <View style={styles.mainContent}>
          <View style={styles.form}>
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              error={touched ? emailValidationError : undefined}
              editable={!loading}
              labelStyle={styles.inputLabel}
            />
          </View>

          <Button title="Send OTP" onPress={handleSendOTP} loading={loading} disabled={isSubmitDisabled} style={styles.button} />

          <View style={styles.footer}>
            <Text style={styles.footerLink} onPress={() => router.push("/(auth)/sign-in")}>
              Back to Sign In
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.neutral10,
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
  form: {
    gap: spacing.xl,
  },
  inputLabel: {
    fontWeight: fontWeights.medium,
  },
  button: {
    marginTop: spacing.xl,
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  footerLink: {
    ...typographyStyles.semibold,
    fontSize: fontSizes.sm,
    color: Colors.neutral100,
    fontWeight: fontWeights.bold,
  },
})
