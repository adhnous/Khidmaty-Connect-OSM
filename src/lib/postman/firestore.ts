import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

export type KeyValueRow = { key: string; value: string; enabled: boolean };

export type PostmanAuth =
  | { type: 'none' }
  | { type: 'bearer'; token: string }
  | {
      type: 'apikey';
      keyName: string;
      keyValue: string;
      in: 'header' | 'query';
    };

export type PostmanRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  auth: PostmanAuth;
  bodyText: string;
};

export type PostmanResponseSummary = {
  status: number;
  ok: boolean;
  timeMs: number;
};

export type PostmanHistoryItem = {
  id: string;
  request: PostmanRequest;
  responseSummary: PostmanResponseSummary;
  createdAt?: unknown;
};

export type PostmanSavedItem = {
  id: string;
  name: string;
  request: PostmanRequest;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function listHistory(uid: string): Promise<PostmanHistoryItem[]> {
  const ref = collection(db, 'users', uid, 'postman_history');
  const q = query(ref, orderBy('createdAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      request: data.request as PostmanRequest,
      responseSummary: data.responseSummary as PostmanResponseSummary,
      createdAt: data.createdAt,
    };
  });
}

export async function addHistory(
  uid: string,
  entry: { request: PostmanRequest; responseSummary: PostmanResponseSummary }
): Promise<void> {
  const ref = collection(db, 'users', uid, 'postman_history');
  await addDoc(ref, {
    request: entry.request,
    responseSummary: entry.responseSummary,
    createdAt: serverTimestamp(),
  });
}

export async function clearHistory(uid: string): Promise<void> {
  const ref = collection(db, 'users', uid, 'postman_history');
  const q = query(ref, orderBy('createdAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  for (const d of snap.docs) batch.delete(d.ref);
  await batch.commit();
}

export async function listSaved(uid: string): Promise<PostmanSavedItem[]> {
  const ref = collection(db, 'users', uid, 'postman_saved');
  const q = query(ref, orderBy('updatedAt', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: String(data.name || ''),
      request: data.request as PostmanRequest,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}

export async function saveRequest(
  uid: string,
  name: string,
  request: PostmanRequest
): Promise<string> {
  const ref = collection(db, 'users', uid, 'postman_saved');
  const docRef = await addDoc(ref, {
    name,
    request,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteSaved(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'postman_saved', id));
}

