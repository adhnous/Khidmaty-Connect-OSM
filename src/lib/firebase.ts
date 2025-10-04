// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Prefer environment variables; fallback to legacy inline config for compatibility in dev
const fallback: FirebaseOptions = {
  apiKey: "AIzaSyDr43GAZFdLh674vZOzlXR_OawyFP0arRY",
  authDomain: "khidmaty-connect-2d512.firebaseapp.com",
  projectId: "khidmaty-connect-2d512",
  storageBucket: "khidmaty-connect-2d512.appspot.com",
  messagingSenderId: "587434148277",
  appId: "1:587434148277:web:1a1aeec6f34435023fd9fc",
};

const isProd = process.env.NODE_ENV === 'production';

let firebaseConfig: FirebaseOptions;
const missingEnv = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  || !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  || !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  || !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  || !process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

if (missingEnv) {
  if (isProd) {
    // Fail fast in production when env vars are not provided
    throw new Error(
      'Missing Firebase client env vars. Set NEXT_PUBLIC_FIREBASE_* in your prod environment.'
    );
  } else {
    // Allow fallback only in development to avoid breaking local runs
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.warn('[firebase] Using fallback dev config. Define NEXT_PUBLIC_FIREBASE_* env vars to override.');
    }
    firebaseConfig = fallback;
  }
} else {
  firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
