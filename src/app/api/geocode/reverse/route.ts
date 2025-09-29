import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const langParam = (searchParams.get('lang') || 'en').toLowerCase();
  const lang = langParam.startsWith('ar') ? 'ar' : 'en';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lng);
  url.searchParams.set('accept-language', lang);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept-Language': lang,
        // Nominatim requires an identifying User-Agent
        'User-Agent': 'KhidmatyConnect/1.0 (dev)'
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'reverse failed' }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ displayName: data.display_name || '' });
  } catch (e) {
    return NextResponse.json({ error: 'reverse error' }, { status: 500 });
  }
}
