export interface User {
  id: string
  fullName: string
  email: string
  contactNumber: string
  estateName: string
  createdAt: Date
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}
