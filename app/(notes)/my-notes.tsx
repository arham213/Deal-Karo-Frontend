"use client"

import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { getToken } from "@/utils/secureStore"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { useEffect, useState } from "react"
import {
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
  completed: boolean
  createdAt: any
}

export default function MyNotesScreen() {
  const [notes, setNotes] = useState<Note[]>([])

  const [newNoteDescription, setNewNoteDescription] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const BASE_URL = 'http://10.224.131.91:8080/api';

  useEffect(()=> {
    getNotes();
  }, [])

  const getNotes = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const response = await axios.get(`${BASE_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('response:', response.data);

      if (response?.data.success) {
        setNotes(response.data.data?.notes)
      } else {
        alert(response?.data.error.message);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error?.response?.data?.error?.message);
      } else {
        alert("Something went wrong. Please try again later")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNoteDescription) {
      alert("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      const response = await axios.post(`${BASE_URL}/notes`, {  description: newNoteDescription }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('response:', response.data);

      if (response?.data.success) {
        alert("Note Added Successfully");
        getNotes()
        setNewNoteDescription("")
        setShowAddModal(false)
      } else {
        alert(response?.data.error.message);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error?.response?.data?.error?.message);
      } else {
        alert("Something went wrong. Please try again later")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsDone = (id: string) => {
    setNotes(notes.map((note) => (note?._id === id ? { ...note, completed: !note?.completed } : note)))
  }

  const NotesHeader = () => (
    <View style={styles.header}>
          <Text style={styles.title}>My Notes</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
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
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Note</Text>

            <TextInput
              placeholder="Type your note here..."
              value={newNoteDescription}
              onChangeText={setNewNoteDescription}
              multiline
              style={styles.noteInput}
            />

            <View style={styles.modalButtons}>
              <Button title="Add" onPress={handleAddNote} />
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
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
    paddingHorizontal: 16
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  notesList: {
    paddingHorizontal: 16,
  },
  notesListContent: {
    paddingBottom: 90,
  },
  noteCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.success,
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
  noteInput: {
    minHeight: 100,
    paddingVertical: 12,
  },
  modalButtons: {
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
})