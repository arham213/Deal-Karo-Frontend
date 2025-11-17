"use client"

import { Header } from "@/components/auth/Header"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { fontSizes, fontWeights, layoutStyles, radius, spacing, typographyStyles } from "@/styles"
import { showErrorToast, showSuccessToast } from "@/utils/toast"
import { Validation, type ValidationErrors } from "@/utils/validation"
import axios from "axios"
import { useRouter } from "expo-router"
import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

type SignUpField = "fullName" | "email" | "contactNo" | "estateName" | "password"

type SignUpFormState = Record<SignUpField, string>

const createInitialFormState = (): SignUpFormState => ({
  fullName: "",
  email: "",
  contactNo: "",
  estateName: "",
  password: "",
})

const createTouchedState = (value: boolean) =>
  ({
    fullName: value,
    email: value,
    contactNo: value,
    estateName: value,
    password: value,
  }) as Record<SignUpField, boolean>

const PASSWORD_HELPER_TEXT = "Use at least 8 characters with upper, lower case letters and a number"

export default function SignUpScreen() {
  const router = useRouter()
  const [form, setForm] = useState<SignUpFormState>(createInitialFormState)
  const [errors, setErrors] = useState<ValidationErrors<SignUpField>>({})
  const [touched, setTouched] = useState<Record<SignUpField, boolean>>(createTouchedState(false))
  const [loading, setLoading] = useState(false)

  const BASE_URL = 'https://deal-karo-backend.vercel.app/api';

  const validateField = (field: SignUpField, value: string) => {
    const trimmed = value.trim()
    switch (field) {
      case "fullName":
        if (!Validation.isRequired(trimmed)) return "Full name is required"
        if (!Validation.hasMinLength(trimmed, 3)) return "Full name must be at least 3 characters"
        return undefined
      case "email":
        if (!Validation.isRequired(trimmed)) return "Email is required"
        if (!Validation.isEmail(trimmed)) return "Enter a valid email address"
        return undefined
      case "contactNo": {
        if (!Validation.isRequired(trimmed)) return "Contact number is required"
        if (!Validation.isPakistaniMobile11(trimmed)) return "Enter 11-digit Pakistani number (e.g. 03XXXXXXXXX)"
        return undefined
      }
      case "estateName":
        if (!Validation.isRequired(trimmed)) return "Estate name is required"
        return undefined
      case "password":
        if (!Validation.isRequired(value)) return "Password is required"
        if (!Validation.isStrongPassword(value)) return "Password must include upper, lower case letters and a number"
        return undefined
      default:
        return undefined
    }
  }

  const validateForm = () => {
    const newErrors: ValidationErrors<SignUpField> = {}
    ;(Object.keys(form) as SignUpField[]).forEach((field) => {
      const errorMessage = validateField(field, form[field])
      if (errorMessage) {
        newErrors[field] = errorMessage
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange =
    (field: SignUpField) =>
    (value: string) => {
      if (field === "contactNo") {
        const digits = Validation.digitsOnly(value).slice(0, 11)
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
    setTouched(createTouchedState(true))
  }

  const hasEmptyRequiredField = useMemo(
    () => (Object.keys(form) as SignUpField[]).some((field) => !Validation.isRequired(form[field])),
    [form],
  )

  const hasAnyError = useMemo(
    () => (Object.keys(form) as SignUpField[]).some((field) => Boolean(validateField(field, form[field]))),
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
      const userData = {
        name: form.fullName.trim(),
        email: form.email.trim(),
        contactNo: Validation.digitsOnly(form.contactNo),
        estateName: form.estateName.trim(),
        password: form.password,
        role: "dealer"
      }

      //console.log('userData:', userData);
      //console.log('sending request to:', `${BASE_URL}/users/signup`);

      const response = await axios.post(`${BASE_URL}/users/signup`, userData);

      //console.log('response:', response.data);

      if (response?.data.success) {
        showSuccessToast("OTP sent successfully");
        setForm(createInitialFormState())
        setErrors({})
        setTouched(createTouchedState(false))
        // router.push("/(auth)/sign-in");
        router.push({
          pathname: '/verify-otp',
          params: { userId: response.data.data.userId, isSignupOTP: "true" }
       });
      } else {
        showErrorToast(response?.data.error.message || "Signup failed");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showErrorToast(error?.response?.data?.error?.message || "Signup failed");
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