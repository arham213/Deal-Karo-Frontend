"use client"

import { Colors } from "@/constants/colors"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useEffect, useRef, useState } from "react"
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from "react-native"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Image dimensions
const IMAGE_WIDTH = 699
const IMAGE_HEIGHT = 1280

// Track if popup has been closed globally for the current JS runtime (app session).
// This ensures the popup is only shown once per app launch, even if the component unmounts/remounts
// when navigating between tabs or screens.
let globalHasBeenClosed = false

// Calculate scaled dimensions to fit screen while maintaining aspect ratio
const getImageDimensions = () => {
  // Use smaller width (85% of screen) and limit height to 70% for more space on all sides
  let displayWidth = SCREEN_WIDTH * 0.85 // 85% of screen width for more left/right space
  let displayHeight = (displayWidth * IMAGE_HEIGHT) / IMAGE_WIDTH

  // Limit height to 70% of screen for more top/bottom space
  if (displayHeight > SCREEN_HEIGHT * 0.7) {
    displayHeight = SCREEN_HEIGHT * 0.7
    displayWidth = (displayHeight * IMAGE_WIDTH) / IMAGE_HEIGHT
  }

  return { width: displayWidth, height: displayHeight }
}

interface LaunchPopupProps {
  isAuthenticated: boolean
  isLoading: boolean
}

export function LaunchPopup({ isAuthenticated, isLoading }: LaunchPopupProps) {
  const [visible, setVisible] = useState(false)
  const [imageDimensions, setImageDimensions] = useState(getImageDimensions())
  // Track if popup has been closed in this app lifecycle.
  // Initialise from the global flag so remounts don't show it again.
  const hasBeenClosed = useRef(globalHasBeenClosed)

  useEffect(() => {
    // Update dimensions on screen size change
    const subscription = Dimensions.addEventListener("change", () => {
      setImageDimensions(getImageDimensions())
    })

    return () => {
      if (subscription) {
        subscription.remove()
      }
    }
  }, [])

  useEffect(() => {
    const checkAndShowPopup = () => {
      // Don't show while loading or if not authenticated
      if (isLoading || !isAuthenticated) {
        setVisible(false)
        return
      }

      // Only show if it hasn't been closed in this app lifecycle
      if (!hasBeenClosed.current) {
        setVisible(true)
      }
    }

    checkAndShowPopup()
  }, [isAuthenticated, isLoading])

  const handleClose = () => {
    hasBeenClosed.current = true
    globalHasBeenClosed = true
    setVisible(false)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { width: imageDimensions.width, height: imageDimensions.height }]}>
          <Image
            source={require("@/assets/images/popup-img.jpeg")}
            style={[
              styles.image,
              {
                width: imageDimensions.width,
                height: imageDimensions.height,
              },
            ]}
            contentFit="contain"
            transition={200}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  image: {
    borderRadius: 10,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
})

