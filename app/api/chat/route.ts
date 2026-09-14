import { auth } from "@clerk/nextjs/server";
import { InterviewService } from "@/lib/services/interviewService";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const {
    userMessage,
    currentCode,
    language,
    sessionId,
    problemTitle,
    optimalTime,
    optimalSpace,
    difficultyLevel,
    previousMessages,
  } = await req.json();

  try {
    const stream = await InterviewService.handleChatMessage(
      userId,
      sessionId,
      problemTitle,
      difficultyLevel,
      optimalTime,
      optimalSpace,
      language,
      currentCode,
      userMessage,
      previousMessages
    );

    return new Response(stream);
  } catch (error: any) {
    console.error("Streaming Error RAW:", error);
    if (error.message && error.message.includes("fetch failed")) {
      return new Response(
        "**[SYSTEM ERROR]** The database was asleep and took too long to wake up. I am awake now, please click 'Send' again to retry!",
        { status: 500 }
      );
    }
    return new Response(`CRITICAL ERROR: ${error.message}`, { status: 500 });
  }
}
