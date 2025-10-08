"use client";

import { useEffect, useState } from "react";
import { getIdTokenOrThrow } from "@/lib/auth-client";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pricingEnabled, setPricingEnabled] = useState<boolean>(true);
  const [showForProviders, setShowForProviders] = useState<boolean>(false);
  const [showForSeekers, setShowForSeekers] = useState<boolean>(false);
  const [enforceAfterMonths, setEnforceAfterMonths] = useState<number>(3);
  const [lockAllToPricing, setLockAllToPricing] = useState<boolean>(false);
  const [lockProvidersToPricing, setLockProvidersToPricing] = useState<boolean>(false);
  const [lockSeekersToPricing, setLockSeekersToPricing] = useState<boolean>(false);

  async function load() {
    setLoading(true); setError(null);
    try {
      const token = await getIdTokenOrThrow();
      const res = await fetch('/api/settings/features', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      const f = json.features || {};
      setPricingEnabled(!!f.pricingEnabled);
      setShowForProviders(!!f.showForProviders);
      setShowForSeekers(!!f.showForSeekers);
      setEnforceAfterMonths(Number.isFinite(f.enforceAfterMonths) ? Number(f.enforceAfterMonths) : 3);
      setLockAllToPricing(!!f.lockAllToPricing);
      setLockProvidersToPricing(!!f.lockProvidersToPricing);
      setLockSeekersToPricing(!!f.lockSeekersToPricing);
    } catch (e: any) {
      setError(e?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      const token = await getIdTokenOrThrow();
      const res = await fetch('/api/settings/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pricingEnabled, showForProviders, showForSeekers, enforceAfterMonths, lockAllToPricing, lockProvidersToPricing, lockSeekersToPricing }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      alert('Saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="oc-grid">
      <div className="oc-toolbar">
        <h1 className="oc-h1">Settings</h1>
      </div>

      {error && (
        <div className="oc-card" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</div>
      )}

      <div className="oc-card">
        <h3 className="oc-title" style={{ marginBottom: 8 }}>Pricing Feature Flags</h3>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input id="pricingEnabled" className="oc-switch" type="checkbox" checked={pricingEnabled} onChange={(e) => setPricingEnabled(e.target.checked)} />
              <label htmlFor="pricingEnabled">Enable Pricing feature</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input id="showForProviders" className="oc-switch" type="checkbox" checked={showForProviders} onChange={(e) => setShowForProviders(e.target.checked)} />
              <label htmlFor="showForProviders">Show for Providers immediately</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input id="showForSeekers" className="oc-switch" type="checkbox" checked={showForSeekers} onChange={(e) => setShowForSeekers(e.target.checked)} />
              <label htmlFor="showForSeekers">Show for Seekers immediately</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input id="lockAllToPricing" className="oc-switch" type="checkbox" checked={lockAllToPricing} onChange={(e) => setLockAllToPricing(e.target.checked)} />
              <label htmlFor="lockAllToPricing">Lock entire app to Pricing (everyone on free plan)</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input id="lockProvidersToPricing" className="oc-switch" type="checkbox" checked={lockProvidersToPricing} onChange={(e) => setLockProvidersToPricing(e.target.checked)} />
              <label htmlFor="lockProvidersToPricing">Lock Providers to Pricing (when on free plan)</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input id="lockSeekersToPricing" className="oc-switch" type="checkbox" checked={lockSeekersToPricing} onChange={(e) => setLockSeekersToPricing(e.target.checked)} />
              <label htmlFor="lockSeekersToPricing">Lock Seekers to Pricing (when on free plan)</label>
            </div>
            <div>
              <label className="oc-label" htmlFor="enforceAfterMonths">Default show after N months (0 for immediate)</label>
              <input id="enforceAfterMonths" type="number" min={0} className="oc-input" value={enforceAfterMonths} onChange={(e) => setEnforceAfterMonths(Math.max(0, Math.floor(Number(e.target.value)||0)))} />
              <div className="oc-help" style={{ marginTop: 6 }}>After this period from registration, Pricing becomes visible for everyone.</div>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="oc-btn oc-btn-primary" onClick={save} disabled={saving}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
