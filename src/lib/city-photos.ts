export type PlacePhoto = {
  ref: string;
  width?: number;
  height?: number;
  attributions?: string[];
};

export async function getPlacePhotos(args: { query?: string; placeId?: string; maxResults?: number }) {
  const { query, placeId, maxResults = 20 } = args || {};
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('Missing Google Maps API key');

  let pid = placeId;
  if (!pid) {
    if (!query) throw new Error('query or placeId required');
    const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
    url.searchParams.set('input', query);
    url.searchParams.set('inputtype', 'textquery');
    url.searchParams.set('fields', 'place_id');
    url.searchParams.set('key', key);

    const r = await fetch(url.toString(), { cache: 'no-store' });
    if (!r.ok) throw new Error('findplace request failed');
    const data = await r.json() as any;
    pid = data?.candidates?.[0]?.place_id;
    if (!pid) throw new Error('Place not found');
  }

  const durl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  durl.searchParams.set('place_id', pid);
  durl.searchParams.set('fields', 'photos');
  durl.searchParams.set('key', key);
  const dr = await fetch(durl.toString(), { cache: 'no-store' });
  if (!dr.ok) throw new Error('details request failed');
  const details = await dr.json() as any;

  const photos: PlacePhoto[] = (details?.result?.photos || []).slice(0, maxResults).map((p: any) => ({
    ref: p?.photo_reference,
    width: p?.width,
    height: p?.height,
    attributions: (p?.html_attributions || []).map((a: string) => a).filter(Boolean),
  })).filter((p: PlacePhoto) => !!p.ref);

  return { placeId: pid, photos } as { placeId: string, photos: PlacePhoto[] };
}
