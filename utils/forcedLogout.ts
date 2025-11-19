import { clearAuthData } from "./secureStore"
import { showErrorToast } from "./toast"

// Flag to prevent multiple simultaneous logout attempts
let isLoggingOut = false
let logoutPromise: Promise<void> | null = null

// Global logout callback that will be set by AuthContext
let globalLogoutCallback: ((message?: string) => Promise<void>) | null = null

/**
 * Set the global logout callback from AuthContext
 * This allows interceptors to trigger logout through the context
 */
export function setLogoutCallback(callback: (message?: string) => Promise<void>) {
  globalLogoutCallback = callback
}

/**
 * Force logout user with a message and redirect to sign-in
 * This can be called from anywhere, including axios interceptors
 * @param message - Optional message to show to the user (default: "Session expired. Please sign in again.")
 */
export async function forceLogout(message?: string): Promise<void> {
  // If already logging out, return the existing promise
  if (isLoggingOut && logoutPromise) {
    return logoutPromise
  }

  // Set flag and create promise
  isLoggingOut = true
  logoutPromise = (async () => {
    try {
      // Clear all auth data first
      await clearAuthData()
      
      // Show toast message
      const logoutMessage = message || "Session expired. Please sign in again."
      
      // Use the global logout callback if available (set by AuthContext)
      // This ensures proper state updates and navigation
      if (globalLogoutCallback) {
        // Show toast first, then trigger logout
        showErrorToast(logoutMessage, "Session Expired")
        // Small delay to ensure toast is visible before navigation
        await new Promise(resolve => setTimeout(resolve, 100))
        // Pass empty string to prevent duplicate toast in logout function
        await globalLogoutCallback("")
      } else {
        // Fallback: show toast and try direct navigation if callback not set yet
        showErrorToast(logoutMessage, "Session Expired")
        try {
          const { router } = await import("expo-router")
          // Use a delay to ensure toast is visible
          await new Promise(resolve => setTimeout(resolve, 300))
          router.replace("/(auth)/sign-in")
        } catch (routerError) {
          // Router might not be available, that's okay
          console.warn("Router not available in forceLogout:", routerError)
        }
      }
    } catch (error) {
      console.error("Error during forced logout:", error)
      // Even if there's an error, try to use callback or router
      if (globalLogoutCallback) {
        try {
          await globalLogoutCallback("")
        } catch (e) {
          // Ignore errors in fallback
        }
      } else {
        try {
          const { router } = await import("expo-router")
          router.replace("/(auth)/sign-in")
        } catch (e) {
          // Ignore errors
        }
      }
    } finally {
      // Reset flag after a delay to allow navigation to complete
      setTimeout(() => {
        isLoggingOut = false
        logoutPromise = null
      }, 2000)
    }
  })()

  return logoutPromise
}
