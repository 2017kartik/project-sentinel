import { auth } from '@clerk/nextjs/server'; // <-- IMPORT CLERK AUTH
import { ProblemRepository } from '@/lib/repositories/problemRepository';
import { withRetry } from '@/lib/db';

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

    await withRetry(async () => {
      // 2. Save progress specifically mapped to this user's Clerk ID!
      await ProblemRepository.updateUserProgress(userId, problemSlug, finalResult);
    });

    console.log(`✅ SUCCESS! Saved ${finalResult} for user ${userId} on problem: ${problemSlug}.`);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("❌ Database Update Error:", error);
    return new Response(JSON.stringify({ error: "Failed to save final result." }), { status: 500 });
  }
}