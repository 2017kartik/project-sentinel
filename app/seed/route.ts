import { neon } from '@neondatabase/serverless';

export async function GET() {
  // Initialize the Neon serverless connection
  const sql = neon(process.env.DATABASE_URL!);

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        problem_title VARCHAR(255) NOT NULL,
        difficulty_mode VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        code_snippet TEXT NOT NULL,
        execution_time FLOAT,
        memory_used FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return Response.json({ message: 'Database seeded successfully with Neon!' });
  } catch (error) {
    console.error('Database Error:', error);
    return Response.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}