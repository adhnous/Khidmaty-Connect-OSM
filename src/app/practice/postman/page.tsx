'use client';

/**
 * Mini Postman (Practice)
 *
 * Allowed targets:
 * - Same-origin paths under `/api/mock/*`
 * - External (https only): `https://api.github.com`, `https://dorar.net`
 *
 * Training auth values:
 * - Bearer token: `TRAINING_TOKEN`
 * - Refresh token: `TRAINING_REFRESH_TOKEN`
 * - Expired token (practice 401): `EXPIRED_TOKEN`
 * - Login password (for /api/mock/auth/login): `password123`
 * - API key: `LIBYA123`
 *
 * Quick tests:
 * - GET  `/api/mock/users`
 * - POST `/api/mock/users` body: `{"name":"Aisha","email":"aisha@example.com"}`
 * - POST `/api/mock/auth/login` body: `{"email":"student@khidmaty.ly","password":"password123"}`
 * - GET  `/api/mock/auth/profile` header: `Authorization: Bearer TRAINING_TOKEN`
 * - POST `/api/mock/auth/refresh` body: `{"refreshToken":"TRAINING_REFRESH_TOKEN"}`
 * - GET  `/api/mock/cities?region=west&q=طرابلس`
 * - GET  `/api/mock/services?city=Tripoli&category=transport`
 * - POST `/api/mock/services` body: `{"title":"...","category":"...","cityEn":"Tripoli","cityAr":"طرابلس","priceLyd":120,"providerName":"..."}`
 * - GET  `/api/mock/secure` header: `Authorization: Bearer TRAINING_TOKEN`
 * - GET  `/api/mock/apikey/header` header: `X-API-Key: LIBYA123`
 * - GET  `/api/mock/apikey/query?api_key=LIBYA123`
 * - GET  `/api/mock/delay?ms=800`
 * - GET  `/api/mock/status?code=204`
 * - GET  `/api/mock/redirect?to=/api/mock/users&status=302`
 * - GET  `/api/mock/text?city=Tripoli` (plain text)
 * - GET  `/api/mock/malformed-json` (broken JSON)
 * - GET  `/api/mock/rate-limit`
 * - POST `/api/mock/echo`
 * - CRUD: `/api/mock/todos`
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
import { Globe, KeyRound, Shield } from 'lucide-react';

type ProxyErrorState = { message: string; status?: number; timeMs?: number } | null;

const EMPTY_ROW = { key: '', value: '', enabled: true };

const DEFAULT_REQUEST: PostmanRequest = {
  method: 'GET',
  url: '/api/mock/users',
  params: [EMPTY_ROW],
  headers: [EMPTY_ROW],
  auth: { type: 'none' },
  bodyText: '',
};

const EXAMPLES: Array<{ id: string; name: string; descriptionAr: string; request: PostmanRequest }> = [
  {
    id: 'ex_users_get',
    name: 'Basics: List users',
    descriptionAr: 'طلب GET بسيط يرجع قائمة مستخدمين وهميين بصيغة JSON.',
    request: {
      method: 'GET',
      url: '/api/mock/users',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_users_post_ok',
    name: 'Basics: Create user (201)',
    descriptionAr: 'يرسل JSON لإنشاء مستخدم جديد؛ المتوقع 201 عند النجاح.',
    request: {
      method: 'POST',
      url: '/api/mock/users',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: JSON.stringify({ name: 'Aisha', email: 'aisha@example.com' }, null, 2),
    },
  },
  {
    id: 'ex_users_post_bad',
    name: 'Basics: Create user (400 invalid payload)',
    descriptionAr: 'نفس POST لكن ببيانات غير صحيحة لتجربة 400 وقراءة رسالة الخطأ.',
    request: {
      method: 'POST',
      url: '/api/mock/users',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: JSON.stringify({ name: '', email: 'not-an-email' }, null, 2),
    },
  },
  {
    id: 'ex_cities',
    name: 'Libya: List cities (المدن)',
    descriptionAr: 'يعرض مدن ليبية تجريبية (English/Arabic) للتدريب على قراءة JSON.',
    request: {
      method: 'GET',
      url: '/api/mock/cities',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_cities_west',
    name: 'Libya: Cities in west (region=west)',
    descriptionAr: 'استخدم region=west لتصفية المدن (تدريب على Query Params).',
    request: {
      method: 'GET',
      url: '/api/mock/cities',
      params: [{ key: 'region', value: 'west', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_services_tripoli',
    name: 'Libya: Services in Tripoli (طرابلس)',
    descriptionAr: 'يجلب خدمات تجريبية داخل طرابلس مع take=10.',
    request: {
      method: 'GET',
      url: '/api/mock/services',
      params: [
        { key: 'city', value: 'Tripoli', enabled: true },
        { key: 'take', value: '10', enabled: true },
        EMPTY_ROW,
      ],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_services_transport',
    name: 'Libya: Transport services in Tripoli (حافلة)',
    descriptionAr: 'فلترة بالخانة category=transport مع city=Tripoli (أكثر من Param).',
    request: {
      method: 'GET',
      url: '/api/mock/services',
      params: [
        { key: 'city', value: 'Tripoli', enabled: true },
        { key: 'category', value: 'transport', enabled: true },
        EMPTY_ROW,
      ],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_services_search_ar',
    name: 'Libya: Search services (q=سباك)',
    descriptionAr: 'بحث نصّي باستخدام q=سباك لملاحظة تأثير البحث على النتائج.',
    request: {
      method: 'GET',
      url: '/api/mock/services',
      params: [{ key: 'q', value: 'سباك', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_service_details',
    name: 'Libya: Service details (svc_1)',
    descriptionAr: 'جلب تفاصيل خدمة واحدة باستخدام مسار /svc_1 (Path param).',
    request: {
      method: 'GET',
      url: '/api/mock/services/svc_1',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_create_service',
    name: 'Libya: Create service (POST)',
    descriptionAr: 'إنشاء خدمة جديدة عبر POST؛ بعد الإرسال جرّب GET /api/mock/services لرؤيتها في القائمة.',
    request: {
      method: 'POST',
      url: '/api/mock/services',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: JSON.stringify(
        {
          title: 'سباك - صيانة سخان مياه',
          category: 'plumbing',
          cityEn: 'Tripoli',
          cityAr: 'طرابلس',
          priceLyd: 140,
          providerName: 'صلاح المغربي',
          description: 'مثال تدريبي فقط.',
          contactPhone: '+218 91 000 1122',
        },
        null,
        2
      ),
    },
  },
  {
    id: 'ex_secure_ok',
    name: 'Auth: Secure endpoint (TRAINING_TOKEN)',
    descriptionAr: 'تطبيق Bearer Token في الهيدر؛ إذا التوكن صحيح تتوقع 200.',
    request: {
      method: 'GET',
      url: '/api/mock/secure',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'bearer', token: 'TRAINING_TOKEN' },
      bodyText: '',
    },
  },
  {
    id: 'ex_secure_fail',
    name: 'Auth: Secure endpoint (missing token -> 401)',
    descriptionAr: 'بدون توكن يجب أن يرجع 401 Unauthorized.',
    request: {
      method: 'GET',
      url: '/api/mock/secure',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_auth_login',
    name: 'Auth flow: Login (get access token)',
    descriptionAr: 'محاكاة تسجيل دخول: يرجع accessToken وrefreshToken لاستخدامهما في الطلبات التالية.',
    request: {
      method: 'POST',
      url: '/api/mock/auth/login',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: JSON.stringify({ email: 'student@khidmaty.ly', password: 'password123' }, null, 2),
    },
  },
  {
    id: 'ex_auth_profile_ok',
    name: 'Auth flow: Profile (Bearer TRAINING_TOKEN)',
    descriptionAr: 'استخدم Authorization: Bearer TRAINING_TOKEN لجلب بيانات المستخدم؛ تتوقع 200.',
    request: {
      method: 'GET',
      url: '/api/mock/auth/profile',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'bearer', token: 'TRAINING_TOKEN' },
      bodyText: '',
    },
  },
  {
    id: 'ex_auth_profile_expired',
    name: 'Auth flow: Profile (expired token -> 401)',
    descriptionAr: 'استخدم EXPIRED_TOKEN لتجربة 401 مع رسالة Token expired.',
    request: {
      method: 'GET',
      url: '/api/mock/auth/profile',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'bearer', token: 'EXPIRED_TOKEN' },
      bodyText: '',
    },
  },
  {
    id: 'ex_auth_refresh',
    name: 'Auth flow: Refresh token',
    descriptionAr: 'أرسل refreshToken للحصول على accessToken جديد (محاكاة).',
    request: {
      method: 'POST',
      url: '/api/mock/auth/refresh',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: JSON.stringify({ refreshToken: 'TRAINING_REFRESH_TOKEN' }, null, 2),
    },
  },
  {
    id: 'ex_auth_logout',
    name: 'Auth flow: Logout',
    descriptionAr: 'محاكاة تسجيل خروج (يرجع ok:true).',
    request: {
      method: 'POST',
      url: '/api/mock/auth/logout',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'bearer', token: 'TRAINING_TOKEN' },
      bodyText: '',
    },
  },
  {
    id: 'ex_apikey_header_ok',
    name: 'Auth: API key in header (X-API-Key)',
    descriptionAr: 'إرسال API Key في الهيدر X-API-Key؛ القيمة الصحيحة هي LIBYA123.',
    request: {
      method: 'GET',
      url: '/api/mock/apikey/header',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'apikey', keyName: 'X-API-Key', keyValue: 'LIBYA123', in: 'header' },
      bodyText: '',
    },
  },
  {
    id: 'ex_apikey_query_ok',
    name: 'Auth: API key in query (api_key)',
    descriptionAr: 'إرسال API Key في Query String باسم api_key (في الرابط).',
    request: {
      method: 'GET',
      url: '/api/mock/apikey/query',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'apikey', keyName: 'api_key', keyValue: 'LIBYA123', in: 'query' },
      bodyText: '',
    },
  },
  {
    id: 'ex_echo_headers_body',
    name: 'Debug: Echo (params + headers + JSON body)',
    descriptionAr: 'يرجع لك ما أرسلته (params + headers الآمنة + body) للتأكد من البناء الصحيح.',
    request: {
      method: 'POST',
      url: '/api/mock/echo',
      params: [
        { key: 'city', value: 'Tripoli', enabled: true },
        { key: 'lang', value: 'ar', enabled: true },
        EMPTY_ROW,
      ],
      headers: [
        { key: 'X-Demo', value: 'Khidmaty', enabled: true },
        { key: 'X-Request-Id', value: 'demo-123', enabled: true },
        EMPTY_ROW,
      ],
      auth: { type: 'none' },
      bodyText: JSON.stringify({ message: 'مرحبا من طرابلس' }, null, 2),
    },
  },
  {
    id: 'ex_delay',
    name: 'HTTP: Delay 800ms (measure time)',
    descriptionAr: 'ينتظر 800ms تقريباً قبل الرد لتتدرّب على قراءة timeMs وزمن الاستجابة.',
    request: {
      method: 'GET',
      url: '/api/mock/delay',
      params: [{ key: 'ms', value: '800', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_rate_limit',
    name: 'HTTP: Rate limit practice (random 429)',
    descriptionAr: 'يرجع 429 عشوائياً 30% من الوقت لتجربة Rate Limit وإعادة المحاولة.',
    request: {
      method: 'GET',
      url: '/api/mock/rate-limit',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_status_500',
    name: 'HTTP: Custom status (500 JSON)',
    descriptionAr: 'يرجع 500 مع JSON لتجربة أخطاء السيرفر وعرضها في Response.',
    request: {
      method: 'GET',
      url: '/api/mock/status',
      params: [
        { key: 'code', value: '500', enabled: true },
        { key: 'message', value: 'Server error example', enabled: true },
        EMPTY_ROW,
      ],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_status_204',
    name: 'HTTP: 204 No Content',
    descriptionAr: 'يرجع 204 بدون محتوى لتجربة الاستجابات الفارغة.',
    request: {
      method: 'GET',
      url: '/api/mock/status',
      params: [{ key: 'code', value: '204', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_redirect_302',
    name: 'HTTP: Redirect 302 (manual)',
    descriptionAr: 'يرجع Redirect 302؛ لاحظ هيدر location لأن البروكسي يستخدم redirect: manual.',
    request: {
      method: 'GET',
      url: '/api/mock/redirect',
      params: [
        { key: 'to', value: '/api/mock/users', enabled: true },
        { key: 'status', value: '302', enabled: true },
        EMPTY_ROW,
      ],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_text_plain',
    name: 'HTTP: Text response (text/plain)',
    descriptionAr: 'رد نصّي text/plain (ليس JSON) لتجربة عرض النص.',
    request: {
      method: 'GET',
      url: '/api/mock/text',
      params: [{ key: 'city', value: 'Tripoli', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_text_html',
    name: 'HTTP: HTML response (text/html)',
    descriptionAr: 'رد text/html بسيط لتجربة محتوى HTML.',
    request: {
      method: 'GET',
      url: '/api/mock/text',
      params: [{ key: 'mode', value: 'html', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_malformed_json',
    name: 'HTTP: Malformed JSON (application/json)',
    descriptionAr: 'يرجع Content-Type JSON لكن body غير صالح لتجربة فشل parsing.',
    request: {
      method: 'GET',
      url: '/api/mock/malformed-json',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_todos_list',
    name: 'CRUD: List todos',
    descriptionAr: 'قائمة مهام تجريبية للتدريب على عمليات CRUD.',
    request: {
      method: 'GET',
      url: '/api/mock/todos',
      params: [{ key: 'take', value: '10', enabled: true }, EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_todos_create',
    name: 'CRUD: Create todo (201)',
    descriptionAr: 'إنشاء مهمة جديدة عبر POST؛ تتوقع 201 عند النجاح.',
    request: {
      method: 'POST',
      url: '/api/mock/todos',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: JSON.stringify(
        { title: 'سؤال عن حافلات طرابلس', cityEn: 'Tripoli', cityAr: 'طرابلس', done: false },
        null,
        2
      ),
    },
  },
  {
    id: 'ex_todos_patch',
    name: 'CRUD: PATCH todo_1 (done=true)',
    descriptionAr: 'تعديل جزئي PATCH لتغيير done=true فقط.',
    request: {
      method: 'PATCH',
      url: '/api/mock/todos/todo_1',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: JSON.stringify({ done: true }, null, 2),
    },
  },
  {
    id: 'ex_todos_delete',
    name: 'CRUD: DELETE todo_2 (204)',
    descriptionAr: 'حذف مهمة ويرجع 204 No Content.',
    request: {
      method: 'DELETE',
      url: '/api/mock/todos/todo_2',
      params: [EMPTY_ROW],
      headers: [EMPTY_ROW],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_external_github_zen',
    name: 'External: GitHub /zen (allowed host)',
    descriptionAr: 'مثال طلب خارجي مسموح فقط إلى api.github.com (قد يحتاج User-Agent).',
    request: {
      method: 'GET',
      url: 'https://api.github.com/zen',
      params: [EMPTY_ROW],
      headers: [
        { key: 'User-Agent', value: 'Khidmaty-MiniPostman', enabled: true },
        { key: 'Accept', value: 'text/plain', enabled: true },
        EMPTY_ROW,
      ],
      auth: { type: 'none' },
      bodyText: '',
    },
  },
  {
    id: 'ex_blocked_host',
    name: 'Blocked: https://example.com (should be rejected)',
    descriptionAr: 'يجب أن يُرفض لأن المضيف غير موجود في allowlist (تتوقع 403 Host not allowed).',
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

export default function PracticePostmanPage() {
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
            <div className="text-2xl font-bold tracking-tight text-ink">Mini Postman</div>
            <div className="mt-1 max-w-2xl text-sm text-ink/80">
              Practice HTTP requests safely via a proxy allowlist (no direct requests to arbitrary URLs).
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <Shield className="mr-1 h-3.5 w-3.5" />
                Allowlist only
              </Badge>
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <Globe className="mr-1 h-3.5 w-3.5" />
                /api/mock/* + api.github.com + dorar.net
              </Badge>
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <KeyRound className="mr-1 h-3.5 w-3.5" />
                TRAINING_TOKEN
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
              <div className="text-2xl font-bold tracking-tight text-ink">Mini Postman</div>
              <div className="mt-1 max-w-2xl text-sm text-ink/80">
                Build requests, send them through a safe proxy, and inspect responses. History and saved requests are stored per user.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <Shield className="mr-1 h-3.5 w-3.5" />
                Proxy allowlist
              </Badge>
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <Globe className="mr-1 h-3.5 w-3.5" />
                /api/mock/* + api.github.com + dorar.net
              </Badge>
              <Badge className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50" variant="outline">
                <KeyRound className="mr-1 h-3.5 w-3.5" />
                TRAINING_TOKEN
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
