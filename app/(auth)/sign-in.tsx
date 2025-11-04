"use client"

import { Header } from "@/components/auth/Header"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { saveToken, saveUser } from "@/utils/secureStore"
import axios from "axios"
import { useRouter } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function SignInScreen() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const BASE_URL = 'http://10.224.131.91:8080/api';

  const handleSignIn = async () => {
    if (!email || !password) {
      alert("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const userData = {
        email: email,
        password: password,
      }

      const response = await axios.post(`${BASE_URL}/users/signin`, userData);

      console.log('response:', response?.data);

      setLoading(false);

      if (response?.data.success) {
        await saveToken(response.data.data.token);
        await saveUser(response.data.data.user);
        router.push('/onboarding');
      } else {
        alert(response?.data.error.message || "Signin failed");
      }
    } catch (error) {
      setLoading(false)
      
      if (axios.isAxiosError(error)) {
        alert(error?.response?.data?.error?.message);
      } else {
        alert("Something went wrong. Please try again later")
      }
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Header title="Sign In" subtitle="Welcome back! Sign in to your account" />

          <View style={styles.mainContent}>
            <View style={styles.form}>
              <TextInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!loading}
              />

              <TextInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
            

            <Button title="Sign In" onPress={handleSignIn} loading={loading} style={styles.button} />

            <View style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordLink} onPress={() => router.push("/forgot-password")}>
                Forgot Password?
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Text style={styles.footerLink} onPress={() => router.push("/sign-up")}>
                Sign Up
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    padding: 24
  },
  form: {
    gap: 20,
    marginVertical: 30,
  },
  button: {
    marginTop: 20,
  },
  forgotPasswordContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  forgotPasswordLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
})