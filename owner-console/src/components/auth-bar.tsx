"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthBar() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setEmail(u?.email ?? null));
    return () => unsub();
  }, []);

  async function handleSignOut() {
    try {
      await signOut(auth);
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 16px 0" }}>
      <div className="oc-subtle">Owner Console</div>
      {email ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="oc-subtle" title={email} style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
          <button className="oc-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      ) : (
        <Link href="/login" className="oc-btn">Login</Link>
      )}
    </div>
  );
}
