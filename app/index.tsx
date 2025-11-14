"use client"

import { Colors } from "@/constants/colors"
import { useAuthContext } from "@/contexts/AuthContext"
import { Redirect } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"

export default function Index() {
  const { isAuthenticated, isLoading, isOnboardingCompleted } = useAuthContext()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return

    if (isAuthenticated) {
      // User is authenticated, check onboarding status
      if (isOnboardingCompleted) {
        setRedirectPath("/(listings)/listings")
      } else {
        setRedirectPath("/(onboarding)/onboarding")
      }
    } else {
      // User is not authenticated, redirect to sign-in
      setRedirectPath("/(auth)/sign-in")
    }
  }, [isAuthenticated, isLoading, isOnboardingCompleted])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (redirectPath) {
    return <Redirect href={redirectPath as any} />
  }

  // Default fallback
  return <Redirect href="/(auth)/sign-in" />
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral10,
  },
})