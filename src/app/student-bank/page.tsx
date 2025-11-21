'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  GraduationCap,
  Search,
  FileText,
  BookOpen,
  FlaskConical,
  Cpu,
  Briefcase,
  Stethoscope,
  Brain,
  Gavel,
} from 'lucide-react';
import { getClientLocale } from '@/lib/i18n';
import type { StudentResource } from '@/lib/student-bank';
import { kindsToTypes, type ResourceKind } from './config';

type TopicNode = { id: string; labelAr: string; labelEn: string };
type FieldNode = { id: string; labelAr: string; labelEn: string; topics: TopicNode[] };

const KIND_TABS: { id: ResourceKind; labelAr: string; labelEn: string }[] = [
  { id: 'books',    labelAr: 'كتب ومراجع',       labelEn: 'Books & references' },
  { id: 'journals', labelAr: '(دراسات سابقة)مقالات وبحوث',     labelEn: 'Articles & research' },
  { id: 'exams',    labelAr: 'امتحانات وواجبات', labelEn: 'Exams & assignments' },
  { id: 'notes',    labelAr: 'مذكرات ومختصرات',  labelEn: 'Notes & summaries' },
  { id: 'other',    labelAr: 'أخرى',             labelEn: 'Other' },
];

function renderKindIcon(kind: ResourceKind) {
  const iconClass = 'h-3.5 w-3.5';
  switch (kind) {
    case 'books':
      return <BookOpen className={iconClass} />;
    case 'journals':
      return <FileText className={iconClass} />;
    case 'exams':
      return <GraduationCap className={iconClass} />;
    case 'notes':
      return <FileText className={iconClass} />;
    case 'other':
    default:
      return <Search className={iconClass} />;
  }
}

function renderFieldIcon(fieldId: string) {
  const iconClass = 'h-4 w-4 text-amber-500';
  switch (fieldId) {
    // Science
    case 'science':
    case 'science-research':
    case 'science-exams':
    case 'science-notes':
      return <FlaskConical className={iconClass} />;
    // Engineering
    case 'engineering':
    case 'engineering-research':
    case 'engineering-exams':
    case 'engineering-notes':
      return <Cpu className={iconClass} />;
    // Business
    case 'business':
    case 'business-research':
    case 'business-exams':
    case 'business-notes':
      return <Briefcase className={iconClass} />;
    // Medicine
    case 'medicine':
    case 'medicine-exams':
    case 'medical-notes':
    case 'medical-research':
      return <Stethoscope className={iconClass} />;
    // Humanities
    case 'humanities':
    case 'humanities-exams':
    case 'humanities-notes':
    case 'humanities-research':
      return <Brain className={iconClass} />;
    // Law
    case 'law':
    case 'law-exams':
    case 'law-notes':
    case 'law-research':
      return <Gavel className={iconClass} />;
    default:
      return <BookOpen className={iconClass} />;
  }
}

// Tree built from your description (shortened a bit but same idea)
const TREE: Record<ResourceKind, FieldNode[]> = {
  books: [
    {
      id: 'science',
      labelAr: 'علوم',
      labelEn: 'Science',
      topics: [
        { id: 'physics',  labelAr: 'فيزياء',            labelEn: 'Physics' },
        { id: 'chemistry',labelAr: 'كيمياء',            labelEn: 'Chemistry' },
        { id: 'biology',  labelAr: 'أحياء',             labelEn: 'Biology' },
        { id: 'math',     labelAr: 'رياضيات',           labelEn: 'Mathematics' },
        { id: 'cs',       labelAr: 'علوم الحاسوب',      labelEn: 'Computer Science' },
        { id: 'env',      labelAr: 'علوم بيئية',        labelEn: 'Environmental Science' },
      ],
    },
    {
      id: 'engineering',
      labelAr: 'هندسة',
      labelEn: 'Engineering',
      topics: [
        { id: 'civil',      labelAr: 'هندسة مدنية',       labelEn: 'Civil Engineering' },
        { id: 'electrical', labelAr: 'هندسة كهربائية',    labelEn: 'Electrical Engineering' },
        { id: 'mechanical', labelAr: 'هندسة ميكانيكية',   labelEn: 'Mechanical Engineering' },
        { id: 'software',   labelAr: 'هندسة برمجيات',     labelEn: 'Software Engineering' },
        { id: 'architecture',labelAr: 'عمارة',            labelEn: 'Architecture' },
        { id: 'chemical',   labelAr: 'هندسة كيميائية',    labelEn: 'Chemical Engineering' },
      ],
    },
    {
      id: 'business',
      labelAr: 'إدارة وأعمال',
      labelEn: 'Business',
      topics: [
        { id: 'accounting', labelAr: 'محاسبة',            labelEn: 'Accounting' },
        { id: 'finance',    labelAr: 'تمويل',             labelEn: 'Finance' },
        { id: 'marketing',  labelAr: 'تسويق',             labelEn: 'Marketing' },
        { id: 'economics',  labelAr: 'اقتصاد',            labelEn: 'Economics' },
        { id: 'hr',         labelAr: 'إدارة موارد بشرية', labelEn: 'HR Management' },
      ],
    },
    {
      id: 'medicine',
      labelAr: 'طب وصحة',
      labelEn: 'Medicine',
      topics: [
        { id: 'medicine',      labelAr: 'طب',         labelEn: 'Medicine' },
        { id: 'nursing',       labelAr: 'تمريض',      labelEn: 'Nursing' },
        { id: 'pharmacy',      labelAr: 'صيدلة',      labelEn: 'Pharmacy' },
        { id: 'public-health', labelAr: 'صحة عامة',   labelEn: 'Public Health' },
        { id: 'dentistry',     labelAr: 'أسنان',      labelEn: 'Dentistry' },
      ],
    },
    {
      id: 'humanities',
      labelAr: 'علوم إنسانية',
      labelEn: 'Humanities',
      topics: [
        { id: 'history',           labelAr: 'تاريخ',        labelEn: 'History' },
        { id: 'philosophy',        labelAr: 'فلسفة',        labelEn: 'Philosophy' },
        { id: 'sociology',         labelAr: 'علم اجتماع',   labelEn: 'Sociology' },
        { id: 'psychology',        labelAr: 'علم نفس',      labelEn: 'Psychology' },
        { id: 'political-science', labelAr: 'علوم سياسية',  labelEn: 'Political Science' },
      ],
    },
    {
      id: 'law',
      labelAr: 'قانون',
      labelEn: 'Law',
      topics: [
        { id: 'civil-law',         labelAr: 'قانون مدني',      labelEn: 'Civil Law' },
        { id: 'criminal-law',      labelAr: 'قانون جنائي',     labelEn: 'Criminal Law' },
        { id: 'intl-law',          labelAr: 'قانون دولي',      labelEn: 'International Law' },
        { id: 'constitutional-law',labelAr: 'قانون دستوري',    labelEn: 'Constitutional Law' },
      ],
    },
  ],
  journals: [
    {
      id: 'science-research',
      labelAr: 'بحوث علمية',
      labelEn: 'Scientific Research',
      topics: [
        { id: 'physics',  labelAr: 'فيزياء',   labelEn: 'Physics' },
        { id: 'chemistry',labelAr: 'كيمياء',   labelEn: 'Chemistry' },
        { id: 'biology',  labelAr: 'أحياء',    labelEn: 'Biology' },
        { id: 'math',     labelAr: 'رياضيات',  labelEn: 'Math' },
      ],
    },
    {
      id: 'engineering-research',
      labelAr: 'بحوث هندسية',
      labelEn: 'Engineering Research',
      topics: [
        { id: 'electrical', labelAr: 'هندسة كهربائية',    labelEn: 'Electrical Engineering' },
        { id: 'mechanical', labelAr: 'هندسة ميكانيكية',   labelEn: 'Mechanical Engineering' },
        { id: 'civil',      labelAr: 'هندسة مدنية',       labelEn: 'Civil Engineering' },
        { id: 'software',   labelAr: 'هندسة برمجيات',     labelEn: 'Software Engineering' },
      ],
    },
    {
      id: 'medical-research',
      labelAr: 'بحوث طبية',
      labelEn: 'Medical Research',
      topics: [
        { id: 'anatomy',       labelAr: 'تشريح',            labelEn: 'Anatomy' },
        { id: 'nursing',       labelAr: 'دراسات تمريض',     labelEn: 'Nursing Studies' },
        { id: 'pharmacology',  labelAr: 'بحوث علم الأدوية',  labelEn: 'Pharmacology Research' },
        { id: 'public-health', labelAr: 'أوراق صحة عامة',    labelEn: 'Public Health Papers' },
      ],
    },
    {
      id: 'business-research',
      labelAr: 'بحوث إدارية',
      labelEn: 'Business Research',
      topics: [
        { id: 'accounting', labelAr: 'دراسات محاسبة',   labelEn: 'Accounting Studies' },
        { id: 'finance',    labelAr: 'أوراق تمويل',     labelEn: 'Finance Papers' },
        { id: 'marketing',  labelAr: 'تحليلات تسويق',   labelEn: 'Marketing Analysis' },
        { id: 'economics',  labelAr: 'تقارير اقتصاد',   labelEn: 'Economics Reports' },
      ],
    },
    {
      id: 'humanities-research',
      labelAr: 'بحوث علوم إنسانية',
      labelEn: 'Humanities Research',
      topics: [
        { id: 'history',    labelAr: 'أوراق تاريخ',   labelEn: 'History Papers' },
        { id: 'sociology',  labelAr: 'دراسات اجتماع', labelEn: 'Sociology Studies' },
        { id: 'psychology', labelAr: 'أوراق علم نفس', labelEn: 'Psychology Papers' },
        { id: 'philosophy', labelAr: 'مقالات فلسفية', labelEn: 'Philosophy Essays' },
      ],
    },
    {
      id: 'law-research',
      labelAr: 'بحوث قانونية',
      labelEn: 'Law Research',
      topics: [
        { id: 'case-studies',        labelAr: 'دراسات حالة',      labelEn: 'Case Studies' },
        { id: 'legal-analysis',      labelAr: 'تحليلات قانونية',  labelEn: 'Legal Analysis' },
        { id: 'legislation-reviews', labelAr: 'مراجعات تشريعات', labelEn: 'Legislation Reviews' },
      ],
    },
  ],
  exams: [
    {
      id: 'engineering-exams',
      labelAr: 'هندسة',
      labelEn: 'Engineering',
      topics: [
        { id: 'civil-exams',      labelAr: 'امتحانات مدنية',    labelEn: 'Civil Exams' },
        { id: 'software-exams',   labelAr: 'امتحانات برمجيات',  labelEn: 'Software Exams' },
        { id: 'electrical-exams', labelAr: 'امتحانات كهرباء',    labelEn: 'Electrical Exams' },
        { id: 'mechanical-exams', labelAr: 'امتحانات ميكانيكا',  labelEn: 'Mechanical Exams' },
      ],
    },
    {
      id: 'science-exams',
      labelAr: 'علوم',
      labelEn: 'Science',
      topics: [
        { id: 'biology-exams',    labelAr: 'امتحانات أحياء',        labelEn: 'Biology Exams' },
        { id: 'chemistry-exams',  labelAr: 'امتحانات كيمياء',       labelEn: 'Chemistry Exams' },
        { id: 'physics-exams',    labelAr: 'امتحانات فيزياء',       labelEn: 'Physics Exams' },
        { id: 'math-worksheets',  labelAr: 'أوراق عمل رياضيات',     labelEn: 'Math Worksheets' },
      ],
    },
    {
      id: 'business-exams',
      labelAr: 'إدارة وأعمال',
      labelEn: 'Business',
      topics: [
        { id: 'accounting-midterms',  labelAr: 'منتصفات محاسبة',   labelEn: 'Accounting Midterms' },
        { id: 'economics-finals',     labelAr: 'نهائيات اقتصاد',    labelEn: 'Economics Finals' },
        { id: 'marketing-quizzes',    labelAr: 'اختبارات تسويق',   labelEn: 'Marketing Quizzes' },
        { id: 'finance-assignments',  labelAr: 'واجبات تمويل',      labelEn: 'Finance Assignments' },
      ],
    },
    {
      id: 'medicine-exams',
      labelAr: 'طب وصحة',
      labelEn: 'Medicine',
      topics: [
        { id: 'anatomy-exams',        labelAr: 'امتحانات تشريح',       labelEn: 'Anatomy Exams' },
        { id: 'nursing-worksheets',   labelAr: 'أوراق تمريض',          labelEn: 'Nursing Worksheets' },
        { id: 'pharmacy-tests',       labelAr: 'اختبارات صيدلة',       labelEn: 'Pharmacy Practice Tests' },
        { id: 'public-health-assignments', labelAr: 'واجبات صحة عامة', labelEn: 'Public Health Assignments' },
      ],
    },
    {
      id: 'humanities-exams',
      labelAr: 'علوم إنسانية',
      labelEn: 'Humanities',
      topics: [
        { id: 'history-exams',    labelAr: 'امتحانات تاريخ',        labelEn: 'History Exams' },
        { id: 'sociology-exercises',labelAr: 'تمارين اجتماع',       labelEn: 'Sociology Exercises' },
        { id: 'psychology-tests', labelAr: 'اختبارات علم نفس',       labelEn: 'Psychology Tests' },
        { id: 'political-science-assignments',labelAr: 'واجبات علوم سياسية',labelEn: 'Political Science Assignments' },
      ],
    },
    {
      id: 'law-exams',
      labelAr: 'قانون',
      labelEn: 'Law',
      topics: [
        { id: 'law-midterms',     labelAr: 'منتصفات قانون',      labelEn: 'Law Midterms' },
        { id: 'case-study-exams', labelAr: 'امتحانات دراسات حالة', labelEn: 'Case Study Exams' },
        { id: 'legal-drafting',   labelAr: 'اختبارات صياغة قانونية',labelEn: 'Legal Drafting Assignments' },
      ],
    },
  ],
  notes: [
    {
      id: 'science-notes',
      labelAr: 'مذكرات علوم',
      labelEn: 'Science Notes',
      topics: [
        { id: 'physics-notes',    labelAr: 'مذكرات فيزياء',      labelEn: 'Physics Notes' },
        { id: 'biology-summaries',labelAr: 'مختصرات أحياء',      labelEn: 'Biology Summaries' },
        { id: 'chemistry-notes',  labelAr: 'مذكرات كيمياء',      labelEn: 'Chemistry Notes' },
        { id: 'math-summaries',   labelAr: 'مختصرات رياضيات',    labelEn: 'Math Summaries' },
      ],
    },
    {
      id: 'engineering-notes',
      labelAr: 'مذكرات هندسة',
      labelEn: 'Engineering Notes',
      topics: [
        { id: 'civil-notes',      labelAr: 'مذكرات مدنية',       labelEn: 'Civil Notes' },
        { id: 'software-notes',   labelAr: 'مذكرات برمجيات',     labelEn: 'Software Notes' },
        { id: 'electrical-notes', labelAr: 'مذكرات كهرباء',       labelEn: 'Electrical Notes' },
        { id: 'mechanical-notes', labelAr: 'مذكرات ميكانيكا',     labelEn: 'Mechanical Notes' },
      ],
    },
    {
      id: 'business-notes',
      labelAr: 'مذكرات إدارة وأعمال',
      labelEn: 'Business Notes',
      topics: [
        { id: 'accounting-summaries',labelAr: 'مختصرات محاسبة', labelEn: 'Accounting Summaries' },
        { id: 'finance-notes',       labelAr: 'مذكرات تمويل',   labelEn: 'Finance Notes' },
        { id: 'marketing-summaries', labelAr: 'مختصرات تسويق',   labelEn: 'Marketing Summaries' },
        { id: 'economics-notes',     labelAr: 'مذكرات اقتصاد',   labelEn: 'Economics Notes' },
      ],
    },
    {
      id: 'medical-notes',
      labelAr: 'مذكرات طب وصحة',
      labelEn: 'Medical Notes',
      topics: [
        { id: 'anatomy-notes',      labelAr: 'مذكرات تشريح',     labelEn: 'Anatomy Notes' },
        { id: 'nursing-notes',      labelAr: 'مذكرات تمريض',     labelEn: 'Nursing Notes' },
        { id: 'pharmacy-notes',     labelAr: 'مذكرات صيدلة',     labelEn: 'Pharmacy Notes' },
        { id: 'public-health-notes',labelAr: 'مذكرات صحة عامة',  labelEn: 'Public Health Notes' },
      ],
    },
    {
      id: 'humanities-notes',
      labelAr: 'مذكرات علوم إنسانية',
      labelEn: 'Humanities Notes',
      topics: [
        { id: 'history-summaries', labelAr: 'مختصرات تاريخ',    labelEn: 'History Summaries' },
        { id: 'sociology-notes',   labelAr: 'مذكرات اجتماع',    labelEn: 'Sociology Notes' },
        { id: 'psychology-notes',  labelAr: 'مذكرات علم نفس',   labelEn: 'Psychology Notes' },
        { id: 'philosophy-notes',  labelAr: 'مذكرات فلسفة',     labelEn: 'Philosophy Notes' },
      ],
    },
    {
      id: 'law-notes',
      labelAr: 'مذكرات قانون',
      labelEn: 'Law Notes',
      topics: [
        { id: 'case-summaries',    labelAr: 'ملخصات قضايا',    labelEn: 'Case Summaries' },
        { id: 'lecture-notes',     labelAr: 'مذكرات محاضرات',  labelEn: 'Lecture Notes' },
        { id: 'legal-theory-notes',labelAr: 'مذكرات نظرية قانونية',labelEn: 'Legal Theory Notes' },
      ],
    },
  ],
  other: [
    {
      id: 'templates',
      labelAr: 'قوالب جاهزة',
      labelEn: 'Templates',
      topics: [
        { id: 'resume-templates', labelAr: 'قوالب سيرة ذاتية', labelEn: 'Resume Templates' },
        { id: 'lab-templates',    labelAr: 'قوالب تقارير معمل',labelEn: 'Lab Templates' },
        { id: 'report-templates', labelAr: 'قوالب تقارير',     labelEn: 'Report Templates' },
      ],
    },
    {
      id: 'media',
      labelAr: 'مواد مرئية ومسموعة',
      labelEn: 'Media',
      topics: [
        { id: 'images',      labelAr: 'صور',              labelEn: 'Images' },
        { id: 'recordings',  labelAr: 'تسجيلات محاضرات', labelEn: 'Lecture Recordings' },
        { id: 'screenshots', labelAr: 'لقطات شاشة',       labelEn: 'Screenshots' },
      ],
    },
    {
      id: 'data-files',
      labelAr: 'ملفات بيانات',
      labelEn: 'Data Files',
      topics: [
        { id: 'csv',     labelAr: 'ملفات CSV',     labelEn: 'CSV Files' },
        { id: 'excel',   labelAr: 'جداول إكسل',    labelEn: 'Excel Sheets' },
        { id: 'samples', labelAr: 'عينات بيانات',  labelEn: 'Data Samples' },
      ],
    },
    {
      id: 'misc',
      labelAr: 'مواد متنوعة',
      labelEn: 'Miscellaneous',
      topics: [
        { id: 'forms',          labelAr: 'نماذج',         labelEn: 'Forms' },
        { id: 'presentations',  labelAr: 'عروض تقديمية',  labelEn: 'Presentations' },
        { id: 'extra-materials',labelAr: 'مواد إضافية',   labelEn: 'Extra Materials' },
      ],
    },
  ],
};

// kindsToTypes is defined in ./config

function drivePreviewUrl(r: StudentResource): string | undefined {
  if (r.driveFileId) {
    return `https://drive.google.com/file/d/${r.driveFileId}/preview`;
  }
  if (!r.driveLink) return undefined;
  try {
    const m = r.driveLink.match(/\/file\/d\/([^/]+)/);
    if (m && m[1]) return `https://drive.google.com/file/d/${m[1]}/preview`;
  } catch {
    // ignore
  }
  return r.driveLink;
}

export default function StudentBankPage() {
  const locale = getClientLocale();
  const isAr = locale === 'ar';

  const [items, setItems] = useState<StudentResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeKind, setActiveKind] = useState<ResourceKind>('books');
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [title, setTitle] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState<StudentResource['type']>('book'); // upload type (kept for compatibility)
  const [language, setLanguage] = useState<'ar' | 'en' | 'both'>('en');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewItem, setPreviewItem] = useState<StudentResource | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const fieldsRef = useRef<HTMLDivElement | null>(null);
  const topicsRef = useRef<HTMLDivElement | null>(null);

  const [highlightFields, setHighlightFields] = useState(false);
  const [highlightTopics, setHighlightTopics] = useState(false);

  // Load list from API
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
            isAr
              ? 'تعذر تحميل موارد الطلبة في الوقت الحالي.'
              : 'Failed to load student resources.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAr]);

  // Scroll preview into view
  useEffect(() => {
    if (previewItem && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [previewItem]);

	  const fields = TREE[activeKind];
	  const activeField = activeFieldId
	    ? fields.find((f) => f.id === activeFieldId) || null
	    : null;
  const activeTopic = activeField
    ? activeField.topics.find((t) => t.id === activeTopicId) || null
    : null;

	  const currentKindTab = KIND_TABS.find((t) => t.id === activeKind)!;
	  const allowedTypesForKind = kindsToTypes(activeKind);
	  const defaultUploadType = allowedTypesForKind[0] || 'other';

  const breadcrumbParts: string[] = [
    isAr ? 'الرئيسية' : 'Home',
    isAr ? currentKindTab.labelAr : currentKindTab.labelEn,
  ];
  if (activeField) {
    breadcrumbParts.push(isAr ? activeField.labelAr : activeField.labelEn);
  }
  if (activeTopic) {
    breadcrumbParts.push(isAr ? activeTopic.labelAr : activeTopic.labelEn);
  }

  // Filter items according to kind + tags (if any)
  const filteredItems = items.filter((r) => {
    const allowedTypes = kindsToTypes(activeKind);
    if (!allowedTypes.includes((r.type || 'other') as StudentResource['type'])) {
      return false;
    }

    const tags = r.subjectTags || [];

    if (activeTopicId && tags.length) {
      if (!tags.includes(activeTopicId)) return false;
    } else if (activeFieldId && tags.length) {
      if (!tags.includes(activeFieldId)) return false;
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const haystack = [
        r.title,
        r.description,
        r.university,
        r.course,
        r.year,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  const previewUrl = previewItem ? drivePreviewUrl(previewItem) : undefined;

	  function handleKindChange(kind: ResourceKind) {
	    setActiveKind(kind);
	    setActiveFieldId(null);
	    setActiveTopicId(null);

	    // Keep upload type in sync with selected kind
	    const [uploadType] = kindsToTypes(kind);
	    if (uploadType) {
	      setType(uploadType);
	    }

	    if (fieldsRef.current) {
	      fieldsRef.current.scrollIntoView({
	        behavior: 'smooth',
	        block: 'start',
	      });
	    }

	    setHighlightTopics(false);
	    setHighlightFields(true);
	    window.setTimeout(() => setHighlightFields(false), 900);
	  }

  function handleFieldClick(fieldId: string) {
    setActiveFieldId(fieldId);
    setActiveTopicId(null);

    if (topicsRef.current) {
      topicsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    setHighlightTopics(true);
    window.setTimeout(() => setHighlightTopics(false), 900);
  }

  function titlePlaceholder(currentType: StudentResource['type']): string {
    switch (currentType) {
      case 'book':
        return isAr ? 'مثال: فيزياء 1 لطلبة الهندسة' : 'e.g. Physics 1 book for engineering';
      case 'report':
        return isAr ? 'مثال: تقرير معمل فيزياء 101' : 'e.g. Physics 101 lab report';
      case 'notes':
        return isAr ? 'مثال: ملخصات تفاضل 1' : 'e.g. Calculus I revision notes';
      case 'assignment':
      case 'exam':
        return isAr ? 'مثال: اختبار نهائي تفاضل 1' : 'e.g. Final exam Calculus I';
      default:
        return isAr ? 'مثال: مورد دراسي مفيد' : 'e.g. Helpful study resource';
    }
  }

  function descriptionPlaceholder(currentType: StudentResource['type']): string {
    switch (currentType) {
      case 'book':
        return isAr
          ? 'صف بإيجاز محتوى الكتاب ولمَن يناسب من الطلاب.'
          : 'Briefly describe what the book covers and who it helps.';
      case 'report':
        return isAr
          ? 'مثلاً: تقرير معمل منظم مع مقدمة ومنهج ونتائج ومناقشة.'
          : 'Structured lab report with intro, method, results and discussion.';
      case 'notes':
        return isAr
          ? 'ملخصات سريعة لأهم الأفكار مع أمثلة قصيرة.'
          : 'Short revision notes covering the main ideas with quick examples.';
      case 'assignment':
      case 'exam':
        return isAr
          ? 'امتحان نهائي أو نصفي مع نموذج إجابة مختصر.'
          : 'Final or midterm exam with a short answer key.';
      default:
        return isAr
          ? 'اشرح ماذا يحتوي هذا المورد وكيف يساعد الطلبة.'
          : 'Describe what this resource contains and how it helps students.';
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* HERO */}
        <section className="border-b bg-gradient-to-b from-amber-50 via-background to-background">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
            <div
              className={`flex flex-col gap-4 ${
                isAr ? 'items-end text-right' : 'items-start text-left'
              }`}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm">
                <GraduationCap className="h-4 w-4" />
                <span>{isAr ? 'موارد الطلبة' : 'Student Resource Bank'}</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                {isAr
                  ? 'اختر المجال، ثم التخصص، ثم الموضوع'
                  : 'Choose the area, then the subject'}
              </h1>

              <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                {isAr
                  ? 'كل شيء هنا عبارة عن بطاقات فقط. اختر نوع المورد، ثم المجال، ثم الموضوع لتصل بسرعة إلى ما تحتاجه.'
                  : 'Everything here is organised into cards: pick the resource type, then the field, then the topic to quickly find what you need.'}
              </p>

              <div
                className={`flex flex-wrap gap-3 ${
                  isAr ? 'justify-end' : 'justify-start'
                }`}
              >
                <Button
                  size="sm"
                  className="bg-amber-500 text-white hover:bg-amber-600"
                  asChild
                >
                  <Link href="#browse">
                    {isAr ? 'ابدأ التصفح' : 'Start browsing'}
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/services">
                    {isAr ? 'العودة إلى الخدمات' : 'Back to services'}
                  </Link>
                </Button>
              </div>
            </div>

            <div
              className={`flex flex-col gap-3 rounded-2xl border border-amber-200/70 bg-card/90 p-4 text-xs text-muted-foreground shadow-sm md:text-sm ${
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
                  ? 'كتب ومراجع، مقالات وبحوث، امتحانات وواجبات، مذكرات ومختصرات، بالإضافة إلى قوالب وملفات ووسائط أخرى مفيدة للطلبة.'
                  : 'Books and references, articles and research, exams and assignments, notes and summaries, plus helpful templates, files and media.'}
              </p>
            </div>
          </div>
        </section>

        {/* LIST SECTION */}
        <section
          id="browse"
          className="mx-auto max-w-5xl border-t bg-gradient-to-r from-amber-50 via-amber-100/60 to-background px-4 py-8 md:py-10"
        >
          {/* Tabs */}
          <div
            className={`mb-4 flex flex-wrap gap-3 text-[11px] md:text-xs ${
              isAr ? 'justify-end' : 'justify-start'
            }`}
          >
            {KIND_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleKindChange(tab.id)}
                className={`inline-flex items-center rounded-full border px-4 py-1.5 transition-all ${
                  activeKind === tab.id
                    ? 'border-amber-600 bg-gradient-to-r from-amber-500 to-amber-700 text-[12px] md:text-sm font-semibold text-white shadow-[0_10px_26px_rgba(217,119,6,0.75)]'
                    : 'border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 text-[12px] md:text-sm font-medium text-amber-900 hover:from-amber-200 hover:to-amber-300'
                }`}
              >
                <span
                  className={`flex items-center gap-1 ${
                    isAr ? 'flex-row-reverse' : ''
                  }`}
                >
                  {renderKindIcon(tab.id)}
                  <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Breadcrumb */}
          <div
            className={`mb-4 text-[11px] text-muted-foreground md:text-xs ${
              isAr ? 'text-right' : 'text-left'
            }`}
          >
            {breadcrumbParts.join(' / ')}
          </div>

          {/* Field cards */}
          <div
            ref={fieldsRef}
            className={`mb-6 grid gap-4 text-[11px] md:grid-cols-2 md:text-xs ${
              highlightFields ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-background' : ''
            }`}
          >
            {fields.map((field) => {
              const selected = activeFieldId === field.id;
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => handleFieldClick(field.id)}
                  className={`group relative flex flex-col justify-between rounded-2xl border bg-card px-4 py-3 text-left shadow-[0_6px_0_rgba(248,250,252,1),0_18px_32px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-1 hover:shadow-[0_10px_0_rgba(248,250,252,1),0_26px_40px_rgba(15,23,42,0.18)] ${
                    isAr ? 'items-end text-right' : 'items-start text-left'
                  } ${
                    selected
                      ? 'border-amber-500 bg-gradient-to-br from-amber-100 via-amber-50 to-card'
                      : 'border-slate-300 bg-gradient-to-br from-slate-50 via-card/95 to-slate-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {renderFieldIcon(field.id)}
                      <p className="text-sm font-semibold md:text-base">
                        {isAr ? field.labelAr : field.labelEn}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">
                      {isAr
                        ? 'اختر الموضوع الفرعي داخل هذا المجال من القائمة أدناه.'
                        : 'Pick a more specific topic inside this field below.'}
                    </p>
                  </div>
                  <span className="mt-3 text-[11px] font-medium text-amber-700 group-hover:underline md:text-xs">
                    {selected
                      ? isAr
                        ? 'الموضوعات الفرعية معروضة أدناه...'
                        : 'Topics shown below...'
                      : isAr
                      ? 'اختر الموضوع الفرعي'
                      : 'Select a sub-topic'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Topics */}
          {activeField && (
            <div
              ref={topicsRef}
              className={`mb-6 rounded-2xl border border-slate-200 bg-gradient-to-l from-amber-50/40 via-card to-card p-3 text-[11px] shadow-sm backdrop-blur-sm md:p-4 md:text-xs ${
                highlightTopics ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-background' : ''
              }`}
            >
              <p
                className={`mb-3 text-xs font-semibold md:text-sm ${
                  isAr ? 'text-right text-slate-900' : 'text-left text-slate-900'
                }`}
              >
                {isAr
                  ? `الموضوعات داخل: ${activeField.labelAr}`
                  : `Topics inside: ${activeField.labelEn}`}
              </p>
              <div
                className={`flex flex-wrap gap-2 ${
                  isAr ? 'justify-end' : 'justify-start'
                }`}
              >
                {activeField.topics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      setActiveTopicId(topic.id);
                      if (resultsRef.current) {
                        resultsRef.current.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }
                    }}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold md:text-sm transition-all ${
                      activeTopicId === topic.id
                        ? 'border-amber-600 bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-[0_10px_24px_rgba(217,119,6,0.8)]'
                        : 'border-amber-200 bg-gradient-to-r from-amber-50/40 via-amber-50/10 to-amber-100/50 text-amber-900 shadow-[0_6px_16px_rgba(251,191,36,0.22)] hover:from-amber-100 hover:via-amber-100 hover:to-amber-200'
                    }`}
                  >
                    <span
                      className={`flex items-center ${
                        isAr ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span>{isAr ? topic.labelAr : topic.labelEn}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Small hint */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground md:text-xs">
            <Search className="h-3.5 w-3.5" />
            <span>
                <span>{isAr ? 'بحث' : 'Search'}</span>
            </span>
          </div>

          {/* Search bar (client-side filter) */}
          <div
            className={`mb-4 flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm md:text-xs ${
              isAr ? 'flex-row-reverse' : ''
            }`}
          >
            <Search className="h-3.5 w-3.5 text-amber-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              dir={isAr ? 'rtl' : 'ltr'}
              className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/70 md:text-sm"
              placeholder={
                isAr
                  ? 'ابحث بعنوان المورد، الجامعة، المقرر أو السنة...'
                  : 'Search by title, university, course or year...'
              }
            />
          </div>

          {/* Results */}
          <div ref={resultsRef}>
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
                  ? 'لا توجد موارد مطابقة لهذا الاختيار بعد.'
                  : 'No resources match this selection yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((r) => (
                  <div
                    key={r.id}
                    className="group flex flex-col gap-2 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-card/95 to-amber-100 p-3 text-xs shadow-[0_10px_28px_rgba(15,23,42,0.1)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(15,23,42,0.18)] md:flex-row md:items-center md:justify-between md:p-4 md:text-sm"
                  >
                    <div className={isAr ? 'text-right' : 'text-left'}>
                      <h3 className="font-semibold text-foreground">
                        {r.title}
                      </h3>
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
                        className={`rounded-full border text-xs font-semibold md:text-sm ${
                          r.driveLink || r.driveFileId
                            ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 hover:from-amber-200 hover:to-amber-300'
                            : 'border-slate-200 bg-muted/40 text-muted-foreground'
                        }`}
                        disabled={!r.driveLink && !r.driveFileId}
                        onClick={() => {
                          if (r.driveLink || r.driveFileId) {
                            setPreviewItem(r);
                          }
                        }}
                      >
                        {isAr ? 'عرض / تنزيل (قريبًا)' : 'View / download (soon)'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* INLINE FILE PREVIEW */}
        {previewItem && previewUrl && (
          <section
            className="mx-auto mt-4 max-w-5xl px-4 pb-8"
            ref={previewRef}
          >
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-card/95 to-amber-100 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.16)] md:p-4">
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
                        className="text-xs font-semibold md:text-sm"
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
                  sandbox="allow-same-origin allow-scripts"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background/95 to-transparent" />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground md:text-xs">
                {isAr
                  ? 'يتم عرض الملف باستخدام عارض Google Drive داخل التطبيق.'
                  : 'The file is shown using the Google Drive viewer inside the app.'}
              </p>
            </div>
          </section>
        )}

        {/* CONTRIBUTE FORM (upload kept as before) */}
        <section className="mx-auto max-w-5xl px-4 pb-12">
          <div
            className={`mb-4 flex flex-col gap-2 ${
              isAr ? 'items-end text-right' : 'items-start text-left'
            }`}
          >
            <h2 className="text-lg font-bold md:text-xl">
              {isAr
                ? 'أضف مورداً جديداً (تجريبي)'
                : 'Contribute a student resource (demo)'}
            </h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              {isAr
                ? 'هذا النموذج للتجربة حالياً. في الإصدارات القادمة سيتم حفظ الموارد وربطها بحسابك بشكل كامل.'
                : 'This form is for design/demo only right now. In the next version, uploads will be stored and linked to your account.'}
            </p>
          </div>

          <form
            className={`space-y-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-card/95 to-amber-100 p-4 text-xs shadow-[0_12px_34px_rgba(15,23,42,0.14)] md:text-sm ${
              isAr ? 'text-right' : 'text-left'
            }`}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!title.trim()) {
                setSubmitMessage(
                  isAr
                    ? 'يرجى إدخال عنوان للمورد.'
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

	                // Derive type from selected kind and, for exams, allow exam/assignment choice
	                const allowedForKind = kindsToTypes(activeKind);
	                let finalType = allowedForKind[0] || type;
	                if (allowedForKind.includes(type)) {
	                  finalType = type;
	                }
	                formData.append('type', finalType);
	                formData.append('language', language);

	                // Tag the resource with the current path for filtering
	                const tags: string[] = [];
	                tags.push(activeKind);
	                if (activeFieldId) tags.push(activeFieldId);
	                if (activeTopicId) tags.push(activeTopicId);
	                if (tags.length) {
	                  formData.append('subjectTags', tags.join(','));
	                }

                const file = fileInputRef.current?.files?.[0];
                if (file) {
                  formData.append('file', file);
                }

                const res = await fetch('/api/student-bank/upload', {
                  method: 'POST',
                  body: formData,
                });
                if (!res.ok) throw new Error('upload_failed');

                setTitle('');
                setDescription('');
                setUniversity('');
                setCourse('');
                setYear('');
                setType('exam');
                setLanguage('en');
                if (fileInputRef.current) fileInputRef.current.value = '';

                setSubmitMessage(
                  isAr
                    ? 'تم استلام الإرسال التجريبي. لاحقًا سيتم حفظه ومراجعته بالكامل.'
                    : 'Demo submission received. Later this will be fully saved and moderated once storage is enabled.',
                );
              } catch {
                setSubmitMessage(
                  isAr
                    ? 'تعذر إرسال المورد التجريبي الآن.'
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
                  placeholder={titlePlaceholder(type)}
                  className="h-8 text-xs md:h-9 md:text-sm"
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
                  className="h-8 text-xs md:h-9 md:text-sm"
                  dir={isAr ? 'rtl' : 'ltr'}
                  placeholder={
                    isAr
                      ? 'مثال: جامعة طرابلس – الهندسة'
                      : 'e.g. University of Tripoli – Engineering'
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold md:text-xs">
                  {isAr ? 'المقرر / المادة' : 'Course / subject'}
                </label>
                <Input
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="h-8 text-xs md:h-9 md:text-sm"
                  dir={isAr ? 'rtl' : 'ltr'}
                  placeholder={isAr ? 'مثال: تفاضل 1' : 'e.g. Calculus I'}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold md:text-xs">
                  {isAr ? 'السنة الدراسية' : 'Year'}
                </label>
                <Input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="h-8 text-xs md:h-9 md:text-sm"
                  dir={isAr ? 'rtl' : 'ltr'}
                  placeholder={isAr ? 'مثال: 2023' : 'e.g. 2023'}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold md:text-xs">
                  {isAr ? 'نوع المورد' : 'Resource type'}
                </label>
	                <div className="flex flex-wrap gap-1 text-[11px] md:text-xs">
	                  {(['exam', 'assignment', 'notes', 'report', 'book', 'other'] as StudentResource['type'][]).map(
	                    (t) => {
	                      const isAllowed = allowedTypesForKind.includes(t);
	                      const isSelected = type === t && isAllowed;
	                      return (
	                        <button
	                          key={t}
	                          type="button"
	                          disabled={!isAllowed}
	                          onClick={() => {
	                            if (!isAllowed) return;
	                            setType(t);
	                          }}
	                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold md:text-xs ${
	                            !isAllowed
	                              ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
	                              : isSelected
	                              ? 'border-amber-600 bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-[0_6px_18px_rgba(217,119,6,0.65)]'
	                              : 'border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 hover:from-amber-200 hover:to-amber-300'
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
                            ? 'تقرير / بحث'
                            : t === 'book'
                            ? 'كتاب / مرجع'
                            : 'أخرى'
	                          : t}
	                        </button>
	                      );
	                    },
	                  )}
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
		                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold md:text-xs ${
		                        language === lng
		                          ? 'border-amber-600 bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-[0_6px_18px_rgba(217,119,6,0.65)]'
	                          : 'border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-900 hover:from-amber-200 hover:to-amber-300'
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
                {isAr ? 'وصف قصير (اختياري)' : 'Short description (optional)'}
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-xs md:text-sm"
                dir={isAr ? 'rtl' : 'ltr'}
                placeholder={descriptionPlaceholder(type)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold md:text-xs">
                {isAr
                  ? 'الملف (اختياري، يتم حفظه في المجلد المناسب)'
                  : 'File (optional, saved to the matching folder)'}
              </label>
              <Input
                ref={fileInputRef}
                type="file"
                className="h-8 cursor-pointer text-xs md:h-9 md:text-sm"
              />
            </div>

            <div
              className={`flex flex-col gap-2 text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between md:text-xs ${
                isAr ? 'text-right' : 'text-left'
              }`}
            >
              <p>
                {isAr
                  ? 'في هذا الإصدار التجريبي قد لا يتم حفظ الملفات أو مشاركتها بشكل نهائي بعد. الهدف هو تجربة الفكرة وتجربة الواجهة.'
                  : 'In this demo version files may not yet be fully stored or shared. The goal is to validate the idea and the UX.'}
              </p>
              <div className={isAr ? 'flex flex-row-reverse gap-2' : 'flex gap-2'}>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting
                    ? isAr
                      ? 'جاري الإرسال...'
                      : 'Submitting...'
                    : isAr
                    ? 'إرسال كتجربة فقط'
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
