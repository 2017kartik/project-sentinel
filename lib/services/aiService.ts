import { ai } from '../ai';

export class AiService {
  /**
   * Generates a streaming response for the mock interview.
   */
  static async generateInterviewResponseStream(
    personaName: string,
    personaInstruction: string,
    problemTitle: string,
    optimalTime: string,
    optimalSpace: string,
    language: string,
    currentCode: string,
    userMessage: string,
    previousMessages: any[]
  ): Promise<AsyncGenerator<string, void, unknown>> {
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
        systemInstruction: `${personaInstruction}\n\nFORMATTING RULES:\n- Always use Markdown.\n- Use bullet points when listing multiple issues.\n- Add double line breaks between paragraphs for readability.\n- Use inline code formatting backticks for variable names.\n- THINK OUT LOUD GATE: The candidate MUST explain their logic/approach before writing code. Interrogate their logic. Once they provide a valid approach that matches the optimal time and space complexity, you MUST append the exact string [EDITOR_UNLOCKED] to the end of your message to unlock their editor.`,
      },
    });

    // We return an AsyncGenerator that yields the text chunks
    async function* streamGenerator() {
      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    }
    
    return streamGenerator();
  }
}
