import 'server-only';

/**
 * Server-side Cloudinary helpers for cleaning up media when services are deleted.
 *
 * This module is intentionally server-only and should never be imported from client components.
 */

const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ||
  '';

const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

function hasAdminCredentials(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

/**
 * Best-effort derivation of Cloudinary public_id from a URL.
 *
 * Works with URLs that look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/<transforms?>/folder/name.jpg
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== 'res.cloudinary.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);

    // Expect: [cloud_name, 'image', 'upload', ...rest]
    const uploadIndex = parts.findIndex((p) => p === 'upload');
    if (uploadIndex === -1 || uploadIndex + 1 >= parts.length) return null;

    const rest = parts.slice(uploadIndex + 1);
    if (!rest.length) return null;

    // If first segment looks like a transform (contains commas and known params), drop it.
    const first = rest[0];
    const looksLikeTransform =
      /,/.test(first) && /(w_|q_|f_auto|c_|g_|ar_)/.test(first);
    const publicSegments = looksLikeTransform ? rest.slice(1) : rest;
    if (!publicSegments.length) return null;

    const last = publicSegments[publicSegments.length - 1];
    const withoutExt = last.replace(/\.[^/.]+$/, '');
    publicSegments[publicSegments.length - 1] = withoutExt;

    return publicSegments.join('/');
  } catch {
    return null;
  }
}

/**
 * Best-effort delete of a single Cloudinary image given a public_id or URL.
 * No-ops if credentials are missing or the ID cannot be derived.
 */
export async function deleteCloudinaryImage(idOrUrl: string): Promise<void> {
  if (!hasAdminCredentials()) return;

  let publicId = idOrUrl;
  if (publicId.startsWith('http')) {
    const derived = extractPublicIdFromUrl(publicId);
    if (!derived) return;
    publicId = derived;
  }

  if (!publicId) return;

  try {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload`,
    );
    url.searchParams.append('public_ids[]', publicId);

    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    // Ignore failures; log for diagnostics but don't block caller.
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        '[cloudinary] delete failed',
        publicId,
        res.status,
        res.statusText,
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cloudinary] delete error', err);
  }
}

