'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type {
  PostmanHistoryItem,
  PostmanRequest,
  PostmanSavedItem,
} from '@/lib/postman/firestore';
import {
  BookmarkPlus,
  Clock,
  History as HistoryIcon,
  Info,
  Save as SaveIcon,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

type Props = {
  examples?: Array<{ id: string; name: string; descriptionAr?: string; request: PostmanRequest }>;
  history: PostmanHistoryItem[];
  saved: PostmanSavedItem[];
  onSelect: (request: PostmanRequest) => void;
  onSave: () => Promise<void>;
  onClearHistory: () => Promise<void>;
  onDeleteSaved: (id: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
};

function methodBadgeClass(method: PostmanRequest['method']) {
  switch (method) {
    case 'GET':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
    case 'POST':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200';
    case 'PUT':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200';
    case 'PATCH':
      return 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-200';
    case 'DELETE':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200';
    default:
      return 'border-border bg-muted/30 text-foreground';
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

export function Sidebar({
  examples,
  history,
  saved,
  onSelect,
  onSave,
  onClearHistory,
  onDeleteSaved,
  disabled,
  className,
}: Props) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col gap-4 overflow-hidden rounded-2xl border bg-card/40 p-3 shadow-sm',
        className
      )}
    >
      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1 bg-gradient-to-r from-copper to-power text-snow hover:opacity-90"
          disabled={disabled}
          onClick={onSave}
        >
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
          disabled={disabled}
          onClick={onClearHistory}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear History
        </Button>
      </div>

      {examples && examples.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-background/60">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-copperDark" />
              Examples
            </div>
            <Badge variant="secondary" className="text-xs">
              {examples.length}
            </Badge>
          </div>
          <div className="max-h-[22vh] overflow-auto">
            <ul className="divide-y">
              {examples.map((ex) => (
                <li key={ex.id} className="flex items-stretch">
                  <button
                    type="button"
                    className="group min-w-0 flex-1 px-3 py-2 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onSelect(ex.request)}
                  >
                    <div className="flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'mt-0.5 font-mono text-[11px]',
                          methodBadgeClass(ex.request.method)
                        )}
                      >
                        {ex.request.method}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{ex.name}</div>
                        <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                          {ex.request.url}
                        </div>
                      </div>
                    </div>
                  </button>

                  {ex.descriptionAr ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-auto rounded-none px-3 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                          aria-label={`شرح المثال: ${ex.name}`}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="right"
                        align="start"
                        className="w-80 rounded-xl border bg-background/95 p-3 shadow-lg"
                      >
                        <div lang="ar" dir="rtl" className="text-sm leading-relaxed">
                          {ex.descriptionAr}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background/60">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <HistoryIcon className="h-4 w-4 text-copperDark" />
              History
            </div>
            <Badge variant="secondary" className="text-xs">
              {history.length}
            </Badge>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {history.length ? (
              <ul className="divide-y">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      className="group w-full px-3 py-2 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => onSelect(h.request)}
                    >
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'mt-0.5 font-mono text-[11px]',
                            methodBadgeClass(h.request.method)
                          )}
                        >
                          {h.request.method}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {h.request.url}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant="outline"
                              className={cn(
                                'font-mono text-[11px]',
                                statusBadgeClass(h.responseSummary.status)
                              )}
                            >
                              {h.responseSummary.status}
                            </Badge>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock className="h-3.5 w-3.5" />
                              {h.responseSummary.timeMs}ms
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                No history yet.
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background/60">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SaveIcon className="h-4 w-4 text-copperDark" />
              Saved
            </div>
            <Badge variant="secondary" className="text-xs">
              {saved.length}
            </Badge>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {saved.length ? (
              <ul className="divide-y">
                {saved.map((s) => (
                  <li key={s.id} className="flex items-stretch">
                    <button
                      type="button"
                      className="group min-w-0 flex-1 px-3 py-2 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => onSelect(s.request)}
                    >
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'mt-0.5 font-mono text-[11px]',
                            methodBadgeClass(s.request.method)
                          )}
                        >
                          {s.request.method}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {s.name}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {s.request.url}
                          </div>
                        </div>
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-auto rounded-none px-3 text-muted-foreground hover:text-foreground"
                      aria-label={`Delete saved request ${s.name}`}
                      disabled={disabled}
                      onClick={() => onDeleteSaved(s.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                No saved requests.
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
