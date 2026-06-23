import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  type User,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../lib/firebaseConfig'
import type { UserProfile } from '../types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Pick<UserProfile, 'name'>>) => Promise<void>
  uploadPhoto: (file: File) => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile from Firestore
  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile)
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    }
  }, [])

  // Create profile document in Firestore
  const createProfile = async (u: User, name?: string) => {
    const profileData: UserProfile = {
      uid: u.uid,
      name: name || u.displayName || 'Usuário',
      email: u.email || '',
      photoURL: u.photoURL || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'users', u.uid), profileData)
    setProfile(profileData)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await fetchProfile(u.uid)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [fetchProfile])

  const signInWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    await fetchProfile(result.user.uid)
  }

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await firebaseUpdateProfile(result.user, { displayName: name })
    await createProfile(result.user, name)
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    // If new user (no profile yet), create one
    const docRef = doc(db, 'users', result.user.uid)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      await createProfile(result.user)
    } else {
      await fetchProfile(result.user.uid)
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setProfile(null)
  }

  const updateProfile = async (data: Partial<Pick<UserProfile, 'name'>>) => {
    if (!user) return
    const docRef = doc(db, 'users', user.uid)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    await firebaseUpdateProfile(user, { displayName: data.name })
    await fetchProfile(user.uid)
  }

  const uploadPhoto = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuário não logado')
    const storageRef = ref(storage, `profiles/${user.uid}/avatar.jpg`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    await updateDoc(doc(db, 'users', user.uid), {
      photoURL: url,
      updatedAt: new Date().toISOString(),
    })
    await firebaseUpdateProfile(user, { photoURL: url })
    await fetchProfile(user.uid)
    return url
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        updateProfile,
        uploadPhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
