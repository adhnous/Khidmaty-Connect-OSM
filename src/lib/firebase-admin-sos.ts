import 'server-only';

import { getApps, initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp, type DocumentReference } from 'firebase-admin/firestore';

const SOS_APP_NAME = 'khidmaty-sos-admin';

function cleanEnv(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function requiredEnv(name: string): string {
  const v = cleanEnv(process.env[name]);
  if (!v) throw new Error(`missing_env:${name}`);
  return v;
}

function initSosApp() {
  const existing = getApps().find((a) => a.name === SOS_APP_NAME);
  if (existing) return existing;

  const projectId = requiredEnv('SOS_FIREBASE_ADMIN_PROJECT_ID');
  const clientEmail = requiredEnv('SOS_FIREBASE_ADMIN_CLIENT_EMAIL');
  const privateKeyRaw = requiredEnv('SOS_FIREBASE_ADMIN_PRIVATE_KEY');

  return initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
      } as ServiceAccount),
    },
    SOS_APP_NAME,
  );
}

export function getSosAdmin() {
  const app = initSosApp();
  return {
    auth: getAuth(app),
    db: getFirestore(app),
    FieldValue,
    Timestamp,
  };
}

export type { DocumentReference };

