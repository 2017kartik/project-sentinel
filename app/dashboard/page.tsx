import { neon } from '@neondatabase/serverless';

export default async function DashboardPage() {
  // 1. Connect to Neon securely on the server
  const sql = neon(process.env.DATABASE_URL!);
  
  // 2. Fetch the past interview sessions
  const sessions = await sql`
    SELECT problem_title, difficulty_mode, status, created_at 
    FROM sessions 
    ORDER BY created_at DESC
  `;

  return (
    <main>
      <h1 className="text-3xl font-bold mb-6">Your Interview History</h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        
        {sessions.length === 0 ? (
          <p className="text-zinc-400">Your past DSA and LLD mock interviews will appear here once we connect the database.</p>
        ) : (
          <ul className="space-y-6">
            {sessions.map((session, index) => (
              <li key={index} className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                <h3 className="text-xl font-semibold text-blue-400">{session.problem_title}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-zinc-400">
                  <span className="rounded bg-zinc-800 px-2 py-1">Mode: {session.difficulty_mode}</span>
                  <span className="rounded bg-zinc-800 px-2 py-1">Status: {session.status}</span>
                  <span>Date: {new Date(session.created_at).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

      </div>
    </main>
  );
}