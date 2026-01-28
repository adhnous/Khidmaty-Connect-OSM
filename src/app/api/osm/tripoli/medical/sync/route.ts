import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/firebase-admin";
import { requireOwnerOrAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sync medical POIs from OpenStreetMap (Overpass) into Firestore:
//   settings/tripoli_medical_directory.json
//
// The mobile app reads this doc (public read) and renders results in Khidmaty UI.
//
// SECURITY: allow either
// - x-bot-key header matching BOT_API_KEY (good for n8n cron), OR
// - Firebase ID token (Bearer) for owner/admin users.

type BBox = { south: number; west: number; north: number; east: number };

const DEFAULT_TRIPOLI_BBOX: BBox = {
  south: 32.79,
  west: 13.1,
  north: 32.93,
  east: 13.25,
};

const AMENITY_AR: Record<string, string> = {
  hospital: "مستشفى",
  clinic: "عيادة",
  pharmacy: "صيدلية",
  doctors: "طبيب",
};

function cleanString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function parseBBox(input: any): BBox {
  const south = clamp(Number(input?.south ?? input?.minLat ?? DEFAULT_TRIPOLI_BBOX.south), -90, 90);
  const west = clamp(Number(input?.west ?? input?.minLon ?? DEFAULT_TRIPOLI_BBOX.west), -180, 180);
  const north = clamp(Number(input?.north ?? input?.maxLat ?? DEFAULT_TRIPOLI_BBOX.north), -90, 90);
  const east = clamp(Number(input?.east ?? input?.maxLon ?? DEFAULT_TRIPOLI_BBOX.east), -180, 180);
  return { south: Math.min(south, north), west: Math.min(west, east), north: Math.max(south, north), east: Math.max(west, east) };
}

async function authorize(req: Request): Promise<{ ok: true } | { ok: false; code: number; error: string }> {
  const expected = cleanString(process.env.BOT_API_KEY);
  const got = cleanString(req.headers.get("x-bot-key") || req.headers.get("X-Bot-Key"));
  if (expected && got && got === expected) return { ok: true };
  const authz = await requireOwnerOrAdmin(req);
  if (authz.ok) return { ok: true };
  return { ok: false, code: authz.code, error: authz.error };
}

function buildOverpassQuery(bbox: BBox): string {
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  // nwr = node/way/relation. Use `out body center` so ways/relations have center coords.
  return `
[out:json][timeout:25];
(
  nwr["amenity"="hospital"](${bboxStr});
  nwr["amenity"="clinic"](${bboxStr});
  nwr["amenity"="pharmacy"](${bboxStr});
  nwr["amenity"="doctors"](${bboxStr});
);
out body center;
`.trim();
}

async function fetchOverpass(query: string): Promise<any> {
  const urls = [
    cleanString(process.env.OVERPASS_URL) || "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ].filter(Boolean);

  const body = new URLSearchParams({ data: query }).toString();
  let lastErr: any = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body,
        cache: "no-store",
      });

      if (!res.ok) {
        lastErr = new Error(`overpass_http_${res.status}`);
        continue;
      }

      const json = await res.json().catch(() => null);
      if (!json || typeof json !== "object") {
        lastErr = new Error("overpass_bad_json");
        continue;
      }
      return json;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  throw lastErr || new Error("overpass_failed");
}

function pickName(tags: any): string {
  const nameAr = cleanString(tags?.["name:ar"]);
  const name = cleanString(tags?.name);
  const nameEn = cleanString(tags?.["name:en"]);
  return nameAr || name || nameEn;
}

function pickPhone(tags: any): string {
  return cleanString(tags?.["contact:phone"]) || cleanString(tags?.phone);
}

function pickWebsite(tags: any): string {
  return cleanString(tags?.["contact:website"]) || cleanString(tags?.website);
}

function formatAddress(tags: any): string {
  const full = cleanString(tags?.["addr:full"]);
  if (full) return full;

  const parts = [
    cleanString(tags?.["addr:street"]),
    cleanString(tags?.["addr:housenumber"]),
    cleanString(tags?.["addr:suburb"]) || cleanString(tags?.["addr:neighbourhood"]),
    cleanString(tags?.["addr:city"]),
  ].filter(Boolean);

  return parts.join(", ");
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, any>;
};

function elementLatLon(el: OverpassElement): { lat?: number; lon?: number } {
  const lat = typeof el.lat === "number" ? el.lat : typeof el.center?.lat === "number" ? el.center!.lat : undefined;
  const lon = typeof el.lon === "number" ? el.lon : typeof el.center?.lon === "number" ? el.center!.lon : undefined;
  return { lat, lon };
}

function toDirectoryRow(el: OverpassElement) {
  const tags = el.tags || {};
  const amenity = cleanString(tags?.amenity);
  const typeLabel = AMENITY_AR[amenity] || "خدمة طبية";

  const name = pickName(tags);
  const title = name || `${typeLabel} (بدون اسم)`;

  const addr = formatAddress(tags);
  const phone = pickPhone(tags);
  const website = pickWebsite(tags);
  const { lat, lon } = elementLatLon(el);

  const notesParts: string[] = [];
  if (phone) notesParts.push(`هاتف: ${phone}`);
  if (website) notesParts.push(`موقع: ${website}`);
  if (typeof lat === "number" && typeof lon === "number") notesParts.push(`الموقع: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
  notesParts.push(`OSM: https://www.openstreetmap.org/${el.type}/${el.id}`);

  const addressFull = addr ? `ليبيا، طرابلس، ${addr}` : "ليبيا، طرابلس";

  return {
    id: `OSM-${el.type}-${el.id}`,
    "الفئة": "الخدمات الطبية",
    "الاسم": title,
    "النوع": typeLabel,
    "المدينة": "طرابلس",
    "البلدية": "طرابلس",
    "رمز_المرفق": String(el.id),
    "العنوان": addressFull,
    "ملاحظات": notesParts.join("\n"),
    "المصدر": "OpenStreetMap (Overpass API)",
  };
}

export async function POST(req: Request) {
  const authz = await authorize(req);
  if (!authz.ok) return NextResponse.json({ ok: false, error: authz.error }, { status: authz.code });

  const body = await req.json().catch(() => ({} as any));
  const bbox = parseBBox(body?.bbox || body);

  const query = buildOverpassQuery(bbox);
  const data = await fetchOverpass(query);
  const elements: OverpassElement[] = Array.isArray((data as any)?.elements) ? (data as any).elements : [];

  const allowed = new Set(Object.keys(AMENITY_AR));
  const rows = elements
    .filter((el) => el && typeof el === "object")
    .filter((el) => allowed.has(cleanString((el as any)?.tags?.amenity)))
    .map((el) => toDirectoryRow(el))
    .filter((r) => cleanString((r as any)?.["الاسم"]))
    .sort((a, b) => String(a["الاسم"]).localeCompare(String(b["الاسم"]), "ar"));

  // Keep within Firestore document size limit (1 MiB). Store as a JSON string to reduce overhead.
  const json = JSON.stringify(rows);
  const bytes = Buffer.byteLength(json, "utf8");
  if (bytes > 900_000) {
    return NextResponse.json(
      { ok: false, error: "too_large", bytes, count: rows.length },
      { status: 413 },
    );
  }

  const { db } = await getAdmin();
  await db
    .collection("settings")
    .doc("tripoli_medical_directory")
    .set(
      {
        json,
        updatedAt: new Date(),
        source: "osm_overpass",
        bbox,
        count: rows.length,
      },
      { merge: true },
    );

  return NextResponse.json({ ok: true, count: rows.length, bytes });
}

