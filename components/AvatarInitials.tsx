import { Colors } from "@/constants/colors"
import { StyleSheet, Text, View } from "react-native"

interface AvatarInitialsProps {
  name: string
  size?: number
}

export function AvatarInitials({ name, size = 56 }: AvatarInitialsProps) {
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const initials = getInitials(name)
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]
  const hashCode = Array.from(initials).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const backgroundColor = colors[hashCode % colors.length]

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: Colors.white,
    fontWeight: "700",
  },
})
