import apiClient from "../../../utils/axiosConfig"
import { Validation } from "../../../utils/validation"

export interface Note {
  _id: string
  description: string
  createdAt: string
}

export const NOTE_MIN_LENGTH = 3
export const NOTE_MAX_LENGTH = 500

export const formatNoteDate = (dateString: unknown): string => {
  if (!dateString) return ""

  const date = new Date(dateString as any)
  if (Number.isNaN(date.getTime())) return ""

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
  hours = hours || 12 // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? `0${minutes}` : String(minutes)
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

export const validateNoteDescription = (
  value: string,
  minLength: number = NOTE_MIN_LENGTH,
  maxLength: number = NOTE_MAX_LENGTH,
): string | undefined => {
  const trimmed = value.trim()
  if (!Validation.isRequired(trimmed)) return "Note cannot be empty"
  if (!Validation.hasMinLength(trimmed, minLength))
    return `Note must be at least ${minLength} characters`
  if (!Validation.hasMaxLength(trimmed, maxLength))
    return `Note cannot exceed ${maxLength} characters`
  return undefined
}

export const createNote = async (description: string): Promise<void> => {
  const trimmed = description.trim()
  try {
    const response = await apiClient.post("/notes", { description: trimmed })

    if (!response?.data?.success) {
      const message =
        response?.data?.error?.message || response?.data?.message || "Failed to add note"
      throw new Error(message)
    }
  } catch (error) {
    if ((error as any)?.isAxiosError) {
      const axiosError = error as any
      const message =
        axiosError?.response?.data?.error?.message ||
        axiosError?.response?.data?.message ||
        axiosError.message ||
        "Failed to add note"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}

export const deleteNoteById = async (id: string): Promise<void> => {
  try {
    const response = await apiClient.delete(`/notes/${id}`)

    if (!response?.data?.success) {
      const message =
        response?.data?.error?.message || response?.data?.message || "Failed to delete note"
      throw new Error(message)
    }
  } catch (error) {
    if ((error as any)?.isAxiosError) {
      const axiosError = error as any
      const message =
        axiosError?.response?.data?.error?.message ||
        axiosError?.response?.data?.message ||
        axiosError.message ||
        "Failed to delete note"
      throw new Error(message)
    }

    throw new Error("Something went wrong. Please try again later")
  }
}


