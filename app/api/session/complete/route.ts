import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  try {
    // We are now expecting problemSlug (e.g., "3sum"), not sessionId!
    const { problemSlug, finalResult } = await req.json();
    const sql = neon(process.env.DATABASE_URL!);

    // 1. Automatically create the progress table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS user_progress (
        slug VARCHAR(255) PRIMARY KEY,
        status VARCHAR(50)
      )
    `;

    // 2. Insert or Update the user's result for this specific problem
    await sql`
      INSERT INTO user_progress (slug, status) 
      VALUES (${problemSlug}, ${finalResult})
      ON CONFLICT (slug) DO UPDATE 
      SET status = EXCLUDED.status
    `;

    console.log(`✅ Database Updated: ${problemSlug} marked as ${finalResult}`);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("Database Update Error:", error);
    return new Response(JSON.stringify({ error: "Failed to save final result." }), { status: 500 });
  }
}