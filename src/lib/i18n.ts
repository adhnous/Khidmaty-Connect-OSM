export type Locale = 'en' | 'ar';

const dict = {
  en: {
    header: {
      browse: 'Browse Services',
      providers: 'For Providers',
      providerDashboard: 'Provider Dashboard',
      myServices: 'My Services',
      addService: 'Add New Service',
      profile: 'Profile',
      signOut: 'Sign Out',
      login: 'Login / Sign Up',
      switch: 'Switch language',
    },
    home: {
      heroTitle: 'Find Local Services You Can Trust',
      heroSubtitle: 'Your connection to skilled professionals in Libya.',
      searchPlaceholder: 'What service are you looking for?',
      cityPlaceholder: 'City',
      allCities: 'All Cities',
      maxPricePlaceholder: 'Max price',
      search: 'Search',
      featuredCategories: 'Featured Categories',
      popularServices: 'Popular Services',
      loading: 'Loading services…',
      empty1: 'No real services yet. The cards below are demos and not clickable.',
      empty2: 'Go to Dashboard → My Services to create a new service or click Seed samples there to add example listings.',
    },
    categories: {
      Plumbing: 'Plumbing',
      'Home Services': 'Home Services',
      Automotive: 'Automotive',
      Education: 'Education',
      Electrical: 'Electrical',
      Carpentry: 'Carpentry',
      Gardening: 'Gardening',
    },
    details: {
      loading: 'Loading service…',
      notFoundTitle: 'Service not found',
      notFoundBodyError: 'There was a problem loading this service.',
      notFoundBodyRemoved: 'This service may have been removed.',
      goHome: 'Go to homepage',
      backToMyServices: 'Back to My Services',
      description: 'Description',
      availability: 'Availability',
      location: 'Location',
      approxIn: 'Approximate location in',
      video: 'Video',
      servicePrice: 'Service Price',
      contactWhatsApp: 'Contact via WhatsApp',
      callProvider: 'Call Provider',
      noContact: 'Contact details not provided.',
    },
  },
  ar: {
    header: {
      browse: 'تصفح الخدمات',
      providers: 'للمقدّمين',
      providerDashboard: 'لوحة المزود',
      myServices: 'خدماتي',
      addService: 'إضافة خدمة جديدة',
      profile: 'الملف الشخصي',
      signOut: 'تسجيل الخروج',
      login: 'تسجيل الدخول / إنشاء حساب',
      switch: 'تغيير اللغة',
    },
    home: {
      heroTitle: 'اعثر على خدمات محلية تثق بها',
      heroSubtitle: 'صلتك بالمحترفين المهرة في ليبيا.',
      searchPlaceholder: 'ما الخدمة التي تبحث عنها؟',
      cityPlaceholder: 'المدينة',
      allCities: 'جميع المدن',
      maxPricePlaceholder: 'أقصى سعر',
      search: 'بحث',
      featuredCategories: 'أبرز الفئات',
      popularServices: 'خدمات شائعة',
      loading: 'جارٍ تحميل الخدمات…',
      empty1: 'لا توجد خدمات حقيقية بعد. البطاقات التالية للعرض فقط وغير قابلة للنقر.',
      empty2: 'اذهب إلى لوحة التحكم → خدماتي لإنشاء خدمة جديدة أو انقر "إضافة عينات" لإضافة أمثلة.',
    },
    categories: {
      Plumbing: 'سباكة',
      'Home Services': 'خدمات منزلية',
      Automotive: 'خدمات السيارات',
      Education: 'تعليم',
      Electrical: 'كهرباء',
      Carpentry: 'نجارة',
      Gardening: 'تنسيق حدائق',
    },
    details: {
      loading: 'جارٍ تحميل الخدمة…',
      notFoundTitle: 'الخدمة غير موجودة',
      notFoundBodyError: 'حدثت مشكلة أثناء تحميل هذه الخدمة.',
      notFoundBodyRemoved: 'قد تم إزالة هذه الخدمة.',
      goHome: 'العودة إلى الصفحة الرئيسية',
      backToMyServices: 'العودة إلى خدماتي',
      description: 'الوصف',
      availability: 'التوفر',
      location: 'الموقع',
      approxIn: 'موقع تقريبي في',
      video: 'فيديو',
      servicePrice: 'سعر الخدمة',
      contactWhatsApp: 'تواصل عبر واتساب',
      callProvider: 'اتصل بالمقدم',
      noContact: 'لا توجد بيانات تواصل.',
    },
  },
} as const;

function get(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj);
}

export function tr(locale: Locale, key: string): string {
  const d = dict[locale] ?? dict.en;
  const v = get(d, key);
  if (typeof v === 'string') return v;
  // fallback to en
  const ve = get(dict.en, key);
  return typeof ve === 'string' ? ve : key;
}

export function getClientLocale(): Locale {
  try {
    if (typeof document === 'undefined') return 'en';
    const m = document.cookie.match(/(?:^|; )locale=([^;]+)/);
    const fromCookie = (m?.[1] || '').toLowerCase();
    const fromHtml = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    const l = (fromCookie || fromHtml).startsWith('ar') ? 'ar' : 'en';
    return l as Locale;
  } catch {
    return 'en';
  }
}

export const dictionaries = dict;
