import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-zinc-950 text-zinc-50">
      <div className="w-full flex-none md:w-64 border-r border-zinc-800 p-4">
        <h2 className="text-lg font-bold text-blue-400">Sentinel Menu</h2>
        
        <div className="mt-6 flex flex-col space-y-2 text-zinc-400">
          <Link 
            href="/" 
            className="rounded-md p-3 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Home (Difficulty Dial)
          </Link>
          
          <Link 
            href="/dashboard" 
            className="rounded-md p-3 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Past Interviews
          </Link>
          
          {/* Temporary link just so we can easily navigate to the test room */}
          <Link 
            href="/interview/test-123" 
            className="rounded-md p-3 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Test Interview Room
          </Link>
        </div>

      </div>
      <div className="grow p-6 md:overflow-y-auto md:p-12">
        {children}
      </div>
    </div>
  );
}