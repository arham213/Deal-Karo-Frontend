"use client"

import { Button } from "@/components/Button"
import { Colors } from "@/constants/colors"
import { useAuthContext } from "@/contexts/AuthContext"
import { fontFamilies, fontSizes, fontWeights, spacing } from "@/styles/tokens"
import { getToken, getUser, saveOnboardingCompleted, saveUser } from "@/utils/secureStore"
import { showErrorToast, showSuccessToast } from "@/utils/toast"
import axios from "axios"
import { useRouter } from "expo-router"
import { useRef, useState } from "react"
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

const onboardingData = [
  {
    id: 1,
    title: "Add your inventory effortlessly.",
    description: "Add and help other dealers to find and contact you easily.",
    image: require("../../assets/images/onboarding.png"),
  },
  {
    id: 2,
    title: "Deal Property required for Sale.",
    description: "Easily find the on sale properties through real time authentic listings.",
    image: require("../../assets/images/onboarding.png"),
  },
  // {
  //   id: 3,
  //   title: "Deal Property required for Rent.",
  //   description: "Easily find the on rent properties through real time authentic listings.",
  //   image: require("../../assets/images/onboarding.png"),
  // },
  {
    id: 4,
    title: "Deal Property for Installment Plans.",
    description: "Easily find the properties for installments through real time authentic listings.",
    image: require("../../assets/images/onboarding.png"),
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const { checkAuth } = useAuthContext()
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const [loading, setLoading] = useState(false)

  const BASE_URL = 'https://deal-karo-backend.vercel.app/api';

  const handleCompleteOnboarding = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) {
        router.replace("/(auth)/sign-in")
        return
      }
      
      const user = await getUser()
      if (!user) {
        router.replace("/(auth)/sign-in")
        return
      }
      
      const updateData = {
        _id: user._id,
        onBoardingCompleted: true
      }

      // Make API call
      const response = await axios.put(`${BASE_URL}/users/`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      //console.log('response:', response.data)

      if (response.data?.success) {
        // Update secure store - save to both user object and separate key
        await saveUser({ ...user, onBoardingCompleted: true })
        await saveOnboardingCompleted("true")
        showSuccessToast("Onboarding completed successfully!")
        // Refresh auth context to update onboarding status
        await checkAuth()
        router.replace("/(listings)/listings")
      } else {
        showErrorToast(response.data?.message || "Failed to complete onboarding")
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        showErrorToast(error?.response?.data?.error?.message || "Failed to complete onboarding. Please try again.")
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      scrollViewRef.current?.scrollTo({
        x: width * nextIndex,
        animated: true,
      })
    } else {
      try {
        // await saveOnboardingCompleted("true")
        await handleCompleteOnboarding()
        // Refresh auth context to update onboarding status
        // await checkAuth()
        // router.replace("/(listings)/listings")
      } catch (error: any) {
        showErrorToast("Failed to save onboarding completed: " + error.message)
      }
    }
  }

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const currentIndex = Math.round(contentOffsetX / width)
    setCurrentIndex(currentIndex)
  }

  const currentData = onboardingData[currentIndex]

  return (
    <SafeAreaView style={styles.container}> 
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      >
        {onboardingData.map((item) => (
          <View key={item.id} style={[styles.slide, { width }]}>
            <Image source={item.image} style={styles.image} />
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              
              <View style={styles.dotsContainer}>
                  {onboardingData.map((_, index) => (
                    <View key={index} style={[styles.dot, index === currentIndex && styles.activeDot]} />
                  ))}
                </View>
              </View>
            
            <View style={styles.footer}>
              <Button
                title={currentIndex === onboardingData.length - 1 ? "Get Started" : "Continue"}
                onPress={handleNext}
                style={styles.button}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  slide: {
    position: "relative",
    flex: 1,
    justifyContent: "space-between",
    // paddingHorizontal: 20,
    paddingTop: 40,
  },
  image: {
    width: "100%",
    // height: 420,
    borderRadius: 20,
    resizeMode: "cover",
  },
  content: {
    position: "absolute",
    backgroundColor: Colors.neutral10,
    top: 0,
    // left: 0,
    // right: 0,
    // marginVertical: 30,
    paddingHorizontal:spacing.screen,
    borderBottomRightRadius: 100,
    borderBottomLeftRadius: 100,
    paddingTop: spacing.xxxl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: Colors.black,
    marginBottom: spacing.lg,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.28
  },
  description: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    fontFamily: fontFamilies.primary,
    color: "#8c8c8c",
    letterSpacing: 0.16
  },
  footer: {
    position: "absolute",
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
    width: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  button: {
    marginTop: 10,
    backgroundColor: Colors.neutral100,
    borderWidth: 1,
    borderColor: Colors.neutral90,
    borderRadius: 50,
  },
})