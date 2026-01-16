import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CITIES = [
  { id: 'tri', nameEn: 'Tripoli', nameAr: 'طرابلس', region: 'west' },
  { id: 'ben', nameEn: 'Benghazi', nameAr: 'بنغازي', region: 'east' },
  { id: 'mis', nameEn: 'Misrata', nameAr: 'مصراتة', region: 'west' },
  { id: 'sbh', nameEn: 'Sabha', nameAr: 'سبها', region: 'south' },
  { id: 'zaw', nameEn: 'Zawiya', nameAr: 'الزاوية', region: 'west' },
  { id: 'srt', nameEn: 'Sirte', nameAr: 'سرت', region: 'central' },
  { id: 'drn', nameEn: 'Derna', nameAr: 'درنة', region: 'east' },
  { id: 'tbr', nameEn: 'Tobruk', nameAr: 'طبرق', region: 'east' },
  { id: 'ghr', nameEn: 'Gharyan', nameAr: 'غريان', region: 'west' },
  { id: 'kuf', nameEn: 'Kufra', nameAr: 'الكفرة', region: 'south' },
] as const;

function clampInt(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function toLower(s: string) {
  return String(s || '').toLowerCase();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const region = String(url.searchParams.get('region') || '').trim().toLowerCase();
  const q = String(url.searchParams.get('q') || '').trim();
  const take = clampInt(Number(url.searchParams.get('take') ?? 50), 1, 50);

  let rows = [...CITIES];
  if (region) rows = rows.filter((c) => c.region === region);
  if (q) {
    const needle = toLower(q);
    rows = rows.filter((c) => toLower(c.nameEn).includes(needle) || toLower(c.nameAr).includes(needle));
  }

  const total = rows.length;
  return NextResponse.json({ ok: true, cities: rows.slice(0, take), total, take });
}

