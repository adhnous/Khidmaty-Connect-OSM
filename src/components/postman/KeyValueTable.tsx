'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { KeyValueRow } from '@/lib/postman/firestore';
import { Plus, X } from 'lucide-react';

type Props = {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  className?: string;
};

const EMPTY_ROW: KeyValueRow = { key: '', value: '', enabled: true };

export function KeyValueTable({
  rows,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  className,
}: Props) {
  const safeRows = rows.length ? rows : [EMPTY_ROW];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="overflow-hidden rounded-xl border bg-background/60">
        <div className="border-b bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">
          Enable rows to include them in the request
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/20 text-muted-foreground">
              <tr className="[&>th]:px-3 [&>th]:py-2">
                <th className="w-20 text-left">On</th>
                <th className="text-left">Key</th>
                <th className="text-left">Value</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {safeRows.map((row, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    'border-t [&>td]:px-3 [&>td]:py-2',
                    row.enabled ? '' : 'bg-muted/10'
                  )}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!!row.enabled}
                        onCheckedChange={(checked) => {
                          const next = safeRows.map((r, i) =>
                            i === idx ? { ...r, enabled: !!checked } : r
                          );
                          onChange(next);
                        }}
                        aria-label="Enable row"
                      />
                    </div>
                  </td>
                  <td>
                    <Input
                      value={row.key}
                      placeholder={keyPlaceholder}
                      className="font-mono"
                      onChange={(e) => {
                        const next = safeRows.map((r, i) =>
                          i === idx ? { ...r, key: e.target.value } : r
                        );
                        onChange(next);
                      }}
                    />
                  </td>
                  <td>
                    <Input
                      value={row.value}
                      placeholder={valuePlaceholder}
                      className="font-mono"
                      onChange={(e) => {
                        const next = safeRows.map((r, i) =>
                          i === idx ? { ...r, value: e.target.value } : r
                        );
                        onChange(next);
                      }}
                    />
                  </td>
                  <td className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove row"
                      onClick={() => {
                        const next = safeRows.filter((_, i) => i !== idx);
                        onChange(next.length ? next : [EMPTY_ROW]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/10 px-3 py-2">
          <div className="text-xs text-muted-foreground">
            Tip: disable rows instead of deleting them.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange([...safeRows, EMPTY_ROW])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

