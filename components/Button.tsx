import { Colors } from "@/constants/colors"
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type ViewStyle } from "react-native"

import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"

interface ButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export function Button({ title, onPress, loading, disabled, style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.neutral90,
    paddingVertical: spacing.md2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.primary,
    fontWeight: fontWeights.medium,
    color: Colors.neutral10,
  },
})
