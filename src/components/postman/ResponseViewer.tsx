'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Clock, FileJson2 } from 'lucide-react';

export type ProxyOkResponse = {
  ok: true;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  bodyText: string;
  timeMs: number;
  isJson: boolean;
};

type Props = {
  response: ProxyOkResponse | null;
  error: { message: string; status?: number; timeMs?: number } | null;
  className?: string;
};

type DorarParsedHadith = {
  index: number;
  text: string;
  rawi?: string;
  muhaddith?: string;
  source?: string;
  pageOrNumber?: string;
  hukm?: string;
};

function normalizeHtmlForSandbox(html: string): string {
  const input = String(html || '');
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return input;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    doc.querySelectorAll('script, style, iframe, object, embed').forEach((el) => el.remove());
    return doc.body?.innerHTML || input;
  } catch {
    return input;
  }
}

function buildSandboxedHtmlDoc(innerHtml: string): string {
  const safeInner = normalizeHtmlForSandbox(innerHtml);
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><style>
  :root{color-scheme:light;}
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; padding:12px; line-height:1.7; direction:rtl; text-align:right;}
  .hadith{margin:0 0 12px;}
  .hadith-info{margin:6px 0 14px; color:#475569; font-size:13px;}
  .search-keys{background:rgba(245,158,11,.18); border:1px solid rgba(245,158,11,.25); padding:0 3px; border-radius:6px;}
  a{color:#0ea5e9; text-decoration:none;}
  a:hover{text-decoration:underline;}
  hr{border:0; border-top:1px solid #e2e8f0; margin:14px 0;}
  </style></head><body>${safeInner}</body></html>`;
}

function normalizeArabicKey(input: string): string {
  return String(input || '')
    .replace(/[:：]/g, '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // harakat
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, '')
    .trim();
}

function cleanValue(input: string): string {
  return String(input || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDorarInfoBlock(infoEl: Element): Record<string, string> {
  const out: Record<string, string> = {};
  let currentKey: string | null = null;
  let buffer: string[] = [];

  function flush() {
    if (!currentKey) return;
    const value = cleanValue(buffer.join(' '));
    if (value) out[currentKey] = value;
    buffer = [];
  }

  for (const node of Array.from(infoEl.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.matches('span.info-subtitle')) {
        flush();
        currentKey = cleanValue(el.textContent || '');
        continue;
      }
    }

    if (!currentKey) continue;
    const text = cleanValue(node.textContent || '');
    if (text) buffer.push(text);
  }

  flush();
  return out;
}

function parseDorarHtml(html: string): DorarParsedHadith[] {
  const input = String(html || '').trim();
  if (!input) return [];
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');

    const hadithEls = Array.from(doc.querySelectorAll('div.hadith'));
    const infoEls = Array.from(doc.querySelectorAll('div.hadith-info'));
    const count = Math.min(hadithEls.length, infoEls.length);

    const KEY_RAWI = normalizeArabicKey('الراوي');
    const KEY_MUHADDITH = normalizeArabicKey('المحدث');
    const KEY_SOURCE = normalizeArabicKey('المصدر');
    const KEY_PAGE = normalizeArabicKey('الصفحة أو الرقم');
    const KEY_HUKM = normalizeArabicKey('خلاصة حكم المحدث');

    const rows: DorarParsedHadith[] = [];
    for (let i = 0; i < count; i++) {
      const text = cleanValue(hadithEls[i]?.textContent || '');
      const fields = parseDorarInfoBlock(infoEls[i]!);

      const normalizedEntries = Object.entries(fields).map(([k, v]) => [normalizeArabicKey(k), v] as const);
      const get = (key: string): string | undefined => {
        const found = normalizedEntries.find(([k]) => k === key);
        return found?.[1];
      };

      rows.push({
        index: i + 1,
        text,
        rawi: get(KEY_RAWI),
        muhaddith: get(KEY_MUHADDITH),
        source: get(KEY_SOURCE),
        pageOrNumber: get(KEY_PAGE),
        hukm: get(KEY_HUKM),
      });
    }

    return rows;
  } catch {
    return [];
  }
}

function statusBadgeClass(status: number) {
  if (status >= 200 && status < 300) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
  }
  if (status >= 300 && status < 400) {
    return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200';
  }
  if (status >= 400 && status < 500) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200';
  }
  if (status >= 500) {
    return 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200';
  }
  return 'border-border bg-muted/30 text-foreground';
}

export function ResponseViewer({ response, error, className }: Props) {
  const [tab, setTab] = useState<'body' | 'preview' | 'parsed' | 'headers'>('body');

  const parsedJson = useMemo(() => {
    if (!response || !response.isJson) return null;
    try {
      return JSON.parse(response.bodyText);
    } catch {
      return null;
    }
  }, [response]);

  const prettyBody = useMemo(() => {
    if (!response) return '';
    if (!response.isJson) return response.bodyText;
    try {
      const parsed = parsedJson ?? JSON.parse(response.bodyText);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return response.bodyText;
    }
  }, [parsedJson, response]);

  const embeddedHtml = useMemo(() => {
    const raw = (parsedJson as any)?.ahadith?.result;
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed ? trimmed : null;
  }, [parsedJson]);

  const previewSrcDoc = useMemo(() => {
    if (!embeddedHtml) return '';
    return buildSandboxedHtmlDoc(embeddedHtml);
  }, [embeddedHtml]);

  const hasPreview = Boolean(previewSrcDoc);

  const dorarParsed = useMemo(() => {
    if (!embeddedHtml) return [];
    return parseDorarHtml(embeddedHtml);
  }, [embeddedHtml]);

  const hasParsed = dorarParsed.length > 0;

  useEffect(() => {
    if (!hasPreview) {
      setTab((current) => (current === 'preview' || current === 'parsed' ? 'body' : current));
    }
  }, [hasPreview]);

  useEffect(() => {
    if (!response || !hasPreview) return;
    setTab((current) => (current === 'body' ? 'preview' : current));
  }, [hasPreview, response]);

  const headerEntries = useMemo(() => {
    if (!response) return [];
    return Object.entries(response.headers || {});
  }, [response]);

  return (
    <div className={cn('min-w-0 space-y-4', className)}>
      <div className="rounded-xl border bg-background/60 p-3 shadow-sm">
        {response ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn('font-mono', statusBadgeClass(response.status))}
            >
              {response.status}
            </Badge>
            <div className="text-sm font-medium">
              {response.statusText || 'OK'}
            </div>
            <div className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
              {response.isJson && (
                <Badge variant="secondary" className="gap-1">
                  <FileJson2 className="h-3.5 w-3.5" />
                  JSON
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 font-mono">
                <Clock className="h-3.5 w-3.5" />
                {response.timeMs}ms
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-destructive/30 bg-destructive/10 font-mono text-destructive"
            >
              ERROR
            </Badge>
            {typeof error.status === 'number' && (
              <Badge
                variant="outline"
                className={cn('font-mono', statusBadgeClass(error.status))}
              >
                {error.status}
              </Badge>
            )}
            <div className="text-sm font-medium text-destructive">
              {error.message}
            </div>
            {typeof error.timeMs === 'number' && (
              <div className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono">{error.timeMs}ms</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Send a request to see the response.
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-background/60 p-3 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="w-full justify-start bg-muted/30">
            <TabsTrigger value="body">Body</TabsTrigger>
            {hasPreview ? <TabsTrigger value="preview">Preview</TabsTrigger> : null}
            {hasParsed ? <TabsTrigger value="parsed">Parsed</TabsTrigger> : null}
            <TabsTrigger value="headers">
              Headers
              {response ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[11px] font-mono text-muted-foreground">
                  {headerEntries.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="body" className="mt-4">
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/20 p-3 font-mono text-xs leading-relaxed">
              {response ? prettyBody : error ? error.message : ''}
            </pre>
          </TabsContent>

          {hasPreview ? (
            <TabsContent value="preview" className="mt-4">
              <div className="overflow-hidden rounded-xl border bg-background">
                <iframe
                  title="Preview"
                  sandbox=""
                  referrerPolicy="no-referrer"
                  className="h-[520px] w-full bg-white"
                  srcDoc={previewSrcDoc}
                />
              </div>
              <div lang="ar" dir="rtl" className="mt-2 text-xs text-muted-foreground">
                معاينة آمنة: يتم عرض HTML داخل iframe مع sandbox (بدون تشغيل سكربتات).
              </div>
            </TabsContent>
          ) : null}

          {hasParsed ? (
            <TabsContent value="parsed" className="mt-4">
              <div className="max-h-[520px] overflow-auto rounded-xl border bg-muted/10">
                <table lang="ar" dir="rtl" className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/30 text-muted-foreground">
                    <tr className="[&>th]:px-3 [&>th]:py-2">
                      <th className="text-right">#</th>
                      <th className="text-right">المُحدِّث</th>
                      <th className="text-right">المصدر</th>
                      <th className="text-right">الصفحة/الرقم</th>
                      <th className="text-right">خلاصة الحكم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dorarParsed.map((row) => (
                      <tr key={row.index} className="border-t align-top [&>td]:px-3 [&>td]:py-2">
                        <td className="font-mono text-xs text-muted-foreground">{row.index}</td>
                        <td className="max-w-[200px] break-words">{row.muhaddith || '-'}</td>
                        <td className="max-w-[220px] break-words">{row.source || '-'}</td>
                        <td className="max-w-[140px] break-words font-mono text-xs">{row.pageOrNumber || '-'}</td>
                        <td className="max-w-[340px] break-words">{row.hukm || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div lang="ar" dir="rtl" className="mt-2 text-xs text-muted-foreground">
                هذا الجدول يستخرج القيم من HTML ويعرضها كنص. يمكنك الآن استخدام قيمة <span className="font-mono">المحدث</span> بسهولة.
              </div>
            </TabsContent>
          ) : null}

          <TabsContent value="headers" className="mt-4">
            <div className="max-h-[520px] overflow-auto rounded-xl border bg-muted/10">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/30 text-muted-foreground">
                  <tr className="[&>th]:px-3 [&>th]:py-2">
                    <th className="text-left">Header</th>
                    <th className="text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {response
                    ? headerEntries.map(([k, v]) => (
                        <tr key={k} className="border-t [&>td]:px-3 [&>td]:py-2">
                          <td className="font-mono text-xs">{k}</td>
                          <td className="font-mono text-xs break-all">{v}</td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
              {!response && (
                <div className="p-4 text-sm text-muted-foreground">
                  No headers.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
