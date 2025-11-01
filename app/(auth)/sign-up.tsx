"use client"

import { Header } from "@/components/auth/Header"
import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import axios from "axios"
import { useRouter } from "expo-router"
import { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function SignUpScreen() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [contactNo, setContactNo] = useState("")
  const [estateName, setEstateName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const BASE_URL = 'http://10.224.131.91:8080/api';

  const handleSignUp = async () => {
    if (!fullName || !contactNo || !estateName) {
      alert("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const userData = {
        name: fullName,
        email: email,
        contactNo: contactNo,
        estateName: estateName,
        password: password,
        role: "dealer"
      }

      const response = await axios.post(`${BASE_URL}/users/signup`, userData);

      console.log('response:', response.data);

      setLoading(false);

      if (response?.data.success) {
        alert("Signup Successful");
        router.push('/sign-in');
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
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Header title="Sign Up" subtitle="Enter details below to sign up" />

          <View style={styles.mainContent}>
            <View style={styles.form}>
              <TextInput
                label="Full Name"
                placeholder="Type here"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
              />

              <TextInput
                label="Email"
                placeholder="example@gmail.com"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />

              <TextInput
                label="Contact Number"
                placeholder="+92 300 xxxx xxx"
                value={contactNo}
                onChangeText={setContactNo}
                keyboardType="phone-pad"
                editable={!loading}
              />

              <TextInput
                label="Estate Name"
                placeholder="Type here"
                value={estateName}
                onChangeText={setEstateName}
                editable={!loading}
              />

              <TextInput
                label="Set Password"
                placeholder="Type here"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>

            <Button title="Sign Up" onPress={handleSignUp} loading={loading} style={styles.button} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text style={styles.footerLink} onPress={() => router.push("/sign-in")}>
                Sign In
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