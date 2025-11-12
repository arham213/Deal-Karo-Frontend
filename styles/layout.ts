import { StyleSheet } from "react-native"


import { Colors } from "@/constants/colors"
import { spacing } from "./tokens"

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  scrollContent: {
    flexGrow: 1,
  },
  screenPadding: {
    padding: spacing.screen,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
})


