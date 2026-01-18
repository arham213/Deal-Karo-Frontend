import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, radius, spacing } from "@/styles"
import { Image } from "expo-image"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { VoiceMessagePlayer } from "./VoiceMessagePlayer"

interface MessageBubbleProps {
    message: any
    isOwnMessage: boolean
    formatTime: (timestamp: string) => string
    onImagePress?: (imageUrl: string) => void
}

export function MessageBubble({ message, isOwnMessage, formatTime, onImagePress }: MessageBubbleProps) {
    const isImage = message?.type === 'image'
    const isVoice = message?.type === 'voice'
    const isMedia = isImage || isVoice

    return (
        <View style={[
            styles.container,
            isOwnMessage ? styles.outgoingContainer : styles.incomingContainer
        ]}>
            <View style={[
                styles.bubble,
                isOwnMessage ? styles.outgoingBubble : styles.incomingBubble,
                isImage && styles.imageBubble
            ]}>
                {message?.type === 'text' ? (
                    <>
                        <Text style={[
                            styles.messageText,
                            isOwnMessage ? styles.outgoingText : styles.incomingText
                        ]}>
                            {message?.content}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text style={[
                                styles.timestamp,
                                isOwnMessage ? styles.outgoingMeta : styles.incomingMeta
                            ]}>
                                {formatTime(message?.createdAt)}
                            </Text>
                            {isOwnMessage && (
                                <Text style={[
                                    styles.readStatus,
                                    message?.read === true && styles.readStatusRead
                                ]}>
                                    {message?.read === true ? '✓✓' : '✓'}
                                </Text>
                            )}
                        </View>
                    </>
                ) : message?.type === 'image' ? (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => onImagePress?.(message?.content)}
                        style={styles.imageContainer}
                    >
                        <Image
                            source={{ uri: message?.content }}
                            style={styles.messageImage}
                            contentFit="cover"
                        />
                        {/* Overlay timestamp on image */}
                        <View style={styles.imageMetaOverlay}>
                            <Text style={styles.imageTimestamp}>
                                {formatTime(message?.createdAt)}
                            </Text>
                            {isOwnMessage && (
                                <Text style={[
                                    styles.imageReadStatus,
                                    message?.read === true && styles.imageReadStatusRead
                                ]}>
                                    {message?.read === true ? '✓✓' : '✓'}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ) : message?.type === 'voice' ? (
                    <>
                        <VoiceMessagePlayer
                            audioUrl={message?.content}
                            duration={message?.duration || 0}
                            isOwnMessage={isOwnMessage}
                        />
                        <View style={styles.metaRow}>
                            <Text style={[
                                styles.timestamp,
                                isOwnMessage ? styles.outgoingMeta : styles.incomingMeta
                            ]}>
                                {formatTime(message?.createdAt)}
                            </Text>
                            {isOwnMessage && (
                                <Text style={[
                                    styles.readStatus,
                                    message?.read === true && styles.readStatusRead
                                ]}>
                                    {message?.read === true ? '✓✓' : '✓'}
                                </Text>
                            )}
                        </View>
                    </>
                ) : null}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xxs,
    },
    outgoingContainer: {
        alignItems: "flex-end",
    },
    incomingContainer: {
        alignItems: "flex-start",
    },
    bubble: {
        maxWidth: "80%",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
    },
    imageBubble: {
        padding: 4,
        overflow: "hidden",
    },
    outgoingBubble: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: spacing.xxs,
    },
    incomingBubble: {
        backgroundColor: "#ECECEC",  // Lighter gray
        borderBottomLeftRadius: spacing.xxs,
    },
    messageText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.primary,
        lineHeight: 20,
    },
    outgoingText: {
        color: Colors.white,
    },
    incomingText: {
        color: Colors.text,
    },
    imageContainer: {
        position: "relative",
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: radius.md,
    },
    imageMetaOverlay: {
        position: "absolute",
        bottom: 6,
        right: 6,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
    },
    imageTimestamp: {
        fontSize: fontSizes.xs - 2,
        fontFamily: fontFamilies.primary,
        color: Colors.white,
    },
    imageReadStatus: {
        fontSize: fontSizes.xs - 2,
        color: Colors.white,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: spacing.xxs,
        gap: spacing.xxs,
    },
    timestamp: {
        fontSize: fontSizes.xs - 2,
        fontFamily: fontFamilies.primary,
    },
    outgoingMeta: {
        color: "rgba(255, 255, 255, 0.7)",
    },
    incomingMeta: {
        color: Colors.textSecondary,
    },
    readStatus: {
        fontSize: fontSizes.xs - 2,
        color: "rgba(255, 255, 255, 0.9)",
    },
    readStatusRead: {
        color: "#53BDEB", // Blue color for read ticks like WhatsApp
    },
    imageReadStatusRead: {
        color: "#53BDEB", // Blue color for read ticks on images
    },
})


