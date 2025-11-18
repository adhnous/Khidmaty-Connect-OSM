import { NextResponse } from 'next/server';
import { listStudentResources } from '@/lib/student-bank';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || undefined;
    const university = url.searchParams.get('university') || undefined;
    const type = (url.searchParams.get('type') || undefined) as
      | 'exam'
      | 'assignment'
      | 'notes'
      | 'report'
      | 'book'
      | 'other'
      | undefined;
    const language = (url.searchParams.get('language') || undefined) as
      | 'ar'
      | 'en'
      | 'both'
      | undefined;

    const items = await listStudentResources({
      query,
      university,
      type,
      language,
    });

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('student-bank list error', err);
    return NextResponse.json(
      { error: 'failed_to_list_student_resources' },
      { status: 500 },
    );
  }
}

