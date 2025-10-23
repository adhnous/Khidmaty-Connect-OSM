import type { Locale } from '@/lib/i18n';
import { cookies, headers } from 'next/headers';

export function getServerLocale(): Locale {
  const cookieVal = cookies().get('locale')?.value?.toLowerCase() || '';
  const accept = headers().get('accept-language')?.toLowerCase() || '';
  const raw = cookieVal || accept;
  const l: Locale = raw.startsWith('ar') ? 'ar' : 'en';
  return l;
}
