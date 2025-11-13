import { z } from 'zod';
import { imageUrlSchema } from '@/lib/schemas';

export const saleItemSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  priceMode: z.enum(['firm', 'negotiable', 'call', 'hidden']).default('firm'),
  condition: z.enum(['new','like-new','used','for-parts']).optional(),
  trade: z.object({
    enabled: z.boolean().default(false),
    tradeFor: z.string().optional(),
  }).default({ enabled: false }),

  category: z.literal('sales'),
  tags: z.array(z.string()).optional(),

  city: z.string().min(1),
  area: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().min(2).max(50).optional()
    ),
  contactPhone: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  location: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  mapUrl: z.string().url().optional(),
  hideExactLocation: z.boolean().default(false),

  images: z.array(z.object({
    url: imageUrlSchema,
    publicId: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).min(1, 'Add at least one photo'),

  videoUrls: z.array(z.string().url()).optional().default([]),

  status: z.enum(['pending','approved','sold','hidden']).default('pending'),
  quantity: z.coerce.number().min(0).optional(),
  featured: z.boolean().optional(),
  priority: z.coerce.number().optional(),
  acceptRequests: z.boolean().default(true),
});
export type SaleItemForm = z.infer<typeof saleItemSchema>;
