"use client";

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import type { SaleItemForm } from '@/lib/schemas-sale';

export type SaleDraft = Partial<SaleItemForm> & { updatedAt?: number };

const col = 'saleItemsDrafts';

export async function getSaleDraft(uid: string): Promise<SaleDraft | null> {
  const ref = doc(db, col, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return (snap.data() as SaleDraft) ?? null;
}

export async function saveSaleDraft(uid: string, data: Partial<SaleItemForm>): Promise<void> {
  const ref = doc(db, col, uid);
  const payload: SaleDraft = { ...data, updatedAt: Date.now() };
  await setDoc(ref, payload, { merge: true });
}

export async function deleteSaleDraft(uid: string): Promise<void> {
  const ref = doc(db, col, uid);
  await deleteDoc(ref);
}
