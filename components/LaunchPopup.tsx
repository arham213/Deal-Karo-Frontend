"use client"

import { Colors } from "@/constants/colors"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { Image } from "expo-image"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Dimensions, Modal, StyleSheet, TouchableOpacity, View } from "react-native"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

const BASE_URL = "https://deal-karo-backend.onrender.com/api"

// Image dimensions (default for aspect ratio calculation)
const IMAGE_WIDTH = 699
const IMAGE_HEIGHT = 1280

// Track if popup has been closed globally for the current JS runtime (app session).
// This ensures the popup is only shown once per app launch, even if the component unmounts/remounts
// when navigating between tabs or screens.
let globalHasBeenClosed = false

// Track if popup has already been fetched this session
let globalHasFetched = false
let globalPopupImageUrl: string | null = null

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
  const [popupImageUrl, setPopupImageUrl] = useState<string | null>(globalPopupImageUrl)
  const [isLoadingPopup, setIsLoadingPopup] = useState(false)
  const [imageDimensions, setImageDimensions] = useState(getImageDimensions())
  // Track if popup has been closed in this app lifecycle.
  // Initialise from the global flag so remounts don't show it again.
  const hasBeenClosed = useRef(globalHasBeenClosed)
  const hasFetched = useRef(globalHasFetched)

  // Fetch popup image from backend
  const fetchPopupImage = async () => {
    // Don't fetch if already fetched or closed this session
    if (hasFetched.current || hasBeenClosed.current) {
      return
    }

    try {
      setIsLoadingPopup(true)
      const response = await axios.get(`${BASE_URL}/config/popup/public`)

      if (response.data?.success && response.data.data?.showPopup) {
        const imageUrl = response.data.data.imageUrl
        setPopupImageUrl(imageUrl)
        globalPopupImageUrl = imageUrl
        setVisible(true)
      }
    } catch (error) {
      console.log("Failed to fetch popup config")
    } finally {
      setIsLoadingPopup(false)
      hasFetched.current = true
      globalHasFetched = true
    }
  }

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

  // Fetch popup image on app launch when authenticated
  useEffect(() => {
    // Don't fetch while loading or if not authenticated
    if (isLoading || !isAuthenticated) {
      return
    }

    // Only fetch if it hasn't been closed and hasn't been fetched yet
    if (!hasBeenClosed.current && !hasFetched.current) {
      fetchPopupImage()
    } else if (hasFetched.current && globalPopupImageUrl && !hasBeenClosed.current) {
      // If already fetched in a previous mount, show the popup with cached image
      setPopupImageUrl(globalPopupImageUrl)
      setVisible(true)
    }
  }, [isAuthenticated, isLoading])

  const handleClose = () => {
    hasBeenClosed.current = true
    globalHasBeenClosed = true
    setVisible(false)
  }

  // Don't render if no image URL
  if (!popupImageUrl && !isLoadingPopup) {
    return null
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
          {isLoadingPopup ? (
            <ActivityIndicator size="large" color={Colors.white} />
          ) : popupImageUrl ? (
            <Image
              source={{ uri: popupImageUrl }}
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
          ) : null}
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

