"use client";

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getClientLocale, tr } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const dynamic = 'force-static';

export default function ContactPage() {
  const locale = getClientLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSending(true);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error('send_failed');
      setSent(true);
      setName(''); setEmail(''); setMessage('');
    } catch (_) {
      alert(locale === 'ar' ? 'تعذر إرسال الرسالة.' : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="container max-w-2xl flex-1 px-4 py-12">
        <h1 className="mb-4 text-3xl font-bold">{tr(locale, 'footer.contact')}</h1>
        {sent ? (
          <p className="text-green-600">{locale === 'ar' ? 'تم إرسال رسالتك. سنعود إليك قريبًا.' : 'Your message has been sent. We will get back to you soon.'}</p>
        ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{locale === 'ar' ? 'الاسم' : 'Name'}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="message">{locale === 'ar' ? 'رسالتك' : 'Your Message'}</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} />
          </div>
          <Button type="submit" disabled={sending}>{sending ? (locale === 'ar' ? 'جارٍ الإرسال…' : 'Sending…') : (locale === 'ar' ? 'إرسال' : 'Send')}</Button>
        </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
