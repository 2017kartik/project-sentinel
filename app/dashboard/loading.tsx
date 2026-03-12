export default function Loading() {
    return (
        <main className="animate-pulse">
            <div className="mb-8">
                <div className="h-8 w-48 bg-zinc-800 rounded-md mb-2"></div>
                <div className="h-4 w-96 bg-zinc-800 rounded-md"></div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl overflow-hidden">
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
                        {/* Generate 5 dummy rows for the skeleton */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i}>
                                <td className="px-6 py-4">
                                    <div className="h-4 w-4 rounded-full bg-zinc-800"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-5 w-40 bg-zinc-800 rounded-md"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-5 w-16 bg-zinc-800 rounded-md"></div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="h-5 w-16 bg-zinc-800 rounded-md"></div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="h-9 w-20 bg-zinc-800 rounded-md ml-auto"></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}