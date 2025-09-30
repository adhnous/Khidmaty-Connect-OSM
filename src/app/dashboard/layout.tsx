
'use client';

import Link from 'next/link';
import {
  BarChart2,
  List,
  PlusCircle,
  Settings,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getClientLocale, tr } from '@/lib/i18n';

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const locale = getClientLocale();

  useEffect(() => {
    if (loading) return;
    // Not signed in -> login
    if (!user) {
      router.push('/login');
      return;
    }
    // Signed in but not a provider (or missing profile) -> send home (seekers cannot access provider dashboard)
    if (user && (userProfile?.role !== 'provider')) {
      router.push('/');
    }
  }, [user, userProfile, loading, router]);
  
  if (loading || !user) {
    return null; // Or a loading spinner
  }
  // If seeker (or missing profile) somehow lands here before redirect finishes, render a friendly message instead of provider UI
  if (userProfile?.role !== 'provider') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="container py-8">
          <h1 className="mb-2 text-2xl font-bold">For Providers Only</h1>
          <p className="text-muted-foreground">
            Your account is a seeker. Service creation and provider dashboard are available only to provider accounts.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1">
          <Sidebar>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/services">
                      <List />
                      {tr(locale, 'dashboard.sidebar.myServices')}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/services/new">
                      <PlusCircle />
                      {tr(locale, 'dashboard.sidebar.addService')}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/analytics">
                      <BarChart2 />
                      {tr(locale, 'dashboard.sidebar.analytics')}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/profile">
                      <User />
                      {tr(locale, 'dashboard.sidebar.profile')}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/settings">
                      <Settings />
                      {tr(locale, 'dashboard.sidebar.settings')}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
        <Footer />
      </div>
    </SidebarProvider>
  );
}

