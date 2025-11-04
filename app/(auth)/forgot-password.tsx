"use client"

import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Header } from "@/components/auth/Header"
import { Colors } from "@/constants/colors"
import axios from "axios"
import { useRouter } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const BASE_URL = 'http://10.224.131.91:8080/api';

  const handleSendOTP = async () => {
    if (!email) {
      alert("Please enter your email")
      return
    }

    setLoading(true)
    try {
      const userData = {
        email: email,
      }

      const response = await axios.post(`${BASE_URL}/users/forgotPassword`, userData);

      console.log('response:', response.data);

      setLoading(false);

      if (response?.data.success) {
        alert("OTP sent successfully");
        router.push({
           pathname: '/verify-otp',
           params: { userId: response.data.data.userId}
        });
      } else {
        alert(response?.data.error.message);
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Header title="Forgot Password" subtitle="Enter your email to reset your password" />

        <View style={styles.form}>
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        <Button title="Send OTP" onPress={handleSendOTP} loading={loading} style={styles.button} />

        <View style={styles.footer}>
          <Text style={styles.footerLink} onPress={() => router.push("/sign-in")}>
            Back to Sign In
          </Text>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  form: {
    gap: 20,
    marginVertical: 30,
  },
  button: {
    marginTop: 20,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
})