"use client"

import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, spacing } from "@/styles"
import { Ionicons } from "@expo/vector-icons"
import { Audio } from "expo-av"
import { useEffect, useRef, useState } from "react"
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface VoiceRecorderProps {
    onRecordingComplete: (uri: string, duration: number) => void
    onCancel: () => void
}

export function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [permissionGranted, setPermissionGranted] = useState(false)
    const recordingRef = useRef<Audio.Recording | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const pulseAnim = useRef(new Animated.Value(1)).current

    useEffect(() => {
        checkPermission()
        return () => {
            stopRecording()
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start()
        } else {
            pulseAnim.setValue(1)
        }
    }, [isRecording])

    const checkPermission = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync()
            setPermissionGranted(status === "granted")
            if (status !== "granted") {
                console.log("Audio permission not granted")
            }
        } catch (error) {
            console.error("Permission check error:", error)
        }
    }

    const startRecording = async () => {
        if (!permissionGranted) {
            await checkPermission()
            return
        }

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            })

            const { recording } = await Audio.Recording.createAsync(
                {
                    android: {
                        extension: ".m4a",
                        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                        audioEncoder: Audio.AndroidAudioEncoder.AAC,
                        sampleRate: 44100,
                        numberOfChannels: 2,
                        bitRate: 128000,
                    },
                    ios: {
                        extension: ".m4a",
                        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
                        audioQuality: Audio.IOSAudioQuality.HIGH,
                        sampleRate: 44100,
                        numberOfChannels: 2,
                        bitRate: 128000,
                    },
                    web: {
                        mimeType: "audio/webm",
                        bitsPerSecond: 128000,
                    },
                }
            )

            recordingRef.current = recording
            setIsRecording(true)
            setRecordingDuration(0)

            timerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1)
            }, 1000)
        } catch (error) {
            console.error("Failed to start recording:", error)
        }
    }

    const stopRecording = async () => {
        if (!recordingRef.current) return

        try {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }

            await recordingRef.current.stopAndUnloadAsync()
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            })

            const uri = recordingRef.current.getURI()
            const duration = recordingDuration

            recordingRef.current = null
            setIsRecording(false)

            if (uri) {
                // Wait a moment for file to be fully written to disk
                await new Promise(resolve => setTimeout(resolve, 300))
                console.log("Recording file ready:", uri)
                onRecordingComplete(uri, duration)
            }
        } catch (error) {
            console.error("Failed to stop recording:", error)
            setIsRecording(false)
        }
    }

    const cancelRecording = async () => {
        if (recordingRef.current) {
            try {
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
                await recordingRef.current.stopAndUnloadAsync()
                // Note: File cleanup is handled automatically by the system
            } catch (error) {
                console.error("Cancel recording error:", error)
            }
        }
        recordingRef.current = null
        setIsRecording(false)
        setRecordingDuration(0)
        onCancel()
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    if (!isRecording) {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.recordButton}
                    onPress={startRecording}
                    activeOpacity={0.7}
                >
                    <Ionicons name="mic" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.hintText}>Tap to record</Text>
                <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                    <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.recordingContainer}>
            <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton}>
                <Ionicons name="trash-outline" size={24} color={Colors.error} />
            </TouchableOpacity>

            <View style={styles.recordingInfo}>
                <Animated.View
                    style={[
                        styles.recordingIndicator,
                        { transform: [{ scale: pulseAnim }] },
                    ]}
                />
                <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
            </View>

            <TouchableOpacity
                style={styles.sendButton}
                onPress={stopRecording}
                activeOpacity={0.7}
            >
                <Ionicons name="send" size={20} color={Colors.white} />
            </TouchableOpacity>
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
    },
    recordButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    hintText: {
        flex: 1,
        marginLeft: spacing.md,
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.primary,
        color: Colors.textSecondary,
    },
    cancelButton: {
        padding: spacing.sm,
    },
    recordingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.neutral30,
    },
    recordingInfo: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
    },
    recordingIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.error,
    },
    durationText: {
        fontSize: fontSizes.lg,
        fontFamily: fontFamilies.primary,
        fontWeight: "600",
        color: Colors.text,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
})
