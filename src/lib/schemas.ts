import { z } from 'zod';

export const subServiceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'أدخل العنوان').max(100),
  price: z.coerce.number().min(0, 'يجب أن يكون السعر 0 أو أكثر'),
  unit: z.string().max(20).optional(),
  description: z.string().max(300).optional(),
});

export const serviceSchema = z.object({
  title: z.string().min(6, 'يجب أن يتكون العنوان من 6 أحرف على الأقل').max(100, 'لا يمكن أن يتجاوز العنوان 100 حرف'),
  description: z.string().min(30, 'يجب أن يتكون الوصف من 30 حرفاً على الأقل').max(800, 'لا يمكن أن يتجاوز الوصف 800 حرف'),
  price: z.coerce.number().min(0, 'يجب أن يكون السعر 0 أو أكثر'),
  category: z.string({required_error: "يرجى اختيار فئة"}).min(1, 'يرجى اختيار فئة'),
  city: z.string({required_error: "يرجى اختيار مدينة"}).min(1, 'يرجى اختيار مدينة'),
  area: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().min(2, 'يرجى تحديد المنطقة أو الحي').max(50).optional()
    ),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  // Optional map URL (Google Maps or OpenStreetMap). Empty string becomes undefined.
  mapUrl: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().url('أدخل رابط صالح').optional()),
  availabilityNote: z.string().optional(),
  contactPhone: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().min(6, 'أدخل رقم هاتف صالح').max(20).optional()),
  contactWhatsapp: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().min(6, 'أدخل رقم واتساب صالح').max(20).optional()),
  // Optional YouTube video URL. Empty string becomes undefined.
  videoUrl: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().url('أدخل رابط صالح').optional()),
  // New: multiple video URLs (YouTube). Empty items are filtered out on submit.
  videoUrls: z
    .array(z.string().url('أدخل رابط صالح'))
    .optional()
    .default([]),
  // New: social links (optional). Empty string becomes undefined.
  facebookUrl: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().url('أدخل رابط صالح').optional()),
  telegramUrl: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().url('أدخل رابط صالح').optional()),
  // images: z.any() // Image handling is complex, placeholder for now
  subservices: z.array(subServiceSchema).default([]),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
export type SubServiceFormData = z.infer<typeof subServiceSchema>;
