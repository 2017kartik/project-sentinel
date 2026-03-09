import { GoogleGenAI } from '@google/genai';
import { neon } from '@neondatabase/serverless';

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  const { userMessage, currentCode, language, sessionId } = await req.json();
  
  // 1. Connect to Neon Database
  const sql = neon(process.env.DATABASE_URL!);

  try {
    // 2. Save the User's message to the database immediately
    await sql`
      INSERT INTO messages (session_id, role, content) 
      VALUES (${sessionId}, 'user', ${userMessage})
    `;

    const prompt = `
    Candidate's Message: "${userMessage}"
    
    Candidate's Current Code (${language}):
    \`\`\`${language}
    ${currentCode}
    \`\`\`
    
    Respond to the candidate in character as 'The Bar-Raiser'.
    `;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `You are an elite, relentless Senior Software Engineer conducting a mock technical interview. Your persona is 'The Bar-Raiser'. 
        You are highly critical and focus intensely on Big-O time and space complexity. Expect production-ready code. 
        Do NOT give away the exact answer. Ask probing questions, point out missing edge cases, and challenge logic. 
        
        FORMATTING RULES: 
        - Always use Markdown. 
        - Use bullet points when listing multiple issues.
        - Add double line breaks between paragraphs for readability.
        - Use inline code formatting backticks for variable names.`
      }
    });

    // 3. Convert stream and save the final AI response to the database
    const stream = new ReadableStream({
      async start(controller) {
        let fullAiResponse = "";
        
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              fullAiResponse += chunk.text; // Append chunks to the full string
              controller.enqueue(new TextEncoder().encode(chunk.text)); // Send chunk to browser
            }
          }
          
          // 4. The stream is finished! Save the complete AI response to the database
          await sql`
            INSERT INTO messages (session_id, role, content) 
            VALUES (${sessionId}, 'ai', ${fullAiResponse})
          `;
          
        } catch (streamError) {
          console.error("Stream parsing error:", streamError);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream);

  } catch (error: any) {
    console.error("Streaming Error RAW:", error);
    return new Response(`CRITICAL ERROR: ${error.message || JSON.stringify(error)}`, { status: 500 });
  }
}