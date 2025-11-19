import axios from "axios"
import { forceLogout } from "./forcedLogout"
import { getToken } from "./secureStore"
import { showErrorToast } from "./toast"
import { isTokenExpired } from "./tokenValidation"

const BASE_URL = "https://deal-karo-backend.vercel.app/api"

// Create axios instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  // Provide a friendlier default timeout message
  timeoutErrorMessage: "The request took too long and timed out.",
})

// Request interceptor to add token and check expiration
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken()
      if (token) {
        // Check if token is expired before making request
        if (isTokenExpired(token)) {
          // Token expired, force logout with message
          await forceLogout("Your session has expired. Please sign in again.")
          return Promise.reject(new Error("Token expired"))
        }
        config.headers.Authorization = `Bearer ${token}`
      } else {
        // Token is missing, force logout
        await forceLogout("You have been logged out. Please sign in again.")
        return Promise.reject(new Error("Token missing"))
      }
    } catch (error) {
      //console.error("Error in request interceptor:", error)
      // If error occurs, still try to force logout
      if (error instanceof Error && (error.message === "Token expired" || error.message === "Token missing")) {
        // Already handled by forceLogout
        return Promise.reject(error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle request timeout errors
    if (error.code === "ECONNABORTED" || error.message?.toLowerCase()?.includes("timeout")) {
      showErrorToast("Request timed out. Please check your connection and try again.", "Network timeout")
      return Promise.reject(error)
    }

    // Handle network errors (server down / no internet)
    if (!error.response || error.code === "ERR_NETWORK") {
      showErrorToast("Unable to connect to the server. Please try again later.", "Network error")
      return Promise.reject(error)
    }

    // If error is 401 (Unauthorized) or 404 with user not found message
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Check if token is expired
        const token = await getToken()
        if (token && isTokenExpired(token)) {
          // Token expired, force logout
          await forceLogout("Your session has expired. Please sign in again.")
          return Promise.reject(new Error("Token expired. Please login again."))
        } else {
          // 401 but token is not expired - likely invalid token or user not found
          const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || ""
          const isUserNotFound = errorMessage.toLowerCase().includes("user not found") ||
                                errorMessage.toLowerCase().includes("invalid token") ||
                                errorMessage.toLowerCase().includes("user does not exist")
          
          if (isUserNotFound || !token) {
            await forceLogout("You have been logged out. Please sign in again.")
          } else {
            await forceLogout("Session expired. Please sign in again.")
          }
          return Promise.reject(error)
        }
      } catch (error) {
        //console.error("Error in response interceptor:", error)
        await forceLogout("You have been logged out. Please sign in again.")
        return Promise.reject(error)
      }
    }

    // Handle 404 with user not found message
    if (error.response?.status === 404) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || ""
      if (errorMessage.toLowerCase().includes("user not found")) {
        await forceLogout("User not found. Please sign in again.")
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient

