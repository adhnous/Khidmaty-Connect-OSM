import { NextResponse } from 'next/server';
import { listStudentResources } from '@/lib/student-bank';

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

    return withCors(NextResponse.json({ items }));
  } catch (err: any) {
    console.error('student-bank list error', err);
    return withCors(
      NextResponse.json(
        { error: 'failed_to_list_student_resources' },
        { status: 500 },
      ),
    );
  }
}
