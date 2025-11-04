"use client"

import { Button } from "@/components/Button"
import { Colors } from "@/constants/colors"
import { useRouter } from "expo-router"
import { useRef, useState } from "react"
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from "react-native"

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
  {
    id: 3,
    title: "Deal Property required for Rent.",
    description: "Easily find the on rent properties through real time authentic listings.",
    image: require("../../assets/images/onboarding.png"),
  },
  {
    id: 4,
    title: "Deal Property for Installment Plans.",
    description: "Easily find the properties for installments through real time authentic listings.",
    image: require("../../assets/images/onboarding.png"),
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      scrollViewRef.current?.scrollTo({
        x: width * nextIndex,
        animated: true,
      })
    } else {
      router.push("/listings")
    }
  }

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const currentIndex = Math.round(contentOffsetX / width)
    setCurrentIndex(currentIndex)
  }

  const currentData = onboardingData[currentIndex]

  return (
    <View style={styles.container}>
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
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {onboardingData.map((_, index) => (
            <View key={index} style={[styles.dot, index === currentIndex && styles.activeDot]} />
          ))}
        </View>

        <Button
          title={currentIndex === onboardingData.length - 1 ? "Get Started" : "Continue"}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  slide: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  image: {
    width: "100%",
    height: 420,
    borderRadius: 20,
    resizeMode: "cover",
  },
  content: {
    marginVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
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
  },
})