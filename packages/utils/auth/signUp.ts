import axios from "axios"
import { Validation } from "../../../utils/validation"

export type SignUpField = "fullName" | "email" | "contactNo" | "estateName" | "password"

export type SignUpFormState = Record<SignUpField, string>

export type SignUpTouchedState = Record<SignUpField, boolean>

export type SignUpValidationErrors = Partial<Record<SignUpField, string>>

export interface SignUpRequestBody {
  name: string
  email: string
  contactNo: string
  estateName: string
  password: string
  role: "dealer" | "admin"
}

export interface SignUpResult {
  userId: string
}

interface SignUpApiResponse {
  success: boolean
  data?: {
    userId: string
  }
  error?: {
    message?: string
  }
}

export const createInitialSignUpFormState = (): SignUpFormState => ({
  fullName: "",
  email: "",
  contactNo: "",
  estateName: "",
  password: "",
})

export const createSignUpTouchedState = (value: boolean): SignUpTouchedState => ({
  fullName: value,
  email: value,
  contactNo: value,
  estateName: value,
  password: value,
})

export const formatContactNumberInput = (value: string): string => {
  const digits = Validation.digitsOnly(value)
  return digits.slice(0, 11)
}

export const validateSignUpField = (field: SignUpField, value: string): string | undefined => {
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
    case "contactNo":
      if (!Validation.isRequired(trimmed)) return "Contact number is required"
      if (!Validation.isPakistaniMobile11(trimmed))
        return "Enter 11-digit Pakistani number (e.g. 03XXXXXXXXX)"
      return undefined
    case "estateName":
      if (!Validation.isRequired(trimmed)) return "Estate name is required"
      return undefined
    case "password":
      if (!Validation.isRequired(value)) return "Password is required"
      if (!Validation.isStrongPassword(value))
        return "Password must include upper, lower case letters and a number"
      return undefined
    default:
      return undefined
  }
}

export const validateSignUpForm = (
  form: SignUpFormState,
): {
  isValid: boolean
  errors: SignUpValidationErrors
} => {
  const errors: SignUpValidationErrors = {}

    ; (Object.keys(form) as SignUpField[]).forEach((field) => {
      const errorMessage = validateSignUpField(field, form[field])
      if (errorMessage) {
        errors[field] = errorMessage
      }
    })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const hasEmptyRequiredSignUpField = (form: SignUpFormState): boolean =>
  (Object.keys(form) as SignUpField[]).some(
    (field) => !Validation.isRequired(form[field]),
  )

export const hasAnySignUpError = (form: SignUpFormState): boolean =>
  (Object.keys(form) as SignUpField[]).some((field) =>
    Boolean(validateSignUpField(field, form[field])),
  )

export const buildSignUpRequestBody = (
  form: SignUpFormState,
  role: "dealer" | "admin" = "dealer",
): SignUpRequestBody => ({
  name: form.fullName.trim(),
  email: form.email.trim(),
  contactNo: Validation.digitsOnly(form.contactNo),
  estateName: form.estateName.trim(),
  password: form.password,
  role,
})

export const signUpUser = async (body: SignUpRequestBody): Promise<SignUpResult> => {
  try {
    const response = await axios.post<SignUpApiResponse>(
      "http://10.103.65.91:8080/api/users/signup",
      body,
    )

    if (response.data?.success && response.data.data?.userId) {
      return { userId: response.data.data.userId }
    }

    const message = response.data?.error?.message || "Signup failed"
    throw new Error(message)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message || "Signup failed"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}


