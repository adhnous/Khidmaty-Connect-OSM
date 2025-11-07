"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { getClientLocale } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MessagesIndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const locale = getClientLocale();

  const [items, setItems] = useState<any[]>([]);
  const [svcTitles, setSvcTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    const field = `participants.${user.uid}` as any;
    const ref = collection(db, "conversations");
    const q = query(ref, where(field, "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
    });
    return () => { try { unsub(); } catch {} };
  }, [loading, user?.uid]);

  // Fetch service titles for each conversation (best-effort)
  useEffect(() => {
    (async () => {
      const missing = new Set<string>();
      for (const it of items) {
        const sid = String(it.serviceId || "");
        if (sid && !svcTitles[sid]) missing.add(sid);
      }
      if (!missing.size) return;
      const entries: [string, string][] = [];
      await Promise.all(
        Array.from(missing).map(async (sid) => {
          try {
            const sRef = doc(db, "services", sid);
            const sSnap = await getDoc(sRef);
            if (sSnap.exists()) {
              const title = String((sSnap.data() as any)?.title || sid);
              entries.push([sid, title]);
            }
          } catch {}
        })
      );
      if (entries.length) {
        setSvcTitles((prev) => {
          const next = { ...prev };
          for (const [k, v] of entries) next[k] = v;
          return next;
        });
      }
    })();
  }, [JSON.stringify(items)]);

  const sorted = useMemo(() => {
    const rows = [...items];
    rows.sort((a, b) => {
      const av = a?.lastMessageAt?.toMillis?.() ?? (a?.lastMessageAt ? Date.parse(a.lastMessageAt) : 0);
      const bv = b?.lastMessageAt?.toMillis?.() ?? (b?.lastMessageAt ? Date.parse(b.lastMessageAt) : 0);
      return bv - av;
    });
    return rows;
  }, [JSON.stringify(items)]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">{locale === 'ar' ? 'الرسائل' : 'Messages'}</h1>
      {sorted.length === 0 ? (
        <p className="text-muted-foreground">{locale === 'ar' ? 'لا توجد محادثات بعد.' : 'No conversations yet.'}</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => {
            const lastMsg = String(c?.lastMessage || "");
            const lma = c?.lastMessageAt?.toMillis?.() ?? (c?.lastMessageAt ? Date.parse(c.lastMessageAt) : 0);
            const lra = c?.participantsMeta?.[user.uid]?.lastReadAt?.toMillis?.() ?? (c?.participantsMeta?.[user.uid]?.lastReadAt ? Date.parse(c.participantsMeta[user.uid].lastReadAt) : 0);
            const unread = lma && (!lra || lma > lra);
            const title = svcTitles[String(c.serviceId || "")] || (locale === 'ar' ? 'محادثة' : 'Conversation');
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className="block">
                <Card className="hover:bg-accent/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="truncate">{title}</span>
                      {unread && <Badge variant="destructive">{locale === 'ar' ? 'غير مقروء' : 'Unread'}</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="line-clamp-1 text-sm text-muted-foreground">{lastMsg || (locale === 'ar' ? 'ابدأ المحادثة' : 'Start chatting')}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
