"use client"

import { Button } from "@/components/Button"
import { Header } from "@/components/auth/Header"
import { Colors } from "@/constants/colors"
import axios from "axios"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuthContext } from "@/contexts/AuthContext"
import { fontSizes, fontWeights, layoutStyles, radius, spacing, typographyStyles } from "@/styles"
import { saveToken, saveUser } from "@/utils/secureStore"
import { showErrorToast, showSuccessToast } from "@/utils/toast"

export default function VerifyOTPScreen() {
  const router = useRouter()
  const { setUser, setToken, checkAuth } = useAuthContext()
  const { userId, isSignupOTP } = useLocalSearchParams<{ userId: string, isSignupOTP: string }>();
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [touched, setTouched] = useState(false)
  const inputRefs = useRef<(RNTextInput | null)[]>([null, null, null, null])

  const BASE_URL = 'https://deal-karo-backend.vercel.app/api';

  const resetOtpFields = () => {
    setOtp(["", "", "", ""])
    setTouched(false)
    // Focus first input if available for better UX
    inputRefs.current[0]?.focus()
  }

  // Start initial 60s disable timer on first mount
  useEffect(() => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

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

      const url = isSignupOTP === "true" ? `${BASE_URL}/users/verifyEmail` : `${BASE_URL}/users/verify-reset-password-otp`;

      const response = await axios.post(url, userData);

      //console.log('response:', response.data);

      setLoading(false);

      if (response?.data.success) {
        showSuccessToast("OTP verified successfully");
        setTouched(false)
        if (isSignupOTP === "true") {
          // router.push("/(auth)/sign-in");
          //console.log('saving token and user...')
          // Save token and user to secure store
          await saveToken(response.data.data.token);
          await saveUser(response.data.data.user);
          
          // Update auth context
          setToken(response.data.data.token);
          setUser(response.data.data.user);
          
          // Refresh auth state to get onboarding status
          await checkAuth();
          
          router.replace("/(onboarding)/onboarding");
        } else {
          router.push({
            pathname: '/reset-password',
            params: { userId: response.data.data.userId }
          });
        }
      } else {
        showErrorToast(response?.data.error.message || "OTP verification failed");
      }
    } catch (error) {
      setLoading(false)

      if (axios.isAxiosError(error)) {
        showErrorToast(error?.response?.data?.error?.message || "OTP verification failed");
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
    } finally {
      // Clear OTP inputs after API response arrives
      resetOtpFields()
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

      //console.log('response:', response.data);

      setLoading(false);

      if (response?.data.success) {
        showSuccessToast("OTP resent successfully");
      } else {
        showErrorToast(response?.data.error.message || "Failed to resend OTP");
      }
    } catch (error) {
      setLoading(false)

      if (axios.isAxiosError(error)) {
        showErrorToast(error?.response?.data?.error?.message || "Failed to resend OTP");
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
    } finally {
      // Clear OTP inputs after API response arrives
      resetOtpFields()
    }
  }

  const otpCode = otp.join("")
  const showError = touched && otpCode.length !== 4
  const isSubmitDisabled = loading || otpCode.length !== 4

  return (
    <SafeAreaView style={[layoutStyles.safeArea, styles.safeArea]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
        <ScrollView
          contentContainerStyle={[layoutStyles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <Header title="Verify your email" subtitle="An OTP sent to your registered email." />

          <View style={styles.mainContent}>

            <View>
              <Text style={styles.otpLabel}>Enter OTP here</Text>
              <View style={styles.otpInputs}>
                {otp.map((digit, index) => (
                  <RNTextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref }}
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
    fontSize: fontSizes.sm,
    color: Colors.neutral80,
    fontWeight: fontWeights.medium,
  },
  resendLink: {
    ...typographyStyles.semibold,
    fontSize: fontSizes.sm,
    color: Colors.neutral100,
    fontWeight: fontWeights.bold,
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