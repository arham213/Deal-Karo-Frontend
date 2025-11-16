import { Colors } from "@/constants/colors"
import { fontSizes, radius, spacing, typographyStyles } from "@/styles"
import { MaterialIcons } from "@expo/vector-icons"
import { useState } from "react"
import {
  Platform,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  type TextInputProps,
  type ViewStyle
} from "react-native"

interface CustomTextInputProps extends TextInputProps {
  label?: string
  error?: string
  helperText?: string
  containerStyle?: ViewStyle
  labelStyle?: TextStyle
  style?: TextStyle
}

export function TextInput({ label, error, helperText, labelStyle, style, containerStyle, secureTextEntry, ...props }: CustomTextInputProps) {
  const showHelperText = !error && helperText
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPasswordField = secureTextEntry

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev)
  }

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputWrapperError, containerStyle]}>
        <RNTextInput
          style={[styles.input, isPasswordField && styles.inputWithIcon, style]}
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={isPasswordField && !isPasswordVisible}
          {...props}
        />
        {isPasswordField && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.iconContainer}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name={isPasswordVisible ? "visibility" : "visibility-off"}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
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
    paddingVertical: Platform.OS === "ios" ? spacing.md2 : spacing.xxs,
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: "#FFECEC",
  },
  input: {
    ...typographyStyles.regular,
    fontSize: fontSizes.sm,
    color: Colors.text,
    flex: 1,
  },
  inputWithIcon: {
    paddingRight: spacing.sm,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
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
