import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, spacing } from "@/styles"
import { StyleSheet, Text, View } from "react-native"

interface EmptyStateProps {
    icon: string
    title: string
    subtitle?: string
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.xxxl,
    },
    icon: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: fontSizes.base,
        fontFamily: fontFamilies.primary,
        color: Colors.text,
        textAlign: "center",
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.primary,
        color: Colors.textSecondary,
        textAlign: "center",
    },
})
