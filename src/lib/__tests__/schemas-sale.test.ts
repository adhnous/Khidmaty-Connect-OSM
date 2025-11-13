import { describe, it, expect } from 'vitest';
import { saleItemSchema } from '@/lib/schemas-sale';

describe('saleItemSchema', () => {
  it('accepts minimal valid object', () => {
    const data = {
      title: 'iPhone 12',
      price: 1200,
      priceMode: 'firm',
      category: 'sales' as const,
      city: 'Tripoli',
      location: { lat: 32.8872, lng: 13.1913 },
      images: [{ url: 'https://example.com/phone.jpg' }],
    };
    const parsed = saleItemSchema.parse(data);
    expect(parsed.status).toBe('active');
    expect(parsed.trade).toEqual({ enabled: false });
  });

  it('coerces price and rejects invalid image url', () => {
    const data = {
      title: 'Laptop',
      price: '800',
      priceMode: 'negotiable',
      category: 'sales' as const,
      city: 'Tripoli',
      location: { lat: 32.8872, lng: 13.1913 },
      images: [{ url: 'https://example.com/laptop.jpg' }],
    } as any;
    const parsed = saleItemSchema.parse(data);
    expect(parsed.price).toBe(800);
  });

  it('requires at least one image', () => {
    const data = {
      title: 'Bike',
      price: 300,
      priceMode: 'firm',
      category: 'sales' as const,
      city: 'Tripoli',
      location: { lat: 32.8872, lng: 13.1913 },
      images: [],
    } as any;
    expect(() => saleItemSchema.parse(data)).toThrow();
  });
});
