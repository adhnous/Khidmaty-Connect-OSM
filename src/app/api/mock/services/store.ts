export type MockService = {
  id: string;
  title: string;
  category: string;
  cityEn: string;
  cityAr: string;
  priceLyd: number;
  providerName: string;
  rating: number;
  description?: string;
  contactPhone?: string;
  createdAtIso?: string;
};

export type CreateMockServiceInput = {
  title: string;
  category: string;
  cityEn: string;
  cityAr: string;
  priceLyd: number;
  providerName: string;
  description?: string;
  contactPhone?: string;
};

const INITIAL_SERVICES: MockService[] = [
  {
    id: 'svc_1',
    title: 'سباك في طرابلس (طوارئ 24/7)',
    category: 'plumbing',
    cityEn: 'Tripoli',
    cityAr: 'طرابلس',
    priceLyd: 120,
    providerName: 'عمر الفيتوري',
    rating: 4.7,
    description: 'إصلاح التسريبات وفتح المجاري وتركيب الأدوات الصحية. (Training endpoint)',
    contactPhone: '+218 91 234 5678',
    createdAtIso: new Date().toISOString(),
  },
  {
    id: 'svc_2',
    title: 'كهربائي + فحص سلامة الكهرباء',
    category: 'electrician',
    cityEn: 'Benghazi',
    cityAr: 'بنغازي',
    priceLyd: 90,
    providerName: 'سالم الدرسي',
    rating: 4.5,
    description: 'فحص التمديدات والقواطع والمقابس مع تقرير مبسط.',
    contactPhone: '+218 92 111 2233',
    createdAtIso: new Date().toISOString(),
  },
  {
    id: 'svc_3',
    title: 'تنظيف شقق ومنازل',
    category: 'cleaning',
    cityEn: 'Misrata',
    cityAr: 'مصراتة',
    priceLyd: 150,
    providerName: 'مريم الشريف',
    rating: 4.2,
    createdAtIso: new Date().toISOString(),
  },
  {
    id: 'svc_4',
    title: 'صيانة مكيفات وتركيب',
    category: 'ac',
    cityEn: 'Tripoli',
    cityAr: 'طرابلس',
    priceLyd: 180,
    providerName: 'شركة النسيم',
    rating: 4.6,
    createdAtIso: new Date().toISOString(),
  },
  {
    id: 'svc_5',
    title: 'ميكانيكي سيارات (فحص + صيانة)',
    category: 'car',
    cityEn: 'Zawiya',
    cityAr: 'الزاوية',
    priceLyd: 110,
    providerName: 'محمود الزاوي',
    rating: 4.1,
    createdAtIso: new Date().toISOString(),
  },
  {
    id: 'svc_6',
    title: 'دروس خصوصية رياضيات (ثانوي)',
    category: 'tutoring',
    cityEn: 'Benghazi',
    cityAr: 'بنغازي',
    priceLyd: 60,
    providerName: 'هناء العبيدي',
    rating: 4.8,
    createdAtIso: new Date().toISOString(),
  },
  {
    id: 'svc_7',
    title: 'خدمة نقل داخل طرابلس (حافلة)',
    category: 'transport',
    cityEn: 'Tripoli',
    cityAr: 'طرابلس',
    priceLyd: 15,
    providerName: 'شركة النقل العام',
    rating: 3.9,
    description: 'معلومات تجريبية للتدريب فقط (ليست بيانات حقيقية).',
    createdAtIso: new Date().toISOString(),
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __khidmatyMockServices: MockService[] | undefined;
}

function getStore(): MockService[] {
  if (!globalThis.__khidmatyMockServices) {
    globalThis.__khidmatyMockServices = INITIAL_SERVICES.map((s) => ({ ...s }));
  }
  return globalThis.__khidmatyMockServices;
}

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function toLower(s: string) {
  return String(s || '').toLowerCase();
}

export function listMockServices(filters: {
  city?: string;
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  take?: number;
}): { services: MockService[]; total: number; take: number } {
  const store = getStore();
  const city = String(filters.city || '').trim();
  const category = String(filters.category || '').trim();
  const q = String(filters.q || '').trim();
  const minPrice = filters.minPrice;
  const maxPrice = filters.maxPrice;
  const take = clampInt(Number(filters.take ?? 20), 1, 50);

  let rows = [...store];

  if (city) {
    const needle = toLower(city);
    rows = rows.filter((s) => toLower(s.cityEn).includes(needle) || toLower(s.cityAr).includes(needle));
  }
  if (category) {
    const needle = toLower(category);
    rows = rows.filter((s) => toLower(s.category).includes(needle));
  }
  if (q) {
    const needle = toLower(q);
    rows = rows.filter(
      (s) =>
        toLower(s.title).includes(needle) ||
        toLower(s.providerName).includes(needle) ||
        toLower(s.cityEn).includes(needle) ||
        toLower(s.cityAr).includes(needle)
    );
  }
  if (Number.isFinite(minPrice as number)) rows = rows.filter((s) => s.priceLyd >= (minPrice as number));
  if (Number.isFinite(maxPrice as number)) rows = rows.filter((s) => s.priceLyd <= (maxPrice as number));

  const total = rows.length;
  return { services: rows.slice(0, take), total, take };
}

export function getMockServiceById(id: string): MockService | null {
  const store = getStore();
  const needle = String(id || '').trim();
  if (!needle) return null;
  return store.find((s) => s.id === needle) || null;
}

export function createMockService(input: CreateMockServiceInput): MockService {
  const store = getStore();
  const created: MockService = {
    id: `svc_${Math.random().toString(16).slice(2, 10)}`,
    title: input.title,
    category: input.category,
    cityEn: input.cityEn,
    cityAr: input.cityAr,
    priceLyd: input.priceLyd,
    providerName: input.providerName,
    rating: 0,
    description: input.description,
    contactPhone: input.contactPhone,
    createdAtIso: new Date().toISOString(),
  };
  store.unshift(created);
  return created;
}

