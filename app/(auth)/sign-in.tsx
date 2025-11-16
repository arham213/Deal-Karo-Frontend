"use client"

import { Header } from "@/components/auth/Header"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { useAuthContext } from "@/contexts/AuthContext"
import { fontSizes, fontWeights, layoutStyles, radius, spacing, typographyStyles } from "@/styles"
import { saveToken, saveUser } from "@/utils/secureStore"
import { showErrorToast } from "@/utils/toast"
import { Validation, type ValidationErrors } from "@/utils/validation"
import axios from "axios"
import { useRouter } from "expo-router"
import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

type SignInField = "email" | "password"

type SignInFormState = Record<SignInField, string>

const createInitialFormState = (): SignInFormState => ({
  email: "",
  password: "",
})

const createTouchedState = (value: boolean) =>
  ({
    email: value,
    password: value,
  }) as Record<SignInField, boolean>

export default function SignInScreen() {
  const router = useRouter()
  const { setUser, setToken, checkAuth } = useAuthContext()
  const [form, setForm] = useState<SignInFormState>(createInitialFormState)
  const [errors, setErrors] = useState<ValidationErrors<SignInField>>({})
  const [touched, setTouched] = useState<Record<SignInField, boolean>>(createTouchedState(false))
  const [loading, setLoading] = useState(false)

  const BASE_URL = 'http://192.168.10.48:8080/api';

  const validateField = (field: SignInField, value: string) => {
    const trimmed = value.trim()
    switch (field) {
      case "email":
        if (!Validation.isRequired(trimmed)) return "Email is required"
        if (!Validation.isEmail(trimmed)) return "Enter a valid email address"
        return undefined
      case "password":
        if (!Validation.isRequired(value)) return "Password is required"
        return undefined
      default:
        return undefined
    }
  }

  const validateForm = () => {
    const newErrors: ValidationErrors<SignInField> = {}
    ;(Object.keys(form) as SignInField[]).forEach((field) => {
      const errorMessage = validateField(field, form[field])
      if (errorMessage) {
        newErrors[field] = errorMessage
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange =
    (field: SignInField) =>
    (value: string) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }))

      if (touched[field]) {
        const errorMessage = validateField(field, value)
        setErrors((prev) => {
          const next = { ...prev }
          if (errorMessage) {
            next[field] = errorMessage
          } else {
            delete next[field]
          }
          return next
        })
      }
    }

  const handleBlur = (field: SignInField) => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))

    const errorMessage = validateField(field, form[field])
    setErrors((prev) => {
      const next = { ...prev }
      if (errorMessage) {
        next[field] = errorMessage
      } else {
        delete next[field]
      }
      return next
    })
  }

  const markAllTouched = () => {
    setTouched(createTouchedState(true))
  }

  const hasEmptyField = useMemo(
    () => (Object.keys(form) as SignInField[]).some((field) => !Validation.isRequired(form[field])),
    [form],
  )

  const hasAnyError = useMemo(
    () => (Object.keys(form) as SignInField[]).some((field) => Boolean(validateField(field, form[field]))),
    [form],
  )

  const isSubmitDisabled = loading || hasEmptyField || hasAnyError

  const handleSignIn = async () => {
    console.log('loggin in...')
    const isValid = validateForm()
    if (!isValid) {
      markAllTouched()
      return
    }
    console.log('validating form...')

    setLoading(true)
    try {
      const userData = {
        email: form.email.trim(),
        password: form.password,
      }

      console.log('userData:', userData)

      const response = await axios.post(`${BASE_URL}/users/signin`, userData);
      
      console.log('response:', response.data)

      if (response?.data.success) {
        console.log('saving token and user...')
        // Save token and user to secure store
        await saveToken(response.data.data.token);
        await saveUser(response.data.data.user);
        
        // Update auth context
        setToken(response.data.data.token);
        setUser(response.data.data.user);
        
        // Refresh auth state to get onboarding status
        await checkAuth();
        
        setErrors({})
        setTouched(createTouchedState(false))

        // Check onboarding status and redirect
        // const onboardingCompleted = await getOnboardingCompleted();
        const onboardingCompleted = response.data.data.user.onBoardingCompleted;
        if (onboardingCompleted) {
          router.replace("/(listings)/listings");
        } else {
          router.replace("/(onboarding)/onboarding");
        }
      } else {
        showErrorToast(response?.data.error.message || "Signin failed");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showErrorToast(error?.response?.data?.error?.message || "Signin failed");
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[layoutStyles.safeArea, styles.safeArea]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
          <ScrollView
            contentContainerStyle={[layoutStyles.scrollContent]}
            showsVerticalScrollIndicator={false}
          >
            <Header title="Sign In" subtitle="Welcome back! Sign in to your account" />

            <View style={styles.mainContent}>
              <View style={styles.form}>
                <TextInput
                  label="Email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={touched.email ? errors.email : undefined}
                  editable={!loading}
                  labelStyle={styles.inputLabel}
                />

                <TextInput
                  label="Password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  secureTextEntry
                  error={touched.password ? errors.password : undefined}
                  editable={!loading}
                  labelStyle={styles.inputLabel}
                />
              </View>
            
              <Button title="Sign In" onPress={handleSignIn} loading={loading} disabled={isSubmitDisabled} style={styles.button} />

              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity 
                  onPress={() => {
                    console.log("Navigating to forgot password...")
                    router.push("/(auth)/forgot-password")
                  }} 
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordLink}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Text style={styles.footerLink} onPress={() => router.push("/(auth)/sign-up")}>
                  Sign Up
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
    backgroundColor: Colors.headerBackground,
  },
  screen: {
    backgroundColor: Colors.headerBackground,
  },
  mainContent: {
    gap: spacing.xl,
    padding: spacing.screen,
    backgroundColor: Colors.neutral10,
    borderTopRightRadius: radius.xxl2,
    borderTopLeftRadius: radius.xxl2,
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
  forgotPasswordContainer: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  forgotPasswordLink: {
    ...typographyStyles.semibold,
    fontSize: fontSizes.sm,
    color: Colors.neutral100,
    fontWeight: fontWeights.bold,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  footerText: {
    ...typographyStyles.regular,
    fontSize: fontSizes.sm,
    color: Colors.neutral80,
    fontWeight: fontWeights.medium,
  },
  footerLink: {
    ...typographyStyles.semibold,
    fontSize: fontSizes.sm,
    color: Colors.neutral100,
    fontWeight: fontWeights.bold,
  },
})