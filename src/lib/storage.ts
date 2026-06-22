import type { ActiveSession, AppState, Settings, TimeEntry } from '../types'

const STORAGE_KEY = 'minutagem-state'

export const DEFAULT_SETTINGS: Settings = {
  dailyTargetMinutes: 8 * 60,
  defaultLunchMinutes: 60,
}

export const DEFAULT_STATE: AppState = {
  settings: DEFAULT_SETTINGS,
  entries: [],
  activeSession: null,
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      entries: parsed.entries ?? [],
      activeSession: parsed.activeSession ?? null,
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function createEntryId(): string {
  return crypto.randomUUID()
}

export type { AppState, Settings, TimeEntry, ActiveSession }
