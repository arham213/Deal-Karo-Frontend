"use client"

import { User } from "@/types/auth"
import { setLogoutCallback } from "@/utils/forcedLogout"
import { getOnboardingCompleted, getUser } from "@/utils/secureStore"
import { showErrorToast } from "@/utils/toast"
import { validateAuth } from "@/utils/tokenValidation"
import { useRouter } from "expo-router"
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"

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
        const onboardingStatus = await getOnboardingCompleted()
        
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
  }, [router])

  // Check auth status on mount
  useEffect(() => {
    checkAuth()
  }, [])

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

