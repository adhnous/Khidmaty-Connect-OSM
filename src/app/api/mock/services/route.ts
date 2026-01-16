import { NextResponse } from 'next/server';
import { createMockService, listMockServices } from '@/app/api/mock/services/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get('city') || undefined;
  const category = url.searchParams.get('category') || undefined;
  const q = url.searchParams.get('q') || undefined;
  const minPrice = url.searchParams.has('minPrice')
    ? Number(url.searchParams.get('minPrice'))
    : undefined;
  const maxPrice = url.searchParams.has('maxPrice')
    ? Number(url.searchParams.get('maxPrice'))
    : undefined;
  const take = url.searchParams.has('take')
    ? Number(url.searchParams.get('take'))
    : undefined;

  const res = listMockServices({ city, category, q, minPrice, maxPrice, take });
  return NextResponse.json({ ok: true, services: res.services, total: res.total, take: res.take });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as any;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const category = typeof body?.category === 'string' ? body.category.trim() : '';
  const cityEn = typeof body?.cityEn === 'string' ? body.cityEn.trim() : '';
  const cityAr = typeof body?.cityAr === 'string' ? body.cityAr.trim() : '';
  const priceLyd = Number(body?.priceLyd);
  const providerName = typeof body?.providerName === 'string' ? body.providerName.trim() : '';

  if (!title || !category || !cityEn || !cityAr || !providerName || !Number.isFinite(priceLyd)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Invalid payload. Expected {title,category,cityEn,cityAr,priceLyd,providerName}.',
      },
      { status: 400 }
    );
  }
  if (title.length > 120 || providerName.length > 80) {
    return NextResponse.json({ ok: false, error: 'Text too long' }, { status: 400 });
  }
  if (priceLyd < 0 || priceLyd > 10000) {
    return NextResponse.json({ ok: false, error: 'priceLyd out of range' }, { status: 400 });
  }
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 500) : undefined;
  const contactPhone = typeof body?.contactPhone === 'string' ? body.contactPhone.trim().slice(0, 40) : undefined;

  const created = createMockService({
    title,
    category,
    cityEn,
    cityAr,
    priceLyd,
    providerName,
    description,
    contactPhone,
  });

  return NextResponse.json({ ok: true, service: created }, { status: 201 });
}
