"use client"

import { Header } from "@/components/auth/Header"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { useAuthContext } from "@/contexts/AuthContext"
import { fontSizes, fontWeights, layoutStyles, radius, spacing, typographyStyles } from "@/styles"
import { saveToken, saveUser } from "@/utils/secureStore"
import { showErrorToast } from "@/utils/toast"
import { Redirect, useRouter } from "expo-router"
import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  createInitialSignInFormState,
  createSignInTouchedState,
  hasAnySignInError,
  hasEmptySignInField,
  signInWithEmailAndPassword,
  validateSignInField,
  validateSignInForm,
  type SignInField,
  type SignInFormState,
  type SignInTouchedState,
  type SignInValidationErrors,
} from "../../packages/utils/auth/signIn"

export default function SignInScreen() {
  const router = useRouter()
  const { setUser, setToken, checkAuth, isAuthenticated, isLoading, isOnboardingCompleted } = useAuthContext()
  const [form, setForm] = useState<SignInFormState>(createInitialSignInFormState)
  const [errors, setErrors] = useState<SignInValidationErrors>({})
  const [touched, setTouched] = useState<SignInTouchedState>(createSignInTouchedState(false))
  const [loading, setLoading] = useState(false)

  // Immediately redirect if already authenticated - prevents flash of sign-in screen
  // Use Redirect component for immediate redirect without rendering anything
  if (!isLoading && isAuthenticated) {
    const target = isOnboardingCompleted ? "/(listings)/listings" : "/(onboarding)/onboarding"
    return <Redirect href={target} />
  }

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.neutral10 }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const validateForm = () => {
    const { isValid, errors: validationErrors } = validateSignInForm(form)
    setErrors(validationErrors)
    return isValid
  }

  const handleChange =
    (field: SignInField) =>
    (value: string) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }))

      if (touched[field]) {
        const errorMessage = validateSignInField(field, value)
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

    const errorMessage = validateSignInField(field, form[field])
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
    setTouched(createSignInTouchedState(true))
  }

  const hasEmptyField = useMemo(
    () => hasEmptySignInField(form),
    [form],
  )

  const hasAnyError = useMemo(
    () => hasAnySignInError(form),
    [form],
  )

  const isSubmitDisabled = loading || hasEmptyField || hasAnyError

  const handleSignIn = async () => {
    //console.log('loggin in...')
    const isValid = validateForm()
    if (!isValid) {
      markAllTouched()
      return
    }
    //console.log('validating form...')

    setLoading(true)
    try {
      const { token, user } = await signInWithEmailAndPassword({
        email: form.email,
        password: form.password,
      })

      // Save token and user to secure store
      await saveToken(token)
      await saveUser(user)

      // Update auth context
      setToken(token)
      setUser(user)

      // Refresh auth state to get onboarding status
      await checkAuth()

      setErrors({})
      setTouched(createSignInTouchedState(false))

      // Check onboarding status and redirect
      const onboardingCompleted = user.onBoardingCompleted
      if (onboardingCompleted) {
        router.replace("/(listings)/listings")
      } else {
        router.replace("/(onboarding)/onboarding")
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again later"
      showErrorToast(message)
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
                    //console.log("Navigating to forgot password...")
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
    flex: 1,
    // backgroundColor: Colors.headerBackground,
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