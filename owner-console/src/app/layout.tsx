import './globals.css';
export const metadata = { title: 'Owner Console' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="oc-container">{children}</main>
      </body>
    </html>
  );
}
