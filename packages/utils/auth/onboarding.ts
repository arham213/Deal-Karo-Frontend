import axios from "axios"
import type { User } from "../../../types/auth"

export interface CompleteOnboardingParams {
  token: string
  userId: string
  baseUrl?: string
}

export interface CompleteOnboardingResult {
  user: User
}

interface CompleteOnboardingApiResponse {
  success: boolean
  data?: {
    user: User
  }
  error?: {
    message?: string
  }
  message?: string
}

export const completeOnboarding = async ({
  token,
  userId,
  baseUrl = "http://10.103.65.91:8080/api",
}: CompleteOnboardingParams): Promise<CompleteOnboardingResult> => {
  try {
    const response = await axios.put<CompleteOnboardingApiResponse>(
      `${baseUrl}/users/`,
      {
        _id: userId,
        onBoardingCompleted: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (response.data?.success && response.data.data?.user) {
      return {
        user: response.data.data.user,
      }
    }

    const message =
      response.data?.error?.message || response.data?.message || "Failed to complete onboarding"
    throw new Error(message)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error.message ||
        "Failed to complete onboarding"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}


