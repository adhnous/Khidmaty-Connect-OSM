"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { listProviderDailyStats, type StatsDaily } from '@/lib/analytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Link from 'next/link';

type Row = { day: string; views: number; ctas: number; messages: number };

function lastNDaysLabels(n: number): string[] {
  const arr: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const td = new Date(d);
    td.setDate(d.getDate() - i);
    arr.push(td.toISOString().slice(5, 10)); // MM-DD
  }
  return arr;
}

export default function AnalyticsPage() {
  const { user, userProfile } = useAuth();
  const [rows, setRows] = useState<StatsDaily[]>([]);
  const [loading, setLoading] = useState(false);
  const days = 30;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const out = await listProviderDailyStats(user.uid, days);
        if (mounted) setRows(out);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const chartData: Row[] = useMemo(() => {
    const byDay = new Map<string, Row>();
    const labels = lastNDaysLabels(days);
    for (const label of labels) byDay.set(label, { day: label, views: 0, ctas: 0, messages: 0 });
    for (const r of rows) {
      if (!r.yyyymmdd) continue;
      const label = `${r.yyyymmdd.slice(4, 6)}-${r.yyyymmdd.slice(6, 8)}`; // MM-DD
      const prev = byDay.get(label) || { day: label, views: 0, ctas: 0, messages: 0 };
      byDay.set(label, {
        day: label,
        views: (prev.views || 0) + (r.views || 0),
        ctas: (prev.ctas || 0) + (r.ctas || 0),
        messages: (prev.messages || 0) + (r.messages || 0),
      });
    }
    return Array.from(byDay.values());
  }, [rows]);

  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, r) => ({
        views: acc.views + (r.views || 0),
        ctas: acc.ctas + (r.ctas || 0),
        messages: acc.messages + (r.messages || 0),
      }),
      { views: 0, ctas: 0, messages: 0 }
    );
  }, [chartData]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Sign in to view your analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link className="underline" href="/login">Go to Login</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total Views (30d)</CardDescription>
            <CardTitle className="text-3xl">{totals.views.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Contact Clicks (30d)</CardDescription>
            <CardTitle className="text-3xl">{totals.ctas.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Messages (30d)</CardDescription>
            <CardTitle className="text-3xl">{totals.messages.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last {days} days</CardTitle>
          <CardDescription>
            Views, contact clicks, and messages for all your services.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Views" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="ctas" stroke="#16a34a" name="CTAs" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="messages" stroke="#f59e0b" name="Messages" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
