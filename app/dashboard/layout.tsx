export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-zinc-950 text-zinc-50">
      <div className="w-full flex-none md:w-64 border-r border-zinc-800 p-4">
        {/* We will build the actual SideNav component here later */}
        <h2 className="text-lg font-bold text-blue-400">Sentinel Menu</h2>
        <ul className="mt-4 space-y-2 text-zinc-400">
          <li>Home</li>
          <li>Past Interviews</li>
          <li>Settings</li>
        </ul>
      </div>
      <div className="grow p-6 md:overflow-y-auto md:p-12">
        {children}
      </div>
    </div>
  );
}