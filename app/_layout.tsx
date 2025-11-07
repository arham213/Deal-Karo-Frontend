"use client"

import { BottomNavigationBar } from "@/components/navigation/BottomNavigationBar"
import { Stack, usePathname } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { View } from "react-native"

export default function RootLayout() {
  const pathname = usePathname()

  // Hide bottom navigation bar on auth and onboarding screens
  const shouldShowBottomNav = !pathname?.includes("/auth/") && 
                               !pathname?.includes("/onboarding") &&
                               pathname !== "/" &&
                               pathname !== "/add-listing" &&
                               !pathname?.startsWith("/(auth)") &&
                               !pathname?.startsWith("/(onboarding)")

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

          {/* Main app flow */}
          <Stack.Screen name="(main)/index" options={{ title: "Home" }} />
        </Stack>
        
        {shouldShowBottomNav && <BottomNavigationBar />}
      </View>
    </>
  )
}