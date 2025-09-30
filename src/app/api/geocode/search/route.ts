import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = searchParams.get('limit') || '5';
  const countrycodes = searchParams.get('countrycodes') || '';
  const city = (searchParams.get('city') || '').trim();
  const langParam = (searchParams.get('lang') || 'en').toLowerCase();
  const lang = langParam.startsWith('ar') ? 'ar' : 'en';

  if (!q && !city) return NextResponse.json([]);

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  const searchQ = q && city ? `${q}, ${city}, Libya` : q ? q : `${city}, Libya`;
  url.searchParams.set('q', searchQ);
  url.searchParams.set('limit', String(q ? limit : '10'));
  url.searchParams.set('addressdetails', '1');
  if (countrycodes) url.searchParams.set('countrycodes', countrycodes);
  url.searchParams.set('accept-language', lang);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept-Language': lang,
        // Identify the app per Nominatim usage policy
        'User-Agent': 'KhidmatyConnect/1.0 (+https://example.local)'
      },
      // Cache a little to be nicer to the API
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}
