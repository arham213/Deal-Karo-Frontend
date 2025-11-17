import axios from "axios"
import { clearAuthData, getToken } from "./secureStore"
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
          // Token expired, clear auth data
          await clearAuthData()
          // Reject the request - the calling code should handle navigation
          return Promise.reject(new Error("Token expired"))
        }
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      //console.error("Error in request interceptor:", error)
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

    // If error is 401 (Unauthorized) and we haven't retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Check if token is expired
        const token = await getToken()
        if (token && isTokenExpired(token)) {
          // Token expired, clear auth data
          await clearAuthData()
          // Reject the request - the calling code should handle navigation
          return Promise.reject(new Error("Token expired. Please login again."))
        }
      } catch (error) {
        //console.error("Error in response interceptor:", error)
        await clearAuthData()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient

