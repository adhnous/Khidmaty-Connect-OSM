import { NextResponse } from 'next/server';
import { ListBucketsCommand } from '@aws-sdk/client-s3';
import { requireOwnerOrAdmin } from '@/lib/admin-auth';
import { getS3Client, getStudentResourcesBucket, isS3Configured } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authz = await requireOwnerOrAdmin(req);
  if (!authz.ok) {
    return NextResponse.json({ ok: false, code: authz.error }, { status: authz.code });
  }

  const cfg = isS3Configured();
  if (!cfg.ok) {
    return NextResponse.json({ ok: false, code: 'storage_not_configured', missing: cfg.missing }, { status: 400 });
  }

  try {
    const s3 = getS3Client();
    const out = await s3.send(new ListBucketsCommand({}));
    const buckets = (out.Buckets || []).map((b) => b.Name).filter(Boolean);
    const bucket = getStudentResourcesBucket();
    return NextResponse.json({
      ok: true,
      bucket,
      bucketExists: buckets.includes(bucket),
      buckets,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, code: 'health_failed' }, { status: 500 });
  }
}

