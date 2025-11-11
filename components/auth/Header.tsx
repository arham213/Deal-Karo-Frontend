import { Colors } from "@/constants/colors"
import { Image, StyleSheet, Text, View } from "react-native"

import { fontSizes, spacing, typographyStyles } from "@/styles"

interface HeaderProps {
  title: string
  subtitle: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/black-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.xxl + spacing.lg,
    paddingTop: 90,
    paddingBottom: spacing.md,
    backgroundColor: Colors.headerBackground
  },
  logo: {
    width: 120,
    height: 52
  },
  textContainer: {
    alignItems: "center",
    gap: spacing.sm
  },
  title: {
    ...typographyStyles.bold,
    fontSize: fontSizes.xl,
    color: Colors.text,
  },
  subtitle: {
    ...typographyStyles.regular,
    fontSize: fontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
})
