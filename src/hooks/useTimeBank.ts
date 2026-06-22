import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  calcWorkedMinutes,
  getNowTime,
  getTodayDate,
} from '../lib/time'
import {
  createEntryId,
  DEFAULT_STATE,
  loadState,
  saveState,
} from '../lib/storage'
import type {
  ActiveSession,
  AppState,
  EntryInput,
  Settings,
  StopSessionInput,
  TimeEntry,
} from '../types'

export function useTimeBank() {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => updater(prev))
  }, [])

  const startSession = useCallback(
    (startTime: string, date = getTodayDate()) => {
      update((prev) => ({
        ...prev,
        activeSession: { date, startTime },
      }))
    },
    [update],
  )

  const cancelSession = useCallback(() => {
    update((prev) => ({ ...prev, activeSession: null }))
  }, [update])

  const stopSession = useCallback(
    (input: StopSessionInput) => {
      update((prev) => {
        if (!prev.activeSession) return prev

        const now = new Date().toISOString()
        const entry: TimeEntry = {
          id: createEntryId(),
          date: prev.activeSession.date,
          startTime: prev.activeSession.startTime,
          endTime: input.endTime,
          lunchMinutes: input.lunchMinutes,
          usedDefaultLunch: input.usedDefaultLunch,
          createdAt: now,
          updatedAt: now,
        }

        return {
          ...prev,
          activeSession: null,
          entries: [entry, ...prev.entries],
        }
      })
    },
    [update],
  )

  const addEntry = useCallback(
    (input: EntryInput) => {
      const now = new Date().toISOString()
      const entry: TimeEntry = {
        id: createEntryId(),
        ...input,
        createdAt: now,
        updatedAt: now,
      }
      update((prev) => ({
        ...prev,
        entries: [entry, ...prev.entries],
      }))
    },
    [update],
  )

  const updateEntry = useCallback(
    (id: string, input: EntryInput) => {
      update((prev) => ({
        ...prev,
        entries: prev.entries.map((entry) =>
          entry.id === id
            ? { ...entry, ...input, updatedAt: new Date().toISOString() }
            : entry,
        ),
      }))
    },
    [update],
  )

  const deleteEntry = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        entries: prev.entries.filter((entry) => entry.id !== id),
      }))
    },
    [update],
  )

  const updateSettings = useCallback(
    (settings: Partial<Settings>) => {
      update((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...settings },
      }))
    },
    [update],
  )

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  const balance = useMemo(() => {
    const byDate = new Map<string, number>()

    for (const entry of state.entries) {
      const worked = calcWorkedMinutes(
        entry.startTime,
        entry.endTime,
        entry.lunchMinutes,
      )
      byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + worked)
    }

    let totalBalance = 0
    for (const worked of byDate.values()) {
      totalBalance += worked - state.settings.dailyTargetMinutes
    }

    return totalBalance
  }, [state.entries, state.settings.dailyTargetMinutes])

  const todayWorked = useMemo(() => {
    const today = getTodayDate()
    return state.entries
      .filter((entry) => entry.date === today)
      .reduce(
        (sum, entry) =>
          sum +
          calcWorkedMinutes(
            entry.startTime,
            entry.endTime,
            entry.lunchMinutes,
          ),
        0,
      )
  }, [state.entries])

  const todayBalance = todayWorked - state.settings.dailyTargetMinutes

  const sortedEntries = useMemo(
    () =>
      [...state.entries].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.startTime.localeCompare(a.startTime)
      }),
    [state.entries],
  )

  return {
    settings: state.settings,
    activeSession: state.activeSession as ActiveSession | null,
    entries: sortedEntries,
    balance,
    todayWorked,
    todayBalance,
    startSession,
    stopSession,
    cancelSession,
    addEntry,
    updateEntry,
    deleteEntry,
    updateSettings,
    resetAll,
    getNowTime,
    getTodayDate,
  }
}
