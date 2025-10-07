import './globals.css';
import NewServiceNotifier from '@/components/new-service-notifier';
import AuthBar from '@/components/auth-bar';
export const metadata = { title: 'Owner Console' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NewServiceNotifier />
        <main className="oc-container">
          <AuthBar />
          {children}
        </main>
      </body>
    </html>
  );
}
