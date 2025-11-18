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
  subjectTags?: string[];
  // In future: Drive integration
  driveFileId?: string;
  driveLink?: string;
  uploaderId?: string;
  createdAt?: Date;
};

// Temporary mock data until Firestore + Drive are wired
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
    subjectTags: ['chemistry', 'organic', 'medicine', 'pharmacy', 'book'],
  },
];

export type StudentResourceListFilters = {
  query?: string;
  university?: string;
  type?: StudentResource['type'];
  language?: StudentResource['language'];
};

export async function listStudentResources(
  filters: StudentResourceListFilters = {},
): Promise<StudentResource[]> {
  const { query, university, type, language } = filters;
  let rows = [...MOCK_STUDENT_RESOURCES];

  if (university) {
    const needle = university.toLowerCase();
    rows = rows.filter((r) =>
      String(r.university || '').toLowerCase().includes(needle),
    );
  }

  if (type) {
    rows = rows.filter((r) => r.type === type);
  }

  if (language) {
    rows = rows.filter(
      (r) => r.language === language || r.language === 'both',
    );
  }

  const q = query?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) => {
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

  return rows;
}

