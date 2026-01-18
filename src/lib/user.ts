import { auth, db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc, 
  serverTimestamp, 
  Timestamp,
} from 'firebase/firestore';
import type { FieldValue } from 'firebase/firestore';

export type UserRole = 'seeker' | 'provider' | 'admin' | 'owner';

export type UserSettings = {
  theme?: 'system' | 'light' | 'dark';
  language?: 'en' | 'ar';
  emailNotif?: boolean;
  pushNotif?: boolean;
  tips?: boolean;
} | null;

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  createdAt?: Timestamp | FieldValue | null;
  plan?: 'free' | 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'disabled' | 'pending';
  settings?: UserSettings;
  pricingGate?: {
    mode?: 'force_show' | 'force_hide' | null;
    showAt?: Timestamp | null;
    enforceAfterMonths?: number | null;
  } | null;
}

export async function createUserProfile(
  uid: string,
  email: string,
  role: UserRole = 'provider'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const data: UserProfile = {
      uid,
      email,
      role,
      displayName: email.split('@')[0],
      createdAt: serverTimestamp(),
      plan: 'free',
      status: 'active',
    };
    await setDoc(userRef, data);
    console.log(`User profile created for UID: ${uid}`);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>,
  options?: { authEmail?: string | null }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);

    const {
      uid: _uid,
      role: _role,
      plan: _plan,
      status: _status,
      createdAt: _createdAt,
      pricingGate: _pricingGate,
      ...mutable
    } = data;

    const cleanedUpdate = Object.fromEntries(
      Object.entries(mutable).filter(([, value]) => value !== undefined)
    ) as Record<string, unknown>;

    // Try updating first (does not require reading the doc).
    try {
      if (Object.keys(cleanedUpdate).length > 0) {
        await updateDoc(userRef, cleanedUpdate as any);
      }
      return;
    } catch (e: any) {
      // If the profile doc doesn't exist yet, create it (common for new users).
      if (String(e?.code || '') !== 'not-found') throw e;
    }

    const current = auth.currentUser;
    let authEmail =
      current && current.uid === uid ? (current.email ?? null) : null;

    if (!authEmail && current && current.uid === uid) {
      try {
        const token = await current.getIdTokenResult();
        const claimEmail = (token?.claims as any)?.email;
        if (typeof claimEmail === 'string' && claimEmail.trim() !== '') {
          authEmail = claimEmail;
        }
      } catch {
        // ignore
      }
    }

    if (!authEmail) {
      const provided = options?.authEmail ?? null;
      if (typeof provided === 'string' && provided.trim() !== '') {
        authEmail = provided.trim();
      }
    }

    if (!authEmail) {
      throw new Error('No authenticated email available to create user profile.');
    }

    const roleCandidate = data.role;
    const safeRole: UserRole =
      roleCandidate === 'seeker' || roleCandidate === 'provider'
        ? roleCandidate
        : 'provider';

    const createData: Partial<UserProfile> = {
      ...(cleanedUpdate as any),
      uid,
      email: authEmail,
      role: safeRole,
      createdAt: serverTimestamp(),
      plan: 'free',
      status: 'active',
      pricingGate: null,
    };

    if (!createData.displayName) {
      createData.displayName = authEmail.split('@')[0];
    }

    await setDoc(userRef, createData, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Validate that we have the required fields
      if (!data.role) {
        console.warn(`User profile for UID: ${uid} is missing required fields`);
        return null;
      }
      
      return {
        uid: data.uid || uid,
        email: data.email || null,
        role: data.role as UserRole,
        displayName: data.displayName,
        photoURL: data.photoURL,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        city: data.city || null,
        createdAt: data.createdAt || null,
        plan: data.plan || 'free',
        status: data.status || 'active',
        pricingGate: data.pricingGate || null,
        settings: (data as any).settings || null,
      };
    } else {
      console.warn(`No user profile found for UID: ${uid}`);
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Helper function to check if user has specific role
export function hasRole(userProfile: UserProfile | null, role: UserRole | UserRole[]): boolean {
  if (!userProfile) return false;
  
  const rolesToCheck = Array.isArray(role) ? role : [role];
  return rolesToCheck.includes(userProfile.role);
}

// Helper function to check if user is active
export function isUserActive(userProfile: UserProfile | null): boolean {
  return userProfile?.status === 'active';
}

// Helper function to get user display name
export function getUserDisplayName(userProfile: UserProfile | null): string {
  if (!userProfile) return 'Unknown User';
  return userProfile.displayName || userProfile.email?.split('@')[0] || 'Unknown User';
}
