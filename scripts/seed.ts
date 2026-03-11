import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from your .env.local file
dotenv.config({ path: '.env' });
// Fallback in case you just use .env
dotenv.config();

async function seed() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined in your .env file!");
    }

    const sql = neon(process.env.DATABASE_URL);

    // 1. Read the JSON file
    const filePath = join(process.cwd(), 'problems.json');
    const fileData = readFileSync(filePath, 'utf-8');
    const problems = JSON.parse(fileData);

    console.log(`Found ${problems.length} problems in JSON. Starting database injection...`);

    // 2. Loop through and insert/update
    for (const problem of problems) {
      // We use ON CONFLICT DO UPDATE so you can run this script safely multiple times!
      await sql`
        INSERT INTO problems (slug, title, description, optimal_time, optimal_space, boilerplate_cpp)
        VALUES (
          ${problem.slug}, 
          ${problem.title}, 
          ${problem.description}, 
          ${problem.optimal_time}, 
          ${problem.optimal_space}, 
          ${problem.boilerplate_cpp}
        )
        ON CONFLICT (slug) DO UPDATE 
        SET 
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          optimal_time = EXCLUDED.optimal_time,
          optimal_space = EXCLUDED.optimal_space,
          boilerplate_cpp = EXCLUDED.boilerplate_cpp;
      `;
      console.log(`✅ Seeded: ${problem.title}`);
    }

    console.log("🎉 All problems successfully synced to Neon Database!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();