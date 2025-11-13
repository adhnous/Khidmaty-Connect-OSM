"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSaleItemById, updateSaleItem, type SaleItem } from '@/lib/sale-items';
import { getClientLocale, tr } from '@/lib/i18n';

const QuickSchema = z.object({
  price: z.coerce.number().min(0),
  priceMode: z.enum(['firm','negotiable','call','hidden']).default('firm'),
  quantity: z.coerce.number().min(0).optional(),
});

type QuickForm = z.infer<typeof QuickSchema>;

export default function QuickEditSaleItemPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const locale = getClientLocale();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<SaleItem | null>(null);

  const form = useForm<QuickForm>({
    resolver: zodResolver(QuickSchema),
    defaultValues: { price: 0, priceMode: 'firm', quantity: undefined },
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const it = await getSaleItemById(id);
        if (it) {
          setItem(it);
          form.reset({
            price: Number((it as any)?.price ?? 0),
            priceMode: String((it as any)?.priceMode || 'firm') as any,
            quantity: (it as any)?.quantity != null ? Number((it as any).quantity) : undefined,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(values: QuickForm) {
    if (!id) return;
    try {
      await updateSaleItem(id, values);
      toast({ title: locale==='ar' ? 'تم الحفظ' : 'Saved' });
      router.back();
    } catch (e: any) {
      toast({ variant: 'destructive', title: e?.message || 'Failed' });
    }
  }

  if (!id) return null;

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>{locale==='ar' ? 'تعديل سريع' : 'Quick Edit'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{tr(locale,'home.loading')}</p>
          ) : !item ? (
            <p className="text-muted-foreground">{locale==='ar'?'غير موجود':'Not found'}</p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr(locale,'form.labels.price')}</FormLabel>
                    <Input type="number" min={0} step="1" {...field} onChange={(e)=>field.onChange(Number(e.target.value))} />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="priceMode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tr(locale,'form.labels.priceMode')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder={tr(locale,'form.labels.priceMode')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firm">{locale==='ar'?'ثابت':'Firm'}</SelectItem>
                        <SelectItem value="negotiable">{locale==='ar'?'قابل للتفاوض':'Negotiable'}</SelectItem>
                        <SelectItem value="call">{locale==='ar'?'اتصل بي':'Call'}</SelectItem>
                        <SelectItem value="hidden">{locale==='ar'?'إخفاء السعر':'Hide price'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {/* Moderation status (read-only) */}
                {item && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{locale==='ar'?'حالة المراجعة:':'Moderation status:'}</span>{' '}
                    <span>
                      {String((item as any)?.status || '') === 'pending' ? (locale==='ar'?'قيد الموافقة':'Pending approval') :
                       String((item as any)?.status || '') === 'approved' ? (locale==='ar'?'معتمد':'Approved') :
                       String((item as any)?.status || '') === 'sold' ? (locale==='ar'?'مباع':'Sold') :
                       String((item as any)?.status || '') === 'hidden' ? (locale==='ar'?'مخفي':'Hidden') : (String((item as any)?.status || ''))}
                    </span>
                  </div>
                )}
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale==='ar'?'الكمية (اختياري)':'Quantity (optional)'}</FormLabel>
                    <Input type="number" min={0} step="1" value={(field.value as any) ?? ''} onChange={(e)=>field.onChange(e.target.value===''?undefined:Number(e.target.value))} />
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={()=>router.back()}>{locale==='ar'?'إلغاء':'Cancel'}</Button>
                  <Button type="submit">{locale==='ar'?'حفظ':'Save'}</Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
