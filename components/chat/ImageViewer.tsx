import { Colors } from "@/constants/colors"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useState } from "react"
import { ActivityIndicator, Dimensions, Modal, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface ImageViewerProps {
    imageUrl: string
    visible: boolean
    onClose: () => void
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

export function ImageViewer({ imageUrl, visible, onClose }: ImageViewerProps) {
    const insets = useSafeAreaInsets()
    const [loading, setLoading] = useState(true)

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <StatusBar backgroundColor="rgba(0, 0, 0, 0.95)" barStyle="light-content" />
            <View style={styles.container}>
                {/* Close Button */}
                <TouchableOpacity
                    style={[styles.closeButton, { top: insets.top + 10 }]}
                    onPress={onClose}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close" size={28} color={Colors.white} />
                </TouchableOpacity>

                {/* Loading Indicator */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.white} />
                    </View>
                )}

                {/* Full Screen Image */}
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    contentFit="contain"
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                />
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        justifyContent: "center",
        alignItems: "center",
    },
    closeButton: {
        position: "absolute",
        left: 16,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.8,
    },
})
