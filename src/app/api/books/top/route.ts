import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { listStudentResources, type StudentResource } from '@/lib/student-bank';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Check',
};

function withCors<T extends Response>(res: T): T {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

type BookItem = {
  id: string;
  title: string;
  author?: string;
  readCount: number;
};

function sortByReadsDesc(items: BookItem[]) {
  return [...items].sort((a, b) => (b.readCount || 0) - (a.readCount || 0));
}

function normalizeBookDoc(id: string, data: any): BookItem {
  return {
    id,
    title: String(data?.title || data?.name || '').trim(),
    author: data?.author ? String(data.author).trim() : undefined,
    readCount: Number(data?.readCount ?? data?.viewCount ?? 0),
  };
}

function normalizeStudentResourceBook(r: StudentResource): BookItem {
  return {
    id: r.id,
    title: String(r.title || '').trim(),
    author: (r as any)?.author ? String((r as any).author).trim() : undefined,
    readCount: Number((r as any)?.readCount ?? (r as any)?.viewCount ?? 0),
  };
}

export async function GET() {
  try {
    // Prefer a dedicated `books` collection if it exists and has items.
    try {
      const { db } = await getAdmin();
      const snap = await db
        .collection('books')
        .orderBy('readCount', 'desc')
        .limit(10)
        .get();
      const items = snap.docs
        .map((d) => normalizeBookDoc(d.id, d.data()))
        .filter((b) => b.title.length > 0);
      if (items.length > 0) {
        return withCors(
          NextResponse.json({ items: sortByReadsDesc(items).slice(0, 10) }),
        );
      }
    } catch {
      // Ignore and fall back to student resources.
    }

    const rows = await listStudentResources({ type: 'book' });
    const items = sortByReadsDesc(rows.map(normalizeStudentResourceBook)).slice(0, 10);
    return withCors(NextResponse.json({ items }));
  } catch (err: any) {
    console.error('books top error', err);
    return withCors(
      NextResponse.json(
        { error: 'failed_to_list_top_books' },
        { status: 500 },
      ),
    );
  }
}
