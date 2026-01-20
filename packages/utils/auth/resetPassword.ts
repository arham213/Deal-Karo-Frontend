import axios from "axios"
import { Validation, type ValidationErrors } from "../../../utils/validation"

export type ResetPasswordField = "password" | "confirmPassword"

export type ResetPasswordErrors = ValidationErrors<ResetPasswordField>

export interface ResetPasswordPayload {
  userId: string
  password: string
}

interface ResetPasswordApiResponse {
  success: boolean
  error?: {
    message?: string
  }
}

export const validateResetPasswordField = (
  field: ResetPasswordField,
  value: string,
  password: string,
): string | undefined => {
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

export const validateResetPasswordForm = (
  password: string,
  confirmPassword: string,
): {
  isValid: boolean
  errors: ResetPasswordErrors
} => {
  const passwordError = validateResetPasswordField("password", password, password)
  const confirmError = validateResetPasswordField(
    "confirmPassword",
    confirmPassword,
    password,
  )

  const errors: ResetPasswordErrors = {}
  if (passwordError) errors.password = passwordError
  if (confirmError) errors.confirmPassword = confirmError

  return {
    isValid: !passwordError && !confirmError,
    errors,
  }
}

export const getPasswordChecks = (password: string, confirmPassword: string) => ({
  length: Validation.hasMinLength(password, 8),
  uppercase: Validation.hasUppercase(password),
  lowercase: Validation.hasLowercase(password),
  number: Validation.hasNumber(password),
  match: Boolean(password) && password === confirmPassword,
})

export const resetPasswordForUser = async ({
  userId,
  password,
}: ResetPasswordPayload): Promise<void> => {
  try {
    const response = await axios.post<ResetPasswordApiResponse>(
      "https://api.dealkroo.com/api/users/resetPassword",
      {
        userId,
        password,
      },
    )

    if (!response.data?.success) {
      const message = response.data?.error?.message || "Failed to reset password"
      throw new Error(message)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message || "Failed to reset password"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}


