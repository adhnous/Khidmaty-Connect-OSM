'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getClientLocale, tr } from '@/lib/i18n';
import { libyanCities, cityLabel } from '@/lib/cities';
import CategoryCombobox from '@/components/category-combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createService, uploadServiceImages, updateService, getServiceById, type ServiceImage } from '@/lib/services';
import { getUploadMode } from '@/lib/images';

const QuickSchema = z.object({
  title: z.string().min(6).max(100),
  category: z.string().min(1),
  city: z.string().min(1),
  price: z.coerce.number().min(0),
  description: z.string().min(30).max(800),
});

export default function QuickCreateServicePage() {
  const { user, userProfile, loading } = useAuth();
  const locale = getClientLocale();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const draftKey = useMemo(() => `draft_service_quick_${user?.uid || 'anon'}`, [user?.uid]);
  const form = useForm<z.infer<typeof QuickSchema>>({
    resolver: zodResolver(QuickSchema),
    defaultValues: {
      title: '',
      category: '',
      city: 'Tripoli',
      price: 0,
      description: '',
    },
  });

  const titleValue = form.watch('title');
  const descValue = form.watch('description');

  // Load draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        form.reset({
          title: parsed.title || '',
          category: parsed.category || '',
          city: parsed.city || 'Tripoli',
          price: typeof parsed.price === 'number' ? parsed.price : 0,
          description: parsed.description || '',
        });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Save draft on change (debounced)
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const sub = form.watch((values) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify(values));
        } catch {}
      }, 500);
    });
    return () => sub.unsubscribe();
  }, [form, draftKey]);

  useEffect(() => {
    const urls = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [selectedFiles]);

  if (loading) return null;
  const canAccess =
    userProfile?.role === 'provider' ||
    userProfile?.role === 'admin' ||
    userProfile?.role === 'owner';
  if (!canAccess) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'ar' ? 'الحساب غير مخوّل' : 'Not allowed'}</CardTitle>
            <CardDescription>{locale === 'ar' ? 'هذه الصفحة للمقدّمين فقط.' : 'This page is for provider accounts only.'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof QuickSchema>) {
    if (!user) return;
    setSubmitting(true);
    try {
      let images: ServiceImage[] = [];
      if (selectedFiles.length > 0) {
        const mode = getUploadMode(user.uid);
        try {
          if (mode === 'local') {
            // local uploads expect an /api/uploads route; if missing, fallback to inline
            const fd = new FormData();
            selectedFiles.forEach((f) => fd.append('files', f));
            const res = await fetch('/api/uploads', { method: 'POST', body: fd });
            if (res.ok) {
              const data = (await res.json()) as { urls: string[] };
              images = (data.urls || []).map((u) => ({ url: u }));
            } else {
              throw new Error('local_upload_unavailable');
            }
          } else {
            // For now, treat 'inline', 'storage' and 'cloudinary' the same here:
            // upload to Firebase Storage via uploadServiceImages.
            if (mode === 'cloudinary') {
              // Make it explicit in dev logs that this is a fallback.
              console.warn('[QuickCreate] Cloudinary mode not fully supported in quick create; using Firebase Storage instead.');
            }
            images = await uploadServiceImages(user.uid, selectedFiles);
          }
        } catch {
          // inline fallback (first 2)
          const files = selectedFiles.slice(0, 2);
          const dataUrls = await Promise.all(files.map(async (f) => {
            const raw = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = reject;
              reader.readAsDataURL(f);
            });
            return raw;
          }));
          images = dataUrls.map((u) => ({ url: u }));
        }
      }

      const id = await createService({
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        city: values.city,
        area: '',
        images,
        providerId: user.uid,
      } as any);
      // Force-persist images in case the server sanitized them
      if (Array.isArray(images) && images.length > 0) {
        try { await updateService(id, { images }); } catch {}
      }
      try {
        const doc = await getServiceById(id);
        const n = Array.isArray((doc as any)?.images) ? (doc as any).images.length : 0;
        toast({ title: tr(locale, 'form.toasts.createdTitle'), description: `${n} image(s) saved` });
      } catch {
        toast({ title: tr(locale, 'form.toasts.createdTitle'), description: tr(locale, 'form.toasts.createdDesc') });
      }
      try { localStorage.removeItem(draftKey); } catch {}
      router.push(`/services/${id}`);
    } catch (e: any) {
      toast({ variant: 'destructive', title: tr(locale, 'form.toasts.createFailedTitle'), description: e?.message || '' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ar' ? 'إنشاء سريع (خطوتان)' : 'Quick Create (2 steps)'}</CardTitle>
          <CardDescription>{locale === 'ar' ? 'املأ الحقول الأساسية أولاً، ثم أضف الوصف والسعر والوسائط.' : 'Fill the essentials first, then add description, price and media.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.title')}</FormLabel>
                        <FormControl>
                          <Input placeholder={tr(locale, 'form.placeholders.title')} {...field} />
                        </FormControl>
                        <div className="mt-1 text-xs text-muted-foreground">{(titleValue?.length || 0)}/100 · {locale === 'ar' ? 'الحد الأدنى 6 أحرف' : 'min 6 chars'}</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.category')}</FormLabel>
                        <CategoryCombobox value={field.value} onChange={field.onChange} mergeCommunity placeholder={tr(locale, 'form.labels.category') as string} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.city')}</FormLabel>
                        <div className="grid gap-2">
                          <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            {libyanCities.map((c) => (
                              <option key={c.value} value={c.value}>{cityLabel(locale, c.value)}</option>
                            ))}
                          </select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                      {locale === 'ar' ? 'التالي' : 'Next'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => { try { localStorage.removeItem(draftKey); } catch {}; form.reset(); }}>
                      {locale === 'ar' ? 'حذف المسودة' : 'Discard draft'}
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.description')}</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[120px]" placeholder={tr(locale, 'form.placeholders.description')} {...field} />
                        </FormControl>
                        <div className="mt-1 text-xs text-muted-foreground">{(descValue?.length || 0)}/800 · {locale === 'ar' ? 'الحد الأدنى 30 حرفاً' : 'min 30 chars'}</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tr(locale, 'form.labels.price')}</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="1" placeholder="100" {...field} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>{tr(locale, 'form.images.label')}</FormLabel>
                    <div className="mt-2 flex w-full items-center justify-center">
                      <label htmlFor="quick-images" className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-secondary transition-colors hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-7 h-7 mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{tr(locale, 'form.actions.clickToUpload')}</p>
                        </div>
                        <input id="quick-images" type="file" className="hidden" multiple accept="image/*" onChange={(e) => setSelectedFiles(Array.from(e.target.files || []).slice(0, 8))} />
                      </label>
                    </div>
                    {previews.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-4">
                        {previews.map((src, i) => (
                          <div key={i} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="h-24 w-full rounded object-cover" />
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white"
                              onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      {locale === 'ar' ? 'رجوع' : 'Back'}
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {tr(locale, 'form.actions.createService')}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
