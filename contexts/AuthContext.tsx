"use client"

import { connectSocket, disconnectSocket } from "@/services/socketService"
import { User } from "@/types/auth"
import { setLogoutCallback } from "@/utils/forcedLogout"
import { initializeNotifications, unregisterPushToken } from "@/utils/notificationService"
import { getOnboardingCompleted, getUser } from "@/utils/secureStore"
import { showErrorToast } from "@/utils/toast"
import { validateAuth } from "@/utils/tokenValidation"
import { useRouter } from "expo-router"
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react"

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isOnboardingCompleted: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: (message?: string) => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false)
  const router = useRouter()
  const notificationsInitialized = useRef(false)
  const socketInitialized = useRef(false)

  const setToken = async (newToken: string | null) => {
    setTokenState(newToken)
    if (newToken) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }

  const checkAuth = async () => {
    try {
      setIsLoading(true)

      // Check if token exists and is valid
      const { isValid, token: validatedToken } = await validateAuth()

      if (isValid && validatedToken) {
        // Token is valid, get user data
        const storedUser = await getUser()
        let onboardingStatus = await getOnboardingCompleted()

        // Fallback: if key is missing, check user object (defensive fix for existing users)
        if (!onboardingStatus && storedUser?.onBoardingCompleted) {
          onboardingStatus = "true"
          // Sync to separate key for consistency
          const { saveOnboardingCompleted } = await import("@/utils/secureStore")
          await saveOnboardingCompleted("true").catch(() => {
            // Ignore errors if save fails
          })
        }

        // Debug logging (safe for production, can be removed after verification)
        if (__DEV__) {
          console.log('[AuthContext] Onboarding status:', {
            fromKey: onboardingStatus,
            fromUser: storedUser?.onBoardingCompleted,
            final: onboardingStatus === "true"
          })
        }

        setTokenState(validatedToken)
        setUser(storedUser)
        setIsAuthenticated(true)
        setIsOnboardingCompleted(onboardingStatus === "true")
      } else {
        // Token is invalid or expired
        setTokenState(null)
        setUser(null)
        setIsAuthenticated(false)
        setIsOnboardingCompleted(false)
      }
    } catch (error) {
      //console.error("Error checking auth:", error)
      setTokenState(null)
      setUser(null)
      setIsAuthenticated(false)
      setIsOnboardingCompleted(false)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = useCallback(async (message?: string) => {
    try {
      // Unregister push token before clearing auth
      if (token) {
        await unregisterPushToken(token)
      }

      const { clearAuthData } = await import("@/utils/secureStore")
      await clearAuthData()
      setTokenState(null)
      setUser(null)
      setIsAuthenticated(false)
      setIsOnboardingCompleted(false)

      // Show logout message if provided (empty string means toast already shown by forceLogout)
      if (message && message !== "") {
        showErrorToast(message, "Session Expired")
      }

      router.replace("/(auth)/sign-in")
    } catch (error) {
      //console.error("Error during logout:", error)
    }
  }, [router, token])

  // Check auth status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Initialize notifications when user logs in
  useEffect(() => {
    if (isAuthenticated && token && !notificationsInitialized.current) {
      notificationsInitialized.current = true
      initializeNotifications(token).catch(console.error)
    }

    // Reset flag on logout
    if (!isAuthenticated) {
      notificationsInitialized.current = false
    }
  }, [isAuthenticated, token])

  // Global socket connection when user logs in
  useEffect(() => {
    const initSocket = async () => {
      if (isAuthenticated && !socketInitialized.current) {
        const storedUser = await getUser()
        if (storedUser) {
          socketInitialized.current = true
          connectSocket(storedUser)
          console.log('[AuthContext] Socket connected globally')
        }
      }

      // Disconnect socket on logout
      if (!isAuthenticated && socketInitialized.current) {
        socketInitialized.current = false
        disconnectSocket()
        console.log('[AuthContext] Socket disconnected')
      }
    }

    initSocket()
  }, [isAuthenticated])

  // Register logout callback for interceptors to use
  useEffect(() => {
    // Set the global logout callback so interceptors can trigger logout
    setLogoutCallback(async () => {
      await logout()
    })

    // Cleanup: remove callback when component unmounts
    return () => {
      setLogoutCallback(() => Promise.resolve())
    }
  }, [logout])

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    isOnboardingCompleted,
    setUser,
    setToken,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}

