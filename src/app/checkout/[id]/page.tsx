"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getIdTokenOrThrow } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tx, setTx] = useState<any | null>(null);

  const isProvider = (userProfile?.role === 'provider');

  const load = async () => {
    if (!id) return;
    try {
      setError(null);
      const token = await getIdTokenOrThrow();
      const res = await fetch(`/api/payments/tx/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      setTx(json.tx);
    } catch (e: any) {
      setError(e?.message || 'Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // Poll transaction status until success/failed/cancelled
  useEffect(() => {
    if (!tx) return;
    if (tx.status === 'success') {
      // Plan is already updated by server; route accordingly
      if (isProvider) router.replace('/dashboard'); else router.replace('/');
      return;
    }
    if (tx.status !== 'pending') return;
    const t = setInterval(() => { load(); }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx?.status, isProvider]);

  // Build a mock QR payload. Prefer a deeplink-like URL that a wallet could handle.
  const qrPayload = useMemo(() => {
    if (!tx) return '';
    const deeplink = `khidmaty-mock://pay?tx=${encodeURIComponent(String(id))}&amt=${encodeURIComponent(String(tx.amount || ''))}&cur=${encodeURIComponent(String(tx.currency || 'LYD'))}&p=${encodeURIComponent(String(tx.provider || 'mock'))}`;
    // If backend provided a checkoutUrl that isn't just the same page, use it; else use deeplink
    const url = typeof tx.checkoutUrl === 'string' && !String(tx.checkoutUrl).includes('/checkout/')
      ? String(tx.checkoutUrl)
      : deeplink;
    return url;
  }, [tx, id]);

  return (
    <div className="flex min-h-screen flex-col bg-ink text-snow">
      <Header />
      <main className="flex-1">
        <section className="py-16">
          <div className="container">
            <Card className="mx-auto max-w-2xl bg-background text-foreground border-white/10">
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
                <CardDescription>
                  Complete your payment to activate your subscription.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div>Loading…</div>
                ) : error ? (
                  <div className="text-red-500">{error}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">Transaction ID: {id}</div>
                    <div className="flex items-center justify-between">
                      <div>Plan</div>
                      <div className="font-semibold uppercase">{tx?.planId}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>Amount</div>
                      <div className="font-semibold">{tx?.amount} {tx?.currency || 'LYD'}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>Status</div>
                      <div className="font-semibold capitalize">{tx?.status}</div>
                    </div>

                    {tx?.status === 'pending' && (
                      <div className="space-y-4">
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                          <img
                            alt="Payment QR"
                            width={220}
                            height={220}
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`}
                            style={{ borderRadius: 12, border: '1px solid var(--oc-border)' }}
                          />
                          <div>
                            <div className="oc-subtle" style={{ marginBottom: 8 }}>Scan with your wallet app</div>
                            <div style={{ fontSize: 12, wordBreak: 'break-all', background: '#f9fafb', border: '1px solid var(--oc-border)', padding: 10, borderRadius: 10 }}>
                              {qrPayload}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <Button className="bg-copper text-ink" onClick={() => load()}>I’ve paid, refresh</Button>
                              <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(qrPayload); }}>Copy payment code</Button>
                              {tx?.checkoutUrl && (
                                <Button variant="secondary" onClick={() => { window.open(String(tx.checkoutUrl), '_blank'); }}>Open Wallet</Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Please complete the payment in your wallet app. This page will update automatically every few seconds after payment is confirmed.
                        </p>
                      </div>
                    )}

                    {tx?.status === 'failed' && (
                      <div className="text-red-600">Payment failed. Please go back to Pricing and try again.</div>
                    )}
                    {tx?.status === 'cancelled' && (
                      <div className="text-yellow-600">Payment was cancelled. You can try again from Pricing.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
