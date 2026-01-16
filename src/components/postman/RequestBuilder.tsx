'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { KeyValueTable } from '@/components/postman/KeyValueTable';
import type { PostmanRequest } from '@/lib/postman/firestore';
import { formatJson, validateJson, validatePracticeUrl } from '@/lib/postman/validate';
import { cn } from '@/lib/utils';
import { Braces, CheckCircle2, Send, Shield } from 'lucide-react';

type Props = {
  request: PostmanRequest;
  onChange: (next: PostmanRequest) => void;
  onSend: (request: PostmanRequest) => Promise<void>;
  sending: boolean;
  className?: string;
};

function methodSelectAccent(method: PostmanRequest['method']) {
  switch (method) {
    case 'GET':
      return 'border-emerald-500/30 focus-visible:ring-emerald-500/30';
    case 'POST':
      return 'border-sky-500/30 focus-visible:ring-sky-500/30';
    case 'PUT':
      return 'border-amber-500/30 focus-visible:ring-amber-500/30';
    case 'PATCH':
      return 'border-violet-500/30 focus-visible:ring-violet-500/30';
    case 'DELETE':
      return 'border-rose-500/30 focus-visible:ring-rose-500/30';
    default:
      return '';
  }
}

export function RequestBuilder({
  request,
  onChange,
  onSend,
  sending,
  className,
}: Props) {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [tab, setTab] = useState<'params' | 'headers' | 'auth' | 'body'>(
    'params'
  );

  const urlValidation = useMemo(
    () => validatePracticeUrl(request.url),
    [request.url]
  );

  const bodyValidation = useMemo(
    () => validateJson(request.bodyText),
    [request.bodyText]
  );
  const inlineJsonError = jsonError || (!bodyValidation.ok ? bodyValidation.error : null);

  const canSend = urlValidation.ok && bodyValidation.ok && !sending;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border bg-background/60 p-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className={cn(
              'h-10 w-full rounded-md border bg-background px-3 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-40',
              methodSelectAccent(request.method)
            )}
            value={request.method}
            onChange={(e) =>
              onChange({
                ...request,
                method: e.target.value as PostmanRequest['method'],
              })
            }
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          <div className="min-w-0 flex-1">
            <Input
              value={request.url}
              placeholder="/api/mock/users or https://api.github.com/..."
              className="font-mono"
              onChange={(e) => onChange({ ...request, url: e.target.value })}
            />
            {!urlValidation.ok && (
              <div className="mt-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                {urlValidation.error}
              </div>
            )}
          </div>

          <Button
            type="button"
            className="sm:w-32 bg-gradient-to-r from-copper to-power text-snow hover:opacity-90"
            disabled={!canSend}
            onClick={async () => {
              const urlOk = validatePracticeUrl(request.url);
              if (!urlOk.ok) return;

              const jsonOk = validateJson(request.bodyText);
              if (!jsonOk.ok) {
                setJsonError(jsonOk.error);
                setTab('body');
                return;
              }
              setJsonError(null);
              await onSend(request);
            }}
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border bg-muted/20 px-2 py-1">
            <Shield className="h-3.5 w-3.5 text-copperDark" />
            Requests go through /api/proxy (allowlist enforced)
          </span>
        </div>
      </div>

      <div className="rounded-xl border bg-background/60 p-3 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="w-full justify-start bg-muted/30">
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>

          <TabsContent value="params" className="mt-4">
            <KeyValueTable
              rows={request.params}
              onChange={(params) => onChange({ ...request, params })}
              keyPlaceholder="param"
              valuePlaceholder="value"
            />
          </TabsContent>

          <TabsContent value="headers" className="mt-4">
            <KeyValueTable
              rows={request.headers}
              onChange={(headers) => onChange({ ...request, headers })}
              keyPlaceholder="Header-Name"
              valuePlaceholder="value"
            />
          </TabsContent>

          <TabsContent value="auth" className="mt-4">
            <div className="space-y-3 rounded-xl border bg-background/60 p-3">
              <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
                <label className="text-sm font-medium">Type</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={request.auth.type}
                  onChange={(e) => {
                    const t = e.target.value as PostmanRequest['auth']['type'];
                    if (t === 'none') onChange({ ...request, auth: { type: 'none' } });
                    if (t === 'bearer')
                      onChange({ ...request, auth: { type: 'bearer', token: '' } });
                    if (t === 'apikey')
                      onChange({
                        ...request,
                        auth: {
                          type: 'apikey',
                          keyName: 'X-API-Key',
                          keyValue: '',
                          in: 'header',
                        },
                      });
                  }}
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apikey">API Key</option>
                </select>
              </div>

              {request.auth.type === 'bearer' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Token</label>
                  <Input
                    value={request.auth.token}
                    placeholder="TRAINING_TOKEN"
                    className="font-mono"
                    onChange={(e) =>
                      onChange({
                        ...request,
                        auth: { type: 'bearer', token: e.target.value },
                      })
                    }
                  />
                </div>
              )}

              {request.auth.type === 'apikey' &&
                (() => {
                  const auth = request.auth;
                  return (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Key Name</label>
                        <Input
                          value={auth.keyName}
                          className="font-mono"
                          onChange={(e) =>
                            onChange({
                              ...request,
                              auth: { ...auth, keyName: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Key Value</label>
                        <Input
                          value={auth.keyValue}
                          className="font-mono"
                          onChange={(e) =>
                            onChange({
                              ...request,
                              auth: { ...auth, keyValue: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-sm font-medium">Send In</label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={auth.in}
                          onChange={(e) => {
                            const loc = e.target.value === 'query' ? 'query' : 'header';
                            onChange({ ...request, auth: { ...auth, in: loc } });
                          }}
                        >
                          <option value="header">Header</option>
                          <option value="query">Query</option>
                        </select>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </TabsContent>

          <TabsContent value="body" className="mt-4">
            <div className="space-y-3">
              <Textarea
                value={request.bodyText}
                onChange={(e) => {
                  setJsonError(null);
                  onChange({ ...request, bodyText: e.target.value });
                }}
                placeholder='{"hello":"world"}'
                className="min-h-[200px] rounded-xl font-mono text-sm"
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const res = formatJson(request.bodyText);
                    if (!res.ok) {
                      setJsonError(res.error);
                      return;
                    }
                    setJsonError(null);
                    onChange({ ...request, bodyText: res.formatted });
                  }}
                >
                  <Braces className="mr-2 h-4 w-4" />
                  Format JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const res = validateJson(request.bodyText);
                    setJsonError(res.ok ? null : res.error);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Validate JSON
                </Button>
              </div>

              {inlineJsonError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {inlineJsonError}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

