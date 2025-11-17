"use client"

import "@/styles/global-text"

import { BottomNavigationBar } from "@/components/navigation/BottomNavigationBar"
import { ToastProvider } from "@/components/Toast"
import { Colors } from "@/constants/colors"
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext"
import { Stack, usePathname, useRouter } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync()

function RootLayoutContent() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, isOnboardingCompleted } = useAuthContext()

  // Hide splash screen once auth check is complete
  useEffect(() => {
    if (!isLoading) {
      // Hide splash screen after auth check is complete
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors if splash screen is already hidden
      })
    }
  }, [isLoading])

  // Protect routes - redirect unauthenticated users to sign-in
  // Note: Authenticated users trying to access auth screens are handled by Redirect component below
  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) return // Authenticated users are handled by Redirect component

    // Normalize pathname for checking
    const normalizedPath = pathname || ""
    
    // More explicit check for auth screens including forgot-password, reset-password, verify-otp
    const isAuthScreen = normalizedPath.startsWith("/(auth)") || 
                        normalizedPath.startsWith("/auth") ||
                        normalizedPath === "/sign-in" || 
                        normalizedPath === "/sign-up" ||
                        normalizedPath.includes("forgot-password") ||
                        normalizedPath.includes("reset-password") ||
                        normalizedPath.includes("verify-otp")
    
    const isOnboardingScreen = normalizedPath.startsWith("/(onboarding)") || 
                               normalizedPath.startsWith("/onboarding") ||
                               normalizedPath === "/onboarding"

    // If user is not authenticated and not on auth screen, redirect to sign-in
    // Allow all auth screens including forgot-password, reset-password, verify-otp
    // Don't redirect if already on an auth screen (allows navigation between auth screens)
    if (!isAuthScreen && !isOnboardingScreen && normalizedPath !== "/" && normalizedPath !== "") {
      router.replace("/(auth)/sign-in")
    }
  }, [isAuthenticated, isLoading, pathname, router])

  // Hide bottom navigation bar on auth and onboarding screens
  const shouldShowBottomNav = 
    !pathname?.includes("/auth/") && 
    !pathname?.includes("/onboarding") &&
    pathname !== "/" &&
    pathname !== "/add-listing" &&
    !pathname?.startsWith("/(auth)") &&
    !pathname?.startsWith("/(onboarding)") &&
    isAuthenticated &&
    !isLoading

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <>
      <StatusBar backgroundColor="#F8F9FA" />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Auth flow */}
          <Stack.Screen name="(auth)/sign-in" options={{ title: "Sign In" }} />
          <Stack.Screen name="(auth)/sign-up" options={{ title: "Sign Up" }} />
          <Stack.Screen name="(auth)/forgot-password" options={{ title: "Forgot Password" }} />
          <Stack.Screen name="(auth)/reset-password" options={{ title: "Reset Password" }} />
          <Stack.Screen name="(auth)/verify-otp" options={{ title: "Verify OTP" }} />

          {/* Onboarding */}
          <Stack.Screen name="(onboarding)/onboarding" options={{ title: "Onboarding" }} />

          {/* Main app flow */}
          <Stack.Screen name="(main)/index" options={{ title: "Home" }} />
          <Stack.Screen name="(listings)/listings" options={{ title: "Listings" }} />
          <Stack.Screen name="(listings)/add-listing" options={{ title: "Add Listing" }} />
          <Stack.Screen name="(listings)/my-listings" options={{ title: "My Listings" }} />
          <Stack.Screen name="(notes)/my-notes" options={{ title: "My Notes" }} />
          <Stack.Screen name="(user)/profile" options={{ title: "Profile" }} />
        </Stack>
        
        {shouldShowBottomNav && <BottomNavigationBar />}
        <ToastProvider />
      </View>
    </>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral10,
  },
})