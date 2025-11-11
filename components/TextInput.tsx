import { Colors } from "@/constants/colors"
import { fontSizes, radius, spacing, typographyStyles } from "@/styles"
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
    gap: spacing.sm,
  },
  label: {
    ...typographyStyles.label,
    color: Colors.text,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: radius.pill,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxs,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: "#FFECEC",
  },
  input: {
    ...typographyStyles.regular,
    fontSize: fontSizes.sm,
    color: Colors.text,
    width: "100%",
  },
  errorText: {
    ...typographyStyles.helper,
    color: Colors.error,
  },
  helperText: {
    ...typographyStyles.helper,
    color: Colors.textSecondary,
  },
})
