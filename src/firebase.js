import { initializeApp } from "firebase/app"
import { getAuth, signInAnonymously } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyALAuNZy6ksaGbNXv523ovaQ_EjYLz7fLE",
  authDomain: "special-79bba.firebaseapp.com",
  projectId: "special-79bba",
  storageBucket: "special-79bba.firebasestorage.app",
  messagingSenderId: "450526706158",
  appId: "1:450526706158:web:f402b05613763dc648f6ff"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export async function loginAnonymous() {
  const result = await signInAnonymously(auth)
  return result.user
}