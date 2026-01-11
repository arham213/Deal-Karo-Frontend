"use client"

import { ListingDetailsModal } from "@/components/listings/ListingsDetailsModal"
import { User } from "@/types/auth"
import { ListingState } from "@/types/listings"
import apiClient from "@/utils/axiosConfig"
import { showErrorToast } from "@/utils/toast"
import axios from "axios"
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react"

interface NotificationContextType {
    openListingFromNotification: (propertyId: string) => Promise<void>
    closeNotificationModal: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [selectedListing, setSelectedListing] = useState<ListingState | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)

    const getUser = async () => {
        try {
            const response = await apiClient.get(`/users/me`)
            if (response.data.success) {
                setUser(response.data.data.user)
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status
                // Don't show error toast for auth errors - interceptors will handle logout
                if (status === 401 || status === 404) {
                    return
                }
            }
            // Silently fail - user will remain null
        }
    }

    useEffect(() => {
        getUser()
    }, [])

    const openListingFromNotification = useCallback(async (propertyId: string) => {
        if (!propertyId) return

        setIsLoading(true)
        try {
            // Fetch fresh user data to ensure accurate verification status
            const userResponse = await apiClient.get(`/users/me`)

            if (!userResponse.data.success) {
                showErrorToast("Failed to verify user status")
                return
            }

            const currentUser = userResponse.data.data.user

            // Only proceed if user is verified
            if (currentUser?.verificationStatus !== "verified") {
                showErrorToast("Please verify your account to view listing details")
                return
            }

            // Fetch the listing details from the API
            const response = await apiClient.get(`/properties/${propertyId}`)

            if (response.data.success) {
                setSelectedListing(response.data.data.property)
                setShowModal(true)
            } else {
                showErrorToast("Failed to load listing details")
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status
                const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Failed to load listing'

                // Don't show error toast for auth errors - interceptors will handle logout
                if (status === 401 || status === 404) {
                    return
                }

                showErrorToast(errorMessage)
            } else {
                showErrorToast("Failed to load listing details")
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    const closeNotificationModal = useCallback(() => {
        setShowModal(false)
        setSelectedListing(undefined)
    }, [])

    return (
        <NotificationContext.Provider value={{ openListingFromNotification, closeNotificationModal }}>
            {children}

            {/* Global notification modal */}
            <ListingDetailsModal
                visible={showModal}
                onClose={closeNotificationModal}
                listing={selectedListing}
            />
        </NotificationContext.Provider>
    )
}

export function useNotificationContext() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error("useNotificationContext must be used within a NotificationProvider")
    }
    return context
}
