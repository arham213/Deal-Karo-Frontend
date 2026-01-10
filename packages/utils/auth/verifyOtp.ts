import axios from "axios"
import type { User } from "../../../types/auth"

export const OTP_LENGTH = 4

export type OtpArray = string[]

export interface VerifyOtpParams {
  userId: string
  isSignupOtp: boolean
  otpCode: string
}

export interface VerifyOtpSignupResult {
  type: "signup"
  token: string
  user: User
}

export interface VerifyOtpResetPasswordResult {
  type: "resetPassword"
  userId: string
}

export type VerifyOtpResult = VerifyOtpSignupResult | VerifyOtpResetPasswordResult

interface VerifyEmailApiResponse {
  success: boolean
  data?: {
    token: string
    user: User
  }
  error?: {
    message?: string
  }
}

interface VerifyResetPasswordApiResponse {
  success: boolean
  data?: {
    userId: string
  }
  error?: {
    message?: string
  }
}

interface ResendOtpApiResponse {
  success: boolean
  error?: {
    message?: string
  }
}

export const createInitialOtpState = (length: number = OTP_LENGTH): OtpArray =>
  Array.from({ length }, () => "")

export const formatOtpDigitInput = (value: string): string =>
  value.replace(/\D/g, "").slice(0, 1)

export const getOtpCodeFromArray = (otp: OtpArray): string => otp.join("")

export const isOtpComplete = (otp: OtpArray): boolean =>
  getOtpCodeFromArray(otp).length === OTP_LENGTH

export const verifyOtp = async ({
  userId,
  isSignupOtp,
  otpCode,
}: VerifyOtpParams): Promise<VerifyOtpResult> => {
  try {
    const baseUrl = "https://api.dealkroo.com/api"

    if (isSignupOtp) {
      const response = await axios.post<VerifyEmailApiResponse>(`${baseUrl}/users/verifyEmail`, {
        userId,
        OTP: otpCode,
      })

      if (response.data?.success && response.data.data?.token && response.data.data.user) {
        return {
          type: "signup",
          token: response.data.data.token,
          user: response.data.data.user,
        }
      }

      const message = response.data?.error?.message || "OTP verification failed"
      throw new Error(message)
    } else {
      const response = await axios.post<VerifyResetPasswordApiResponse>(
        `${baseUrl}/users/verify-reset-password-otp`,
        {
          userId,
          OTP: otpCode,
        },
      )

      if (response.data?.success && response.data.data?.userId) {
        return {
          type: "resetPassword",
          userId: response.data.data.userId,
        }
      }

      const message = response.data?.error?.message || "OTP verification failed"
      throw new Error(message)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message || "OTP verification failed"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}

export interface ResendOtpParams {
  userId: string
  isSimpleOtp?: boolean
}

export const resendOtp = async ({
  userId,
  isSimpleOtp = false,
}: ResendOtpParams): Promise<void> => {
  try {
    const baseUrl = "https://api.dealkroo.com/api"

    const response = await axios.post<ResendOtpApiResponse>(`${baseUrl}/users/resendOTP`, {
      userId,
      isSimpleOTP: isSimpleOtp,
    })

    if (!response.data?.success) {
      const message = response.data?.error?.message || "Failed to resend OTP"
      throw new Error(message)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message || "Failed to resend OTP"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}


