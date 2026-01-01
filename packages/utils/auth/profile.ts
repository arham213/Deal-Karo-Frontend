import type { User } from "../../../types/auth"
import { Validation, type ValidationErrors } from "../../../utils/validation"

export type EditableProfileField = "name" | "email" | "contactNo" | "estateName"

export type ProfileErrors = ValidationErrors<EditableProfileField>

export const validateProfileField = (
  field: EditableProfileField,
  value: string,
): string | undefined => {
  const trimmed = value.trim()

  switch (field) {
    case "name":
      if (!Validation.isRequired(trimmed)) return "Full name is required"
      if (!Validation.hasMinLength(trimmed, 3)) return "Full name must be at least 3 characters"
      return undefined
    case "email":
      if (!Validation.isRequired(trimmed)) return "Email is required"
      if (!Validation.isEmail(trimmed)) return "Enter a valid email address"
      return undefined
    case "contactNo":
      if (!Validation.isRequired(trimmed)) return "Contact number is required"
      if (!Validation.isPakistaniMobile11(trimmed))
        return "Enter 11-digit Pakistani number (e.g. 03XXXXXXXXX)"
      return undefined
    case "estateName":
      if (!Validation.isRequired(trimmed)) return "Estate name is required"
      return undefined
    default:
      return undefined
  }
}

export const validateProfileForm = (
  data: Pick<User, EditableProfileField>,
): {
  isValid: boolean
  errors: ProfileErrors
} => {
  const newErrors: ProfileErrors = {}

  ;(["name", "email", "contactNo", "estateName"] as EditableProfileField[]).forEach((field) => {
    const errorMessage = validateProfileField(field, data[field] ?? "")
    if (errorMessage) newErrors[field] = errorMessage
  })

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors,
  }
}

export const hasProfileChanges = (profile: User, editData: User): boolean => {
  const cleanedEditContact = Validation.digitsOnly(editData.contactNo)
  const cleanedProfileContact = Validation.digitsOnly(profile.contactNo)

  return (
    editData.name.trim() !== profile.name.trim() ||
    editData.email.trim() !== profile.email.trim() ||
    cleanedEditContact !== cleanedProfileContact ||
    editData.estateName.trim() !== profile.estateName.trim()
  )
}

export interface ProfileUpdatePayload {
  _id: string
  name?: string
  email?: string
  contactNo?: string
  estateName?: string
}

export const buildProfileUpdatePayload = (profile: User, editData: User): ProfileUpdatePayload => {
  const cleanedContactNo = Validation.digitsOnly(editData.contactNo)
  const cleanedProfileContact = Validation.digitsOnly(profile.contactNo)

  const payload: ProfileUpdatePayload = {
    _id: profile._id,
  }

  if (editData.name.trim() !== profile.name.trim()) {
    payload.name = editData.name.trim()
  }

  if (editData.email.trim() !== profile.email.trim()) {
    payload.email = editData.email.trim()
  }

  if (cleanedContactNo !== cleanedProfileContact) {
    payload.contactNo = cleanedContactNo
  }

  if (editData.estateName.trim() !== profile.estateName.trim()) {
    payload.estateName = editData.estateName.trim()
  }

  return payload
}


