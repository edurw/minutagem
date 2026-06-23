export interface Settings {
  dailyTargetMinutes: number
  defaultLunchMinutes: number
}

export interface TimeEntry {
  id: string
  date: string
  startTime: string
  endTime: string
  lunchMinutes: number
  usedDefaultLunch: boolean
  createdAt: string
  updatedAt: string
}

export interface ActiveSession {
  date: string
  startTime: string
}

export interface AppState {
  settings: Settings
  entries: TimeEntry[]
  activeSession: ActiveSession | null
}

export interface StopSessionInput {
  endTime: string
  lunchMinutes: number
  usedDefaultLunch: boolean
}

export interface EntryInput {
  date: string
  startTime: string
  endTime: string
  lunchMinutes: number
  usedDefaultLunch: boolean
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  photoURL: string | null
  createdAt: string
  updatedAt: string
}
