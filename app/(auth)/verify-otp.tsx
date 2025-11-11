"use client"

import { Button } from "@/components/Button"
import { Header } from "@/components/auth/Header"
import { Colors } from "@/constants/colors"
import axios from "axios"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { fontSizes, layoutStyles, radius, spacing, typographyStyles } from "@/styles"

export default function VerifyOTPScreen() {
  const router = useRouter()
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [touched, setTouched] = useState(false)
  const inputRefs = useRef<(RNTextInput | null)[]>([null, null, null, null])

  const BASE_URL = 'http://10.190.83.91:8080/api';

  const handleOTPChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 1)

    const newOtp = [...otp]
    newOtp[index] = sanitized

    setOtp(newOtp)

    // Auto-focus to next input
    if (sanitized && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleBackspace = (index: number) => {
    if (index > 0 && !otp[index]) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("")
    if (otpCode.length !== 4) {
      setTouched(true)
      return
    }

    setLoading(true)
    try {
      const userData = {
        userId: userId,
        OTP: otpCode
      }

      const response = await axios.post(`${BASE_URL}/users/verify-reset-password-otp`, userData);

      console.log('response:', response.data);

      setLoading(false);

      if (response?.data.success) {
        alert("OTP verified successfully");
        setTouched(false)
        router.push({
            pathname: '/reset-password',
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
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setResendTimer(60)
    const interval = setInterval(async () => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

      try {
      const userData = {
        userId: userId,
        isSimpleOTP: false
      }

      const response = await axios.post(`${BASE_URL}/users/resendOTP`, userData);

      console.log('response:', response.data);

      setLoading(false);

      if (response?.data.success) {
        alert("OTP resent successfully");
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

  const otpCode = otp.join("")
  const showError = touched && otpCode.length !== 4
  const isSubmitDisabled = loading || otpCode.length !== 4

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={layoutStyles.screen}>
      <ScrollView
        contentContainerStyle={[layoutStyles.scrollContent, layoutStyles.screenPadding]}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Verify your email" subtitle="An OTP sent to your registered email." />

        <View style={styles.otpContainer}>
          <Text style={styles.otpLabel}>Enter OTP here</Text>
          <View style={styles.otpInputs}>
            {otp.map((digit, index) => (
              <RNTextInput
                key={index}
                ref={(ref) => {inputRefs.current[index] = ref}}
                style={[styles.otpInput, showError && styles.otpInputError]}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(value) => handleOTPChange(index, value)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace") {
                    handleBackspace(index)
                  }
                }}
                editable={!loading}
              />
            ))}
          </View>
          {showError && <Text style={styles.errorText}>Enter the 4-digit code sent to your email</Text>}
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive OTP? </Text>
          <Text
            style={[styles.resendLink, resendTimer > 0 && styles.resendDisabled]}
            onPress={resendTimer === 0 ? handleResendOTP : undefined}
          >
            {resendTimer > 0 ? `Re-Send (${resendTimer}s)` : "Re-Send"}
          </Text>
        </View>

        <Button title="Continue" onPress={handleVerifyOTP} loading={loading} disabled={isSubmitDisabled} style={styles.button} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  otpContainer: {
    marginVertical: spacing.xxl + spacing.md,
  },
  otpLabel: {
    ...typographyStyles.semibold,
    fontSize: fontSizes.sm,
    color: Colors.text,
    marginBottom: spacing.lg,
  },
  otpInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: radius.md,
    fontSize: fontSizes.xl,
    fontWeight: "600",
    textAlign: "center",
    color: Colors.text,
    backgroundColor: Colors.inputBackground,
  },
  otpInputError: {
    borderColor: Colors.error,
    backgroundColor: "#FFECEC",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  resendText: {
    ...typographyStyles.regular,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendLink: {
    ...typographyStyles.semibold,
    fontSize: 14,
    color: Colors.primary,
  },
  resendDisabled: {
    opacity: 0.5,
  },
  errorText: {
    marginTop: spacing.md,
    ...typographyStyles.helper,
    color: Colors.error,
    textAlign: "center",
  },
  button: {
    marginTop: spacing.xl,
  },
})