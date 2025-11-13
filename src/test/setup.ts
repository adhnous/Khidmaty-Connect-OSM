import { vi } from 'vitest';

// Minimal window stub for libraries that probe for it
// @ts-ignore
if (typeof (globalThis as any).window === 'undefined') {
  // @ts-ignore
  (globalThis as any).window = {};
}

// Mock leaflet to avoid accessing window / DOM APIs in Node tests
vi.mock('leaflet', () => {
  const L = {
    divIcon: (_opts?: any) => ({ /* mock icon */ }),
  } as any;
  return { default: L, ...L };
});

// Mock react-leaflet components as no-ops
vi.mock('react-leaflet', () => {
  const Noop = (props: any) => null;
  return {
    MapContainer: Noop,
    TileLayer: Noop,
    Marker: Noop,
    Popup: Noop,
    ScaleControl: Noop,
  };
});

// Provide dummy env vars so firebase.ts does not throw in tests (will be mocked below anyway)
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test.local';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '0';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'test';

// Mock our firebase wrapper to avoid real SDK initialization
vi.mock('@/lib/firebase', () => {
  return {
    app: {} as any,
    auth: { currentUser: null } as any,
    db: {} as any,
    storage: {} as any,
  };
});

// Mock Next.js App Router hooks for tests
vi.mock('next/navigation', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };
  return {
    useRouter: () => router,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  };
});
