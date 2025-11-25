'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import CityPicker from '@/components/city-picker';
import { libyanCities, cityLabel } from '@/lib/cities';
import { getClientLocale } from '@/lib/i18n';
import { getIdTokenOrThrow } from '@/lib/auth-client';

type BloodDonorListItem = {
  id: string;
  name: string;
  bloodType:
    | 'A+'
    | 'A-'
    | 'B+'
    | 'B-'
    | 'AB+'
    | 'AB-'
    | 'O+'
    | 'O-'
    | 'other';
  city?: string | null;
  phone?: string | null;
  notes?: string | null;
  rare?: boolean | null;
  availability?: 'available' | 'maybe' | 'unavailable' | null;
};

const BLOOD_TYPES: BloodDonorListItem['bloodType'][] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'other',
];

export default function BloodDonorsPage() {
  const locale = getClientLocale();
  const isAr = locale === 'ar';

  const [items, setItems] = useState<BloodDonorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cityFilter, setCityFilter] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] =
    useState<BloodDonorListItem['bloodType'] | ''>('');
  const [rareOnly, setRareOnly] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  const [name, setName] = useState('');
  const [bloodType, setBloodType] =
    useState<BloodDonorListItem['bloodType']>('O+');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [rare, setRare] = useState(false);
  const [availability, setAvailability] =
    useState<BloodDonorListItem['availability']>('available');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  async function load(opts?: {
    city?: string;
    bloodType?: BloodDonorListItem['bloodType'] | '';
    rareOnly?: boolean;
  }) {
    const cityVal = opts?.city ?? cityFilter;
    const bloodTypeVal = opts?.bloodType ?? bloodTypeFilter;
    const rareOnlyVal = opts?.rareOnly ?? rareOnly;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (cityVal.trim()) params.set('city', cityVal.trim());
      if (bloodTypeVal) params.set('bloodType', bloodTypeVal);
      if (rareOnlyVal) params.set('rareOnly', 'true');

      const res = await fetch(`/api/blood-donors/list?${params.toString()}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || res.statusText);
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e: any) {
      setError(
        isAr
          ? 'تعذّر تحميل قائمة المتبرعين.'
          : 'Failed to load blood donors.',
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load({ city: '', bloodType: '', rareOnly: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFiltersAndLoadAll() {
    setCityFilter('');
    setBloodTypeFilter('');
    setRareOnly(false);
    setFiltersApplied(false);
    void load({ city: '', bloodType: '', rareOnly: false });
  }

  function handleSearchToggle() {
    const hasFilters =
      cityFilter.trim() !== '' || bloodTypeFilter !== '' || rareOnly;

    if (!hasFilters) {
      // No filters set at all: just show all donors
      resetFiltersAndLoadAll();
      return;
    }

    if (!filtersApplied) {
      // Apply filters
      void load();
      setFiltersApplied(true);
    } else {
      // Filters already applied: toggle back to "all donors"
      resetFiltersAndLoadAll();
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* HERO */}
        <section className="border-b bg-gradient-to-b from-rose-50 via-background to-background">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:py-10">
            <div
              className={`flex flex-col gap-3 ${
                isAr ? 'items-end text-right' : 'items-start text-left'
              }`}
            >
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {isAr
                  ? 'متبرعي الدم والأنواع النادرة'
                  : 'Blood donors & rare types'}
              </h1>
              <p className="max-w-2xl text-xs text-muted-foreground md:text-sm">
                {isAr
                  ? 'مكان بسيط للبحث عن متبرعين بالدم حسب الفصيلة والمدينة، أو تسجيل نفسك كمتبرع. شارك فقط بيانات الاتصال التي تشعر بالراحة في مشاركتها.'
                  : 'A simple place to register as a blood donor or search for donors by blood type and city. Please only share contact details you are comfortable with.'}
              </p>
            </div>
          </div>
        </section>

        {/* LIST + FILTERS */}
        <section className="mx-auto max-w-5xl px-4 py-8 md:py-10">
          <div className="grid gap-6 items-start lg:grid-cols-2">
            {/* Filters + list */}
            <div>
              <div
                className={`mb-4 grid gap-3 rounded-2xl border border-rose-200/70 bg-white/80 p-3 text-[11px] shadow-sm md:grid-cols-4 md:p-4 md:text-xs ${
                  isAr ? 'text-right' : 'text-left'
                }`}
              >
                <div>
                  <label className="mb-1 block font-semibold">
                    {isAr ? 'فصيلة الدم' : 'Blood type'}
                  </label>
                  <select
                    className="w-full rounded border border-rose-200 bg-white/80 px-2 py-1 text-xs text-rose-700 shadow-sm outline-none transition hover:border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 md:text-sm"
                    value={bloodTypeFilter}
                    onChange={(e) => {
                      setBloodTypeFilter(
                        e.target.value as BloodDonorListItem['bloodType'] | '',
                      );
                      setFiltersApplied(false);
                    }}
                  >
                    <option value="">
                      {isAr ? 'أي فصيلة' : 'Any type'}
                    </option>
                    {BLOOD_TYPES.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold">
                    {isAr ? 'المدينة' : 'City'}
                  </label>
                  <CityPicker
                    locale={isAr ? 'ar' : 'en'}
                    value={cityFilter}
                    onChange={(val) => {
                      setCityFilter(val);
                      setFiltersApplied(false);
                    }}
                    options={libyanCities}
                    className="h-8 text-xs md:h-9 md:text-sm"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <label className="inline-flex items-center gap-1 text-[11px] font-semibold md:text-xs">
                    <input
                      type="checkbox"
                      checked={rareOnly}
                      onChange={(e) => {
                        setRareOnly(e.target.checked);
                        setFiltersApplied(false);
                      }}
                      className="h-3 w-3"
                    />
                    {isAr ? 'الأنواع النادرة فقط' : 'Rare types only'}
                  </label>
                </div>

                <div className="flex items-end justify-end">
                  <Button size="sm" onClick={handleSearchToggle}>
                    {filtersApplied
                      ? isAr
                        ? 'إظهار كل المتبرعين'
                        : 'Show all donors'
                      : isAr
                      ? 'بحث'
                      : 'Search'}
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50 via-card to-rose-100/70 p-4 text-xs shadow-[0_22px_45px_rgba(244,63,94,0.20)] md:p-5 md:text-sm">
                {error && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 md:text-sm">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-xl border bg-muted/60"
                      />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-xs text-muted-foreground md:text-sm">
                    {isAr
                      ? 'لا يوجد متبرعون لهذا البحث حتى الآن.'
                      : 'No donors found for this filter yet.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {items.map((d) => (
                      <div
                        key={d.id}
                        className="flex flex-col justify-between rounded-xl border bg-background/60 p-3 text-xs shadow-sm md:p-4 md:text-sm"
                      >
                        <div className={isAr ? 'text-right' : 'text-left'}>
                          <div className="mb-2 flex justify-center">
                            <Image
                              src="/blood-donor-card.png"
                              alt={isAr ? 'تبرع بالدم' : 'Donate blood'}
                              width={96}
                              height={64}
                              className="h-16 w-auto object-contain"
                            />
                          </div>
                          <div className="mb-2 text-[11px] font-semibold leading-snug text-indigo-700">
                            {isAr ? (
                              <>
                                <div>تبرع بدمك</div>
                                <div>هناك من هو في خطر</div>
                                <div>ينتظرك</div>
                              </>
                            ) : (
                              <>
                                <div>Donate your blood</div>
                                <div>Someone in danger</div>
                                <div>is waiting for you</div>
                              </>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold md:text-base">
                              {d.name}
                            </h3>
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                              {d.bloodType}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground md:text-xs">
                            {d.city && (
                              <span className="rounded-full bg-muted px-2 py-0.5">
                                {cityLabel(isAr ? 'ar' : 'en', d.city)}
                              </span>
                            )}
                            {d.rare && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                                {isAr ? 'فصيلة نادرة' : 'Rare type'}
                              </span>
                            )}
                            {d.availability && (
  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
    {isAr
      ? d.availability === 'available'
        ? 'متاح'
        : d.availability === 'maybe'
        ? 'ربما'
        : 'غير متاح'
      : d.availability}
  </span>
)}

                          </div>
                          {d.notes && (
                            <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground md:text-xs">
                              {d.notes}
                            </p>
                          )}
                        </div>
                        <div
                          className={`mt-3 flex items-center justify-between text-[11px] text-muted-foreground md:text-xs ${
                            isAr ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <div>
                            {d.phone && (
                              <span className="font-mono text-[11px]">
                                {d.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contribute form */}
            <div>
              <section className="rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50 via-card to-rose-100/70 p-4 text-xs shadow-[0_22px_45px_rgba(244,63,94,0.20)] md:p-5 md:text-sm">
                <h2 className="mb-2 text-sm font-bold md:text-base">
                  {isAr ? 'سجّل كمتبرع بالدم' : 'Register as a blood donor'}
                </h2>
                <p className="mb-3 text-[11px] text-muted-foreground md:text-xs">
                  {isAr
                    ? 'يرجى مشاركة بيانات الاتصال التي تشعر بالراحة في مشاركتها.'
                    : 'Please only share contact details you are comfortable sharing.'}
                </p>

                <form
                  className={`grid gap-3 lg:grid-cols-2 ${
                    isAr ? 'text-right' : 'text-left'
                  }`}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!name.trim()) {
                      setSubmitMessage(
                        isAr
                          ? 'يرجى إدخال الاسم الكامل.'
                          : 'Please enter your name.',
                      );
                      return;
                    }
                    try {
                      setSubmitting(true);
                      setSubmitMessage(null);

                      const token = await getIdTokenOrThrow();
                      const res = await fetch('/api/blood-donors/create', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          name: name.trim(),
                          bloodType,
                          city: city.trim() || undefined,
                          phone: phone.trim() || undefined,
                          notes: notes.trim() || undefined,
                          rare,
                          availability,
                        }),
                      });
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        const code = json?.error || 'failed';
                        if (code === 'missing_name') {
                          throw new Error(
                            isAr ? 'الاسم مطلوب.' : 'Name is required.',
                          );
                        }
                        throw new Error(
                          isAr
                            ? 'تعذّر حفظ بيانات المتبرع حالياً.'
                            : 'Could not save your donor details right now.',
                        );
                      }

                      setName('');
                      setCity('');
                      setPhone('');
                      setNotes('');
                      setRare(false);
                      setBloodType('O+');
                      setAvailability('available');

                      setSubmitMessage(
                        isAr
                          ? 'شكراً لك، تم تسجيل بياناتك كمتبرع بالدم.'
                          : 'Thank you, your donor details have been registered.',
                      );
                      void load();
                    } catch (err: any) {
                      setSubmitMessage(
                        err?.message ||
                          (isAr
                            ? 'تعذّر حفظ بيانات المتبرع حالياً.'
                            : 'Could not save your donor details right now.'),
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold md:text-xs">
                      {isAr ? 'الاسم الكامل' : 'Full name'}
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-8 text-xs md:h-9 md:text-sm"
                      dir={isAr ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold md:text-xs">
                      {isAr ? 'فصيلة الدم' : 'Blood type'}
                    </label>
                    <select
                      className="h-8 w-full rounded border border-rose-200 bg-white/80 px-2 text-xs text-rose-700 shadow-sm outline-none transition hover:border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 md:h-9 md:text-sm"
                      value={bloodType}
                      onChange={(e) =>
                        setBloodType(
                          e.target.value as BloodDonorListItem['bloodType'],
                        )
                      }
                    >
                      {BLOOD_TYPES.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold md:text-xs">
                      {isAr ? 'المدينة' : 'City'}
                    </label>
                    <CityPicker
                      locale={isAr ? 'ar' : 'en'}
                      value={city}
                      onChange={(val) => setCity(val)}
                      options={libyanCities}
                      className="h-8 text-xs md:h-9 md:text-sm"
                    />
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="hidden"
                      dir={isAr ? 'rtl' : 'ltr'}
                      placeholder={isAr ? 'ابحث عن مدينة...' : 'City...'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold md:text-xs">
                      {isAr ? 'الهاتف / واتساب' : 'Phone / WhatsApp'}
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-8 text-xs md:h-9 md:text-sm"
                      dir={isAr ? 'rtl' : 'ltr'}
                      placeholder={isAr ? '09...' : '+218...'}
                    />
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <label className="block text-[11px] font-semibold md:text-xs">
                      {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="text-xs md:text-sm"
                      dir={isAr ? 'rtl' : 'ltr'}
                      placeholder={
                        isAr
                          ? 'أي تفاصيل مهمة مثل أوقات التوفر أو ملاحظات خاصة.'
                          : 'Any important details, e.g. availability times or special notes.'
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold md:text-xs">
                      {isAr ? 'نوع نادر' : 'Rare type'}
                    </label>
                    <div className="flex items-center gap-2 text-[11px] md:text-xs">
                      <input
                        type="checkbox"
                        checked={rare}
                        onChange={(e) => setRare(e.target.checked)}
                      />
                      <span>
                        {isAr
                          ? 'حدد هذا الخيار إذا كانت الفصيلة نادرة.'
                          : 'Mark if this is a rare or hard-to-find blood type.'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold md:text-xs">
                      {isAr ? 'التوفر' : 'Availability'}
                    </label>
                    <div className="flex flex-wrap gap-1 text-[11px] md:text-xs">
                      {(['available', 'maybe', 'unavailable'] as const).map(
                        (v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setAvailability(v)}
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold md:text-xs ${
                              availability === v
                                ? 'border-emerald-600 bg-emerald-500 text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          >
                            {isAr
                              ? v === 'available'
                                ? 'متوفر'
                                : v === 'maybe'
                                ? 'ربما'
                                : 'غير متوفر'
                              : v}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex items-center justify-between text-[11px] text-muted-foreground md:text-xs">
                    <p>
                      {isAr
                        ? 'يمكنك طلب حذف بياناتك لاحقاً عن طريق التواصل مع فريق خدمتـي.'
                        : 'Your details can be removed later by contacting the Khidmaty team.'}
                    </p>
                    <Button size="sm" type="submit" disabled={submitting}>
                      {submitting
                        ? isAr
                          ? 'جارٍ الإرسال...'
                          : 'Submitting...'
                        : isAr
                        ? 'تسجيل المتبرع'
                        : 'Register as donor'}
                    </Button>
                  </div>

                  {submitMessage && (
                    <div className="lg:col-span-2 text-[11px] text-muted-foreground md:text-xs">
                      {submitMessage}
                    </div>
                  )}
                </form>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
