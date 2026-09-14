import { neon } from '@neondatabase/serverless';

// Singleton instance to prevent exhausting connections in serverless environments
export const sql = neon(process.env.DATABASE_URL!);

/**
 * A utility function for retrying database operations that may fail due to 
 * serverless cold starts or transient network errors.
 */
export const withRetry = async <T>(dbCall: () => Promise<T>, retries = 3): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await dbCall();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, 1500));
    }
  }
  throw new Error("Database operation failed after retries.");
};
