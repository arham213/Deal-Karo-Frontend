import { Colors } from "@/constants/colors"
import { TextInput as RNTextInput, StyleSheet, Text, View, type TextInputProps } from "react-native"

interface CustomTextInputProps extends TextInputProps {
  label?: string
}

export function TextInput({ label, style, ...props }: CustomTextInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput style={[styles.input, style]} placeholderTextColor={Colors.placeholder} {...props} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
})
