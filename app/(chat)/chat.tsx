"use client"

import { AvatarInitials } from "@/components/AvatarInitials"
import { ChatInput } from "@/components/chat/ChatInput"
import { EmptyState } from "@/components/chat/EmptyState"
import { ImagePreview } from "@/components/chat/ImagePreview"
import { ImageViewer } from "@/components/chat/ImageViewer"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { VoiceRecorder } from "@/components/chat/VoiceRecorder"
import { Colors } from "@/constants/colors"
import { getChatById, getChatMessages, uploadChatImage, uploadVoiceMessage } from "@/services/chatService"
import socket, { joinChat, markMessagesAsRead, sendMessage, sendTypingEvent, sendVoiceMessage } from "@/services/socketService"
import { fontFamilies, fontSizes, fontWeights, spacing } from "@/styles"
import { getUser } from "@/utils/secureStore"
import { showErrorToast } from "@/utils/toast"
import { Ionicons } from "@expo/vector-icons"
import { Audio } from "expo-av"
import * as ImagePicker from "expo-image-picker"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ChatScreen() {
    const router = useRouter()
    const { chatId, participantName, participantOnline, participantImage } = useLocalSearchParams<{
        chatId: string
        participantName?: string
        participantOnline?: string
        participantImage?: string
    }>()

    const [messages, setMessages] = useState<Array<any>>([])
    const [newMessage, setNewMessage] = useState<string>("")
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null)
    const [sendingImage, setSendingImage] = useState<boolean>(false)
    const [typingUser, setTypingUser] = useState<any>(null)
    const [loadingMessages, setLoadingMessages] = useState<boolean>(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [chatData, setChatData] = useState<any>(null)
    const [viewingImage, setViewingImage] = useState<string | null>(null)
    const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false)
    const [sendingVoice, setSendingVoice] = useState<boolean>(false)
    const [showScrollButton, setShowScrollButton] = useState<boolean>(false)
    const flatListRef = useRef<FlatList>(null)
    const contentHeightRef = useRef<number>(0)
    const selectedChatRef = useRef<string | null>(chatId)

    const getCurrentUserId = () => {
        return currentUser?._id
    }

    const getOtherParticipant = (chat: any) => {
        if (!chat || !currentUser) return null
        return chat?.participants[0]?.name === currentUser?.name
            ? chat.participants[1]
            : chat.participants[0]
    }

    const formatTime = (timestamp: string) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    const loadMessages = async () => {
        if (!chatId) return

        try {
            setLoadingMessages(true)
            const response = await getChatMessages(chatId)
            console.log("Chat Messages", response)
            if (response && response.data) {
                setMessages(response.data.messages || [])
                if (response.data.chat) {
                    setChatData(response.data.chat)
                } else {
                    // Fetch chat data separately if not included in messages response
                    try {
                        const chatResponse = await getChatById(chatId)
                        if (chatResponse && chatResponse.data) {
                            setChatData(chatResponse.data)
                        }
                    } catch (chatError) {
                        console.error("Failed to fetch chat data:", chatError)
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error)
            showErrorToast("Failed to load messages. Please try again.")
        } finally {
            setLoadingMessages(false)
        }
    }

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0 && !loadingMessages) {
            // Longer delay to ensure all content (images, voice) is rendered
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false })
            }, 300)
        }
    }, [messages.length, loadingMessages])

    const handleSendMessage = () => {
        if (!newMessage.trim() || !chatId) return

        sendMessage(chatId, newMessage, 'text')
        setMessages(prev => [...prev, {
            _id: Math.random().toString(36).substring(7),
            chat: chatId,
            sender: {
                _id: getCurrentUserId()
            },
            content: newMessage,
            type: 'text',
            read: false,
            createdAt: new Date().toISOString()
        }])
        setNewMessage("")
        // Scroll to bottom after sending
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true })
        }, 100)
    }

    const handleSendImage = async () => {
        if (!selectedImage || !chatId) return

        if (selectedImage.fileSize && selectedImage.fileSize > 1_000_000) {
            showErrorToast("Image size exceeds 1MB limit")
            return
        }

        try {
            setSendingImage(true)
            console.log("Selected Image", selectedImage)
            const response = await uploadChatImage(selectedImage)

            if (!response?.data?.imageUrl) {
                showErrorToast("Image upload failed. Please try again.")
                return
            }

            sendMessage(chatId, response.data.imageUrl, 'image')
            setMessages(prev => [...prev, {
                _id: Math.random().toString(36).substring(7),
                chat: chatId,
                sender: {
                    _id: getCurrentUserId(),
                },
                content: response.data.imageUrl,
                type: 'image',
                read: false,
                createdAt: new Date().toISOString()
            }])
            setSelectedImage(null)
        } catch (error) {
            console.error("Failed to send image:", error)
            showErrorToast("Failed to send image. Please try again.")
        } finally {
            setSendingImage(false)
        }
    }

    const handleAttachImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        })

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0])
        }
    }

    const handleRemoveImage = () => {
        setSelectedImage(null)
    }

    const handleMicPress = async () => {
        // Request audio permissions before showing recorder
        const { status } = await Audio.requestPermissionsAsync()
        if (status !== 'granted') {
            showErrorToast('Audio permission is required to record voice messages')
            return
        }
        // Pre-configure audio mode
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        })
        setIsRecordingVoice(true)
    }

    const handleVoiceRecordingComplete = async (uri: string, duration: number) => {
        if (!chatId) return

        try {
            setSendingVoice(true)
            console.log("Voice recording complete", uri, duration)
            const response = await uploadVoiceMessage(uri)

            if (!response?.data?.audioUrl) {
                showErrorToast("Voice upload failed. Please try again.")
                return
            }

            sendVoiceMessage(chatId, response.data.audioUrl, duration)
            setMessages(prev => [...prev, {
                _id: Math.random().toString(36).substring(7),
                chat: chatId,
                sender: { _id: getCurrentUserId() },
                content: response.data.audioUrl,
                type: 'voice',
                duration: duration,
                read: false,
                createdAt: new Date().toISOString()
            }])
            setIsRecordingVoice(false)
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true })
            }, 100)
        } catch (error) {
            console.error("Failed to send voice message:", error)
            showErrorToast("Failed to send voice message. Please try again.")
        } finally {
            setSendingVoice(false)
        }
    }

    const handleVoiceRecordingCancel = () => {
        setIsRecordingVoice(false)
    }

    // Typing indicator effect
    const isTypingRef = useRef(false)
    useEffect(() => {
        if (!chatId) return

        const hasText = newMessage.trim() !== ""

        // Only send "true" if we weren't typing before
        if (hasText && !isTypingRef.current) {
            isTypingRef.current = true
            sendTypingEvent(chatId, true)
        }

        // Send "false" after 2 seconds of inactivity
        const typingTimeout = setTimeout(() => {
            if (isTypingRef.current) {
                isTypingRef.current = false
                sendTypingEvent(chatId, false)
            }
        }, 2000)

        // Immediately send "false" if input is cleared
        if (!hasText && isTypingRef.current) {
            isTypingRef.current = false
            sendTypingEvent(chatId, false)
        }

        return () => {
            clearTimeout(typingTimeout)
        }
    }, [newMessage, chatId])

    // Socket event handlers
    useEffect(() => {
        const handleReceiveMessage = (data: any) => {
            console.log("Message received:", data)
            setMessages(prev => [...prev, data?.message])
            setTypingUser(null)
        }

        const handleReceiveTypingEvent = (data: any) => {
            console.log("Typing event received:", data)
            if (data?.isTyping) {
                setTypingUser(data)
            } else {
                setTypingUser(null)
            }
        }

        const handleMessagesRead = (data: any) => {
            const currentChatId = selectedChatRef.current

            if (data?.chatId === currentChatId) {
                setMessages(prevMessages => {
                    return prevMessages.map(msg => ({
                        ...msg,
                        read: true
                    }))
                })
            }
        }

        const handleMessageRead = (data: any) => {
            const currentChatId = selectedChatRef.current

            if (data?.message?.chat === currentChatId) {
                setMessages(prevMessages => {
                    return prevMessages.map(msg => ({
                        ...msg,
                        read: true
                    }))
                })
            }
        }

        const handleUserStatusUpdated = (data: any) => {
            if (chatData) {
                const otherParticipant = getOtherParticipant(chatData)
                if (data?.userId === otherParticipant?.id || data?.userId === otherParticipant?._id) {
                    const index = chatData.participants[0]?.name === currentUser?.name ? 1 : 0
                    setChatData({
                        ...chatData,
                        participants: chatData.participants.map((participant: any, i: number) =>
                            i === index ? { ...participant, online: data?.online } : participant
                        )
                    })
                }
            }
        }

        socket.on('new_message', handleReceiveMessage)
        socket.on('user_typing', handleReceiveTypingEvent)
        socket.on('messages_read', handleMessagesRead)
        socket.on('message_read', handleMessageRead)
        socket.on('user_status', handleUserStatusUpdated)

        return () => {
            socket.off('new_message', handleReceiveMessage)
            socket.off('user_typing', handleReceiveTypingEvent)
            socket.off('messages_read', handleMessagesRead)
            socket.off('message_read', handleMessageRead)
            socket.off('user_status', handleUserStatusUpdated)
        }
    }, [chatData, currentUser])

    // Initialize on mount
    useEffect(() => {
        const initialize = async () => {
            const user = await getUser()
            if (user) {
                setCurrentUser(user)
            }

            if (chatId) {
                selectedChatRef.current = chatId
                joinChat(chatId)
                markMessagesAsRead(chatId)
                await loadMessages()
            }
        }

        initialize()
    }, [chatId])

    const renderMessage = useCallback(({ item }: { item: any }) => (
        <MessageBubble
            message={item}
            isOwnMessage={item?.sender?._id === getCurrentUserId()}
            formatTime={formatTime}
            onImagePress={(imageUrl) => setViewingImage(imageUrl)}
        />
    ), [currentUser])

    console.log('chatId', chatId)
    console.log('participantName', participantName)

    const otherParticipant = chatData ? getOtherParticipant(chatData) : null

    console.log('chatData', chatData)
    console.log("otherParticipant", otherParticipant)

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            disabled={!(otherParticipant?.profileImage || participantImage)}
                            onPress={() => setViewingImage(otherParticipant?.profileImage || participantImage || null)}
                        >
                            <AvatarInitials
                                name={otherParticipant?.name || participantName || "?"}
                                size={40}
                                backgroundColor={Colors.primary}
                                textColor={Colors.white}
                                imageUri={otherParticipant?.profileImage || participantImage}
                            />
                        </TouchableOpacity>
                        <View style={styles.headerText}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {otherParticipant?.name || participantName || "Chat"}
                            </Text>
                            <Text style={[
                                styles.headerSubtitle,
                                typingUser && styles.typingText
                            ]}>
                                {typingUser ? "typing..." : (
                                    (otherParticipant?.online ?? participantOnline === "true")
                                        ? "online"
                                        : otherParticipant?.lastSeen
                                            ? `last seen at ${formatTime(otherParticipant.lastSeen)}`
                                            : "offline"
                                )}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.headerActions} />
                </View>

                {/* Messages */}
                {loadingMessages ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item._id}
                        renderItem={renderMessage}
                        contentContainerStyle={[
                            styles.messagesContainer,
                            messages.length === 0 && styles.emptyMessagesContainer
                        ]}
                        ListEmptyComponent={
                            <EmptyState
                                icon="💬"
                                title="No messages yet"
                                subtitle="Send a message to start the conversation"
                            />
                        }
                        onContentSizeChange={(_, contentHeight) => {
                            contentHeightRef.current = contentHeight
                            if (messages.length > 0) {
                                flatListRef.current?.scrollToOffset({
                                    offset: contentHeight,
                                    animated: false
                                })
                            }
                        }}
                        showsVerticalScrollIndicator={false}
                        onScroll={(event) => {
                            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
                            const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100
                            setShowScrollButton(!isNearBottom && contentOffset.y > 50)
                        }}
                        scrollEventThrottle={16}
                    />
                )}

                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                    <TouchableOpacity
                        style={styles.scrollButton}
                        onPress={() => {
                            flatListRef.current?.scrollToOffset({
                                offset: contentHeightRef.current,
                                animated: true
                            })
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chevron-down" size={24} color={Colors.white} />
                    </TouchableOpacity>
                )}

                {/* Typing Indicator */}
                <TypingIndicator
                    typingUser={typingUser}
                    currentUserId={getCurrentUserId()}
                />

                {/* Image Preview */}
                {selectedImage && (
                    <ImagePreview
                        image={selectedImage}
                        onRemove={handleRemoveImage}
                        onSend={handleSendImage}
                        sending={sendingImage}
                    />
                )}

                {/* Voice Recorder */}
                {isRecordingVoice && (
                    <VoiceRecorder
                        onRecordingComplete={handleVoiceRecordingComplete}
                        onCancel={handleVoiceRecordingCancel}
                    />
                )}

                {/* Input Area */}
                {!selectedImage && !isRecordingVoice && (
                    <ChatInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        onSend={handleSendMessage}
                        onAttachImage={handleAttachImage}
                        onMicPress={handleMicPress}
                    />
                )}
            </KeyboardAvoidingView>

            {/* Fullscreen Image Viewer */}
            <ImageViewer
                imageUrl={viewingImage || ""}
                visible={!!viewingImage}
                onClose={() => setViewingImage(null)}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.headerBackground,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral30,
    },
    backButton: {
        padding: spacing.sm,
        marginLeft: -spacing.sm,
        marginRight: spacing.sm,
    },
    headerInfo: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semibold,
        fontFamily: fontFamilies.primary,
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: fontSizes.xs,
        fontFamily: fontFamilies.primary,
        color: Colors.textSecondary,
    },
    typingText: {
        color: Colors.success2,
    },
    headerActions: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.md,
    },
    loadingText: {
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.primary,
        color: Colors.textSecondary,
    },
    messagesContainer: {
        paddingVertical: spacing.md,
    },
    emptyMessagesContainer: {
        flex: 1,
    },
    scrollButton: {
        position: "absolute",
        right: spacing.md,
        bottom: 80,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
})
