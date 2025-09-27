
import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export type UserRole = 'seeker' | 'provider';

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
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
  };
  await setDoc(userRef, data);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, data);
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
