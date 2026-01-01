"use client"

import { Header } from "@/components/auth/Header"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { fontSizes, fontWeights, layoutStyles, radius, spacing, typographyStyles } from "@/styles"
import { showErrorToast, showSuccessToast } from "@/utils/toast"
import { useRouter } from "expo-router"
import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  buildSignUpRequestBody,
  createInitialSignUpFormState,
  createSignUpTouchedState,
  formatContactNumberInput,
  hasAnySignUpError,
  hasEmptyRequiredSignUpField,
  signUpUser,
  validateSignUpField,
  validateSignUpForm,
  type SignUpField,
  type SignUpFormState,
  type SignUpTouchedState,
  type SignUpValidationErrors,
} from "../../packages/utils/auth/signUp"

const PASSWORD_HELPER_TEXT = "Use at least 8 characters with upper, lower case letters and a number"

export default function SignUpScreen() {
  const router = useRouter()
  const [form, setForm] = useState<SignUpFormState>(createInitialSignUpFormState)
  const [errors, setErrors] = useState<SignUpValidationErrors>({})
  const [touched, setTouched] = useState<SignUpTouchedState>(createSignUpTouchedState(false))
  const [loading, setLoading] = useState(false)

  const validateField = (field: SignUpField, value: string) => {
    return validateSignUpField(field, value)
  }

  const validateForm = () => {
    const { isValid, errors: validationErrors } = validateSignUpForm(form)
    setErrors(validationErrors)
    return isValid
  }

  const handleChange =
    (field: SignUpField) =>
    (value: string) => {
      if (field === "contactNo") {
        const digits = formatContactNumberInput(value)
        setForm((prev) => ({
          ...prev,
          [field]: digits,
        }))

        // Mark as touched on first input so error shows while typing
        if (!touched.contactNo) {
          setTouched((prev) => ({ ...prev, contactNo: true }))
        }

        const errorMessage = validateField(field, digits)
        setErrors((prev) => {
          const next = { ...prev }
          if (errorMessage) next[field] = errorMessage
          else delete next[field]
          return next
        })
        return
      }

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

  const handleBlur = (field: SignUpField) => () => {
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
    setTouched(createSignUpTouchedState(true))
  }

  const hasEmptyRequiredField = useMemo(
    () => hasEmptyRequiredSignUpField(form),
    [form],
  )

  const hasAnyError = useMemo(
    () => hasAnySignUpError(form),
    [form],
  )

  const isSubmitDisabled = loading || hasEmptyRequiredField || hasAnyError

  const handleSignUp = async () => {
    //console.log('handleSignUp');
    const isValid = validateForm()
    if (!isValid) {
      markAllTouched()
      //console.log('isValid', isValid);
      return
    }

    setLoading(true)
    try {
      const requestBody = buildSignUpRequestBody(form, "dealer")
      const { userId } = await signUpUser(requestBody)

      showSuccessToast("OTP sent successfully")
      setForm(createInitialSignUpFormState())
      setErrors({})
      setTouched(createSignUpTouchedState(false))
      // router.push("/(auth)/sign-in");
      router.push({
        pathname: "/verify-otp",
        params: { userId, isSignupOTP: "true" },
      })
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
          <Header title="Sign Up" subtitle="Enter details below to sign up" />
            <View style={styles.mainContent}>
              <View style={styles.form}>
                <TextInput
                  label="Full Name"
                  placeholder="Type here"
                  value={form.fullName}
                  onChangeText={handleChange("fullName")}
                  onBlur={handleBlur("fullName")}
                  error={touched.fullName ? errors.fullName : undefined}
                  editable={!loading}
                  labelStyle={styles.inputLabel}
                />

                <TextInput
                  label="Email"
                  placeholder="example@gmail.com"
                  value={form.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={touched.email ? errors.email : undefined}
                  editable={!loading}
                  labelStyle={styles.inputLabel}
                />

                <TextInput
                  label="Contact Number"
                  placeholder="03XXXXXXXXX"
                  value={form.contactNo}
                  onChangeText={handleChange("contactNo")}
                  onBlur={handleBlur("contactNo")}
                  keyboardType="phone-pad"
                  maxLength={11}
                  error={touched.contactNo ? errors.contactNo : undefined}
                  editable={!loading}
                  labelStyle={styles.inputLabel}
                />

                <TextInput
                  label="Estate Name"
                  placeholder="Type here"
                  value={form.estateName}
                  onChangeText={handleChange("estateName")}
                  onBlur={handleBlur("estateName")}
                  error={touched.estateName ? errors.estateName : undefined}
                  editable={!loading}
                  labelStyle={styles.inputLabel}
                />

                <TextInput
                  label="Set Password"
                  placeholder="Type here"
                  value={form.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  error={touched.password ? errors.password : undefined}
                  helperText={PASSWORD_HELPER_TEXT}
                  secureTextEntry
                  editable={!loading}
                  labelStyle={styles.inputLabel}
                />
              </View>

              <View>
                <Button title="Sign Up" onPress={handleSignUp} loading={loading} disabled={isSubmitDisabled} style={styles.button} />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <Text style={styles.footerLink} onPress={() => router.push("/(auth)/sign-in")}>
                    Sign In
                  </Text>
                </View>
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
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
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
    minWidth: '100%',
  },
  button: {
    marginTop: spacing.xl,
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