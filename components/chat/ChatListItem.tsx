import { AvatarInitials } from "@/components/AvatarInitials"
import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, fontWeights, spacing } from "@/styles"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface ChatListItemProps {
    chat: any
    otherParticipant: any
    isSelected: boolean
    onPress: () => void
    formatTime: (timestamp: string) => string
    unreadCount?: number
}

export function ChatListItem({ chat, otherParticipant, isSelected, onPress, formatTime, unreadCount = 0 }: ChatListItemProps) {
    const lastMessage = chat?.lastMessage

    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.containerActive]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <AvatarInitials
                    name={otherParticipant?.name || "?"}
                    size={48}
                    backgroundColor={Colors.primary}
                    textColor={Colors.white}
                />
                {otherParticipant?.online && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.username, unreadCount > 0 && styles.unreadUsername]} numberOfLines={1}>
                        {otherParticipant?.name || "Unknown"}
                    </Text>
                    <Text style={[styles.timestamp, unreadCount > 0 && styles.unreadTimestamp]}>
                        {formatTime(lastMessage?.createdAt)}
                    </Text>
                </View>

                <View style={styles.messageRow}>
                    <Text style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                        {lastMessage?.type === 'image' ? (
                            "📷 Photo"
                        ) : lastMessage?.type === 'voice' ? (
                            "🎤 Voice message"
                        ) : (
                            lastMessage?.content || "No messages yet"
                        )}
                    </Text>
                    {/* {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </Text>
                        </View>
                    )} */}
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral30,
    },
    containerActive: {
        backgroundColor: Colors.neutral20,
    },
    avatarContainer: {
        position: "relative",
        marginRight: spacing.md,
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.success2,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.xxs,
    },
    username: {
        flex: 1,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        fontFamily: fontFamilies.primary,
        color: Colors.text,
        marginRight: spacing.sm,
    },
    unreadUsername: {
        fontWeight: fontWeights.bold,
    },
    timestamp: {
        fontSize: fontSizes.xs,
        color: Colors.textSecondary,
        fontFamily: fontFamilies.primary,
    },
    unreadTimestamp: {
        color: Colors.primary,
        fontWeight: fontWeights.semibold,
    },
    messageRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    lastMessage: {
        flex: 1,
        fontSize: fontSizes.sm,
        color: Colors.textSecondary,
        fontFamily: fontFamilies.primary,
        marginRight: spacing.sm,
    },
    unreadMessage: {
        color: Colors.text,
        fontWeight: fontWeights.medium,
    },
    onlineText: {
        fontSize: fontSizes.xs,
        color: Colors.success2,
        fontFamily: fontFamilies.primary,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 6,
    },
    unreadBadgeText: {
        fontSize: fontSizes.xs,
        color: Colors.white,
        fontWeight: fontWeights.bold,
        fontFamily: fontFamilies.primary,
    },
})
