import { Colors } from "@/constants/colors"
import { Image, StyleSheet, Text, View } from "react-native"

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
    gap: 35,
    paddingTop: 90,
    paddingBottom: 15,
    backgroundColor: Colors.headerBackground
  },
  logo: {
    width: 120,
    height: 52
  },
  textContainer: {
    alignItems: "center",
    gap: 8
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
})
