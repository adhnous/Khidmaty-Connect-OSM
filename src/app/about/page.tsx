import { redirect } from 'next/navigation';

export const dynamic = 'force-static';

export default function AboutPage() {
  // Serve the standalone static HTML directly (no app shell)
  redirect('/about.html');
}
