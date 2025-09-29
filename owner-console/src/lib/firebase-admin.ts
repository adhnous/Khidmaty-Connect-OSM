// Dynamic Admin SDK loader for Owner Console
export async function getAdmin() {
  const appMod = await import('firebase-admin/app');
  const fsMod = await import('firebase-admin/firestore');
  const authMod = await import('firebase-admin/auth');
  const { getApps, initializeApp, cert, applicationDefault } = appMod as any;
  const { getFirestore, FieldValue } = fsMod as any;
  const { getAuth } = authMod as any;

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
  return { db, auth, FieldValue } as { db: any; auth: any; FieldValue: any };
}
