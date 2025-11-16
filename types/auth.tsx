export type User = {
  _id: string
  name: string
  email: string
  contactNo: string
  estateName: string
  role: "dealer" | "admin"
  verificationStatus: "pending" | "verified" | "rejected"
  onBoardingCompleted?: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}
