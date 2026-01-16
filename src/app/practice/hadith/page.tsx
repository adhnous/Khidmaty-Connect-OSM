'use client';

/**
 * Hadith API Practice (dorar.net)
 *
 * Allowed targets:
 * - Same-origin paths under `/api/mock/*`
 * - External (https only): `https://dorar.net`, `https://api.github.com`
 *
 * Dorar Hadith API:
 * - GET `https://dorar.net/dorar_api.json?skey=...`
 *   - `skey` = كلمة البحث (يدعم العربية)
 *   - الاستجابة JSON وبداخلها `ahadith.result` كنص HTML (طبيعي حسب الـ API)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RequestBuilder } from '@/components/postman/RequestBuilder';
import { ResponseViewer, type ProxyOkResponse } from '@/components/postman/ResponseViewer';
import { Sidebar } from '@/components/postman/Sidebar';
import type { PostmanRequest, PostmanHistoryItem, PostmanSavedItem } from '@/lib/postman/firestore';
import { addHistory, clearHistory, deleteSaved, listHistory, listSaved, saveRequest } from '@/lib/postman/firestore';
import { buildUrlWithParamsAndAuth } from '@/lib/postman/url';
import { validateJson, validatePracticeUrl } from '@/lib/postman/validate';
import { BookOpen, Globe, Shield } from 'lucide-react';

type ProxyErrorState = { message: string; status?: number; timeMs?: number } | null;

const EMPTY_ROW = { key: '', value: '', enabled: true };

const DEFAULT_REQUEST: PostmanRequest = {
  method: 'GET',
  url: 'https://dorar.net/dorar_api.json',
  params: [{ key: 'skey', value: 'إنما الأعمال', enabled: true }, EMPTY_ROW],
  headers: [EMPTY_ROW],
  auth: { type: 'none' },
  bodyText: '',
};

const EXAMPLES: Array<{ id: string; name: string; descriptionAr: string; request: PostmanRequest }> = [
  {
    id: 'ex_dorar_intentions',
    name: 'Dorar: Search "إنما الأعمال"',
    descriptionAr: 'أول تجربة: استخدم Param باسم skey للبحث عن الحديث. لاحظ أن الرد JSON وبداخله HTML في ahadith.result.',
    request: {
      method: 'GET',
      url: 'https://dorar.net/dorar_api.json',
      params: [{ key: 'skey', value: 'إنما الأعمال', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_dorar_no_harm',
    name: 'Dorar: Search "لا ضرر ولا ضرار"',
    descriptionAr: 'تجربة بحث ثانية بكلمات مختلفة. جرّب تغيير skey ولاحظ تغيّر النتائج.',
    request: {
      method: 'GET',
      url: 'https://dorar.net/dorar_api.json',
      params: [{ key: 'skey', value: 'لا ضرر ولا ضرار', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_dorar_islam',
    name: 'Dorar: Search "من حسن إسلام المرء"',
    descriptionAr: 'تدريب على البحث بجملة أطول. لاحظ ترميز الرابط (URL encoding) يتم تلقائياً عند استخدام Params.',
    request: {
      method: 'GET',
      url: 'https://dorar.net/dorar_api.json',
      params: [{ key: 'skey', value: 'من حسن إسلام المرء', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_dorar_empty',
    name: 'Dorar: Empty skey (edge case)',
    descriptionAr: 'حالة طرفية: skey فارغ. الهدف هو مشاهدة كيف يتعامل الـ API مع الطلبات غير المكتملة.',
    request: {
      method: 'GET',
      url: 'https://dorar.net/dorar_api.json',
      params: [{ key: 'skey', value: '', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_blocked_host',
    name: 'Blocked: https://example.com (should be rejected)',
    descriptionAr: 'هذا مثال مقصود للفشل: المضيف غير موجود في allowlist، لذلك تتوقع 403 Host not allowed.',
    request: {
      method: 'GET',
      url: 'https://example.com',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
];

function cloneRequest(r: PostmanRequest): PostmanRequest {
  return {
    method: r.method,
    url: r.url,
    params: (r.params || []).map((x) => ({ ...x })),
    headers: (r.headers || []).map((x) => ({ ...x })),
    auth: { ...(r.auth as any) },
    bodyText: r.bodyText,
  } as PostmanRequest;
}

export default function PracticeHadithPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [request, setRequest] = useState<PostmanRequest>(DEFAULT_REQUEST);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ProxyOkResponse | null>(null);
  const [error, setError] = useState<ProxyErrorState>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [history, setHistory] = useState<PostmanHistoryItem[]>([]);
  const [saved, setSaved] = useState<PostmanSavedItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const formatFirestoreError = useCallback((e: unknown): string => {
    const code = (e as any)?.code;
    const message = (e as any)?.message;
    if (code === 'permission-denied') {
      return 'Missing or insufficient permissions. Deploy updated `firestore.rules` to the same Firebase project as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.';
    }
    if (typeof message === 'string' && message.trim()) return message;
    if (e instanceof Error && e.message) return e.message;
    return 'Firestore error';
  }, []);

  const refreshLists = useCallback(async () => {
    if (!user) return;
    setLoadingLists(true);
    try {
      setFirestoreError(null);
      const [h, s] = await Promise.all([listHistory(user.uid), listSaved(user.uid)]);
      setHistory(h);
      setSaved(s);
    } catch (e) {
      const msg = formatFirestoreError(e);
      setFirestoreError(msg);
      setHistory([]);
      setSaved([]);
    } finally {
      setLoadingLists(false);
    }
  }, [formatFirestoreError, user?.uid]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setSaved([]);
      return;
    }
    refreshLists();
  }, [user?.uid, refreshLists]);

  const sendableRequest = useMemo(() => request, [request]);

  const handleSend = useCallback(
    async (reqToSend: PostmanRequest) => {
      if (!user) return;

      const urlOk = validatePracticeUrl(reqToSend.url);
      if (!urlOk.ok) {
        setResponse(null);
        setError({ message: urlOk.error });
        return;
      }

      const jsonOk = validateJson(reqToSend.bodyText);
      if (!jsonOk.ok) {
        setResponse(null);
        setError({ message: jsonOk.error });
        return;
      }

      const finalUrl = buildUrlWithParamsAndAuth(reqToSend.url, reqToSend.params, reqToSend.auth);

      const headers: Record<string, string> = {};
      for (const h of reqToSend.headers) {
        if (!h.enabled) continue;
        const key = String(h.key || '').trim();
        if (!key) continue;
        headers[key] = String(h.value ?? '');
      }

      if (reqToSend.auth.type === 'bearer' && reqToSend.auth.token.trim()) {
        headers['Authorization'] = `Bearer ${reqToSend.auth.token.trim()}`;
      }
      if (reqToSend.auth.type === 'apikey' && reqToSend.auth.in === 'header') {
        const key = String(reqToSend.auth.keyName || '').trim();
        if (key) headers[key] = String(reqToSend.auth.keyValue ?? '');
      }

      const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
      if (!hasContentType && reqToSend.method !== 'GET' && reqToSend.bodyText.trim()) {
        headers['Content-Type'] = 'application/json';
      }

      setSending(true);
      setResponse(null);
      setError(null);
      const start = Date.now();
      try {
        const resp = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: reqToSend.method,
            url: finalUrl,
            headers,
            bodyText: reqToSend.method === 'GET' ? undefined : reqToSend.bodyText || undefined,
          }),
        });

        const end = Date.now();
        const data = (await resp.json().catch(() => null)) as any;
        const timeMs = typeof data?.timeMs === 'number' ? data.timeMs : Math.max(0, end - start);

        if (data?.ok) {
          const okResp = data as ProxyOkResponse;
          setResponse(okResp);
          setError(null);
          try {
            await addHistory(user.uid, {
              request: reqToSend,
              responseSummary: {
                status: okResp.status,
                ok: okResp.status >= 200 && okResp.status < 300,
                timeMs: okResp.timeMs,
              },
            });
          } catch (e) {
            toast({
              variant: 'destructive',
              title: 'History not saved',
              description: formatFirestoreError(e),
            });
          }
        } else {
          const message = typeof data?.error === 'string' ? data.error : 'Request failed';
          setResponse(null);
          setError({ message, status: resp.status, timeMs });
          try {
            await addHistory(user.uid, {
              request: reqToSend,
              responseSummary: {
                status: resp.status,
                ok: false,
                timeMs,
              },
            });
          } catch (e) {
            toast({
              variant: 'destructive',
              title: 'History not saved',
              description: formatFirestoreError(e),
            });
          }
        }

        await refreshLists();
      } catch (e) {
        const end = Date.now();
        const message = e instanceof Error ? e.message : 'Fetch failed';
        setResponse(null);
        setError({ message, timeMs: Math.max(0, end - start) });
      } finally {
        setSending(false);
      }
    },
    [formatFirestoreError, refreshLists, toast, user?.uid]
  );

  if (!user) {
    return (
      <div className="ds-container py-6 md:py-10">
        <div className="mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-copper/20 via-copperLight/10 to-power/15">
          <div className="p-6 md:p-8">
            <div className="text-2xl font-bold tracking-tight text-ink">Hadith API Practice</div>
            <div className="mt-1 max-w-2xl text-sm text-ink/80">
              Practice calling a real public API (dorar.net) safely through the proxy allowlist.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <Shield className="mr-1 h-3.5 w-3.5" />
                Allowlist only
              </Badge>
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <Globe className="mr-1 h-3.5 w-3.5" />
                dorar.net
              </Badge>
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                Dorar API
              </Badge>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-6 text-sm">
            <div>You need to be signed in to save history and saved requests.</div>
            <Link className="ds-link" href="/login">
              Go to login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="ds-container py-6 md:py-10">
      <div className="mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-copper/20 via-copperLight/10 to-power/15">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight text-ink">Hadith API Practice</div>
              <div className="mt-1 max-w-2xl text-sm text-ink/80">
                Search ahadith from dorar.net via the safe proxy and inspect the JSON response.
              </div>
              <div lang="ar" dir="rtl" className="mt-2 max-w-2xl text-sm text-ink/80">
                اختر مثالًا من القائمة، ثم اضغط Send. أهم شيء هنا هو Param باسم <span className="font-mono">skey</span> (كلمة البحث).
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Docs: <a className="ds-link" href="https://dorar.net/article/389" target="_blank" rel="noreferrer">dorar.net/article/389</a>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <Shield className="mr-1 h-3.5 w-3.5" />
                Proxy allowlist
              </Badge>
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <Globe className="mr-1 h-3.5 w-3.5" />
                /api/mock/* + dorar.net
              </Badge>
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                dorar_api.json
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {firestoreError && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {firestoreError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[340px,1fr]">
        <div className="md:sticky md:top-24 md:h-[calc(100vh-8rem)]">
          <Sidebar
            examples={EXAMPLES}
            history={history}
            saved={saved}
            disabled={sending || loadingLists}
            onSelect={(r) => {
              setRequest(cloneRequest(r));
              setResponse(null);
              setError(null);
            }}
            onSave={async () => {
              try {
                const name = window.prompt('Name this request');
                const trimmed = String(name || '').trim().slice(0, 80);
                if (!trimmed) return;
                await saveRequest(user.uid, trimmed, sendableRequest);
                await refreshLists();
              } catch (e) {
                toast({
                  variant: 'destructive',
                  title: 'Save failed',
                  description: formatFirestoreError(e),
                });
              }
            }}
            onClearHistory={async () => {
              try {
                if (!window.confirm('Clear last 50 history entries?')) return;
                await clearHistory(user.uid);
                await refreshLists();
              } catch (e) {
                toast({
                  variant: 'destructive',
                  title: 'Clear history failed',
                  description: formatFirestoreError(e),
                });
              }
            }}
            onDeleteSaved={async (id) => {
              try {
                await deleteSaved(user.uid, id);
                await refreshLists();
              } catch (e) {
                toast({
                  variant: 'destructive',
                  title: 'Delete failed',
                  description: formatFirestoreError(e),
                });
              }
            }}
          />
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="border-b bg-gradient-to-r from-copper/10 to-power/10">
              <CardTitle className="text-lg">Request</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <RequestBuilder request={request} onChange={setRequest} sending={sending} onSend={handleSend} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">Response</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponseViewer response={response} error={error} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
