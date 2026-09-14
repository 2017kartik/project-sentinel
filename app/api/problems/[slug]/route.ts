import { NextResponse } from 'next/server';
import { ProblemRepository } from '@/lib/repositories/problemRepository';

// 1. Update the signature so params is explicitly a Promise
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // 2. Await the params object to unwrap it!
    const { slug } = await params; 

    // 3. Use the unwrapped slug in the SQL query via repository
    const result = await ProblemRepository.getProblemBySlug(slug);

    if (!result) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch problem:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}