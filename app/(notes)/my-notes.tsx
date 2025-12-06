"use client"

import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { User } from "@/types/auth"
import apiClient from "@/utils/axiosConfig"
import { getToken } from "@/utils/secureStore"
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/toast"
import { Validation } from "@/utils/validation"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface Note {
  _id: string
  description: string
  createdAt: any
}

export default function MyNotesScreen() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [newNoteDescription, setNewNoteDescription] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [noteError, setNoteError] = useState<string | undefined>(undefined)
  const [noteTouched, setNoteTouched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const hasScrolledRef = useRef(false)
  const initialLoadCompleteRef = useRef(false)
  const isFetchingRef = useRef(false)
  const currentPageRef = useRef(1)

  const BASE_URL = 'https://deal-karo-backend.vercel.app/api';
  const NOTE_MIN_LENGTH = 3
  const NOTE_MAX_LENGTH = 500

  const formatDate = (dateString: any): string => {
    if (!dateString) return ""
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const noteDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // Format time in 12-hour format
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes
    const timeString = `${hours}:${minutesStr} ${ampm}`
    
    // Determine date label
    let dateLabel = ""
    if (noteDate.getTime() === today.getTime()) {
      dateLabel = "Today"
    } else if (noteDate.getTime() === yesterday.getTime()) {
      dateLabel = "Yesterday"
    } else {
      // Format as "MMM DD, YYYY" for older dates
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      dateLabel = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    }
    
    return `${dateLabel} - ${timeString}`
  }

  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus()
  }, [])

  const checkVerificationStatus = async () => {
    try {
      setLoadingUser(true)
      const token = await getToken()
      if (!token) {
        const { forceLogout } = await import("@/utils/forcedLogout")
        await forceLogout("You have been logged out. Please sign in again.")
        return
      }

      const response = await apiClient.get(`/users/me`)

      if (response.data.success) {
        const userData = response.data.data.user
        setUser(userData)

        // Redirect to listings if not verified
        if (userData.verificationStatus !== "verified") {
          showInfoToast(
            "Your account needs to be verified by an admin to access this feature. Please wait for verification or contact support.",
            "Access Restricted"
          )
          setTimeout(() => {
            router.replace("/listings")
          }, 2000)
          return
        }
      }
    } catch (error) {
      //console.error("Error checking verification status:", error)
      // Check if it's a user not found or auth error
      if (axios.isAxiosError(error)) {
        const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || ""
        const status = error.response?.status
        if (status === 401 || status === 404 || errorMessage.toLowerCase().includes("user not found")) {
          const { forceLogout } = await import("@/utils/forcedLogout")
          await forceLogout("You have been logged out. Please sign in again.")
          return
        }
      }
      router.replace("/listings")
    } finally {
      setLoadingUser(false)
    }
  }

  useEffect(() => {
    // Only fetch notes if user is verified
    if (user?.verificationStatus === "verified") {
      // Reset pagination state on initial load
      setCurrentPage(1)
      currentPageRef.current = 1
      setTotalPages(1)
      setHasMore(true)
      setNotes([])
      initialLoadCompleteRef.current = false
      hasScrolledRef.current = false
      isFetchingRef.current = false
      getNotes(1, true)
    }
  }, [user])

  const getNotes = useCallback(async (page: number = 1, reset: boolean = false) => {
    // Prevent multiple simultaneous API calls
    if (isFetchingRef.current) {
      return
    }

    const token = await getToken()
    if (!token) {
      if (reset) {
        const { forceLogout } = await import("@/utils/forcedLogout")
        await forceLogout("You have been logged out. Please sign in again.")
        return
      }
      return
    }

    isFetchingRef.current = true

    // Don't show loading indicator for pagination
    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const response = await apiClient.get(`/notes`, {
        params: {
          page,
          limit: parseInt(process.env.PAGINATION_LIMIT || '25'),
        }
      });
      //console.log('response:', response.data);

      isFetchingRef.current = false

      if (response?.data.success) {
        // Parse response - handle both { notes, pagination } and direct array
        const data = response.data.data
        let fetchedNotes: Note[] = []
        let pagination: any = null

        // Check if data is an array (direct notes) or object with notes property
        if (Array.isArray(data)) {
          fetchedNotes = data
        } else if (data && typeof data === 'object') {
          fetchedNotes = data.notes || []
          pagination = data.pagination
        }

        //console.log('Notes response:', { fetchedNotes: fetchedNotes.length, pagination, page, data })

        if (reset) {
          setNotes(fetchedNotes)
          initialLoadCompleteRef.current = true
          hasScrolledRef.current = false
        } else {
          // Deduplicate notes by _id when appending
          setNotes((prev) => {
            const existingIds = new Set(prev.map((item) => item._id))
            const newNotes = fetchedNotes.filter((item: Note) => !existingIds.has(item._id))
            return [...prev, ...newNotes]
          })
        }

        // Update pagination state from response (exactly like listings screen)
        if (pagination) {
          const pageNum = pagination.page || page || 1
          const totalPagesNum = pagination.totalPages || 1
          
          setCurrentPage(pageNum)
          currentPageRef.current = pageNum
          setTotalPages(totalPagesNum)
          setHasMore(pageNum < totalPagesNum)
          
          console.log('Notes pagination:', { 
            pageNum, 
            totalPagesNum, 
            hasMore: pageNum < totalPagesNum, 
            fetchedNotes: fetchedNotes.length,
            reset,
            pagination 
          })
        } else {
          // If no pagination info, use fallback logic based on results
          const limit = parseInt(process.env.PAGINATION_LIMIT || '25')
          setCurrentPage(page)
          currentPageRef.current = page
          // If we got a full page of results, assume there might be more
          const hasMoreResults = fetchedNotes.length >= limit
          setTotalPages(hasMoreResults ? page + 1 : page)
          setHasMore(hasMoreResults)
          
          console.log('Notes pagination (no pagination object):', { 
            page, 
            fetchedNotes: fetchedNotes.length,
            limit,
            hasMore: hasMoreResults,
            reset
          })
        }

        // Don't update loading state for pagination - do it after processing
        if (reset) {
          setLoading(false)
        } else {
          setLoadingMore(false)
        }
      } else {
        isFetchingRef.current = false
        if (reset) {
          setLoading(false)
        } else {
          setLoadingMore(false)
        }
        if (reset) {
          showErrorToast(response?.data.error?.message || "Failed to fetch notes");
        }
      }
    } catch (error) {
      isFetchingRef.current = false
      
      if (reset) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }

      if (reset) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || "Failed to fetch notes"
          
          // Don't show error toast for auth errors - interceptors will handle logout
          if (status === 401 || status === 404) {
            if (errorMessage.toLowerCase().includes("user not found")) {
              return
            }
            return
          }
          
          showErrorToast(errorMessage)
        } else {
          showErrorToast("Something went wrong. Please try again later")
        }
      }
    }
  }, [])

  const validateNote = (value: string) => {
    const trimmed = value.trim()
    if (!Validation.isRequired(trimmed)) return "Note cannot be empty"
    if (!Validation.hasMinLength(trimmed, NOTE_MIN_LENGTH)) return `Note must be at least ${NOTE_MIN_LENGTH} characters`
    if (!Validation.hasMaxLength(trimmed, NOTE_MAX_LENGTH)) return `Note cannot exceed ${NOTE_MAX_LENGTH} characters`
    return undefined
  }

  const handleOpenModal = () => {
    setNewNoteDescription("")
    setNoteError(undefined)
    setNoteTouched(false)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setNoteTouched(false)
    setNoteError(undefined)
  }

  const handleNoteChange = (value: string) => {
    setNewNoteDescription(value)
    if (noteTouched) {
      setNoteError(validateNote(value))
    }
  }

  const noteHelperText = noteError ? undefined : `Max ${NOTE_MAX_LENGTH} characters`

  const handleAddNote = async () => {
    const errorMessage = validateNote(newNoteDescription)
    if (errorMessage) {
      setNoteError(errorMessage)
      setNoteTouched(true)
      return
    }

    setSubmitting(true)
    try {
      const response = await apiClient.post(`/notes`, { description: newNoteDescription.trim() });
      //console.log('response:', response.data);

      if (response?.data.success) {
        showSuccessToast("Note Added Successfully");
        // Reset and reload from page 1
        setCurrentPage(1)
        currentPageRef.current = 1
        setTotalPages(1)
        setHasMore(true)
        setNotes([])
        initialLoadCompleteRef.current = false
        hasScrolledRef.current = false
        getNotes(1, true)
        setNewNoteDescription("")
        setNoteTouched(false)
        setNoteError(undefined)
        setShowAddModal(false)
      } else {
        showErrorToast(response?.data.error.message || "Failed to fetch notes");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showErrorToast(error?.response?.data?.error?.message || "Failed to fetch notes");
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkAsDone = async (id: string) => {
    // Don't show loading for delete operation to avoid blocking UI
    try {
      const response = await apiClient.delete(`/notes/${id}`);

      if (response?.data.success) {
        showSuccessToast("Note Marked as Done Successfully");
        // Remove the note from the list
        setNotes((prevNotes) => prevNotes.filter((note) => note?._id !== id))
      } else {
        showErrorToast(response?.data.error.message || "Failed to fetch notes");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || "Failed to delete note"
        
        // Don't show error toast for auth errors - interceptors will handle logout
        if (status === 401 || status === 404) {
          if (errorMessage.toLowerCase().includes("user not found")) {
            return
          }
          return
        }
        
        showErrorToast(errorMessage)
      } else {
        showErrorToast("Something went wrong. Please try again later")
      }
    }
  }

  const loadMore = useCallback(() => {
    // Only load more if:
    // 1. Not already loading more
    // 2. Has more pages
    // 3. Initial load is complete
    // 4. User has scrolled (prevents immediate trigger on mount)
    console.log('loadMore called:', { 
      loadingMore, 
      hasMore, 
      loading, 
      initialLoadComplete: initialLoadCompleteRef.current, 
      hasScrolled: hasScrolledRef.current,
      currentPage 
    })
    
    if (!loadingMore && hasMore && !loading && initialLoadCompleteRef.current && hasScrolledRef.current) {
      console.log('Calling getNotes with page:', currentPage + 1)
      getNotes(currentPage + 1, false)
    }
  }, [loadingMore, hasMore, loading, currentPage, getNotes])

  const handleScroll = useCallback((event: any) => {
    if (!hasScrolledRef.current) {
      hasScrolledRef.current = true
    }

    // Proactively trigger loadMore when near the end
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const paddingToBottom = 400 // Trigger when 400px from bottom
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom

    if (isNearBottom && !loadingMore && hasMore && !loading && initialLoadCompleteRef.current) {
      loadMore()
    }
  }, [loadingMore, hasMore, loading, loadMore])

  const NotesHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>My Notes</Text>
      <TouchableOpacity onPress={handleOpenModal}>
        <Text style={styles.addButtonText}>Add New Note</Text>
      </TouchableOpacity>
    </View>
  )

  const NoteCard = ({ note }: any) => (
    <View key={note?._id} style={styles.noteCard}>
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle}>{note?.description}</Text>
        <View style={styles.noteFooter}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.timestamp}>{formatDate(note?.createdAt)}</Text>
          </View>
          <TouchableOpacity onPress={() => handleMarkAsDone(note?._id)}>
            <Text style={styles.markAsDoneText}>Mark as done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  // Show loading while checking verification
  if (loadingUser) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Don't render if user is not verified (will redirect)
  if (user?.verificationStatus !== "verified") {
    return null
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <FlatList
          data={notes}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <NoteCard note={item} />}
          ListHeaderComponent={<NotesHeader />}
          ListFooterComponent={
            loadingMore && notes.length > 0 ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingMoreText}>Loading more notes...</Text>
              </View>
            ) : !hasMore && notes.length > 0 && !loadingMore && !isFetchingRef.current ? (
              <View style={styles.endOfListContainer}>
                <Text style={styles.endOfListText}>No more notes to load</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading && !isFetchingRef.current && notes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No notes found</Text>
              </View>
            ) : null
          }
          contentContainerStyle={[
            styles.container,
            notes.length === 0 && { flexGrow: 1 } // Ensure container is tall enough to trigger onEndReached
          ]}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
        />
      </KeyboardAvoidingView>
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Note</Text>

            <TextInput
              placeholder="Type your note here..."
              value={newNoteDescription}
              onChangeText={handleNoteChange}
              onBlur={() => {
                setNoteTouched(true)
                setNoteError(validateNote(newNoteDescription))
              }}
              multiline
              style={styles.noteInput}
              containerStyle={styles.noteInputContainer}
              error={noteTouched ? noteError : undefined}
            // helperText={noteHelperText}

            />

            <View style={styles.modalButtons}>
              <Button title="Add" onPress={handleAddNote} loading={submitting} disabled={submitting || Boolean(validateNote(newNoteDescription))} />
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  container: {
    paddingBottom: 120,
    backgroundColor: Colors.headerBackground,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.headerBackground,
  },
  header: {
    paddingVertical: spacing.screen,
    paddingHorizontal: spacing.screen,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.neutral10,
    backdropFilter: "blur(2px)",
    borderBottomRightRadius: 48,
    borderBottomLeftRadius: 48,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: Colors.black,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.24
  },
  addButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: Colors.primary,
    fontFamily: fontFamilies.primary,
    letterSpacing: 0.12
  },
  notesList: {
    paddingHorizontal: 16,
    backgroundColor: "red",
  },
  notesListContent: {
    paddingBottom: 90,
  },
  noteCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    // marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: spacing.screen,
    marginBottom: spacing.md,
  },
  noteContent: {
    gap: 12,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  markAsDoneText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.neutral10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  noteInputContainer: {
    borderRadius: radius.lg
  },
  noteInput: {
    minHeight: 100,
    paddingVertical: 12,
  },
  modalButtons: {
    gap: 12,
  },
  cancelButton: {
    paddingVertical: spacing.md2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: Colors.neutral50,
    alignItems: "center",
    backgroundColor: Colors.neutral20,
  },
  cancelButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: Colors.neutral90,
    fontFamily: fontFamilies.primary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingMoreContainer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingMoreText: {
    fontSize: fontSizes.sm,
    color: Colors.textSecondary,
  },
  endOfListContainer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  endOfListText: {
    fontSize: fontSizes.sm,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: fontSizes.md,
    color: Colors.textSecondary,
  },
})