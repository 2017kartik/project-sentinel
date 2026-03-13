import { neon } from '@neondatabase/serverless';
import { auth } from '@clerk/nextjs/server'; // <-- IMPORT CLERK AUTH

export async function POST(req: Request) {
  console.log("🚀 /api/session/complete API WAS CALLED!"); 
  
  try {
    // 1. Authenticate the user securely
    const { userId } = await auth();
    
    if (!userId) {
      console.error("❌ Unauthorized request. No user ID found.");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Payload received:", body); 

    const { problemSlug, finalResult } = body;

    if (!problemSlug || !finalResult) {
       console.error("❌ Missing problemSlug or finalResult!");
       return new Response(JSON.stringify({ error: "Missing data" }), { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

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
      // 2. Save progress specifically mapped to this user's Clerk ID!
      await sql`
        INSERT INTO user_progress (user_id, slug, status) 
        VALUES (${userId}, ${problemSlug}, ${finalResult})
        ON CONFLICT (user_id, slug) DO UPDATE 
        SET status = EXCLUDED.status
      `;
    });

    console.log(`✅ SUCCESS! Saved ${finalResult} for user ${userId} on problem: ${problemSlug}.`);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("❌ Database Update Error:", error);
    return new Response(JSON.stringify({ error: "Failed to save final result." }), { status: 500 });
  }
}