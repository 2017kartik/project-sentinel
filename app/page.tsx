import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Code2, BrainCircuit, LineChart, ChevronRight } from "lucide-react";

export default async function Home() {
  // Check auth state directly on the server!
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col selection:bg-blue-500/30">
      {/* Navigation Bar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <TerminalIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Project Sentinel</span>
          </div>

          <div className="flex items-center gap-4">
            {userId ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <div className="h-8 w-8 rounded-full border border-zinc-700 flex items-center justify-center bg-zinc-800">
                  <UserButton />
                </div>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/sign-up" className="text-sm font-medium bg-white text-zinc-950 px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          v1.0 Now Live
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl bg-linear-to-b from-white to-zinc-400 bg-clip-text text-transparent">
          Master Your FAANG Interview with AI.
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Stop memorizing solutions. Practice live coding and system design with an adaptive AI interviewer that pushes you to write optimal, production-ready code.
        </p>

        {userId ? (
          <Link href="/dashboard" className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]">
            Enter Sandbox
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <Link href="/sign-up" className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]">
            Start Practicing for Free
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-3 gap-8 border-t border-zinc-800/50">
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group">
          <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center mb-6 border border-blue-800/50 text-blue-400 group-hover:scale-110 transition-transform">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Adaptive Personas</h3>
          <p className="text-zinc-400 leading-relaxed">From a gentle guide to a ruthless Bar-Raiser, calibrate the AI's intensity to match your exact preparation level.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group">
          <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center mb-6 border border-emerald-800/50 text-emerald-400 group-hover:scale-110 transition-transform">
            <Code2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Real-time Analysis</h3>
          <p className="text-zinc-400 leading-relaxed">The AI reads your code as you type, evaluating Big-O time and space complexity just like a real human interviewer.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group">
          <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center mb-6 border border-purple-800/50 text-purple-400 group-hover:scale-110 transition-transform">
            <LineChart className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Track Progress</h3>
          <p className="text-zinc-400 leading-relaxed">Securely save your interview history, code snippets, and grading results to review your growth over time.</p>
        </div>
      </div>
    </main>
  );
}

function TerminalIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}