import axios from "axios"
import { clearAuthData, getToken } from "./secureStore"
import { isTokenExpired } from "./tokenValidation"

const BASE_URL = "http://10.190.83.91:8080/api"

// Create axios instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
      console.error("Error in request interceptor:", error)
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
        console.error("Error in response interceptor:", error)
        await clearAuthData()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient

