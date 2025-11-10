import { Text, TextInput } from "react-native"

import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes } from "./tokens"

type TextWithDefault = typeof Text & { defaultProps?: Record<string, unknown> }

type TextInputWithDefault = typeof TextInput & { defaultProps?: Record<string, unknown> }

const defaultTextProps = {
  allowFontScaling: false,
  style: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    color: Colors.text,
  },
}

const defaultInputProps = {
  allowFontScaling: false,
  style: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    color: Colors.text,
  },
}

export const applyGlobalTextStyles = () => {
  const TextComponent = Text as TextWithDefault
  const TextInputComponent = TextInput as TextInputWithDefault

  if (!TextComponent.defaultProps) {
    TextComponent.defaultProps = {}
  }
  if (!TextInputComponent.defaultProps) {
    TextInputComponent.defaultProps = {}
  }

  TextComponent.defaultProps = {
    ...defaultTextProps,
    ...TextComponent.defaultProps,
    style: [defaultTextProps.style, TextComponent.defaultProps.style].filter(Boolean),
  }

  TextInputComponent.defaultProps = {
    ...defaultInputProps,
    ...TextInputComponent.defaultProps,
    style: [defaultInputProps.style, TextInputComponent.defaultProps.style].filter(Boolean),
  }
}

applyGlobalTextStyles()


