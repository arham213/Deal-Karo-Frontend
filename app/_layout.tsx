"use client"

import "@/styles/global-text"

import { BottomNavigationBar } from "@/components/navigation/BottomNavigationBar"
import { Colors } from "@/constants/colors"
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext"
import { Stack, usePathname, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"

function RootLayoutContent() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, isOnboardingCompleted } = useAuthContext()

  // Protect routes - redirect authenticated users away from auth screens
  useEffect(() => {
    if (isLoading) return

    const isAuthScreen = pathname?.startsWith("/(auth)") || pathname === "/sign-in" || pathname === "/sign-up"
    const isOnboardingScreen = pathname?.startsWith("/(onboarding)") || pathname === "/onboarding"

    if (isAuthenticated) {
      // If user is authenticated and on auth screen, redirect to appropriate screen
      // But allow navigation to forgot-password, reset-password, and verify-otp even when authenticated
      const isPasswordFlow = pathname?.includes("forgot-password") || 
                            pathname?.includes("reset-password") || 
                            pathname?.includes("verify-otp")
      
      // Only redirect if on sign-in or sign-up screens, not on password flow screens
      if ((pathname === "/(auth)/sign-in" || pathname === "/(auth)/sign-up" || pathname === "/sign-in" || pathname === "/sign-up") && !isPasswordFlow) {
        if (isOnboardingCompleted) {
          router.replace("/(listings)/listings")
        } else {
          router.replace("/(onboarding)/onboarding")
        }
      }
    } else {
      // If user is not authenticated and not on auth screen, redirect to sign-in
      // Allow all auth screens including forgot-password, reset-password, verify-otp
      // Don't redirect if already on an auth screen (allows navigation between auth screens)
      if (!isAuthScreen && !isOnboardingScreen && pathname !== "/") {
        router.replace("/(auth)/sign-in")
      }
    }
  }, [isAuthenticated, isLoading, pathname, isOnboardingCompleted, router])

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