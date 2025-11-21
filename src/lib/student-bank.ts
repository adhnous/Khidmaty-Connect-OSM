import 'server-only';
import { getAdmin } from '@/lib/firebase-admin';

export type StudentResource = {
  id: string;
  title: string;
  description?: string;
  university?: string;
  faculty?: string;
  course?: string;
  year?: string;
  type: 'exam' | 'assignment' | 'notes' | 'report' | 'book' | 'other';
  language?: 'ar' | 'en' | 'both';
  status?: 'pending' | 'approved' | 'rejected';
  subjectTags?: string[];
  // In future: Drive integration
  driveFileId?: string;
  driveLink?: string;
  driveFolderId?: string;
  uploaderId?: string;
  createdAt?: Date | unknown;
};

// Temporary mock data until Firestore is populated
const MOCK_STUDENT_RESOURCES: StudentResource[] = [
  {
    id: 'mock-1',
    title: 'Past Exam – Calculus I (Tripoli University)',
    description:
      'Final exam with solutions for Calculus I, Faculty of Engineering, University of Tripoli.',
    university: 'University of Tripoli',
    faculty: 'Engineering',
    course: 'Calculus I',
    year: '2023',
    type: 'exam',
    language: 'en',
    status: 'approved',
    subjectTags: ['math', 'calculus', 'engineering'],
  },
  {
    id: 'mock-2',
    title: 'Sample Lab Report – Physics 101',
    description:
      'Well-structured lab report template with introduction, method, results and discussion sections.',
    university: 'University of Benghazi',
    faculty: 'Science',
    course: 'Physics 101',
    year: '2022',
    type: 'report',
    language: 'both',
    status: 'approved',
    subjectTags: ['physics', 'lab', 'report'],
  },
  {
    id: 'mock-3',
    title: 'Revision Notes – Microeconomics',
    description:
      'Summary notes for key microeconomics concepts, demand/supply, elasticity and market structures.',
    university: 'Misrata University',
    faculty: 'Economics',
    course: 'Microeconomics',
    year: '2021',
    type: 'notes',
    language: 'en',
    status: 'approved',
    subjectTags: ['economics', 'micro', 'notes'],
  },
  {
    id: 'mock-4',
    title: 'Introductory Physics for Engineers – Volume 1',
    description:
      'Core mechanics and waves topics for first-year engineering students, with worked examples and exam-style questions.',
    university: 'Generic',
    faculty: 'Engineering / Science',
    course: 'Introductory Physics',
    year: 'Any',
    type: 'book',
    language: 'en',
    status: 'approved',
    subjectTags: ['physics', 'mechanics', 'engineering', 'book'],
  },
  {
    id: 'mock-5',
    title: 'Organic Chemistry for Health Sciences',
    description:
      'Concise explanations, reaction summaries and MCQ practice tailored for pharmacy and medical students.',
    university: 'Generic',
    faculty: 'Medicine / Pharmacy',
    course: 'Organic Chemistry',
    year: 'Any',
    type: 'book',
    language: 'both',
    status: 'approved',
    subjectTags: ['chemistry', 'organic', 'medicine', 'pharmacy', 'book'],
  },
];

export type StudentResourceListFilters = {
  query?: string;
  university?: string;
  type?: StudentResource['type'];
  language?: StudentResource['language'];
};

export type CreateStudentResourceInput = Omit<
  StudentResource,
  'id' | 'createdAt'
>;

function applyFilters(
  rows: StudentResource[],
  filters: StudentResourceListFilters,
): StudentResource[] {
  const { query, university, type, language } = filters;
  let out = [...rows];

  if (university) {
    const needle = university.toLowerCase();
    out = out.filter((r) =>
      String(r.university || '').toLowerCase().includes(needle),
    );
  }

  if (type) {
    out = out.filter((r) => r.type === type);
  }

  if (language) {
    out = out.filter(
      (r) => r.language === language || r.language === 'both',
    );
  }

  const q = query?.trim().toLowerCase();
  if (q) {
    out = out.filter((r) => {
      const title = r.title.toLowerCase();
      const desc = String(r.description || '').toLowerCase();
      const course = String(r.course || '').toLowerCase();
      const faculty = String(r.faculty || '').toLowerCase();
      const tags = (r.subjectTags || []).join(' ').toLowerCase();
      return (
        title.includes(q) ||
        desc.includes(q) ||
        course.includes(q) ||
        faculty.includes(q) ||
        tags.includes(q)
      );
    });
  }

  return out;
}

export function folderIdForType(type: StudentResource['type']): string | undefined {
  switch (type) {
    case 'book':
      return process.env.GOOGLE_DRIVE_STUDENT_BOOKS_FOLDER_ID;
    case 'report':
      return process.env.GOOGLE_DRIVE_STUDENT_JOURNALS_FOLDER_ID;
    case 'exam':
    case 'assignment':
      return process.env.GOOGLE_DRIVE_STUDENT_EXAMS_FOLDER_ID;
    case 'notes':
      return process.env.GOOGLE_DRIVE_STUDENT_NOTES_FOLDER_ID;
    default:
      return process.env.GOOGLE_DRIVE_STUDENT_OTHER_FOLDER_ID;
  }
}

export async function listStudentResources(
  filters: StudentResourceListFilters = {},
): Promise<StudentResource[]> {
  try {
    const { db } = await getAdmin();
    const col = db.collection('student_resources');
    const snap = await col.orderBy('createdAt', 'desc').limit(80).get();
    let rows: StudentResource[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        title: String(data.title || ''),
        description: data.description,
        university: data.university,
        faculty: data.faculty,
        course: data.course,
        year: data.year,
        type: (data.type as StudentResource['type']) || 'other',
        language: data.language,
        status: (data.status as StudentResource['status']) || undefined,
        subjectTags: Array.isArray(data.subjectTags)
          ? (data.subjectTags as string[])
          : [],
      driveFileId: data.driveFileId,
      driveLink: data.driveLink,
        driveFolderId: data.driveFolderId,
        uploaderId: data.uploaderId,
        createdAt: data.createdAt,
      };
    });

    // Only include approved resources (or legacy ones without a status).
    rows = rows.filter((r) => !r.status || r.status === 'approved');

    if (!rows.length) {
      rows = MOCK_STUDENT_RESOURCES;
    }

    return applyFilters(rows, filters);
  } catch (err) {
    console.error('listStudentResources fallback to mock', err);
    return applyFilters(MOCK_STUDENT_RESOURCES, filters);
  }
}

export async function createStudentResource(
  input: CreateStudentResourceInput,
): Promise<string> {
  const { db, FieldValue } = await getAdmin();
  const col = db.collection('student_resources');

  const payload: any = {
    title: String(input.title || '').trim(),
    description: input.description ? String(input.description) : undefined,
    university: input.university ? String(input.university) : undefined,
    faculty: input.faculty ? String(input.faculty) : undefined,
    course: input.course ? String(input.course) : undefined,
    year: input.year ? String(input.year) : undefined,
    type: input.type || 'other',
    language: input.language || 'en',
    status: input.status || 'pending',
    subjectTags: Array.isArray(input.subjectTags)
      ? input.subjectTags
      : undefined,
  driveFileId: input.driveFileId || undefined,
  driveLink: input.driveLink || undefined,
    driveFolderId: folderIdForType(input.type || 'other'),
    uploaderId: input.uploaderId || undefined,
    createdAt:
      typeof FieldValue?.serverTimestamp === 'function'
        ? FieldValue.serverTimestamp()
        : new Date(),
  };

  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined && v !== null),
  );

  const ref = await col.add(clean);
  return ref.id;
}
