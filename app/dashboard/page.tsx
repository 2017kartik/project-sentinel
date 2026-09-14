import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import DifficultySelector from '@/components/ui/DifficultySelector';
import { ProblemRepository } from '@/lib/repositories/problemRepository';
import { Problem } from '@/types';

export const dynamic = 'force-dynamic'; 

export default async function DashboardPage() {
  const { userId } = await auth(); 
  let problems: Problem[] = [];
  let isWakingUp = false;
  
  try {
    if (userId) {
      problems = await ProblemRepository.getProblemsWithUserProgress(userId);
    }
  } catch (error) {
    console.error("Database Error:", error);
    isWakingUp = true;
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">Problem Set</h1>
          <p className="mt-2 text-zinc-400">Select your interviewer intensity, then choose a problem.</p>
        </div>
        
        {/* Clerk User Profile Button */}
        <div className="bg-zinc-800 p-2 rounded-full border border-zinc-700 flex items-center justify-center">
           <UserButton />
        </div>
      </div>

      {/* --- NEW: The Difficulty Selector --- */}
      <DifficultySelector />

      {/* Problem Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl overflow-hidden">
        
        {isWakingUp ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-300 font-medium">Waking up database...</p>
            <p className="text-zinc-500 text-sm">Serverless databases go to sleep to save resources. Please refresh the page in a few seconds!</p>
          </div>
        ) : problems.length === 0 ? (
          <div className="p-6 text-center text-zinc-400">
            No problems found. Run the seed script to populate the database!
          </div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-800/80 text-xs uppercase text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Target Time</th>
                <th className="px-6 py-4 font-medium">Target Space</th>
                <th className="px-6 py-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {problems.map((problem) => (
                <tr key={problem.slug} className="hover:bg-zinc-800/40 transition-colors group">
                  <td className="px-6 py-4">
                    {problem.status === 'PASS' ? (
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-500" title="Passed">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    ) : problem.status === 'FAIL' ? (
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-500/20 text-red-500" title="Failed">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </div>
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-zinc-700 group-hover:bg-blue-500 transition-colors" title="Unsolved"></div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-100 text-base">
                    {problem.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-blue-400 border border-zinc-700">
                      {problem.optimal_time}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-purple-400 border border-zinc-700">
                      {problem.optimal_space}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/interview/${problem.slug}`}
                      className="inline-block rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-500 hover:shadow-blue-900/20 transition-all"
                    >
                      {problem.status === 'PASS' ? 'Review' : 'Solve'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </main>
  );
}