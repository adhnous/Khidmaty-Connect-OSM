'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, Search, FileText } from 'lucide-react';
import { getClientLocale } from '@/lib/i18n';
import type { StudentResource } from '@/lib/student-bank';

type ResourceFilter = 'all' | 'books' | 'journals' | 'exams' | 'notes' | 'other';

function drivePreviewUrl(r: StudentResource): string | undefined {
  // Prefer explicit file id when we have it.
  if (r.driveFileId) {
    return `https://drive.google.com/file/d/${r.driveFileId}/preview`;
  }

  if (!r.driveLink) return undefined;

  // Try to convert a normal Drive view link into an embeddable preview link.
  try {
    const m = r.driveLink.match(/\/file\/d\/([^/]+)/);
    if (m && m[1]) {
      return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
  } catch {
    // ignore and fall through
  }

  // Fallback: use the raw link.
  return r.driveLink;
}

export default function StudentBankPage() {
  const locale = getClientLocale();
  const isAr = locale === 'ar';

  const [items, setItems] = useState<StudentResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>('all');

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState<StudentResource['type']>('exam');
  const [language, setLanguage] = useState<'ar' | 'en' | 'both'>('en');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewItem, setPreviewItem] = useState<StudentResource | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  function mapFilterToType(filter: ResourceFilter): StudentResource['type'] | null {
  switch (filter) {
    case 'books':
      return 'book';
    case 'journals':
      return 'report';
    case 'exams':
      return 'exam';
    case 'notes':
      return 'notes';
    case 'other':
      return 'other';
    default:
      return null;
  }
}

function titlePlaceholder(isAr: boolean, type: StudentResource['type']): string {
  if (isAr) {
    switch (type) {
      case 'book':
        return 'مثال: كتاب فيزياء 1 – مرجع هندسي';
      case 'report':
        return 'مثال: تقرير مختبر فيزياء 101';
      case 'notes':
        return 'مثال: مذكرات تفاضل 1 – ملخص المحاضرات';
      case 'assignment':
        return 'مثال: واجب رقم 3 في البرمجة 1';
      case 'exam':
        return 'مثال: امتحان نهائي تفاضل 1 – هندسة طرابلس';
      default:
        return 'مثال: مورد دراسي مفيد';
    }
  }
  switch (type) {
    case 'book':
      return 'e.g. Physics 1 book – engineering reference';
    case 'report':
      return 'e.g. Physics 101 lab report';
    case 'notes':
      return 'e.g. Calculus I revision notes';
    case 'assignment':
      return 'e.g. Assignment 3 – Programming I';
    case 'exam':
      return 'e.g. Final exam Calculus I – Tripoli Engineering';
    default:
      return 'e.g. Helpful study resource';
  }
}

function descriptionPlaceholder(isAr: boolean, type: StudentResource['type']): string {
  if (isAr) {
    switch (type) {
      case 'book':
        return 'مثال: كتاب شرح مبسط مع أمثلة وتمارين، مناسب لسنة أولى هندسة.';
      case 'report':
        return 'مثال: تقرير مخبري منظم يحتوي على المقدمة، المنهج، النتائج والمناقشة.';
      case 'notes':
        return 'مثال: مذكرات مراجعة مختصرة تغطي أهم الأفكار مع أمثلة سريعة.';
      case 'assignment':
        return 'مثال: واجب يحتوي على 5 أسئلة محلولة مع خطوات الحل.';
      case 'exam':
        return 'مثال: امتحان نهائي مع نموذج إجابة مختصر، يغطي الفصول 1-5.';
      default:
        return 'يمكنك وصف نوع هذا المورد وكيف يساعد الطلبة.';
    }
  }
  switch (type) {
    case 'book':
      return 'e.g. Clear explanations with examples and exercises, good for first-year engineering.';
    case 'report':
      return 'e.g. Well-structured lab report with intro, method, results and discussion.';
    case 'notes':
      return 'e.g. Short revision notes covering main ideas with quick examples.';
    case 'assignment':
      return 'e.g. Assignment with 5 solved questions and step-by-step solutions.';
    case 'exam':
      return 'e.g. Final exam with short answer key, covers chapters 1–5.';
    default:
      return 'Describe what this resource contains and how it helps students.';
  }
}


  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/student-bank/list');
        if (!res.ok) throw new Error('failed_to_load');
        const json = await res.json();
        if (!cancelled) {
          setItems(Array.isArray(json.items) ? json.items : []);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setError(
            isAr ? 'تعذر تحميل موارد الطلبة حالياً.' : 'Failed to load student resources.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAr]);

  // When a preview item is chosen, scroll the preview into view
  useEffect(() => {
    if (previewItem && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [previewItem]);

  const filteredItems = items.filter((r) => {
    if (resourceFilter === 'all') return true;
    if (resourceFilter === 'books') return r.type === 'book';
    if (resourceFilter === 'journals') return r.type === 'report';
    if (resourceFilter === 'exams') return r.type === 'exam' || r.type === 'assignment';
    if (resourceFilter === 'notes') return r.type === 'notes';
    // other
    return (
      r.type !== 'book' &&
      r.type !== 'report' &&
      r.type !== 'exam' &&
      r.type !== 'assignment' &&
      r.type !== 'notes'
    );
  });

  const previewUrl = previewItem ? drivePreviewUrl(previewItem) : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* HERO */}
        <section className="border-b bg-gradient-to-b from-amber-50 via-background to-background">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:py-12">
            <div
              className={`flex-1 space-y-4 ${
                isAr ? 'text-right md:pl-10' : 'text-left md:pr-10'
              }`}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm">
                <GraduationCap className="h-4 w-4" />
                <span>{isAr ? 'ركن موارد الطلبة' : 'Student Resource Bank'}</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                {isAr
                  ? 'امتحانات، كتب، مذكرات، ودعم أكاديمي في مكان واحد'
                  : 'Exams, books, notes and academic help in one place'}
              </h1>

              <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                {isAr
                  ? 'مساحة منظمة لطلاب ليبيا: امتحانات سابقة، واجبات، مذكرات، كتب مراجع، وأدلة للبحث والكتابة والسيرة الذاتية.'
                  : 'A simple, organised space for students in Libya: past exams, assignments, notes, reference books and guides for research, writing and CVs.'}
              </p>

              <div
                className={`flex flex-wrap gap-3 ${
                  isAr ? 'justify-end' : 'justify-start'
                }`}
              >
                <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600" asChild>
                  <Link href="#browse">
                    {isAr ? 'استعرض الموارد' : 'Browse resources'}
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/services">
                    {isAr ? 'العودة إلى الخدمات' : 'Back to services'}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Simple highlight card */}
            <div
              className={`flex flex-1 flex-col gap-3 rounded-2xl border border-amber-200/70 bg-card/90 p-4 text-xs text-muted-foreground shadow-sm md:text-sm ${
                isAr ? 'text-right' : 'text-left'
              }`}
            >
              <div className="flex items-center gap-2 text-amber-900">
                <FileText className="h-4 w-4" />
                <p className="font-semibold">
                  {isAr ? 'أنواع الموارد' : 'Resource types'}
                </p>
              </div>
              <p>
                {isAr
                  ? 'كتب ومراجع، مقالات وأبحاث، امتحانات وواجبات، مذكرات وملخصات، وموارد أخرى مفيدة.'
                  : 'Books and references, journals and articles, exams and assignments, notes and summaries, plus other helpful resources.'}
              </p>
            </div>
          </div>
        </section>

        {/* LIST SECTION */}
        <section id="browse" className="mx-auto max-w-5xl px-4 py-8 md:py-10">
          <div
            className={`mb-3 flex flex-col gap-2 ${
              isAr ? 'items-end text-right' : 'items-start text-left'
            }`}
          >
            <h2 className="text-lg font-bold md:text-xl">
              {isAr ? 'استعرض موارد الطلبة' : 'Browse student resources'}
            </h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              {isAr
                ? 'اختر نوع المورد أولاً، ثم استعرض ما هو متاح حالياً (تجريبي).'
                : 'Pick the type of resource first, then browse what is available (demo data for now).'}
            </p>
          </div>

          {/* Type filter – single, simple row */}
          <div
            className={`mb-4 flex flex-wrap gap-2 text-[11px] md:text-xs ${
              isAr ? 'justify-end' : 'justify-start'
            }`}
          >
            {[
              { id: 'all' as const, labelEn: 'All resources', labelAr: 'كل الموارد' },
              { id: 'books' as const, labelEn: 'Books', labelAr: 'الكتب' },
              {
                id: 'journals' as const,
                labelEn: 'Journals & articles',
                labelAr: 'مقالات وأبحاث',
              },
              {
                id: 'exams' as const,
                labelEn: 'Exams & assignments',
                labelAr: 'امتحانات وواجبات',
              },
              {
                id: 'notes' as const,
                labelEn: 'Notes & summaries',
                labelAr: 'مذكرات وملخصات',
              },
              { id: 'other' as const, labelEn: 'Other', labelAr: 'أخرى' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
onClick={() => {
  setResourceFilter(opt.id);
  const mapped = mapFilterToType(opt.id);
  if (mapped) setType(mapped);
}}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] md:text-xs transition-all ${
                  resourceFilter === opt.id
                    ? 'border-amber-500 bg-amber-500 text-white shadow-[0_6px_14px_rgba(245,158,11,0.4)] scale-[1.03]'
                    : 'border-muted-foreground/30 bg-background text-muted-foreground hover:border-amber-300 hover:bg-amber-50/60'
                }`}
              >
                {isAr ? opt.labelAr : opt.labelEn}
              </button>
            ))}
          </div>

          {/* Small hint */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground md:text-xs">
            <Search className="h-3.5 w-3.5" />
            <span>
              {isAr
                ? 'لاحقاً سيتم إضافة بحث متقدم حسب الجامعة، المادة، السنة، ونوع المورد.'
                : 'Later we will add advanced search by university, course, year and more.'}
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 md:text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border bg-muted/60"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-md border bg-muted/40 p-4 text-xs text-muted-foreground md:text-sm">
              {isAr
                ? 'لا توجد موارد مطابقة لهذا الاختيار حالياً.'
                : 'No resources match this selection yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 rounded-xl border bg-card p-3 text-xs shadow-sm md:flex-row md:items-center md:justify-between md:p-4 md:text-sm"
                >
                  <div className={isAr ? 'text-right' : 'text-left'}>
                    <h3 className="font-semibold text-foreground">{r.title}</h3>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 text-muted-foreground">
                        {r.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground md:text-xs">
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {r.type || 'other'}
                      </span>
                      {r.university && (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {r.university}
                        </span>
                      )}
                      {r.course && (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {r.course}
                        </span>
                      )}
                      {r.year && (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {r.year}
                        </span>
                      )}
                      {r.language && (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {r.language === 'ar'
                            ? 'AR'
                            : r.language === 'en'
                            ? 'EN'
                            : 'AR + EN'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`mt-2 flex items-center gap-2 md:mt-0 ${
                      isAr ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!r.driveLink}
                      onClick={() => {
                        if (r.driveLink) {
                          setPreviewItem(r);
                        }
                      }}
                    >
                      {isAr ? 'عرض / تحميل (قريباً)' : 'View / download (soon)'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* INLINE FILE PREVIEW */}
        {previewItem && previewUrl && (
          <section className="mx-auto mt-4 max-w-5xl px-4 pb-8" ref={previewRef}>
            <div className="rounded-xl border bg-card p-3 shadow-sm md:p-4">
              <div
                className={`mb-3 flex items-center justify-between ${
                  isAr ? 'flex-row-reverse text-right' : 'text-left'
                }`}
              >
                <h3 className="text-sm font-semibold md:text-base">
                  {previewItem.title}
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewItem(null)}
                >
                  {isAr ? 'إغلاق المعاينة' : 'Close preview'}
                </Button>
              </div>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted">
                <iframe
                  src={previewUrl}
                  className="h-full w-full"
                  loading="lazy"
                  // No allow-popups: blocks the Drive "open in new tab" icon.
                  sandbox="allow-same-origin allow-scripts"
                />
                {/* Hide Drive's own toolbar / pop-out icon on the right edge */}
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background/95 to-transparent" />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground md:text-xs">
                {isAr
                  ? 'يتم فتح الملف من Google Drive داخل هذا الإطار.'
                  : 'The file is shown using the Google Drive viewer inside the app.'}
              </p>
            </div>
          </section>
        )}

        {/* CONTRIBUTE FORM (DEMO ONLY) */}
        <section className="mx-auto max-w-5xl px-4 pb-12">
          <div
            className={`mb-4 flex flex-col gap-2 ${
              isAr ? 'items-end text-right' : 'items-start text-left'
            }`}
          >
            <h2 className="text-lg font-bold md:text-xl">
              {isAr ? 'ساهم بمورد للطلبة (تجريبي)' : 'Contribute a student resource (demo)'}
            </h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              {isAr
                ? 'هذا النموذج للتصميم والتجربة فقط حالياً. في الإصدار القادم سيتم ربطه بحسابك ورفع الملفات إلى السحابة.'
                : 'This form is for design/demo only right now. In the next version, uploads will be stored and linked to your account.'}
            </p>
          </div>

          <form
            className={`space-y-3 rounded-2xl border bg-card p-4 text-xs md:text-sm ${
              isAr ? 'text-right' : 'text-left'
            }`}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!title.trim()) {
                setSubmitMessage(
                  isAr
                    ? 'الرجاء كتابة عنوان للمورد.'
                    : 'Please enter a title for your resource.',
                );
                return;
              }
              try {
                setSubmitting(true);
                setSubmitMessage(null);
                const formData = new FormData();
                formData.append('title', title.trim());
                if (description.trim()) formData.append('description', description.trim());
                if (university.trim()) formData.append('university', university.trim());
                if (course.trim()) formData.append('course', course.trim());
                if (year.trim()) formData.append('year', year.trim());
                formData.append('type', type);
                formData.append('language', language);
                const file = fileInputRef.current?.files?.[0];
                if (file) {
                  formData.append('file', file);
                }
                const res = await fetch('/api/student-bank/upload', {
                  method: 'POST',
                  body: formData,
                });
                if (!res.ok) {
                  throw new Error('upload_failed');
                }
                setTitle('');
                setDescription('');
                setUniversity('');
                setCourse('');
                setYear('');
                setType('exam');
                setLanguage('en');
                setSubmitMessage(
                  isAr
                    ? 'تم استلام النموذج (تجريبي فقط). لاحقاً سيتم حفظه فعلياً بعد إضافة قاعدة البيانات.'
                    : 'Demo submission received. Later this will be fully saved and moderated once storage is enabled.',
                );
              } catch {
                setSubmitMessage(
                  isAr
                    ? 'تعذر إرسال النموذج حالياً.'
                    : 'Could not submit your demo resource right now.',
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold md:text-xs">
                  {isAr ? 'عنوان المورد' : 'Resource title'}
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                 placeholder={titlePlaceholder(isAr, type)}

                  className="h-8 md:h-9 text-xs md:text-sm"
                  dir={isAr ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold md:text-xs">
                  {isAr ? 'الجامعة / الكلية' : 'University / faculty'}
                </label>
                <Input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                placeholder={titlePlaceholder(isAr, type)}

                  className="h-8 md:h-9 text-xs md:text-sm"
                  dir={isAr ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold md:text-xs">
                  {isAr ? 'المادة / المقرر' : 'Course / subject'}
                </label>
                <Input
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                 placeholder={titlePlaceholder(isAr, type)}

                  className="h-8 md:h-9 text-xs md:text-sm"
                  dir={isAr ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold md:text-xs">
                  {isAr ? 'السنة / الفصل' : 'Year / term'}
                </label>
                <Input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder={titlePlaceholder(isAr, type)}

                  className="h-8 md:h-9 text-xs md:text-sm"
                  dir={isAr ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold md:text-xs">
                  {isAr ? 'نوع المورد' : 'Resource type'}
                </label>
                <div className="flex flex-wrap gap-1 text-[11px] md:text-xs">
                  {(
                    ['exam', 'assignment', 'notes', 'report', 'book', 'other'] as StudentResource['type'][]
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-full border px-2 py-0.5 ${
                        type === t
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {isAr
                        ? t === 'exam'
                          ? 'امتحان'
                          : t === 'assignment'
                          ? 'واجب'
                          : t === 'notes'
                          ? 'مذكرات'
                          : t === 'report'
                          ? 'تقرير / مقال'
                          : t === 'book'
                          ? 'كتاب / مرجع'
                          : 'أخرى'
                        : t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold md:text-xs">
                  {isAr ? 'لغة المحتوى' : 'Content language'}
                </label>
                <div className="flex flex-wrap gap-1 text-[11px] md:text-xs">
                  {(['ar', 'en', 'both'] as const).map((lng) => (
                    <button
                      key={lng}
                      type="button"
                      onClick={() => setLanguage(lng)}
                      className={`rounded-full border px-2 py-0.5 ${
                        language === lng
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'border-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {lng === 'ar'
                        ? 'AR'
                        : lng === 'en'
                        ? 'EN'
                        : isAr
                        ? 'AR + EN'
                        : 'AR + EN'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold md:text-xs">
                {isAr ? 'وصف مختصر (اختياري)' : 'Short description (optional)'}
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-xs md:text-sm"
                dir={isAr ? 'rtl' : 'ltr'}
                placeholder={titlePlaceholder(isAr, type)}

              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold md:text-xs">
                {isAr ? 'ملف (اختياري، سيتم حفظه في المجلد المناسب)' : 'File (optional, saved to the matching folder)'}
              </label>
              <Input
                ref={fileInputRef}
                type="file"
                className="h-8 md:h-9 cursor-pointer text-xs md:text-sm"
              />
            </div>

            <div
              className={`flex flex-col gap-2 text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between md:text-xs ${
                isAr ? 'text-right' : 'text-left'
              }`}
            >
              <p>
                {isAr
                  ? 'لن يتم رفع الملف فعلياً في هذا الإصدار. الهدف هو اختبار الفكرة وتصميم التجربة.'
                  : 'Files are not actually uploaded in this demo. The goal is to validate the idea and UX.'}
              </p>
              <div className={isAr ? 'md:flex-row-reverse flex gap-2' : 'flex gap-2'}>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting
                    ? isAr
                      ? 'جاري الإرسال...'
                      : 'Submitting...'
                    : isAr
                    ? 'إرسال كنموذج تجريبي'
                    : 'Submit as demo only'}
                </Button>
              </div>
            </div>

            {submitMessage && (
              <p className="text-[11px] text-muted-foreground md:text-xs">
                {submitMessage}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
