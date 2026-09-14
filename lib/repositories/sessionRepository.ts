import { sql, withRetry } from '../db';

export class SessionRepository {
  /**
   * Creates a new interview session. Uses withRetry for reliability.
   */
  static async createSession(
    sessionId: string,
    userId: string,
    problemTitle: string,
    difficultyMode: string
  ): Promise<void> {
    await withRetry(async () => {
      await sql`
        INSERT INTO sessions (id, user_id, problem_title, difficulty_mode, status) 
        VALUES (${sessionId}, ${userId}, ${problemTitle}, ${difficultyMode}, 'In Progress')
        ON CONFLICT (id) DO NOTHING
      `;
    });
  }

  /**
   * Adds a new message to a session.
   */
  static async addMessageToSession(
    sessionId: string,
    role: 'user' | 'ai',
    content: string
  ): Promise<void> {
    await withRetry(async () => {
      await sql`
        INSERT INTO messages (session_id, role, content) 
        VALUES (${sessionId}, ${role}, ${content})
      `;
    });
  }

  /**
   * Completes a session and optionally updates the user's progress for the problem.
   */
  static async completeSession(
    sessionId: string,
    userId: string,
    slug: string,
    status: string,
    score: number,
    feedback: string
  ): Promise<void> {
    // 1. Mark session as completed
    await sql`
      UPDATE sessions 
      SET status = 'Completed', score = ${score}, feedback = ${feedback}
      WHERE id = ${sessionId}
    `;

    // 2. Upsert user_progress if they passed
    if (status === "PASS") {
      await sql`
        INSERT INTO user_progress (user_id, slug, status)
        VALUES (${userId}, ${slug}, 'PASS')
        ON CONFLICT (user_id, slug) 
        DO UPDATE SET status = 'PASS'
      `;
    } else {
      await sql`
        INSERT INTO user_progress (user_id, slug, status)
        VALUES (${userId}, ${slug}, 'FAIL')
        ON CONFLICT (user_id, slug) 
        DO NOTHING
      `;
    }
  }
}
