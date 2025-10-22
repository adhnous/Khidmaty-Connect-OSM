import React from 'react';

export const metadata = {
  title: 'Public Analytics',
  description: 'Public dashboard embed',
};

export default function PublicDashboardPage() {
  const url = process.env.NEXT_PUBLIC_PUBLIC_DASHBOARD_URL || '';

  if (!url) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-xl font-semibold">Public dashboard is not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set NEXT_PUBLIC_PUBLIC_DASHBOARD_URL in your environment to a Looker Studio or Grafana public embed URL.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-0 md:p-6">
      <div className="w-full">
        <iframe
          src={url}
          style={{ width: '100%', height: '80vh', border: 0 }}
          allowFullScreen
        />
      </div>
    </div>
  );
}
