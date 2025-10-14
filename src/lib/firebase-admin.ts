// src/lib/firebase-admin.ts
import "server-only";
import { getApps, initializeApp, cert, applicationDefault, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function initApp() {
  if (getApps().length) return getApps()[0];

  // Prefer explicit service account envs; otherwise fall back to ADC (gcloud).
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKeyRaw) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: (privateKeyRaw || "").replace(/\\n/g, "\n"),
      } as ServiceAccount),
    });
  }

  // Application Default Credentials (works if you ran: gcloud auth application-default login)
  return initializeApp({ credential: applicationDefault() });
}

export function getAdmin() {
  const app = initApp();
  return {
    adminAuth: getAuth(app),
    db: getFirestore(app),
    FieldValue,
  };
}
