export type MockTodo = {
  id: string;
  title: string;
  cityEn: string;
  cityAr: string;
  done: boolean;
  createdAtIso: string;
  updatedAtIso: string;
};

export type CreateMockTodoInput = {
  title: string;
  cityEn: string;
  cityAr: string;
  done?: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var __khidmatyMockTodos: MockTodo[] | undefined;
}

const INITIAL_TODOS: MockTodo[] = [
  {
    id: 'todo_1',
    title: 'Fix AC in apartment (صيانة مكيف)',
    cityEn: 'Tripoli',
    cityAr: 'طرابلس',
    done: false,
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
  },
  {
    id: 'todo_2',
    title: 'Plumbing leak (سباكة)',
    cityEn: 'Misrata',
    cityAr: 'مصراتة',
    done: true,
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
  },
  {
    id: 'todo_3',
    title: 'Bus timetable question (مواعيد الحافلات)',
    cityEn: 'Benghazi',
    cityAr: 'بنغازي',
    done: false,
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
  },
];

function getStore(): MockTodo[] {
  if (!globalThis.__khidmatyMockTodos) {
    globalThis.__khidmatyMockTodos = INITIAL_TODOS.map((t) => ({ ...t }));
  }
  return globalThis.__khidmatyMockTodos;
}

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function toLower(s: string) {
  return String(s || '').toLowerCase();
}

export function listMockTodos(filters: {
  city?: string;
  q?: string;
  done?: boolean;
  take?: number;
}): { todos: MockTodo[]; total: number; take: number } {
  const store = getStore();
  const city = String(filters.city || '').trim();
  const q = String(filters.q || '').trim();
  const done = typeof filters.done === 'boolean' ? filters.done : undefined;
  const take = clampInt(Number(filters.take ?? 20), 1, 50);

  let rows = [...store];

  if (typeof done === 'boolean') rows = rows.filter((t) => t.done === done);
  if (city) {
    const needle = toLower(city);
    rows = rows.filter((t) => toLower(t.cityEn).includes(needle) || toLower(t.cityAr).includes(needle));
  }
  if (q) {
    const needle = toLower(q);
    rows = rows.filter((t) => toLower(t.title).includes(needle));
  }

  const total = rows.length;
  return { todos: rows.slice(0, take), total, take };
}

export function getMockTodoById(id: string): MockTodo | null {
  const store = getStore();
  const needle = String(id || '').trim();
  if (!needle) return null;
  return store.find((t) => t.id === needle) || null;
}

export function createMockTodo(input: CreateMockTodoInput): MockTodo {
  const store = getStore();
  const now = new Date().toISOString();
  const created: MockTodo = {
    id: `todo_${Math.random().toString(16).slice(2, 10)}`,
    title: input.title,
    cityEn: input.cityEn,
    cityAr: input.cityAr,
    done: Boolean(input.done),
    createdAtIso: now,
    updatedAtIso: now,
  };
  store.unshift(created);
  return created;
}

export function replaceMockTodo(
  id: string,
  next: { title: string; cityEn: string; cityAr: string; done: boolean }
): MockTodo | null {
  const store = getStore();
  const idx = store.findIndex((t) => t.id === id);
  if (idx < 0) return null;

  const updated: MockTodo = {
    id,
    title: next.title,
    cityEn: next.cityEn,
    cityAr: next.cityAr,
    done: next.done,
    createdAtIso: store[idx]!.createdAtIso,
    updatedAtIso: new Date().toISOString(),
  };
  store[idx] = updated;
  return updated;
}

export function patchMockTodo(
  id: string,
  patch: Partial<Pick<MockTodo, 'title' | 'cityEn' | 'cityAr' | 'done'>>
): MockTodo | null {
  const store = getStore();
  const idx = store.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const prev = store[idx]!;
  const updated: MockTodo = {
    ...prev,
    title: typeof patch.title === 'string' ? patch.title : prev.title,
    cityEn: typeof patch.cityEn === 'string' ? patch.cityEn : prev.cityEn,
    cityAr: typeof patch.cityAr === 'string' ? patch.cityAr : prev.cityAr,
    done: typeof patch.done === 'boolean' ? patch.done : prev.done,
    updatedAtIso: new Date().toISOString(),
  };
  store[idx] = updated;
  return updated;
}

export function deleteMockTodo(id: string): boolean {
  const store = getStore();
  const idx = store.findIndex((t) => t.id === id);
  if (idx < 0) return false;
  store.splice(idx, 1);
  return true;
}
