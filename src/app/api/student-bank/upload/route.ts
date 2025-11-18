import { NextResponse } from 'next/server';

type UploadPayload = {
  title?: string;
  description?: string;
  university?: string;
  faculty?: string;
  course?: string;
  year?: string;
  type?: string;
  language?: string;
};

export async function POST(req: Request) {
  try {
    let payload: UploadPayload | null = null;
    try {
      payload = (await req.json()) as UploadPayload;
    } catch {
      payload = null;
    }

    if (!payload || !payload.title) {
      return NextResponse.json(
        { error: 'missing_title' },
        { status: 400 },
      );
    }

    const id = `demo-${Date.now()}`;

    // In the real implementation we will:
    // - validate payload
    // - accept a file upload
    // - push to Google Drive and/or Firebase Storage
    // - store metadata in Firestore with gating rules

    return NextResponse.json({
      ok: true,
      id,
    });
  } catch (err: any) {
    console.error('student-bank upload error', err);
    return NextResponse.json(
      { error: 'failed_to_upload_student_resource' },
      { status: 500 },
    );
  }
}

