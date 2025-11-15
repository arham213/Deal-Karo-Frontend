"use client"

import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { fontFamilies, fontSizes, fontWeights, radius, spacing } from "@/styles"
import { User } from "@/types/auth"
import { getToken } from "@/utils/secureStore"
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/toast"
import { Validation } from "@/utils/validation"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
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
  const [submitting, setSubmitting] = useState(false)
  const [noteError, setNoteError] = useState<string | undefined>(undefined)
  const [noteTouched, setNoteTouched] = useState(false)

  const BASE_URL = 'http://10.190.83.91:8080/api';
  const NOTE_MIN_LENGTH = 3
  const NOTE_MAX_LENGTH = 500

  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus()
  }, [])

  const checkVerificationStatus = async () => {
    try {
      setLoadingUser(true)
      const token = await getToken()
      if (!token) {
        router.replace("/(auth)/sign-in")
        return
      }

      const response = await axios.get(`${BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

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
      console.error("Error checking verification status:", error)
      router.replace("/listings")
    } finally {
      setLoadingUser(false)
    }
  }

  useEffect(() => {
    // Only fetch notes if user is verified
    if (user?.verificationStatus === "verified") {
      getNotes()
    }
  }, [user])

  const getNotes = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) {
        router.replace("/(auth)/sign-in")
        return
      }
      const response = await axios.get(`${BASE_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('response:', response.data);

      if (response?.data.success) {
        setNotes(response.data.data?.notes)
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
      setLoading(false)
    }
  }

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
      const token = await getToken()
      const response = await axios.post(`${BASE_URL}/notes`, { description: newNoteDescription.trim() }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('response:', response.data);

      if (response?.data.success) {
        showSuccessToast("Note Added Successfully");
        getNotes()
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
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) {
        router.replace("/(auth)/sign-in")
        return
      }

      console.log('token:', token);

      const response = await axios.delete(`${BASE_URL}/notes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response?.data.success) {
        showSuccessToast("Note Marked as Done Successfully");
        setNotes(notes.filter((note) => note?._id !== id))
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
      setLoading(false)
    }
  }

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
            <Text style={styles.timestamp}>{note?.createdAt}</Text>
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
          contentContainerStyle={styles.container}
          scrollEnabled
          showsVerticalScrollIndicator={false}
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
})