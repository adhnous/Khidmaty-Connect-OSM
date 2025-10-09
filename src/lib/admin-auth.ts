import { getAdmin } from '@/lib/firebase-admin';

export async function requireOwnerOrAdmin(req: Request): Promise<{ ok: true; uid: string } | { ok: false; code: number; error: string } > {
  try {
    const authz = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const m = authz.match(/^Bearer\s+(.+)$/i);
    if (!m) return { ok: false, code: 401, error: 'missing_token' };
    const token = m[1];
    const { auth, db } = await getAdmin() as any;
    const decoded = await auth.verifyIdToken(token, true);
    const uid = decoded.uid as string;
    const snap = await db.collection('users').doc(uid).get();
    const role = (snap.exists ? (snap.data() || {}).role : null) as string | null;
    if (role === 'owner' || role === 'admin') return { ok: true, uid };
    return { ok: false, code: 403, error: 'forbidden' };
  } catch (e: any) {
    return { ok: false, code: 401, error: 'invalid_token' };
  }
}
