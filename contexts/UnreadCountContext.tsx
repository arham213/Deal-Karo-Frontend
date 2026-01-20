"use client"

import { getChats } from "@/services/chatService"
import socket from "@/services/socketService"
import { getUser } from "@/utils/secureStore"
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"

interface UnreadCountContextType {
    totalUnread: number
    unreadCounts: Record<string, number>
    refreshUnreadCounts: () => Promise<void>
    markChatAsRead: (chatId: string) => void
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined)

export function UnreadCountProvider({ children }: { children: ReactNode }) {
    const [totalUnread, setTotalUnread] = useState<number>(0)
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // Initialize current user
    useEffect(() => {
        const initUser = async () => {
            const user = await getUser()
            if (user?._id) {
                setCurrentUserId(user._id)
            }
        }
        initUser()
    }, [])

    // Fetch initial unread counts from chats
    const refreshUnreadCounts = useCallback(async () => {
        try {
            const response = await getChats()
            if (response?.data?.chats) {
                const counts: Record<string, number> = {}
                let total = 0

                response.data.chats.forEach((chat: any) => {
                    const unread = chat.unreadCount || 0
                    counts[chat._id] = unread
                    total += unread
                })

                setUnreadCounts(counts)
                setTotalUnread(total)
            }
        } catch (error) {
            console.error("Failed to fetch unread counts:", error)
        }
    }, [])

    // Mark a chat as read locally
    const markChatAsRead = useCallback((chatId: string) => {
        setUnreadCounts((prev) => {
            const prevCount = prev[chatId] || 0
            setTotalUnread((total) => Math.max(0, total - prevCount))
            return { ...prev, [chatId]: 0 }
        })
    }, [])

    // Listen for socket events
    useEffect(() => {
        // Handle unread count updates from server
        const handleUnreadCountUpdated = (data: {
            chatId: string
            unreadCount: number
            totalUnread: number
        }) => {
            setUnreadCounts((prev) => ({ ...prev, [data.chatId]: data.unreadCount }))
            setTotalUnread(data.totalUnread)
        }

        // Handle new messages (increment count if not from current user)
        const handleChatUpdated = (data: { chatId: string; lastMessage: any }) => {
            if (!data?.chatId || !data?.lastMessage) return

            // Get sender ID - handle both populated object and string ID formats
            const senderId = data.lastMessage?.sender?._id || data.lastMessage?.sender

            // Only increment if message is from another user (recipient should see the badge)
            if (senderId && senderId !== currentUserId) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [data.chatId]: (prev[data.chatId] || 0) + 1
                }))
                setTotalUnread((prev) => prev + 1)
            }
        }

        socket.on("unread_count_updated", handleUnreadCountUpdated)
        socket.on("chat_updated", handleChatUpdated)

        return () => {
            socket.off("unread_count_updated", handleUnreadCountUpdated)
            socket.off("chat_updated", handleChatUpdated)
        }
    }, [currentUserId])

    // Fetch counts on mount
    useEffect(() => {
        refreshUnreadCounts()
    }, [refreshUnreadCounts])

    return (
        <UnreadCountContext.Provider
            value={{
                totalUnread,
                unreadCounts,
                refreshUnreadCounts,
                markChatAsRead
            }}
        >
            {children}
        </UnreadCountContext.Provider>
    )
}

export function useUnreadCountContext() {
    const context = useContext(UnreadCountContext)
    if (context === undefined) {
        throw new Error("useUnreadCountContext must be used within an UnreadCountProvider")
    }
    return context
}
