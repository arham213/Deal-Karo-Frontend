import { AvatarInitials } from "@/components/AvatarInitials"
import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, fontWeights, spacing } from "@/styles"
import { StyleSheet, Text, TouchableOpacity } from "react-native"

interface UserListItemProps {
    user: any
    onPress: () => void
}

export function UserListItem({ user, onPress }: UserListItemProps) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <AvatarInitials
                name={user?.name || "?"}
                size={44}
                backgroundColor={Colors.primary}
                textColor={Colors.white}
                imageUri={user?.profileImage}
            />
            <Text style={styles.username}>{user?.name || "Unknown"}</Text>
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
        gap: spacing.md,
    },
    username: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.medium,
        fontFamily: fontFamilies.primary,
        color: Colors.text,
    },
})
