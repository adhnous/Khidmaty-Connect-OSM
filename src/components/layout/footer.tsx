import { Logo } from '@/components/logo';
import Link from 'next/link';
import { getClientLocale, tr } from '@/lib/i18n';

export function Footer() {
  const locale = getClientLocale();
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <Logo />
          <nav className="flex flex-wrap justify-center gap-4 text-muted-foreground md:gap-6">
            <Link href="/about" className="transition-colors hover:text-primary">
              {tr(locale, 'footer.about')}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              {tr(locale, 'footer.terms')}
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-primary">
              {tr(locale, 'footer.privacy')}
            </Link>
            <Link href="/contact" className="transition-colors hover:text-primary">
              {tr(locale, 'footer.contact')}
            </Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Khidmaty Connect. {tr(locale, 'footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
