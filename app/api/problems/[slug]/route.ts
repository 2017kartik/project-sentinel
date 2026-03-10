import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// 1. Update the signature so params is explicitly a Promise
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // 2. Await the params object to unwrap it!
    const { slug } = await params; 

    const sql = neon(process.env.DATABASE_URL!);
    
    // 3. Use the unwrapped slug in the SQL query
    const result = await sql`SELECT * FROM problems WHERE slug = ${slug}`;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Failed to fetch problem:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}