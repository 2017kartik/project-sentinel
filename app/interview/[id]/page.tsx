export default function InterviewRoom({ params }: { params: { id: string } }) {
  return (
    <main className="flex h-screen flex-col bg-zinc-950 p-6 text-zinc-50">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold">Active Interview Session</h1>
        <span className="rounded bg-blue-900 px-3 py-1 text-sm font-semibold text-blue-300">
          Session ID: {params.id}
        </span>
      </div>
      
      <div className="mt-6 flex flex-1 gap-6">
        {/* Left side: Code Editor Placeholder */}
        <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-zinc-400">Code Editor goes here...</p>
        </div>
        
        {/* Right side: AI Chat Placeholder */}
        <div className="w-1/3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-zinc-400">AI Interviewer feedback goes here...</p>
        </div>
      </div>
    </main>
  );
}