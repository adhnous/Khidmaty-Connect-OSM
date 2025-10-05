// Dynamic Admin SDK loader to avoid build-time dependency errors
// Returns Firestore db and FieldValue when firebase-admin is installed.
// Throws a descriptive error if the dependency is missing.

export async function getAdmin() {
  try {
    const appMod = await import('firebase-admin/app');
    const fsMod = await import('firebase-admin/firestore');
    const authMod = await import('firebase-admin/auth');
    const msgMod = await import('firebase-admin/messaging');
    const { getApps, initializeApp, cert, applicationDefault } = appMod as any;
    const { getFirestore, FieldValue } = fsMod as any;
    const { getAuth } = authMod as any;
    const { getMessaging } = msgMod as any;

    if (!getApps().length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKeyRaw) {
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
        initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
      } else {
        initializeApp({ credential: applicationDefault() });
      }
    }

    const db = getFirestore();
    const auth = getAuth();
    const messaging = getMessaging();
    return { db, FieldValue, auth, messaging } as { db: any; FieldValue: any; auth: any; messaging: any };
  } catch (e: any) {
    const err = new Error(
      'firebase_admin_unavailable: Install firebase-admin and set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.'
    );
    (err as any).cause = e;
    throw err;
  }
}
