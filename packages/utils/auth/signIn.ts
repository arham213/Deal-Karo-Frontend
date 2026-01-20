import axios from "axios"
import type { User } from "../../../types/auth"

export type SignInField = "email" | "password"

export type SignInFormState = Record<SignInField, string>

export type SignInTouchedState = Record<SignInField, boolean>

export type SignInValidationErrors = Partial<Record<SignInField, string>>

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignInResult {
  token: string
  user: User
}

interface SignInApiResponse {
  success: boolean
  data?: SignInResult
  error?: {
    message?: string
  }
}

export const createInitialSignInFormState = (): SignInFormState => ({
  email: "",
  password: "",
})

export const createSignInTouchedState = (value: boolean): SignInTouchedState => ({
  email: value,
  password: value,
})

export const validateSignInField = (field: SignInField, value: string): string | undefined => {
  const trimmed = value.trim()

  switch (field) {
    case "email":
      if (!trimmed.length) return "Email is required"
      // Basic email validation – mirrors existing Validation.isEmail behaviour
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address"
      return undefined
    case "password":
      if (!value || !value.toString().trim().length) return "Password is required"
      return undefined
    default:
      return undefined
  }
}

export const validateSignInForm = (
  form: SignInFormState,
): {
  isValid: boolean
  errors: SignInValidationErrors
} => {
  const errors: SignInValidationErrors = {}

    ; (Object.keys(form) as SignInField[]).forEach((field) => {
      const errorMessage = validateSignInField(field, form[field])
      if (errorMessage) {
        errors[field] = errorMessage
      }
    })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const hasEmptySignInField = (form: SignInFormState): boolean =>
  (Object.keys(form) as SignInField[]).some((field) => !form[field]?.toString().trim().length)

export const hasAnySignInError = (form: SignInFormState): boolean =>
  (Object.keys(form) as SignInField[]).some((field) => Boolean(validateSignInField(field, form[field])))

export const signInWithEmailAndPassword = async ({
  email,
  password,
}: SignInCredentials): Promise<SignInResult> => {
  try {
    const response = await axios.post<SignInApiResponse>(
      "https://api.dealkroo.com/api/users/signin",
      {
        email: email.trim(),
        password,
      },
    )

    if (response.data?.success && response.data.data) {
      return response.data.data
    }

    const message = response.data?.error?.message || "Signin failed"
    throw new Error(message)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message || "Signin failed"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}


