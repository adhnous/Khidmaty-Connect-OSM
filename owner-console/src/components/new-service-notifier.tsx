"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";

export default function NewServiceNotifier() {
  const [toast, setToast] = useState<{ id: string; title: string } | null>(null);
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
  const [roleInfo, setRoleInfo] = useState<{ role: string | null; error?: string } | null>(null);
  const initialized = useRef(false);
  const hideTimer = useRef<number | null>(null);
  const unsubRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifSupported(true);
      setNotifPermission(window.Notification.permission);
    }

    const off = onAuthStateChanged(auth, async (u) => {
      // Only listen when signed in
      // Tear down any previous listener
      if (unsubRef.current) {
        unsubRef.current?.();
        unsubRef.current = null;
      }
      if (!u) {
        initialized.current = false;
        setRoleInfo(null);
        return;
      }

      // Check role first to avoid permission errors
      try {
        const me = await getDoc(doc(db, "users", u.uid));
        const role = (me.exists() ? (me.get("role") as string) : null) || null;
        setRoleInfo({ role });
        if (role !== "owner" && role !== "admin") {
          // Do not attach listener if not privileged
          return;
        }
      } catch (e: any) {
        setRoleInfo({ role: null, error: e?.message || "failed_to_read_role" });
        return;
      }

      // Listen for new pending services. We skip the initial batch.
      const q = query(collection(db, "services"), where("status", "==", "pending"));
      const unsub: () => void = onSnapshot(
        q,
        (snap) => {
          if (!initialized.current) {
            initialized.current = true;
            return; // ignore initial load
          }
          const added = snap
            .docChanges()
            .filter((c) => c.type === "added" && !c.doc.metadata.hasPendingWrites);
          if (added.length > 0) {
            const first = added[0].doc;
            const id = first.id;
            const title = (first.get("title") as string) || id;

            // Show in-app toast
            setToast({ id, title });

            // Optional browser notification
            if (typeof window !== "undefined" && "Notification" in window) {
              if (window.Notification.permission === "granted") {
                try {
                  new window.Notification("New service submitted", { body: title });
                } catch {}
              }
            }

            // Auto-hide after 6s
            if (hideTimer.current) window.clearTimeout(hideTimer.current);
            hideTimer.current = window.setTimeout(() => setToast(null), 6000);
          }
        },
        (err) => {
          // Surface permission errors and stop the listener
          if ((err as any)?.code === "permission-denied") {
            setRoleInfo((prev) => ({ role: prev?.role ?? null, error: "permission-denied" }));
          }
          unsubRef.current?.();
          unsubRef.current = null;
        }
      );
      unsubRef.current = unsub;
    });
    return () => {
      off();
      if (unsubRef.current) {
        unsubRef.current?.();
        unsubRef.current = null;
      }
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  // Prompt user to enable browser notifications (one-click)
  function enableBrowserNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (window.Notification.permission === "default") {
      window.Notification.requestPermission()
        .then((perm) => setNotifPermission(perm))
        .catch(() => {});
    }
  }

  const showNoPerm = !!roleInfo && (roleInfo.error === 'permission-denied' || (roleInfo.role !== 'owner' && roleInfo.role !== 'admin'));

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
      {notifSupported && notifPermission === "default" && (
        <button
          onClick={enableBrowserNotifications}
          className="oc-btn"
          style={{ background: "#fffbe6", borderColor: "#fde68a" }}
        >
          Enable browser notifications
        </button>
      )}

      {showNoPerm && (
        <div className="oc-card" style={{ minWidth: 280, background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No permission</div>
          <div className="oc-subtle">Sign in as an owner or admin to receive new service alerts.</div>
        </div>
      )}

      {toast && (
        <div className="oc-card" style={{ minWidth: 280 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>New service submitted</div>
          <div style={{ color: "var(--oc-muted)", marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {toast?.title}
          </div>
          <div className="oc-actions">
            <Link href="/services" className="oc-btn oc-btn-primary">View</Link>
            <button className="oc-btn" onClick={() => setToast(null)}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}
