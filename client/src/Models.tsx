interface Task {
  id: number
  description: string
  notes: string
  completed: boolean
  deadline: number
  recurringInterval: number
  assignedGroup: number | null
  assignedUser: number
}

interface UserProfile {
  id: number
  username: string
  name: string
  groups: Array<string>
}

interface Identifiable {
  id: number
  name: string
}

type ToastType = "info" | "success" | "warning" | "error"

interface Toast {
  type: ToastType
  message: string
  closingInSeconds: number
}

export type {
  Task, UserProfile, Identifiable, ToastType, Toast
}