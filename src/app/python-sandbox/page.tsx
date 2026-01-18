'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, ExternalLink, Loader2, Play, RotateCcw } from 'lucide-react';

import { getClientLocale } from '@/lib/i18n';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type PythonExample = {
  id: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  code: string;
};

const PYTHON_EXAMPLES: PythonExample[] = [
  {
    id: 'hello',
    titleEn: 'Hello World',
    titleAr: 'مرحبا بالعالم',
    descEn: 'Your first print.',
    descAr: 'أول أمر طباعة لك.',
    code: `print("Hello, world!")\n`,
  },
  {
    id: 'variables',
    titleEn: 'Variables & Types',
    titleAr: 'المتغيرات والأنواع',
    descEn: 'Numbers, strings, and f-strings.',
    descAr: 'أرقام ونصوص و f-strings.',
    code: `name = "Aisha"\nage = 21\ncity = "Tripoli"\n\nprint(f"{name} ({age}) - {city}")\nprint(type(age), type(name))\n`,
  },
  {
    id: 'cities',
    titleEn: 'Loop: Libya Cities',
    titleAr: 'حلقة: مدن ليبيا',
    descEn: 'A simple list + loop.',
    descAr: 'قائمة بسيطة + حلقة.',
    code: `cities = ["Tripoli", "Benghazi", "Misrata", "Sabha"]\n\nfor i, c in enumerate(cities, start=1):\n    print(i, c)\n`,
  },
  {
    id: 'dict_json',
    titleEn: 'Dict + JSON Pretty Print',
    titleAr: 'قاموس + طباعة JSON بشكل منسق',
    descEn: 'Build a dict and print as JSON.',
    descAr: 'أنشئ قاموساً واطبعه كـ JSON.',
    code: `import json\n\nservice = {\n    "title": "Home Plumbing",\n    "city": "Tripoli",\n    "priceLYD": 120,\n    "tags": ["urgent", "trusted"],\n}\n\nprint(json.dumps(service, ensure_ascii=False, indent=2))\n`,
  },
  {
    id: 'functions',
    titleEn: 'Functions',
    titleAr: 'الدوال',
    descEn: 'Write a small helper.',
    descAr: 'اكتب دالة مساعدة صغيرة.',
    code: `def format_price(amount_lyd: float) -> str:\n    return f\"{amount_lyd:.0f} LYD\"\n\nprint(format_price(95))\nprint(format_price(120.5))\n`,
  },
  {
    id: 'errors',
    titleEn: 'Try/Except',
    titleAr: 'حاول/استثناء',
    descEn: 'Handle invalid input safely.',
    descAr: 'تعامل مع الإدخال غير الصحيح بأمان.',
    code: `raw = "not-a-number"\n\ntry:\n    n = int(raw)\n    print("Number:", n)\nexcept ValueError as e:\n    print("Invalid number:", raw)\n    print("Error:", e)\n`,
  },
  {
    id: 'class',
    titleEn: 'Class (OOP)',
    titleAr: 'صنف (OOP)',
    descEn: 'A tiny class with a method.',
    descAr: 'صنف صغير مع دالة.',
    code: `class Donor:\n    def __init__(self, name: str, blood_type: str):\n        self.name = name\n        self.blood_type = blood_type\n\n    def badge(self) -> str:\n        return f\"{self.name} [{self.blood_type}]\"\n\npeople = [Donor(\"Omar\", \"O+\"), Donor(\"Mariam\", \"A-\")]\nfor p in people:\n    print(p.badge())\n`,
  },
];

const DEFAULT_PYTHON_REPL_URL =
  'https://lab-c70mcety8-fateh-adhnouss-projects.vercel.app/lab/index.html';

function getPythonReplUrl() {
  const raw = (process.env.NEXT_PUBLIC_PYTHON_REPL_URL || '').trim();
  const cleaned = raw.replace(/^['"]|['"]$/g, '');
  if (!cleaned) return DEFAULT_PYTHON_REPL_URL;

  try {
    const url = new URL(cleaned);
    if (url.protocol === 'https:' || url.protocol === 'http:') return cleaned;
  } catch {
    // ignore
  }

  return DEFAULT_PYTHON_REPL_URL;
}

function getUrlHostLabel(src: string) {
  try {
    const url = new URL(src);
    return url.host;
  } catch {
    return src;
  }
}

export default function PythonSandboxPage() {
  const locale = getClientLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const { toast } = useToast();
  const replSrc = getPythonReplUrl();

  const copy = useMemo(() => {
    return {
      title: isAr ? 'مختبر بايثون' : 'Python Lab',
      subtitle: isAr
        ? 'تدرب على بايثون داخل متصفحك باستخدام مختبر آمن.'
        : 'Practice Python in your browser in a safe sandbox.',
      currentUrl: isAr ? 'الرابط الحالي:' : 'Current URL:',
      openInNewTab: isAr ? 'فتح في تبويب جديد' : 'Open in new tab',
      back: isAr ? 'رجوع' : 'Back',
      tipTitle: isAr ? 'ملاحظة' : 'Tip',
      tipBody: isAr
        ? 'لتغيير المختبر المضمن، ضع الرابط في .env.local ضمن المتغير'
        : 'To change the embedded lab, set this in .env.local:',
      readyTitle: isAr ? 'كود جاهز للتشغيل' : 'Ready-to-run code',
      readySubtitle: isAr
        ? 'اختر مثالاً أو عدّل الكود ثم انسخه إلى المختبر.'
        : 'Pick an example or edit the code, then copy it into the lab.',
      copyToLab: isAr ? 'نسخ إلى المختبر' : 'Copy to lab',
      reset: isAr ? 'إعادة ضبط' : 'Reset',
      steps: isAr
        ? 'الخطوات: اختر مثالاً → اضغط "نسخ إلى المختبر" → الصق في الخلية → Shift+Enter.'
        : 'Steps: choose an example → click "Copy to lab" → paste in a cell → Shift+Enter.',
      examplesTitle: isAr ? 'أمثلة' : 'Examples',
      examplesSubtitle: isAr
        ? 'اضغط لتعبئة الكود، أو اضغط "تشغيل" لنسخه مباشرة.'
        : 'Click to load into the editor, or hit “Run” to copy it.',
      run: isAr ? 'تشغيل' : 'Run',
      labTitle: isAr ? 'المختبر' : 'Lab',
      labSubtitle: isAr
        ? 'واجهة JupyterLite تعمل داخل iframe.'
        : 'JupyterLite running inside an iframe.',
      reload: isAr ? 'تحديث' : 'Reload',
      usingHost: isAr ? 'المضيف:' : 'Host:',
      loading: isAr ? 'جاري تحميل المختبر...' : 'Loading lab...',
      copiedTitle: isAr ? 'تم النسخ' : 'Copied',
      copiedDesc: isAr
        ? 'الصق في الخلية ثم اضغط Shift+Enter للتشغيل.'
        : 'Paste into a cell, then press Shift+Enter to run.',
      copyFailedTitle: isAr ? 'فشل النسخ' : 'Copy failed',
      copyFailedDesc: isAr
        ? 'انسخ يدوياً من صندوق الكود ثم الصق في المختبر.'
        : 'Copy manually from the code box, then paste into the lab.',
      currentExample: isAr ? 'المثال الحالي:' : 'Current example:',
    };
  }, [isAr]);

  const [selectedExampleId, setSelectedExampleId] = useState<string>(
    PYTHON_EXAMPLES[0]?.id || 'hello'
  );
  const [draftCode, setDraftCode] = useState<string>(
    PYTHON_EXAMPLES[0]?.code || 'print("Hello")\n'
  );
  const [pulseRepl, setPulseRepl] = useState(false);
  const replWrapRef = useRef<HTMLDivElement | null>(null);
  const [replKey, setReplKey] = useState(0);
  const [replLoaded, setReplLoaded] = useState(false);

  const selectedExample = useMemo(() => {
    return (
      PYTHON_EXAMPLES.find((e) => e.id === selectedExampleId) ||
      PYTHON_EXAMPLES[0]
    );
  }, [selectedExampleId]);

  useEffect(() => {
    setReplLoaded(false);
  }, [replKey, replSrc]);

  useEffect(() => {
    try {
      const savedExampleId = localStorage.getItem('pythonSandbox.exampleId');
      const savedCode = localStorage.getItem('pythonSandbox.code');
      const exists = savedExampleId
        ? PYTHON_EXAMPLES.some((e) => e.id === savedExampleId)
        : false;

      const nextExampleId = exists
        ? String(savedExampleId)
        : String(PYTHON_EXAMPLES[0]?.id || 'hello');
      setSelectedExampleId(nextExampleId);

      const fallbackCode =
        (PYTHON_EXAMPLES.find((e) => e.id === nextExampleId) ||
          PYTHON_EXAMPLES[0])?.code || 'print("Hello")\n';
      setDraftCode(savedCode ?? fallbackCode);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('pythonSandbox.exampleId', selectedExampleId);
    } catch {}
  }, [selectedExampleId]);

  useEffect(() => {
    try {
      localStorage.setItem('pythonSandbox.code', draftCode);
    } catch {}
  }, [draftCode]);

  const nudgeRepl = () => {
    try {
      replWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {}
    setPulseRepl(true);
    window.setTimeout(() => setPulseRepl(false), 900);
  };

  const copyCodeToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: copy.copiedTitle, description: copy.copiedDesc });
      nudgeRepl();
    } catch {
      toast({
        variant: 'destructive',
        title: copy.copyFailedTitle,
        description: copy.copyFailedDesc,
      });
      nudgeRepl();
    }
  };

  const resetDraft = () => {
    setDraftCode(selectedExample?.code || PYTHON_EXAMPLES[0]?.code || '');
  };

  const goBack = () => {
    try {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    }
  };

  return (
    <div className="ds-page">
      <div className="ds-container space-y-6">
        <div className="ds-hero">
          <div className="ds-hero-content">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ds-badge ds-badge-neutral border-ink/20 bg-snow/30 text-ink">
                    {isAr ? 'مزود' : 'Provider'}
                  </span>
                  <span className="ds-badge ds-badge-neutral border-ink/20 bg-snow/30 text-ink">
                    {isAr ? 'مختبر' : 'Sandbox'}
                  </span>
                </div>
                <h1 className="ds-title">{copy.title}</h1>
                <p className="ds-subtitle text-ink/80">{copy.subtitle}</p>

                <div className="mt-3 flex flex-col gap-1 text-sm text-ink/80">
                  <span className="font-semibold">{copy.currentUrl}</span>
                  <code className="max-w-full break-all rounded-md bg-snow/35 px-2 py-1 text-xs text-ink">
                    {replSrc}
                  </code>
                </div>
              </div>

              <div className="flex w-fit flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50"
                  asChild
                >
                  <a href={replSrc} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    {copy.openInNewTab}
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-ink/20 bg-snow/40 text-ink hover:bg-snow/50"
                  onClick={goBack}
                >
                  {copy.back}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Alert>
          <AlertTitle>{copy.tipTitle}</AlertTitle>
          <AlertDescription>
            {copy.tipBody}{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              NEXT_PUBLIC_PYTHON_REPL_URL
            </code>
            .
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
          <section className="ds-card">
            <div className="ds-card-section space-y-3">
              <div className="ds-toolbar">
                <div>
                  <h2 className="ds-section-title text-base">{copy.readyTitle}</h2>
                  <p className="ds-section-subtitle">{copy.readySubtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={resetDraft}>
                    {copy.reset}
                  </Button>
                  <Button type="button" onClick={() => void copyCodeToClipboard(draftCode)}>
                    <Copy />
                    {copy.copyToLab}
                  </Button>
                </div>
              </div>

              <Textarea
                value={draftCode}
                onChange={(e) => setDraftCode(e.target.value)}
                rows={10}
                className="font-mono text-xs leading-5"
                spellCheck={false}
              />

              <div className="text-xs text-muted-foreground">{copy.steps}</div>
            </div>
          </section>

          <section className="ds-card">
            <div className="ds-card-section space-y-3">
              <div>
                <h2 className="ds-section-title text-base">{copy.examplesTitle}</h2>
                <p className="ds-section-subtitle">{copy.examplesSubtitle}</p>
              </div>

              <ScrollArea className="h-[440px] pr-2">
                <div className="space-y-2">
                  {PYTHON_EXAMPLES.map((ex) => {
                    const active = ex.id === selectedExampleId;
                    return (
                      <div
                        key={ex.id}
                        className={`w-full rounded-xl border p-3 transition hover:bg-muted/30 ${
                          active ? 'border-primary/50 bg-muted/20' : 'bg-background'
                        } ${isAr ? 'text-right' : 'text-left'}`}
                        onClick={() => {
                          setSelectedExampleId(ex.id);
                          setDraftCode(ex.code);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedExampleId(ex.id);
                            setDraftCode(ex.code);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">
                              {isAr ? ex.titleAr : ex.titleEn}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {isAr ? ex.descAr : ex.descEn}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedExampleId(ex.id);
                              setDraftCode(ex.code);
                              void copyCodeToClipboard(ex.code);
                            }}
                          >
                            <Play />
                            {copy.run}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </section>
        </div>

        <section
          ref={replWrapRef}
          className={`ds-card overflow-hidden ${
            pulseRepl ? 'ring-2 ring-power ring-offset-2 ring-offset-background' : ''
          }`}
        >
          <div className="ds-card-section border-b bg-muted/10">
            <div className="ds-toolbar">
              <div>
                <h2 className="ds-section-title text-base">{copy.labTitle}</h2>
                <p className="ds-section-subtitle">{copy.labSubtitle}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setReplKey((k) => k + 1)}>
                  <RotateCcw />
                  {copy.reload}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={replSrc} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    {copy.openInNewTab}
                  </a>
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="font-medium">{copy.usingHost}</span>
              <code className="break-all rounded-md bg-background/60 px-2 py-1 font-mono">
                {getUrlHostLabel(replSrc)}
              </code>
            </div>
          </div>

          <div className="relative bg-background">
            {!replLoaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {copy.loading}
                </div>
              </div>
            )}
            <iframe
              key={`${replKey}:${replSrc}`}
              title="Python Lab"
              src={replSrc}
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              className="h-[80vh] min-h-[75vh] w-full"
              onLoad={() => setReplLoaded(true)}
            />
          </div>
        </section>

        {selectedExample && (
          <p className="text-xs text-muted-foreground">
            {copy.currentExample}{' '}
            <span className="font-medium text-foreground">
              {isAr ? selectedExample.titleAr : selectedExample.titleEn}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
