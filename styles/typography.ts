import { StyleSheet } from "react-native"

import { fontFamilies, fontSizes, fontWeights } from "./tokens"

export const typographyStyles = StyleSheet.create({
  regular: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    // lineHeight: 24,
    fontWeight: fontWeights.regular,
  },
  medium: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    lineHeight: 24,
    fontWeight: fontWeights.medium,
  },
  semibold: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
  },
  bold: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    lineHeight: 24,
    fontWeight: fontWeights.bold,
  },
  caption: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xs,
    lineHeight: 18,
    fontWeight: fontWeights.regular,
  },
  title: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.display,
    lineHeight: 36,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.lg,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
  },
  label: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    fontWeight: fontWeights.semibold,
  },
  helper: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xs,
    lineHeight: 18,
    fontWeight: fontWeights.regular,
  },
  link: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    fontWeight: fontWeights.semibold,
  },
})


