import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guard: only initialize if config is present (avoids crash when .env is missing)
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
const app  = hasConfig ? initializeApp(firebaseConfig) : null;
const auth = hasConfig ? getAuth(app) : null;
const googleProvider = hasConfig ? new GoogleAuthProvider() : null;

export {
  auth,
  googleProvider,
  hasConfig,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
};
