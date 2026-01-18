import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(req: Request): string | null {
  const authz =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const match = authz.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "missing_token" },
      { status: 401 },
    );
  }

  try {
    let auth: any, db: any, FieldValue: any;
    try {
      const admin = await getAdmin();
      auth = admin.auth;
      db = admin.db;
      FieldValue = admin.FieldValue;
    } catch {
      return NextResponse.json(
        { ok: false, error: "admin_unavailable" },
        { status: 503 },
      );
    }
    const decoded = await auth.verifyIdToken(token, true);
    const uid = String(decoded.uid || "");
    if (!uid) {
      return NextResponse.json(
        { ok: false, error: "invalid_token" },
        { status: 401 },
      );
    }

    const email =
      typeof decoded.email === "string" && decoded.email.trim() !== ""
        ? decoded.email.trim()
        : null;
    const name =
      typeof decoded.name === "string" && decoded.name.trim() !== ""
        ? decoded.name.trim()
        : null;
    const picture =
      typeof decoded.picture === "string" && decoded.picture.trim() !== ""
        ? decoded.picture.trim()
        : null;

    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const existing = (snap.exists ? snap.data() : null) || {};
    const currentRole = typeof existing.role === "string" ? existing.role : null;

    const updates: Record<string, unknown> = {};
    if (existing.uid !== uid) updates.uid = uid;
    if ((existing.email == null || existing.email === "") && email) {
      updates.email = email;
    }

    // Default everybody to "provider" now (keep admin/owner unchanged).
    if (currentRole !== "owner" && currentRole !== "admin" && currentRole !== "provider") {
      updates.role = "provider";
    }

    // Create defaults if the profile document doesn't exist yet.
    if (!snap.exists) {
      updates.createdAt = FieldValue.serverTimestamp();
      updates.plan = "free";
      updates.status = "active";
      updates.pricingGate = null;
      if (name) updates.displayName = name;
      if (picture) updates.photoURL = picture;
    } else {
      if ((existing.displayName == null || existing.displayName === "") && name) {
        updates.displayName = name;
      }
      if ((existing.photoURL == null || existing.photoURL === "") && picture) {
        updates.photoURL = picture;
      }
    }

    if (Object.keys(updates).length > 0) {
      await userRef.set(updates, { merge: true });
    }

    const nextSnap = await userRef.get();
    const next = (nextSnap.data() || {}) as any;

    return NextResponse.json({
      ok: true,
      profile: {
        uid,
        email: typeof next.email === "string" ? next.email : email,
        role: typeof next.role === "string" ? next.role : "provider",
        status: typeof next.status === "string" ? next.status : null,
        plan: typeof next.plan === "string" ? next.plan : null,
        displayName:
          typeof next.displayName === "string" ? next.displayName : null,
        photoURL: typeof next.photoURL === "string" ? next.photoURL : null,
      },
    });
  } catch (e) {
    console.error("[ensure-provider] failed", e);
    return NextResponse.json(
      { ok: false, error: "invalid_token" },
      { status: 401 },
    );
  }
}
