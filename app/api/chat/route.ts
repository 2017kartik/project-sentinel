import { GoogleGenAI } from "@google/genai";
import { neon } from "@neondatabase/serverless";
import { auth } from "@clerk/nextjs/server"; // <-- NEW

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  // --- NEW: Authenticate the user ---
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

  const sql = neon(process.env.DATABASE_URL!);

  const withRetry = async (dbCall: () => Promise<any>, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await dbCall();
      } catch (err: any) {
        if (i === retries - 1) throw err;
        await new Promise((res) => setTimeout(res, 1500));
      }
    }
  };

  try {
    let personaName = "The Bar-Raiser";
    let personaInstruction =
      "You are an elite, relentless Senior Software Engineer conducting a mock technical interview. Your persona is 'The Bar-Raiser'. You are highly critical and focus intensely on Big-O time and space complexity. Expect production-ready code. Do NOT give away the exact answer. Ask probing questions, point out missing edge cases, and challenge logic.";

    if (difficultyLevel === 1) {
      personaName = "The Guide";
      personaInstruction =
        "You are a friendly, encouraging Senior Engineer acting as 'The Guide'. Your goal is to help the candidate learn. Give gentle hints if they are stuck, praise good ideas, and collaboratively guide them toward the optimal time and space complexity. Do not just give them the answer, but lead them there with helpful clues.";
    } else if (difficultyLevel === 2) {
      personaName = "The Standard Interviewer";
      personaInstruction =
        "You are a professional, neutral Software Engineer conducting a standard technical interview. Evaluate their code objectively. Ask clarifying questions, point out bugs, and request time/space complexity analysis. Maintain a polite but formal tone. Let them struggle a bit, but offer a hint if they are completely stuck for too long.";
    }

    await withRetry(async () => {
      await sql`
        INSERT INTO sessions (id, user_id, problem_title, difficulty_mode, status) 
        VALUES (${sessionId}, ${userId}, ${problemTitle}, ${personaName}, 'In Progress')
        ON CONFLICT (id) DO NOTHING
      `;
    });

    await withRetry(async () => {
      await sql`
        INSERT INTO messages (session_id, role, content) 
        VALUES (${sessionId}, 'user', ${userMessage})
      `;
    });

    const formattedHistory = (previousMessages || [])
      .filter((msg: any) => msg.content.trim() !== "")
      .map((msg: any) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const latestPrompt = `
[CURRENT INTERVIEW STATE]
Problem: "${problemTitle}"
Target Time Complexity: ${optimalTime}
Target Space Complexity: ${optimalSpace}

[CANDIDATE'S CURRENT CODE (${language})]
\`\`\`${language}
${currentCode}
\`\`\`

[CANDIDATE'S LATEST MESSAGE]
"${userMessage}"

Respond to the candidate's latest message in character as '${personaName}'. 
Do NOT repeat questions you have already asked in the chat history.
    `;

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: latestPrompt }] },
      ],
      config: {
        systemInstruction: `${personaInstruction}\n\nFORMATTING RULES:\n- Always use Markdown.\n- Use bullet points when listing multiple issues.\n- Add double line breaks between paragraphs for readability.\n- Use inline code formatting backticks for variable names.`,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        let fullAiResponse = "";
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              fullAiResponse += chunk.text;
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
          await withRetry(async () => {
            await sql`
              INSERT INTO messages (session_id, role, content) 
              VALUES (${sessionId}, 'ai', ${fullAiResponse})
            `;
          });
        } catch (streamError) {
          console.error("Stream parsing error:", streamError);
        } finally {
          controller.close();
        }
      },
    });

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
