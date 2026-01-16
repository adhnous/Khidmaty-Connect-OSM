import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously as firebaseSignInAnonymously,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export const signUp = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
};

export const signInWithGoogleRedirect = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithRedirect(auth, provider);
};

export const getGoogleRedirectResult = () => {
  return getRedirectResult(auth);
};

export const signInAnonymously = () => {
  return firebaseSignInAnonymously(auth);
};

export const signOut = () => {
  return firebaseSignOut(auth);
};

export const resetPassword = (email: string) => {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || 'https://khidmaty.ly';

  // Send reset emails so the link opens your /auth/action page
  return sendPasswordResetEmail(auth, email, {
    url: `${origin}/auth/action?next=/login`,
    handleCodeInApp: true,
  });
};

export const sendVerificationEmail = (user?: User | null) => {
  const u = user ?? auth.currentUser;
  if (!u) throw new Error('No authenticated user');

  // Send verification emails so the link opens your /auth/action page
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || 'https://khidmaty.ly';

  return sendEmailVerification(u, {
    url: `${origin}/auth/action?next=/welcome`,
    handleCodeInApp: true,
  });
};

export const reloadCurrentUser = async () => {
  if (auth.currentUser) {
    await reload(auth.currentUser);
  }
};

export const isCurrentUserVerified = () => !!auth.currentUser?.emailVerified;
