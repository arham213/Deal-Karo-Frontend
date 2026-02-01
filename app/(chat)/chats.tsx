"use client"

import { ChatListItem } from "@/components/chat/ChatListItem"
import { EmptyState } from "@/components/chat/EmptyState"
import { UserListItem } from "@/components/chat/UserListItem"
import { Colors } from "@/constants/colors"
import { useAuthContext } from "@/contexts/AuthContext"
import { createChat, getAllUsers, getChatMessages, getChats } from "@/services/chatService"
import socket, { joinChat, markMessagesAsRead } from "@/services/socketService"
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { getUser } from "@/utils/secureStore"
import { showErrorToast } from "@/utils/toast"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function ChatsScreen() {
    const router = useRouter()
    const { isAuthenticated } = useAuthContext()
    const [chats, setChats] = useState<Array<any>>([])
    const [filteredChats, setFilteredChats] = useState<Array<any>>([])
    const [users, setUsers] = useState<Array<any>>([])
    const [searchString, setSearchString] = useState<string>("")
    const [userSearchString, setUserSearchString] = useState<string>("")
    const [newChatMode, setNewChatMode] = useState<boolean>(false)
    const [selectedChat, setSelectedChat] = useState<any>(null)
    const selectedChatRef = useRef(selectedChat)
    const [loadingChats, setLoadingChats] = useState<boolean>(false)
    const [loadingChat, setLoadingChat] = useState<boolean>(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

    useEffect(() => {
        selectedChatRef.current = selectedChat
    }, [selectedChat])

    const getUserChats = async () => {
        try {
            setLoadingChats(true)
            const response = await getChats()
            if (response && response.data && response.data.chats) {
                setChats(response.data.chats)
                setFilteredChats(response.data.chats)
            } else {
                setChats([])
                setFilteredChats([])
            }
        } catch (error) {
            console.error("Failed to fetch chats:", error)
            showErrorToast("Failed to load chats. Please try again.")
        } finally {
            setLoadingChats(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const response = await getAllUsers()
            console.log('Users response:', response.data.users);
            if (response && response.data.users) {
                setUsers(response.data.users)
            } else {
                setUsers([])
            }
        } catch (error) {
            console.error("Failed to fetch users:", error)
            showErrorToast("Failed to load users. Please try again.")
        }
    }

    const handleNewChatMode = () => {
        setNewChatMode(!newChatMode)
        setUserSearchString("")  // Reset search when toggling
        if (!newChatMode) {
            fetchUsers()
        }
    }

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        user?.name?.toLowerCase()?.includes(userSearchString.toLowerCase())
    )

    const handleStartNewChat = async (participantId: string) => {
        try {
            console.log('handleStartNewChat')
            setLoadingChat(true)
            console.log('Participant ID:', participantId)
            const response = await createChat(participantId)
            if (response) {
                console.log('Chat response:', response)
                setSelectedChat(response.data.chat)
                console.log('Selected chat:', response.data.chat)
                joinChat(response.data.chat?._id)
                setNewChatMode(false)
                const messages = await getChatMessages(response.data.chat?._id)
                if (messages) {
                    getUserChats()
                    // Navigate to chat screen
                    console.log('Chat ID:', response.data.chat)
                    console.log('Other participant:', getOtherParticipant(response.data.chat))
                    console.log('Other participant name:', getOtherParticipant(response.data.chat)?.name)
                    const otherParticipant = getOtherParticipant(response.data.chat)
                    router.push({
                        pathname: "/(chat)/chat" as any,
                        params: {
                            chatId: response.data.chat?._id,
                            participantName: otherParticipant?.name,
                            participantImage: otherParticipant?.profileImage || "",
                            participantOnline: otherParticipant?.online ? "true" : "false"
                        }
                    })
                }
            }
        } catch (error) {
            console.error("Failed to create chat:", error)
            showErrorToast("Failed to start chat. Please try again.")
        } finally {
            setLoadingChat(false)
        }
    }

    const handleStartExistingChat = async (chat: any) => {
        try {
            setLoadingChat(true)
            setSelectedChat(chat)
            // Clear unread count for this chat
            setUnreadCounts((prev) => ({ ...prev, [chat._id]: 0 }))
            joinChat(chat._id)
            markMessagesAsRead(chat._id)
            // Navigate to chat screen
            console.log('New chat:', chat);
            console.log('Other participant:', getOtherParticipant(chat))
            console.log('Other participant name:', getOtherParticipant(chat)?.name)
            const otherParticipant = getOtherParticipant(chat)
            router.push({
                pathname: "/(chat)/chat" as any,
                params: {
                    chatId: chat._id,
                    participantName: otherParticipant?.name,
                    participantImage: otherParticipant?.profileImage || "",
                    participantOnline: otherParticipant?.online ? "true" : "false"
                }
            })
        } catch (error) {
            console.error("Failed to open chat:", error)
            showErrorToast("Failed to open chat. Please try again.")
        } finally {
            setLoadingChat(false)
        }
    }

    const getOtherParticipant = (chat: any) => {
        console.log('chat:', chat)
        console.log('Chat participants:', chat.participants)
        console.log('Current user:', currentUser)
        console.log('Current user name:', currentUser?.name)
        if (!chat || !currentUser || !chat.participants || chat.participants.length < 2) return null

        return chat.participants[0]?.name === currentUser?.name
            ? chat.participants[1]
            : chat.participants[0]
    }

    const formatTime = (timestamp: string) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    // Filter chats based on search
    useEffect(() => {
        if (!currentUser || !chats) {
            setFilteredChats([])
            return
        }
        if (searchString.trim() !== "") {
            const filtered = chats.filter(chat => {
                const otherParticipant = getOtherParticipant(chat)
                return otherParticipant?.name?.toLowerCase()?.includes(searchString.toLowerCase())
            })
            setFilteredChats(filtered)
        } else {
            setFilteredChats(chats)
        }
    }, [searchString, chats, currentUser])

    // Socket event handlers
    useEffect(() => {
        const handleUserStatusUpdated = (data: any) => {
            setChats((prevChats) => {
                return prevChats.map((prevChat) => {
                    const otherParticipant = getOtherParticipant(prevChat)
                    if (data?.userId === otherParticipant?.id || data?.userId === otherParticipant?._id) {
                        const index = prevChat.participants[0]?.name === currentUser?.name ? 1 : 0
                        return {
                            ...prevChat,
                            participants: prevChat.participants.map(
                                (participant: any, i: number) =>
                                    i === index ? { ...participant, online: data?.online } : participant
                            ),
                        }
                    }
                    return prevChat
                })
            })

            setFilteredChats((prevChats) => {
                return prevChats.map((prevChat) => {
                    const otherParticipant = getOtherParticipant(prevChat)
                    if (data?.userId === otherParticipant?.id || data?.userId === otherParticipant?._id) {
                        const index = prevChat.participants[0]?.name === currentUser?.name ? 1 : 0
                        return {
                            ...prevChat,
                            participants: prevChat.participants.map(
                                (participant: any, i: number) =>
                                    i === index ? { ...participant, online: data?.online } : participant
                            ),
                        }
                    }
                    return prevChat
                })
            })
        }

        socket.on('user_status', handleUserStatusUpdated)

        // Handle new messages to update chat list
        const handleChatUpdated = (data: any) => {
            if (!data?.chatId || !data?.lastMessage) return

            // Update chats with new last message
            setChats((prevChats) => {
                const updatedChats = prevChats.map((chat) => {
                    if (chat._id === data.chatId) {
                        return { ...chat, lastMessage: data.lastMessage }
                    }
                    return chat
                })
                // Sort by most recent
                return updatedChats.sort((a, b) => {
                    const aTime = new Date(a.lastMessage?.createdAt || 0).getTime()
                    const bTime = new Date(b.lastMessage?.createdAt || 0).getTime()
                    return bTime - aTime
                })
            })

            // Increment unread count if message is from other user
            if (data.lastMessage?.sender !== currentUser?._id) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [data.chatId]: (prev[data.chatId] || 0) + 1
                }))
            }
        }

        socket.on('chat_updated', handleChatUpdated)

        return () => {
            socket.off('user_status', handleUserStatusUpdated)
            socket.off('chat_updated', handleChatUpdated)
        }
    }, [currentUser])

    // Initialize on mount
    useEffect(() => {
        const initializeChat = async () => {
            const user = await getUser()
            if (user) {
                setCurrentUser(user)
            }
            getUserChats()
        }

        initializeChat()
    }, [])

    const renderChatItem = useCallback(({ item }: { item: any }) => {
        const otherParticipant = getOtherParticipant(item)
        return (
            <ChatListItem
                chat={item}
                otherParticipant={otherParticipant}
                isSelected={selectedChat?._id === item?._id}
                onPress={() => handleStartExistingChat(item)}
                formatTime={formatTime}
                unreadCount={unreadCounts[item._id] || 0}
            />
        )
    }, [selectedChat, currentUser, unreadCounts])

    const renderUserItem = useCallback(({ item }: { item: any }) => (
        <UserListItem
            user={item}
            onPress={() => handleStartNewChat(item._id)}
        />
    ), [])

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.container}>
                {/* Header */}
                {!newChatMode ? (
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Chats</Text>
                            <TouchableOpacity onPress={handleNewChatMode} style={styles.newChatButton}>
                                <Ionicons name="add" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                value={searchString}
                                placeholder="Search chats"
                                placeholderTextColor={Colors.placeholder}
                                onChangeText={setSearchString}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <TouchableOpacity onPress={handleNewChatMode} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>New Chat</Text>
                            <View style={styles.newChatButton} />
                        </View>

                        {/* Search Users */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={18} color={Colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                value={userSearchString}
                                placeholder="Search users"
                                placeholderTextColor={Colors.placeholder}
                                onChangeText={setUserSearchString}
                            />
                        </View>
                    </View>
                )}

                {/* Content */}
                {loadingChats ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading chats...</Text>
                    </View>
                ) : newChatMode ? (
                    <FlatList
                        data={filteredUsers}
                        keyExtractor={(item) => item._id}
                        renderItem={renderUserItem}
                        ListEmptyComponent={
                            <EmptyState
                                icon={userSearchString.trim() !== "" ? "🔍" : "👥"}
                                title={userSearchString.trim() !== "" ? "No users found" : "No users available"}
                                subtitle={userSearchString.trim() !== "" ? "Try a different search" : undefined}
                            />
                        }
                        contentContainerStyle={filteredUsers.length === 0 ? styles.emptyListContainer : undefined}
                    />
                ) : (
                    <FlatList
                        data={filteredChats}
                        keyExtractor={(item) => item._id}
                        renderItem={renderChatItem}
                        ListEmptyComponent={
                            <EmptyState
                                icon={searchString.trim() !== "" ? "🔍" : "💬"}
                                title={searchString.trim() !== "" ? "No chats found" : "No chats yet"}
                                subtitle={searchString.trim() !== "" ? "Try a different search" : "Start a new conversation!"}
                            />
                        }
                        contentContainerStyle={filteredChats.length === 0 ? styles.emptyListContainer : undefined}
                    />
                )}

                {loadingChat && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                )}
            </View>
        </SafeAreaView >
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
        backgroundColor: Colors.white,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral30,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    backButton: {
        padding: spacing.sm,
        marginLeft: -spacing.sm,
    },
    headerTitle: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.bold,
        fontFamily: fontFamilies.primary,
        color: Colors.text,
    },
    newChatButton: {
        padding: spacing.sm,
        marginRight: -spacing.sm,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.neutral20,
        borderRadius: radius.xxl,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: fontSizes.sm,
        fontFamily: fontFamilies.primary,
        color: Colors.text,
        paddingVertical: spacing.sm,
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
    emptyListContainer: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        justifyContent: "center",
        alignItems: "center",
    },
})
