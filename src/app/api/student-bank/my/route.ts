import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';
import { requireAuthedUser } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authInfo = await requireAuthedUser(req);
    if (!authInfo.ok) {
      return NextResponse.json({ error: authInfo.error }, { status: authInfo.code });
    }

    const { db } = await getAdmin();
    const col = db.collection('student_resources');
    const snap = await col.where('uploaderId', '==', authInfo.uid).limit(80).get();

    const items = snap.docs
      .map((d: any) => {
        const data = d.data() || {};
        const createdAtISO = data.createdAt?._seconds
          ? new Date(data.createdAt._seconds * 1000).toISOString()
          : null;
        const driveLink = data.driveLink || data.fileUrl || null;
        const pdfKey = data.pdfKey || null;
        return {
          id: d.id,
          title: data.title || '',
          type: data.type || 'other',
          language: data.language || null,
          status: data.status || null,
          hasFile: !!(pdfKey || driveLink || data.driveFileId),
          createdAt: createdAtISO,
        } as const;
      })
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('student-bank my list error', err);
    return NextResponse.json(
      { error: 'failed_to_list_my_student_resources' },
      { status: 500 },
    );
  }
}
