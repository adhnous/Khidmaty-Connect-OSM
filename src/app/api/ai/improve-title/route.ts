import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, description, category } = await req.json();
    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    // Use a lightweight heuristic-only implementation so we don't depend
    // on Genkit / @genkit-ai/firebase at build time.
    const improved = heuristicsImprove(title, description, category);
    return NextResponse.json({ improvedTitle: improved });
  } catch (err: any) {
    // Fallback as last resort
    try {
      const { title, description, category } = await req.json();
      const improved = heuristicsImprove(title ?? '', description ?? '', category ?? '');
      return NextResponse.json({ improvedTitle: improved });
    } catch {
      return NextResponse.json({ improvedTitle: 'Improved Service Title' });
    }
  }
}

function heuristicsImprove(title: string, description: string, category: string) {
  const t = (title || '').trim();
  const c = (category || '').trim();
  if (t.toLowerCase().includes(c.toLowerCase())) return capitalize(t);
  const joined = `${capitalize(t)} — ${c}`.trim();
  return joined || 'Professional Service';
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
