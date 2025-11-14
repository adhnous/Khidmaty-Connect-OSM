export function transformCloudinary(url: string, opts?: { w?: number; q?: string | number; fAuto?: boolean }) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'res.cloudinary.com') return url;
    const parts = u.pathname.split('/');
    // Expecting: /<cloud_name>/image/upload/.../public_id
    const uploadIndex = parts.findIndex((p) => p === 'upload');
    if (uploadIndex === -1) return url;

    // If a transformation segment already exists (has commas or known params), keep it.
    const nextSeg = parts[uploadIndex + 1] || '';
    const hasTransforms = /[_,]/.test(nextSeg) && /(w_|q_|f_auto|c_|g_|ar_)/.test(nextSeg);
    if (hasTransforms) return url;

    const w = opts?.w ?? 800;
    const q = opts?.q ?? 'auto';
    const fAuto = opts?.fAuto !== false; // default true
    const transforms = [fAuto ? 'f_auto' : '', `q_${q}`, `w_${w}`].filter(Boolean).join(',');
    parts.splice(uploadIndex + 1, 0, transforms);
    u.pathname = parts.join('/');
    return u.toString();
  } catch {
    return url;
  }
}

// Shared helper to decide how images should be handled client-side.
// Modes:
// - inline: keep images as data URLs / local previews
// - local: custom /api/uploads handler on this host
// - storage: Firebase Storage via uploadServiceImages
// - cloudinary: Cloudinary; callers may treat as storage if not fully supported
export function getUploadMode(uid?: string | null): 'inline' | 'local' | 'cloudinary' | 'storage' {
  const envMode = (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_MODE || '').toLowerCase();
  const hasCloud = !!(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD);
  const hasPreset = !!process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
  const storageDisabled =
    process.env.NEXT_PUBLIC_DISABLE_STORAGE_UPLOAD === '1' ||
    process.env.NEXT_PUBLIC_DISABLE_STORAGE_UPLOAD === 'true';

  if (envMode === 'inline') return 'inline';
  if (envMode === 'local') return 'local';
  if (envMode === 'cloudinary') return hasCloud && hasPreset ? 'cloudinary' : 'inline';
  if (envMode === 'storage') return storageDisabled ? 'inline' : 'storage';

  if (uid) {
    return storageDisabled ? (hasCloud && hasPreset ? 'cloudinary' : 'inline') : 'storage';
  }
  return hasCloud && hasPreset ? 'cloudinary' : 'inline';
}
