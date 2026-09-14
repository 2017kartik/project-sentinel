import { AiService } from './aiService';
import { SessionRepository } from '../repositories/sessionRepository';

export class InterviewService {
  /**
   * Handles an incoming chat message, generates the AI response stream, 
   * and saves all interactions to the database.
   */
  static async handleChatMessage(
    userId: string,
    sessionId: string,
    problemTitle: string,
    difficultyLevel: number,
    optimalTime: string,
    optimalSpace: string,
    language: string,
    currentCode: string,
    userMessage: string,
    previousMessages: any[]
  ): Promise<ReadableStream> {
    
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

    // 1. Ensure the session exists in the DB
    await SessionRepository.createSession(sessionId, userId, problemTitle, personaName);

    // 2. Save the user's message
    await SessionRepository.addMessageToSession(sessionId, 'user', userMessage);

    // 3. Generate the response stream using AiService
    const aiStream = await AiService.generateInterviewResponseStream(
      personaName,
      personaInstruction,
      problemTitle,
      optimalTime,
      optimalSpace,
      language,
      currentCode,
      userMessage,
      previousMessages
    );

    // 4. Return a ReadableStream that will send data to the client 
    //    while simultaneously building the full response to save to the DB.
    return new ReadableStream({
      async start(controller) {
        let fullAiResponse = "";
        try {
          for await (const chunk of aiStream) {
            fullAiResponse += chunk;
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          // After streaming completes, save the AI response to the DB
          await SessionRepository.addMessageToSession(sessionId, 'ai', fullAiResponse);
        } catch (streamError) {
          console.error("Stream parsing error:", streamError);
        } finally {
          controller.close();
        }
      },
    });
  }
}
