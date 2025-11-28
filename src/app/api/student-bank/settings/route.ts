import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public endpoint to let the main app know
// whether student uploads are enabled or not.
// Defaults to true if no setting is stored.
export async function GET() {
  try {
    const { db } = await getAdmin();
    const doc = await db.collection('app_settings').doc('student_bank').get();
    const data = (doc.exists ? (doc.data() as any) : null) || {};
    const uploadsEnabled =
      typeof data.uploadsEnabled === 'boolean' ? data.uploadsEnabled : true;

    return NextResponse.json({ uploadsEnabled });
  } catch (err) {
    console.error('student-bank settings error', err);
    // On error, fall back to enabling uploads so we don't
    // accidentally block students.
    return NextResponse.json({ uploadsEnabled: true });
  }
}

