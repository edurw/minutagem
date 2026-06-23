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
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "COLE_SEU_AUTH_DOMAIN_AQUI",
  projectId: "COLE_SEU_PROJECT_ID_AQUI",
  storageBucket: "COLE_SEU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "COLE_SEU_MESSAGING_SENDER_ID_AQUI",
  appId: "COLE_SEU_APP_ID_AQUI"
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
