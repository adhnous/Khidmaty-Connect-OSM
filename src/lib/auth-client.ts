import { auth } from '@/lib/firebase';

export async function getIdTokenOrThrow(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('not_signed_in');
  const token = await user.getIdToken(/* forceRefresh */ true);
  return token;
}
