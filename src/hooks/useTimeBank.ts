import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebaseConfig'
import { useAuth } from '../context/AuthContext'
import { calcWorkedMinutes, getNowTime, getTodayDate } from '../lib/time'
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

// Caminhos no Firestore
const userDoc = (uid: string) => doc(db, 'users', uid)
const entriesCol = (uid: string) => collection(db, 'users', uid, 'entries')
const entryDoc = (uid: string, id: string) => doc(db, 'users', uid, 'entries', id)

export function useTimeBank() {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  // Estado local — fonte da verdade para a UI
  const [state, setState] = useState<AppState>(() => loadState())

  // Evita migração duplicada por sessão
  const hasMigrated = useRef(false)

  // ─── MODO GUEST: persiste no localStorage ─────────────────────────────────
  useEffect(() => {
    if (!uid) {
      saveState(state)
    }
  }, [state, uid])

  // ─── MODO AUTENTICADO: sincroniza com Firestore ────────────────────────────
  useEffect(() => {
    if (!uid) return

    // Migra dados locais para o Firestore na primeira vez que o usuário loga
    async function migrateLocalData() {
      if (hasMigrated.current) return
      hasMigrated.current = true

      const local = loadState()
      const hasLocalEntries = local.entries.length > 0
      if (!hasLocalEntries) return

      // Só migra se o usuário ainda não tem entradas na nuvem
      const userRef = userDoc(uid!)
      const snap = await getDoc(userRef)
      const cloudHasEntries = snap.exists() && (snap.data()?.hasEntries === true)
      if (cloudHasEntries) return

      const batch = writeBatch(db)

      // Salva settings
      batch.set(userRef, {
        settings: local.settings,
        activeSession: local.activeSession,
        hasEntries: local.entries.length > 0,
      }, { merge: true })

      // Salva cada entrada
      for (const entry of local.entries) {
        batch.set(entryDoc(uid!, entry.id), entry)
      }

      await batch.commit()

      // Limpa localStorage após migração
      localStorage.removeItem('minutagem-state')
    }

    migrateLocalData()

    // Listener em tempo real para settings/activeSession
    const unsubUser = onSnapshot(userDoc(uid), (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      setState((prev) => ({
        ...prev,
        settings: data.settings ?? prev.settings,
        activeSession: data.activeSession ?? null,
      }))
    })

    // Listener em tempo real para entries
    const unsubEntries = onSnapshot(entriesCol(uid), (snap) => {
      const entries: TimeEntry[] = snap.docs.map((d) => d.data() as TimeEntry)
      setState((prev) => ({ ...prev, entries }))
    })

    return () => {
      unsubUser()
      unsubEntries()
    }
  }, [uid])

  // ─── HELPERS DE ESCRITA ────────────────────────────────────────────────────

  // Atualiza settings e activeSession no Firestore ou localStorage
  const persistMeta = useCallback(
    async (meta: Partial<Pick<AppState, 'settings' | 'activeSession'>>) => {
      if (uid) {
        await setDoc(userDoc(uid), { ...meta, hasEntries: true }, { merge: true })
      }
    },
    [uid],
  )

  const update = useCallback(
    (updater: (prev: AppState) => AppState) => {
      setState((prev) => updater(prev))
    },
    [],
  )

  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  const startSession = useCallback(
    async (startTime: string, date = getTodayDate()) => {
      const activeSession: ActiveSession = { date, startTime }
      update((prev) => ({ ...prev, activeSession }))
      await persistMeta({ activeSession })
    },
    [update, persistMeta],
  )

  const cancelSession = useCallback(async () => {
    update((prev) => ({ ...prev, activeSession: null }))
    await persistMeta({ activeSession: null })
  }, [update, persistMeta])

  const stopSession = useCallback(
    async (input: StopSessionInput) => {
      let newEntry: TimeEntry | null = null

      update((prev) => {
        if (!prev.activeSession) return prev
        const now = new Date().toISOString()
        newEntry = {
          id: createEntryId(),
          date: prev.activeSession.date,
          startTime: prev.activeSession.startTime,
          endTime: input.endTime,
          lunchMinutes: input.lunchMinutes,
          usedDefaultLunch: input.usedDefaultLunch,
          createdAt: now,
          updatedAt: now,
        }
        return { ...prev, activeSession: null, entries: [newEntry, ...prev.entries] }
      })

      // Aguarda o state ter o newEntry para persistir
      await persistMeta({ activeSession: null })
      if (uid && newEntry) {
        await setDoc(entryDoc(uid, (newEntry as TimeEntry).id), newEntry)
        await setDoc(userDoc(uid), { hasEntries: true }, { merge: true })
      }
    },
    [update, persistMeta, uid],
  )

  const addEntry = useCallback(
    async (input: EntryInput) => {
      const now = new Date().toISOString()
      const entry: TimeEntry = { id: createEntryId(), ...input, createdAt: now, updatedAt: now }
      update((prev) => ({ ...prev, entries: [entry, ...prev.entries] }))
      if (uid) {
        await setDoc(entryDoc(uid, entry.id), entry)
        await setDoc(userDoc(uid), { hasEntries: true }, { merge: true })
      }
    },
    [update, uid],
  )

  const updateEntry = useCallback(
    async (id: string, input: EntryInput) => {
      const updatedAt = new Date().toISOString()
      update((prev) => ({
        ...prev,
        entries: prev.entries.map((e) =>
          e.id === id ? { ...e, ...input, updatedAt } : e,
        ),
      }))
      if (uid) {
        await setDoc(entryDoc(uid, id), { ...input, updatedAt }, { merge: true })
      }
    },
    [update, uid],
  )

  const deleteEntry = useCallback(
    async (id: string) => {
      update((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }))
      if (uid) {
        await deleteDoc(entryDoc(uid, id))
      }
    },
    [update, uid],
  )

  const updateSettings = useCallback(
    async (settings: Partial<Settings>) => {
      update((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }))
      if (uid) {
        await persistMeta({ settings: { ...state.settings, ...settings } })
      }
    },
    [update, uid, persistMeta, state.settings],
  )

  const resetAll = useCallback(async () => {
    setState(DEFAULT_STATE)
    if (uid) {
      // Deleta todas as entradas do Firestore
      const batch = writeBatch(db)
      state.entries.forEach((e) => batch.delete(entryDoc(uid, e.id)))
      batch.set(userDoc(uid), {
        settings: DEFAULT_STATE.settings,
        activeSession: null,
        hasEntries: false,
      }, { merge: true })
      await batch.commit()
    }
  }, [uid, state.entries])

  // ─── DERIVADOS ────────────────────────────────────────────────────────────

  const balance = useMemo(() => {
    const byDate = new Map<string, number>()
    for (const entry of state.entries) {
      const worked = calcWorkedMinutes(entry.startTime, entry.endTime, entry.lunchMinutes)
      byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + worked)
    }
    let total = 0
    for (const worked of byDate.values()) {
      total += worked - state.settings.dailyTargetMinutes
    }
    return total
  }, [state.entries, state.settings.dailyTargetMinutes])

  const todayWorked = useMemo(() => {
    const today = getTodayDate()
    return state.entries
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + calcWorkedMinutes(e.startTime, e.endTime, e.lunchMinutes), 0)
  }, [state.entries])

  const todayBalance = todayWorked - state.settings.dailyTargetMinutes

  const sortedEntries = useMemo(
    () =>
      [...state.entries].sort((a, b) => {
        const d = b.date.localeCompare(a.date)
        return d !== 0 ? d : b.startTime.localeCompare(a.startTime)
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