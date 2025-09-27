import { Logo } from '@/components/logo';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-4 text-muted-foreground md:gap-6">
            <Link href="#" className="transition-colors hover:text-primary">
              About Us
            </Link>
            <Link href="#" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
            <Link href="#" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-primary">
              Contact
            </Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Khidmaty Connect. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
