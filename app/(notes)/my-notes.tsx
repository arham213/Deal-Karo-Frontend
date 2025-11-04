"use client"

import { Button } from "@/components/Button"
import { TextInput } from "@/components/TextInput"
import { Colors } from "@/constants/colors"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface Note {
  id: string
  title: string
  timestamp: string
  completed: boolean
}

export default function MyNotesScreen() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "5 Marla Plot required for client Ali Haider from Bedian road",
      timestamp: "Today - 04:30 PM",
      completed: false,
    },
    {
      id: "2",
      title: "5 Marla Plot required for client Ali Haider from Bedian road",
      timestamp: "Today - 04:30 PM",
      completed: false,
    },
    {
      id: "3",
      title: "5 Marla Plot required for client Ali Haider from Bedian road",
      timestamp: "Today - 04:30 PM",
      completed: false,
    },
    {
      id: "4",
      title: "5 Marla Plot required for client Ali Haider from Bedian road",
      timestamp: "Today - 04:30 PM",
      completed: false,
    },
    {
      id: "5",
      title: "5 Marla Plot required for client Ali Haider from Bedian road",
      timestamp: "Today - 04:30 PM",
      completed: false,
    },
  ])

  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddNote = () => {
    if (newNoteTitle.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        title: newNoteTitle,
        timestamp: "Just now",
        completed: false,
      }
      setNotes([newNote, ...notes])
      setNewNoteTitle("")
      setShowAddModal(false)
    }
  }

  const handleMarkAsDone = (id: string) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, completed: !note.completed } : note)))
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>Add New Note</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.notesList} showsVerticalScrollIndicator={false}>
        {notes.map((note) => (
          <View key={note.id} style={styles.noteCard}>
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <View style={styles.noteFooter}>
                <View style={styles.timeContainer}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.timestamp}>{note.timestamp}</Text>
                </View>
                <TouchableOpacity onPress={() => handleMarkAsDone(note.id)}>
                  <Text style={styles.markAsDoneText}>Mark as done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Note</Text>

            <TextInput
              placeholder="Type your note here..."
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
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
  container: {
    flex: 1,
    backgroundColor: Colors.neutral10,
  },
  header: {
    paddingHorizontal: 16,
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