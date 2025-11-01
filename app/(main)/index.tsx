"use client"

import { Colors } from "@/constants/colors"
import { useRouter } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>DEALS</Text>
        <Text style={styles.title}>Welcome to Deal Karo</Text>
        <Text style={styles.subtitle}>Find the best deals in your area</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.signUpButton} onPress={() => router.push("/(auth)/sign-up")}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    alignItems: "center",
    marginTop: 60,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 30,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  buttonContainer: {
    gap: 16,
  },
  signUpButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  signUpButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signInLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
})