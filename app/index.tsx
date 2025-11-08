"use client"

import { Colors } from "@/constants/colors"
import { getOnboardingCompleted } from "@/utils/secureStore"
import { validateAuth } from "@/utils/tokenValidation"
import { Redirect } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"

export default function Index() {
  const [isLoading, setIsLoading] = useState(true)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndRedirect()
  }, [])

  const checkAuthAndRedirect = async () => {
    try {
      // Check if user has valid token
      const { isValid } = await validateAuth()
      
      if (isValid) {
        // User is authenticated, check onboarding status
        const onboardingCompleted = await getOnboardingCompleted()
        if (onboardingCompleted === "true") {
          setRedirectPath("/listings")
        } else {
          setRedirectPath("/onboarding")
        }
      } else {
        // User is not authenticated, redirect to sign-in
        setRedirectPath("/(auth)/sign-in")
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      setRedirectPath("/(auth)/sign-in")
    } finally {
      setIsLoading(false)
    }
  }

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