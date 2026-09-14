import { sql } from '../db';
import { Problem } from '../../types';

export class ProblemRepository {
  /**
   * Retrieves all problems with the user's progress status.
   */
  static async getProblemsWithUserProgress(userId: string): Promise<Problem[]> {
    const problems = await sql`
      SELECT 
        p.slug, 
        p.title, 
        p.optimal_time, 
        p.optimal_space, 
        COALESCE(up.status, 'Unsolved') as status
      FROM problems p
      LEFT JOIN user_progress up ON p.slug = up.slug AND up.user_id = ${userId}
      ORDER BY p.title ASC
    `;
    return problems as Problem[];
  }

  /**
   * Retrieves a single problem by its slug.
   */
  static async getProblemBySlug(slug: string): Promise<Problem | null> {
    const problems = await sql`
      SELECT * FROM problems WHERE slug = ${slug} LIMIT 1
    `;
    return problems.length > 0 ? (problems[0] as Problem) : null;
  }

  /**
   * Updates the user's progress for a specific problem.
   */
  static async updateUserProgress(userId: string, slug: string, status: string): Promise<void> {
    await sql`
      INSERT INTO user_progress (user_id, slug, status) 
      VALUES (${userId}, ${slug}, ${status})
      ON CONFLICT (user_id, slug) DO UPDATE 
      SET status = EXCLUDED.status
    `;
  }
}
