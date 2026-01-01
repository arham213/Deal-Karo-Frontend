import axios from "axios"
import { Validation } from "../../../utils/validation"

export interface ForgotPasswordResult {
  userId: string
}

interface ForgotPasswordApiResponse {
  success: boolean
  data?: {
    userId: string
  }
  error?: {
    message?: string
  }
}

export const getForgotPasswordEmailError = (email: string): string | undefined => {
  const trimmed = email.trim()

  if (!Validation.isRequired(trimmed)) return "Email is required"
  if (!Validation.isEmail(trimmed)) return "Enter a valid email address"
  return undefined
}

export const sendForgotPasswordOtp = async (email: string): Promise<ForgotPasswordResult> => {
  try {
    const response = await axios.post<ForgotPasswordApiResponse>(
      "https://deal-karo-backend.vercel.app/api/users/forgotPassword",
      { email },
    )

    if (response.data?.success && response.data.data?.userId) {
      return { userId: response.data.data.userId }
    }

    const message = response.data?.error?.message || "Failed to send OTP"
    throw new Error(message)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message || "Failed to send OTP"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}


