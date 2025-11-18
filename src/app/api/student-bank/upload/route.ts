import { NextResponse } from 'next/server';
import {
  createStudentResource,
  folderIdForType,
  type StudentResource,
} from '@/lib/student-bank';
import { requireAuthedUser } from '@/lib/server-auth';
import { uploadStudentFileToDrive } from '@/lib/google-drive-student';

type UploadJsonPayload = {
  title?: string;
  description?: string;
  university?: string;
  faculty?: string;
  course?: string;
  year?: string;
  type?: string;
  language?: string;
};

const ALLOWED_TYPES: StudentResource['type'][] = [
  'exam',
  'assignment',
  'notes',
  'report',
  'book',
  'other',
];

function normalizeType(raw?: string | null): StudentResource['type'] {
  const s = String(raw || '').toLowerCase();
  if (!s) return 'notes';
  const match = ALLOWED_TYPES.find((t) => t === s);
  return (match as StudentResource['type']) || 'notes';
}

function normalizeLanguage(raw?: string | null): StudentResource['language'] {
  const s = String(raw || '').toLowerCase();
  if (s === 'ar' || s === 'both') return s;
  return 'en';
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let title = '';
    let description: string | undefined;
    let university: string | undefined;
    let faculty: string | undefined;
    let course: string | undefined;
    let year: string | undefined;
    let type: StudentResource['type'] = 'notes';
    let language: StudentResource['language'] = 'en';
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      title = String(form.get('title') || '').trim();
      description = String(form.get('description') || '').trim() || undefined;
      university = String(form.get('university') || '').trim() || undefined;
      faculty = String(form.get('faculty') || '').trim() || undefined;
      course = String(form.get('course') || '').trim() || undefined;
      year = String(form.get('year') || '').trim() || undefined;
      type = normalizeType(form.get('type') as string | null);
      language = normalizeLanguage(form.get('language') as string | null);
      const f = form.get('file');
      if (f instanceof File) {
        file = f;
      }
    } else {
      let payload: UploadJsonPayload | null = null;
      try {
        payload = (await req.json()) as UploadJsonPayload;
      } catch {
        payload = null;
      }
      if (!payload) {
        return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
      }
      title = String(payload.title || '').trim();
      description = payload.description?.trim() || undefined;
      university = payload.university?.trim() || undefined;
      faculty = payload.faculty?.trim() || undefined;
      course = payload.course?.trim() || undefined;
      year = payload.year?.trim() || undefined;
      type = normalizeType(payload.type);
      language = normalizeLanguage(payload.language);
    }

    if (!title) {
      return NextResponse.json({ error: 'missing_title' }, { status: 400 });
    }

    // Optional: identify uploader if token is provided
    let uploaderId: string | undefined;
    const authInfo = await requireAuthedUser(req);
    if (authInfo.ok) {
      uploaderId = authInfo.uid;
    }

    let driveFileId: string | undefined;
    let driveLink: string | undefined;

    const folderId = folderIdForType(type);

    if (file && folderId) {
      try {
        const uploaded = await uploadStudentFileToDrive({
          file,
          folderId,
          title,
          type,
        });
        driveFileId = uploaded.fileId;
        driveLink = uploaded.webViewLink;
      } catch (e) {
        console.error('Drive upload failed, continuing with metadata only', e);
      }
    }

   const id = await createStudentResource({
  title,
  description,
  university,
  faculty,
  course,
  year,
  type,
  language,
  driveFileId,
  driveLink,
  uploaderId,
});


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
