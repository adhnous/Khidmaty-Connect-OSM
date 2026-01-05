import { Handshake } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Khidmaty Home">
      <Handshake className="h-8 w-8 text-current" />
      <span className="text-2xl font-bold font-headline">
        Khidmaty
      </span>
    </Link>
  );
}
