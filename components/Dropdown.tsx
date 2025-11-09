import { Colors } from "@/constants/colors"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface DropdownProps {
  label?: string
  placeholder?: string
  options: string[]
  value: string
  onValueChange: (value: string) => void
  error?: string
  helperText?: string
}

export function Dropdown({ label, placeholder = "Select", options, value, onValueChange, error, helperText }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setIsOpen(false)
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={[styles.dropdown, error && styles.dropdownError]} onPress={() => setIsOpen(true)}>
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={value ? Colors.text : Colors.placeholder} />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || "Select an option"}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optionItem, value === item && styles.selectedOption]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.optionText, value === item && styles.selectedOptionText]}>
                    {item}
                  </Text>
                  {value === item && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      {error ? <Text style={styles.errorText}>{error}</Text> : helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.inputBackground || Colors.white,
  },
  dropdownError: {
    borderColor: Colors.error,
    backgroundColor: "#FFECEC",
  },
  dropdownText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.placeholder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.neutral10 || Colors.white,
    borderRadius: 16,
    width: "85%",
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: Colors.inputBackground || Colors.white,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: "600",
    color: Colors.primary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
})

