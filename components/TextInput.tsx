import { Colors } from "@/constants/colors"
import { TextInput as RNTextInput, StyleSheet, Text, View, type TextInputProps } from "react-native"

interface CustomTextInputProps extends TextInputProps {
  label?: string
  error?: string
  helperText?: string
}

export function TextInput({ label, error, helperText, style, ...props }: CustomTextInputProps) {
  const showHelperText = !error && helperText

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={Colors.placeholder}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : showHelperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
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
  inputError: {
    borderColor: Colors.error,
    backgroundColor: "#FFECEC",
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
})
