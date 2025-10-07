"use client";

import { useEffect, useState } from "react";
import { getIdTokenOrThrow } from "@/lib/auth-client";

 type Color = 'copper' | 'power' | 'dark' | 'light';
 type Row = {
  id: string;
  text: string;
  textAr: string;
  href: string;
  color: Color;
  active: boolean;
  priority: number;
  createdAt: string | null;
 };

 export default function AdsManagerPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [fText, setFText] = useState("");
  const [fTextAr, setFTextAr] = useState("");
  const [fHref, setFHref] = useState("");
  const [fColor, setFColor] = useState<Color>('copper');
  const [fPriority, setFPriority] = useState<number>(0);
  const [fActive, setFActive] = useState<boolean>(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const token = await getIdTokenOrThrow();
      const res = await fetch('/api/ads/list', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      setRows(json.rows || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createAd() {
    try {
      setCreating(true);
      const token = await getIdTokenOrThrow();
      const res = await fetch('/api/ads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: fText, textAr: fTextAr, href: fHref, color: fColor, priority: fPriority, active: fActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      setFText(''); setFTextAr(''); setFHref(''); setFColor('copper'); setFPriority(0); setFActive(true);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function saveRow(r: Row) {
    try {
      const token = await getIdTokenOrThrow();
      const res = await fetch('/api/ads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: r.id, text: r.text, textAr: r.textAr, href: r.href, color: r.color, active: r.active, priority: r.priority }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to save');
    }
  }

  async function deleteRow(id: string) {
    if (!confirm('Delete this ad?')) return;
    try {
      const token = await getIdTokenOrThrow();
      const res = await fetch('/api/ads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete');
    }
  }

  function setField(id: string, key: keyof Row, value: any) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  return (
    <div className="oc-grid">
      <div className="oc-toolbar">
        <h1 className="oc-h1">Ads Manager</h1>
      </div>

      {error && <div className="oc-card" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</div>}

      <div className="oc-card" style={{ marginBottom: 16 }}>
        <h3 className="oc-title" style={{ marginBottom: 8 }}>Create new ad</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="oc-subtle">Text (English)</label>
            <input className="w-full rounded border p-2" value={fText} onChange={(e) => setFText(e.target.value)} placeholder="Advertise your service…" />
          </div>
          <div>
            <label className="oc-subtle">النص (عربي)</label>
            <input className="w-full rounded border p-2" value={fTextAr} onChange={(e) => setFTextAr(e.target.value)} placeholder="أعلن عن خدمتك…" />
          </div>
          <div>
            <label className="oc-subtle">Link (optional)</label>
            <input className="w-full rounded border p-2" value={fHref} onChange={(e) => setFHref(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className="oc-subtle">Color</label>
            <select className="w-full rounded border p-2" value={fColor} onChange={(e) => setFColor(e.target.value as Color)}>
              <option value="copper">Copper</option>
              <option value="power">Red</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div>
            <label className="oc-subtle">Priority</label>
            <input type="number" className="w-full rounded border p-2" value={fPriority} onChange={(e) => setFPriority(Number(e.target.value)||0)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input id="ad-active" type="checkbox" checked={fActive} onChange={(e) => setFActive(e.target.checked)} />
            <label htmlFor="ad-active">Active</label>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="oc-btn oc-btn-primary" onClick={createAd} disabled={creating}>Create</button>
        </div>
      </div>

      <div className="oc-grid">
        {loading ? (
          <div className="oc-card">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="oc-card">No ads.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="oc-card" style={{ display: 'grid', gap: 8 }}>
              <div className="oc-meta">ID: {r.id}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="oc-subtle">Text (English)</label>
                  <input className="w-full rounded border p-2" value={r.text} onChange={(e) => setField(r.id, 'text', e.target.value)} />
                </div>
                <div>
                  <label className="oc-subtle">النص (عربي)</label>
                  <input className="w-full rounded border p-2" value={r.textAr} onChange={(e) => setField(r.id, 'textAr', e.target.value)} />
                </div>
                <div>
                  <label className="oc-subtle">Link</label>
                  <input className="w-full rounded border p-2" value={r.href} onChange={(e) => setField(r.id, 'href', e.target.value)} />
                </div>
                <div>
                  <label className="oc-subtle">Color</label>
                  <select className="w-full rounded border p-2" value={r.color} onChange={(e) => setField(r.id, 'color', e.target.value as Color)}>
                    <option value="copper">Copper</option>
                    <option value="power">Red</option>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <div>
                  <label className="oc-subtle">Priority</label>
                  <input type="number" className="w-full rounded border p-2" value={r.priority} onChange={(e) => setField(r.id, 'priority', Number(e.target.value)||0)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input id={`active-${r.id}`} type="checkbox" checked={r.active} onChange={(e) => setField(r.id, 'active', e.target.checked)} />
                  <label htmlFor={`active-${r.id}`}>Active</label>
                </div>
              </div>
              <div className="oc-actions">
                <button className="oc-btn oc-btn-primary" onClick={() => saveRow(r)}>Save</button>
                <button className="oc-btn oc-btn-red" onClick={() => deleteRow(r.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
 }
