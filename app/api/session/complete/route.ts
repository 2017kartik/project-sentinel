import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  try {
    const { problemSlug, finalResult } = await req.json();
    const sql = neon(process.env.DATABASE_URL!);

    // --- NEW: Database Retry Logic ---
    const withRetry = async (dbCall: () => Promise<any>, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try { return await dbCall(); } 
        catch (err: any) {
          if (i === retries - 1) throw err;
          console.log(`Database asleep. Retrying completion save...`);
          await new Promise((res) => setTimeout(res, 1500));
        }
      }
    };

    await withRetry(async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS user_progress (
          slug VARCHAR(255) PRIMARY KEY,
          status VARCHAR(50)
        )
      `;
      
      await sql`
        INSERT INTO user_progress (slug, status) 
        VALUES (${problemSlug}, ${finalResult})
        ON CONFLICT (slug) DO UPDATE 
        SET status = EXCLUDED.status
      `;
    });

    console.log(`✅ Database Updated: ${problemSlug} marked as ${finalResult}`);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("Database Update Error:", error);
    return new Response(JSON.stringify({ error: "Failed to save final result." }), { status: 500 });
  }
}