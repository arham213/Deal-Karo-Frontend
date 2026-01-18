import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, spacing } from "@/styles"
import { StyleSheet, Text, View } from "react-native"

interface TypingIndicatorProps {
    typingUser: {
        name: string
        isTyping: boolean
        userId: string
    } | null
    currentUserId: string
}

export function TypingIndicator({ typingUser, currentUserId }: TypingIndicatorProps) {
    if (!typingUser || !typingUser.isTyping || typingUser.userId === currentUserId) {
        return null
    }

    return (
        <View style={styles.container}>
            <Text style={styles.text}>{typingUser.name} is typing...</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs,
        backgroundColor: Colors.neutral20,
    },
    text: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.primary,
        color: Colors.textSecondary,
        fontStyle: "italic",
    },
})
