"use client"

import { ListingDetailsModal } from "@/components/listings/ListingsDetailsModal"
import { ListingState } from "@/types/listings"
import apiClient from "@/utils/axiosConfig"
import { showErrorToast } from "@/utils/toast"
import axios from "axios"
import { createContext, ReactNode, useCallback, useContext, useState } from "react"

interface NotificationContextType {
    openListingFromNotification: (propertyId: string) => Promise<void>
    closeNotificationModal: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [showModal, setShowModal] = useState(false)
    const [selectedListing, setSelectedListing] = useState<ListingState | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)

    const openListingFromNotification = useCallback(async (propertyId: string) => {
        if (!propertyId) return

        setIsLoading(true)
        try {
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
                const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Failed to load listing'
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
