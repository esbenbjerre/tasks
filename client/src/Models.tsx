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

export type {
  Task, UserProfile, Identifiable
}