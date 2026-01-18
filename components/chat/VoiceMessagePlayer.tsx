"use client"

import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, spacing } from "@/styles"
import { Ionicons } from "@expo/vector-icons"
import { Audio } from "expo-av"
import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface VoiceMessagePlayerProps {
    audioUrl: string
    duration: number
    isOwnMessage: boolean
}

export function VoiceMessagePlayer({ audioUrl, duration, isOwnMessage }: VoiceMessagePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const soundRef = useRef<Audio.Sound | null>(null)

    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync()
            }
        }
    }, [])

    const loadAndPlay = async () => {
        try {
            setIsLoading(true)

            if (soundRef.current) {
                const status = await soundRef.current.getStatusAsync()
                if (status.isLoaded) {
                    if (status.isPlaying) {
                        await soundRef.current.pauseAsync()
                        setIsPlaying(false)
                    } else {
                        // Reset to beginning if at the end
                        if (status.positionMillis === status.durationMillis || progress >= 0.99) {
                            setProgress(0)
                            setCurrentTime(0)
                            await soundRef.current.setPositionAsync(0)
                        }
                        await soundRef.current.playAsync()
                        setIsPlaying(true)
                    }
                    setIsLoading(false)
                    return
                }
            }

            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            })

            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            )

            soundRef.current = sound
            setIsPlaying(true)
        } catch (error) {
            console.error("Error playing audio:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            if (status.positionMillis !== undefined && status.durationMillis) {
                setProgress(status.positionMillis / status.durationMillis)
                setCurrentTime(Math.floor(status.positionMillis / 1000))
            }
            // Update playing state based on actual playback status
            if (status.isPlaying !== isPlaying) {
                setIsPlaying(status.isPlaying)
            }
            if (status.didJustFinish && !status.isLooping) {
                setIsPlaying(false)
                setProgress(0)
                setCurrentTime(0)
            }
        }
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.playButton,
                    isOwnMessage ? styles.playButtonOutgoing : styles.playButtonIncoming,
                ]}
                onPress={loadAndPlay}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={isOwnMessage ? Colors.white : Colors.primary} />
                ) : (
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={20}
                        color={isOwnMessage ? Colors.white : Colors.primary}
                    />
                )}
            </TouchableOpacity>

            <View style={styles.waveformContainer}>
                <View style={styles.waveform}>
                    {[...Array(20)].map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.waveformBar,
                                {
                                    height: 8 + Math.random() * 12,
                                    backgroundColor:
                                        i / 20 <= progress
                                            ? isOwnMessage
                                                ? Colors.white
                                                : Colors.primary
                                            : isOwnMessage
                                                ? "rgba(255, 255, 255, 0.4)"
                                                : Colors.neutral40,
                                },
                            ]}
                        />
                    ))}
                </View>
                <Text
                    style={[
                        styles.durationText,
                        isOwnMessage ? styles.durationTextOutgoing : styles.durationTextIncoming,
                    ]}
                >
                    {isPlaying ? formatDuration(currentTime) : formatDuration(duration || 0)}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        minWidth: 180,
        gap: spacing.sm,
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    playButtonOutgoing: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    playButtonIncoming: {
        backgroundColor: Colors.neutral30,
    },
    waveformContainer: {
        flex: 1,
    },
    waveform: {
        flexDirection: "row",
        alignItems: "center",
        height: 24,
        gap: 2,
    },
    waveformBar: {
        width: 3,
        borderRadius: 1.5,
    },
    durationText: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.primary,
        marginTop: 2,
    },
    durationTextOutgoing: {
        color: "rgba(255, 255, 255, 0.7)",
    },
    durationTextIncoming: {
        color: Colors.textSecondary,
    },
})
