import { Colors } from "@/constants/colors"
import { fontFamilies, fontWeights } from "@/styles"
import { Image } from "expo-image"
import { useState } from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"

interface AvatarInitialsProps {
  name: string
  size?: number
  backgroundColor?: string
  textColor?: string
  imageUri?: string
  showLoading?: boolean
}

export function AvatarInitials({
  name,
  size = 56,
  backgroundColor = "#000",
  textColor = "#fff",
  imageUri,
  showLoading = true
}: AvatarInitialsProps) {
  const [isLoading, setIsLoading] = useState(false)

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const initials = getInitials(name)

  // If imageUri is provided, show the image instead of initials
  if (imageUri) {
    // Check if it's a remote URL (not a local file)
    const isRemoteImage = imageUri.startsWith('http://') || imageUri.startsWith('https://')

    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor }]}>
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          onLoadStart={() => isRemoteImage && showLoading && setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.white} />
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      <Text style={[styles.text, { fontSize: size * 0.4, color: textColor }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontWeight: fontWeights.semibold,
    fontFamily: fontFamilies.primary,
    fontStyle: "normal",
    letterSpacing: 0.12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
})
