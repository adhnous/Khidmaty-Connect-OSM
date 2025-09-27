'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

export type AddressSearchProps = {
  placeholder?: string;
  defaultQuery?: string;
  countryCodes?: string; // e.g., 'ly'
  onSelect: (res: { lat: number; lng: number; displayName: string }) => void;
  className?: string;
};

export default function AddressSearch({
  placeholder = 'Search address',
  defaultQuery = '',
  countryCodes = 'ly',
  onSelect,
  className = '',
}: AddressSearchProps) {
  const [q, setQ] = useState(defaultQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const t = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const lang = useMemo(() => {
    if (typeof document === 'undefined') return 'en';
    const l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return l.startsWith('ar') ? 'ar' : 'en';
  }, []);

  useEffect(() => {
    if (t.current) window.clearTimeout(t.current);
    if (!q || q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    t.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('q', q);
        url.searchParams.set('limit', '5');
        url.searchParams.set('addressdetails', '1');
        if (countryCodes) url.searchParams.set('countrycodes', countryCodes);
        url.searchParams.set('accept-language', lang);
        const res = await fetch(url.toString(), {
          headers: {
            'Accept-Language': lang,
          },
        });
        const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
        setResults(data);
        setOpen(true);
      } catch (e) {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (t.current) window.clearTimeout(t.current);
    };
  }, [q, lang, countryCodes]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!listRef.current) return;
      if (!listRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={listRef}>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-10"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-background shadow">
          {results.map((r, idx) => (
            <button
              key={`${r.lat}-${r.lon}-${idx}`}
              type="button"
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                const lat = Number(r.lat);
                const lng = Number(r.lon);
                setQ(r.display_name);
                setOpen(false);
                onSelect({ lat, lng, displayName: r.display_name });
              }}
            >
              {r.display_name}
            </button>
          ))}
          {loading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Searching…</div>
          )}
        </div>
      )}
    </div>
  );
}
