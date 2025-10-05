import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

  // Client config must come from NEXT_PUBLIC_* env vars (no hardcoded keys)
  // IMPORTANT: Use literal reads so Next.js can inline these on the client
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  const missing = (
    [
      ['NEXT_PUBLIC_FIREBASE_API_KEY', apiKey],
      ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', authDomain],
      ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', projectId],
      ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', storageBucket],
      ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', messagingSenderId],
      ['NEXT_PUBLIC_FIREBASE_APP_ID', appId],
    ] as const
  )
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    throw new Error(
      `[firebase] Missing env vars: ${missing.join(', ')}. Set these NEXT_PUBLIC_* variables in your environment (e.g., .env.local).`
    );
  }

  const firebaseConfig: FirebaseOptions = {
    apiKey: apiKey!,
    authDomain: authDomain!,
    projectId: projectId!,
    storageBucket: storageBucket!,
    messagingSenderId: messagingSenderId!,
    appId: appId!,
  };

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
