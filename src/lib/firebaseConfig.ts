import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// ============================================================
// PASSO 1: Crie um projeto Firebase em https://console.firebase.google.com
// PASSO 2: Ative Authentication > Email/Senha e Google
// PASSO 3: Ative Firestore Database (modo teste)
// PASSO 4: Ative Storage (modo teste)
// PASSO 5: Vá em Configurações > Adicionar app Web e cole o firebaseConfig aqui
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAK8CX9Ocb5rT8G7GL3oXsJqrmm-PqZv7s",
  authDomain: "minutagem-57a8f.firebaseapp.com",
  projectId: "minutagem-57a8f",
  storageBucket: "minutagem-57a8f.firebasestorage.app",
  messagingSenderId: "237536129374",
  appId: "1:237536129374:web:061990dec3d33ce40d5fcf"
}

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
}

export { app, auth, db, storage }
