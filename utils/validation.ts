const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^\+?[0-9\s-]{7,20}$/
const numericRegex = /^-?\d+(\.\d+)?$/

export const Validation = {
  isRequired(value?: string | null) {
    return Boolean(value && value.toString().trim().length)
  },
  isEmail(value: string) {
    return emailRegex.test(value.trim())
  },
  isPhone(value: string) {
    const cleaned = value.replace(/[()\s-]/g, "")
    return /^\+?\d{7,15}$/.test(cleaned)
  },
  hasMinLength(value: string, min: number) {
    return value.trim().length >= min
  },
  hasMaxLength(value: string, max: number) {
    return value.trim().length <= max
  },
  hasUppercase(value: string) {
    return /[A-Z]/.test(value)
  },
  hasLowercase(value: string) {
    return /[a-z]/.test(value)
  },
  hasNumber(value: string) {
    return /\d/.test(value)
  },
  hasSpecialCharacter(value: string) {
    return /[^A-Za-z0-9]/.test(value)
  },
  isStrongPassword(value: string) {
    return (
      this.hasMinLength(value, 8) &&
      this.hasUppercase(value) &&
      this.hasLowercase(value) &&
      this.hasNumber(value)
    )
  },
  isNumeric(value: string) {
    if (!value) return false
    const cleaned = value.replace(/,/g, "").trim()
    return numericRegex.test(cleaned)
  },
  toNumber(value: string) {
    if (!value) return NaN
    const cleaned = value.replace(/,/g, "").trim()
    return Number(cleaned)
  },
}

export type ValidationErrors<T extends string> = Partial<Record<T, string>>

export function mergeErrors<T extends string>(...errors: ValidationErrors<T>[]) {
  return errors.reduce<ValidationErrors<T>>((acc, current) => {
    return {
      ...acc,
      ...current,
    }
  }, {})
}

