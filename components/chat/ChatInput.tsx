import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, radius, spacing } from "@/styles"
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native"

interface ChatInputProps {
    value: string
    onChangeText: (text: string) => void
    onSend: () => void
    onAttachImage: () => void
    onMicPress?: () => void
    disabled?: boolean
}

export function ChatInput({ value, onChangeText, onSend, onAttachImage, onMicPress, disabled }: ChatInputProps) {
    const handleKeyPress = (e: any) => {
        if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
            e.preventDefault?.()
            onSend()
        }
    }

    const hasText = value.trim().length > 0

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.attachButton}
                onPress={onAttachImage}
                activeOpacity={0.7}
            >
                <Ionicons name="attach" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder="Type a message"
                placeholderTextColor={Colors.placeholder}
                multiline={false}
                onKeyPress={handleKeyPress}
                editable={!disabled}
            />

            {hasText ? (
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={onSend}
                    activeOpacity={0.7}
                    disabled={disabled}
                >
                    <Ionicons name="send" size={20} color={Colors.white} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.micButton}
                    onPress={onMicPress}
                    activeOpacity={0.7}
                    disabled={disabled}
                >
                    <Ionicons name="mic" size={22} color={Colors.primary} />
                </TouchableOpacity>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.neutral30,
        gap: spacing.sm,
    },
    attachButton: {
        padding: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.primary,
        color: Colors.text,
        backgroundColor: Colors.neutral20,
        borderRadius: radius.xxl,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    micButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.neutral20,
        justifyContent: "center",
        alignItems: "center",
    },
})
