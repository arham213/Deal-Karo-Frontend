"use client"

import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Header } from "@/components/auth/Header"
import { Colors } from "@/constants/colors"
import { fontSizes, fontWeights, layoutStyles, radius, spacing, typographyStyles } from "@/styles"
import { Validation } from "@/utils/validation"
import axios from "axios"
import { useRouter } from "expo-router"
import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  const BASE_URL = 'http://10.190.83.91:8080/api';

  const emailValidationError = useMemo(() => {
    if (!Validation.isRequired(email)) return "Email is required"
    if (!Validation.isEmail(email)) return "Enter a valid email address"
    return undefined
  }, [email])

  const isSubmitDisabled = loading || Boolean(emailValidationError)

  const handleSendOTP = async () => {
    if (emailValidationError) {
      setTouched(true)
      return
    }

    setLoading(true)
    try {
      const userData = {
        email: email,
      }

      const response = await axios.post(`${BASE_URL}/users/forgotPassword`, userData);

      console.log('response:', response.data);

      setLoading(false);

      if (response?.data.success) {
        alert("OTP sent successfully");
        setEmail("")
        setTouched(false)
        router.push({
           pathname: '/verify-otp',
           params: { userId: response.data.data.userId}
        });
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
          <Text style={styles.footerLink} onPress={() => router.push("/sign-in")}>
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