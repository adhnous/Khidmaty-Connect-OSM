'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, ExternalLink, Play } from 'lucide-react';

import { getClientLocale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
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
    titleAr: 'مرحباً بالعالم',
    descEn: 'Your first print.',
    descAr: 'أول أمر طباعة.',
    code: `print("Hello, world!")\n`,
  },
  {
    id: 'variables',
    titleEn: 'Variables & Types',
    titleAr: 'المتغيرات والأنواع',
    descEn: 'Numbers, strings, and f-strings.',
    descAr: 'أرقام ونصوص ودمج النصوص.',
    code: `name = "Aisha"\nage = 21\ncity = "Tripoli"\n\nprint(f"{name} ({age}) - {city}")\nprint(type(age), type(name))\n`,
  },
  {
    id: 'cities',
    titleEn: 'Loop: Libya Cities',
    titleAr: 'حلقة: مدن ليبيا',
    descEn: 'A simple list + loop.',
    descAr: 'قائمة بسيطة مع حلقة.',
    code: `cities = ["Tripoli", "Benghazi", "Misrata", "Sabha"]\n\nfor i, c in enumerate(cities, start=1):\n    print(i, c)\n`,
  },
  {
    id: 'dict_json',
    titleEn: 'Dict + JSON Pretty Print',
    titleAr: 'قاموس + JSON بتنسيق جميل',
    descEn: 'Build a dict and print as JSON.',
    descAr: 'ابنِ قاموس واطبعه كـ JSON.',
    code: `import json\n\nservice = {\n    "title": "Home Plumbing",\n    "city": "Tripoli",\n    "priceLYD": 120,\n    "tags": ["urgent", "trusted"],\n}\n\nprint(json.dumps(service, ensure_ascii=False, indent=2))\n`,
  },
  {
    id: 'functions',
    titleEn: 'Functions',
    titleAr: 'الدوال',
    descEn: 'Write a small helper.',
    descAr: 'دالة بسيطة للمساعدة.',
    code: `def format_price(amount_lyd: float) -> str:\n    return f\"{amount_lyd:.0f} LYD\"\n\nprint(format_price(95))\nprint(format_price(120.5))\n`,
  },
  {
    id: 'errors',
    titleEn: 'Try/Except',
    titleAr: 'التعامل مع الأخطاء',
    descEn: 'Handle invalid input safely.',
    descAr: 'تعامل مع المدخلات الخاطئة.',
    code: `raw = "not-a-number"\n\ntry:\n    n = int(raw)\n    print("Number:", n)\nexcept ValueError as e:\n    print("Invalid number:", raw)\n    print("Error:", e)\n`,
  },
  {
    id: 'class',
    titleEn: 'Class (OOP)',
    titleAr: 'كلاس (برمجة كائنية)',
    descEn: 'A tiny class with a method.',
    descAr: 'كلاس صغير مع دالة.',
    code: `class Donor:\n    def __init__(self, name: str, blood_type: str):\n        self.name = name\n        self.blood_type = blood_type\n\n    def badge(self) -> str:\n        return f\"{self.name} [{self.blood_type}]\"\n\npeople = [Donor(\"Omar\", \"O+\"), Donor(\"Mariam\", \"A-\")]\nfor p in people:\n    print(p.badge())\n`,
  },
];

const DEFAULT_PYTHON_REPL_URL =
  'https://lab-c70mcety8-fateh-adhnouss-projects.vercel.app/lab/index.html';

function getPythonReplUrl() {
  const raw = (process.env.NEXT_PUBLIC_PYTHON_REPL_URL || '').trim();
  const cleaned = raw.replace(/^['"]|['"]$/g, '');
  return cleaned || DEFAULT_PYTHON_REPL_URL;
}

export default function PythonSandboxPage() {
  const locale = getClientLocale();
  const isAr = locale === 'ar';
  const router = useRouter();
  const { toast } = useToast();
  const replSrc = getPythonReplUrl();

  const [selectedExampleId, setSelectedExampleId] = useState<string>(
    PYTHON_EXAMPLES[0]?.id || 'hello'
  );
  const [draftCode, setDraftCode] = useState<string>(
    PYTHON_EXAMPLES[0]?.code || 'print("Hello")\n'
  );
  const [pulseRepl, setPulseRepl] = useState(false);
  const replWrapRef = useRef<HTMLDivElement | null>(null);

  const selectedExample = useMemo(() => {
    return (
      PYTHON_EXAMPLES.find((e) => e.id === selectedExampleId) ||
      PYTHON_EXAMPLES[0]
    );
  }, [selectedExampleId]);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: isAr ? 'تم النسخ' : 'Copied',
        description: isAr
          ? 'الصق داخل خانة الإدخال ثم اضغط Shift+Enter للتشغيل.'
          : 'Paste into the input cell, then press Shift+Enter to run.',
      });
      nudgeRepl();
    } catch {
      toast({
        variant: 'destructive',
        title: isAr ? 'تعذّر النسخ' : 'Copy failed',
        description: isAr
          ? 'انسخ يدويًا من مربع الكود ثم الصق داخل الـREPL.'
          : 'Copy manually from the code box and paste into the REPL.',
      });
      nudgeRepl();
    }
  };

  return (
    <div className="ds-container py-6 md:py-10">
      <div className="mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-copper/20 via-copperLight/10 to-power/15">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Python Sandbox
              </h1>
              <p className="mt-1 text-sm text-ink/80">
                Practice Python in your browser.
              </p>
            </div>
            <div className="flex w-fit flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-fit border-ink/20 bg-snow/40 text-ink hover:bg-snow/50"
                asChild
              >
                <a href={replSrc} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {isAr ? 'Open' : 'Open in new tab'}
                </a>
              </Button>
            <Button
              type="button"
              variant="outline"
              className="w-fit border-ink/20 bg-snow/40 text-ink hover:bg-snow/50"
              onClick={() => {
                try {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/');
                  }
                } catch {
                  router.push('/');
                }
              }}
            >
              {isAr ? 'رجوع' : 'Back'}
            </Button>
            </div>
          </div>

          <div className="mt-3 text-xs text-ink/70">
            <span className="font-medium">{isAr ? 'ملاحظة:' : 'Note:'}</span>{' '}
            {isAr
              ? 'قد تظهر رسائل في Console من الإطار الخارجي وهذا طبيعي.'
              : 'External iframe console messages are normal.'}{' '}
            <Link className="ds-link" href="/practice/postman">
              {isAr ? 'جرّب Mini Postman' : 'Try Mini Postman'}
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr,360px]">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold">
              {isAr ? 'كود جاهز للتشغيل' : 'Ready-to-run code'}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => copyToClipboard(draftCode)}
            >
              <Copy className="mr-2 h-4 w-4" />
              {isAr ? 'نسخ إلى الـREPL' : 'Copy to REPL'}
            </Button>
          </div>
          <Textarea
            value={draftCode}
            onChange={(e) => setDraftCode(e.target.value)}
            rows={10}
            className="mt-3 font-mono text-xs leading-5"
            spellCheck={false}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            {isAr
              ? 'الخطوات: اختر مثال → اضغط "نسخ إلى الـREPL" → الصق داخل الخانة → Shift+Enter.'
              : 'Steps: pick an example → click "Copy to REPL" → paste in the cell → Shift+Enter.'}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold">
            {isAr ? 'أمثلة جاهزة' : 'Examples'}
          </div>
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
                        void copyToClipboard(ex.code);
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {isAr ? 'تشغيل' : 'Run'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        ref={replWrapRef}
        className={`relative overflow-hidden rounded-[12px] border border-black/10 bg-background shadow-sm ${
          pulseRepl ? 'ring-2 ring-power ring-offset-2 ring-offset-background' : ''
        }`}
      >
        <div
          aria-hidden="true"
          className="absolute right-1 top-1 z-10 h-8 w-8 rounded-full bg-background"
        />
        <iframe
          title="JupyterLite Python REPL"
          src={replSrc}
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          className="h-[80vh] min-h-[75vh] w-full"
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Runs Python in your browser (JupyterLite). No installation required.
      </p>

      {selectedExample && (
        <p className="mt-2 text-xs text-muted-foreground">
          {isAr ? 'المثال الحالي:' : 'Current example:'}{' '}
          <span className="font-medium text-foreground">
            {isAr ? selectedExample.titleAr : selectedExample.titleEn}
          </span>
        </p>
      )}
    </div>
  );
}
