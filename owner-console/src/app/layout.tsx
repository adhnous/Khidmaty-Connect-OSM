import './globals.css';
import NewServiceNotifier from '@/components/new-service-notifier';
import AuthBar from '@/components/auth-bar';
import Sidebar from '@/components/sidebar';
import OwnerGate from '@/components/owner-gate';
export const metadata = { title: 'Owner Console' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NewServiceNotifier />
        <div className="oc-shell">
          <Sidebar />
          <main className="oc-main">
            <AuthBar />
            <OwnerGate>
              {children}
            </OwnerGate>
          </main>
        </div>
      </body>
    </html>
  );
}
