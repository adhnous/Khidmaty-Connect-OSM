
import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export type UserRole = 'seeker' | 'provider' | 'admin' | 'owner';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  createdAt?: unknown; // Firestore Timestamp
  plan?: 'free' | 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'disabled';
  pricingGate?: {
    mode?: 'force_show' | 'force_hide' | null;
    showAt?: any; // Firestore Timestamp or ISO
    enforceAfterMonths?: number | null;
  } | null;
}

export async function createUserProfile(
  uid: string,
  email: string,
  role: UserRole
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const data: UserProfile = {
    uid,
    email,
    role,
    displayName: email.split('@')[0],
    createdAt: serverTimestamp(),
    plan: 'free',
  };
  await setDoc(userRef, data);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, data);
  } catch (e: any) {
    // If the doc does not exist yet, create it and merge
    await setDoc(userRef, { uid, ...data }, { merge: true } as any);
  }
}


export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      console.warn(`No user profile found for UID: ${uid}`);
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}
