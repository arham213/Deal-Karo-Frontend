import { Colors } from "@/constants/colors"
import {
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native"

interface CustomTextInputProps extends TextInputProps {
  label?: string
  error?: string
  helperText?: string
  containerStyle?: ViewStyle
}

export function TextInput({ label, error, helperText, style, containerStyle, ...props }: CustomTextInputProps) {
  const showHelperText = !error && helperText

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputWrapperError, containerStyle]}>
        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.placeholder}
          {...props}
        />
      </View>
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
  inputWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: "#FFECEC",
  },
  input: {
    fontSize: 14,
    color: Colors.text,
    width: "100%",
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
