import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface ImagePreviewProps {
    image: ImagePicker.ImagePickerAsset
    onRemove: () => void
    onSend: () => void
    sending?: boolean
}

export function ImagePreview({ image, onRemove, onSend, sending }: ImagePreviewProps) {
    const fileSizeKB = image.fileSize ? (image.fileSize / 1024).toFixed(1) : "Unknown"

    return (
        <View style={styles.container}>
            <Image
                source={{ uri: image.uri }}
                style={styles.thumbnail}
                contentFit="cover"
            />

            <View style={styles.infoContainer}>
                <Text style={styles.fileName} numberOfLines={1}>
                    {image.fileName || "Image"}
                </Text>
                <Text style={styles.fileSize}>{fileSizeKB} KB</Text>
            </View>

            <TouchableOpacity
                style={styles.removeButton}
                onPress={onRemove}
                activeOpacity={0.7}
                disabled={sending}
            >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                onPress={onSend}
                activeOpacity={0.7}
                disabled={sending}
            >
                <Text style={styles.sendButtonText}>
                    {sending ? "Sending..." : "Send"}
                </Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: Colors.neutral20,
        borderTopWidth: 1,
        borderTopColor: Colors.neutral30,
        gap: spacing.md,
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: radius.sm,
    },
    infoContainer: {
        flex: 1,
    },
    fileName: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.primary,
        fontWeight: fontWeights.medium,
        color: Colors.text,
    },
    fileSize: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.primary,
        color: Colors.textSecondary,
    },
    removeButton: {
        padding: spacing.sm,
    },
    sendButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: radius.xl,
    },
    sendButtonDisabled: {
        backgroundColor: Colors.neutral50,
    },
    sendButtonText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.primary,
        fontWeight: fontWeights.semibold,
        color: Colors.white,
    },
})
