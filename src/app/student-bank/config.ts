import type { StudentResource } from '@/lib/student-bank';

export type ResourceKind = 'books' | 'journals' | 'exams' | 'notes' | 'other';

export function kindsToTypes(kind: ResourceKind): StudentResource['type'][] {
  switch (kind) {
    case 'books':
      return ['book'];
    case 'journals':
      return ['report'];
    case 'exams':
      return ['exam', 'assignment'];
    case 'notes':
      return ['notes'];
    case 'other':
      return ['other'];
  }
}

