"use client";

import { db } from "./firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import type { ServiceFormData } from "./schemas";

export type ServiceDraft = Partial<ServiceFormData> & {
  // Track last updated for UX/debug
  updatedAt?: number;
};

const col = "servicesDrafts";

export async function getServiceDraft(uid: string): Promise<ServiceDraft | null> {
  const ref = doc(db, col, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return (snap.data() as ServiceDraft) ?? null;
}

export async function saveServiceDraft(uid: string, data: Partial<ServiceFormData>): Promise<void> {
  const ref = doc(db, col, uid);
  const payload: ServiceDraft = { ...data, updatedAt: Date.now() };
  await setDoc(ref, payload, { merge: true });
}

export async function deleteServiceDraft(uid: string): Promise<void> {
  const ref = doc(db, col, uid);
  await deleteDoc(ref);
}

