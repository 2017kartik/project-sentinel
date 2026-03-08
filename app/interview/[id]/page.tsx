'use client';

import React from 'react';
import Editor from '@monaco-editor/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";

export default function InterviewPage({ params }: { params: { id: string } }) {
  // In a real SDE workflow, we would use the 'id' to fetch the specific problem from the DB
  const problemTitle = "Two Sum (O(n) space constraint)";

  return (
    <main className="h-screen w-full bg-zinc-950 flex flex-col">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-zinc-800 flex items-center px-6 justify-between bg-zinc-900">
        <h2 className="font-semibold text-zinc-200">{problemTitle}</h2>
        <div className="flex gap-4">
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
            Submit Code
          </button>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">

        {/* Left Side: AI Chat & Problem Statement */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col p-6 bg-zinc-950 overflow-y-auto">
            <div className="prose prose-invert max-w-none">
              <h1 className="text-2xl font-bold text-blue-400">Problem Statement</h1>
              <p className="text-zinc-400 mt-4 leading-relaxed">
                Given an array of integers <code className="bg-zinc-800 px-1 rounded text-zinc-200">nums</code> and an integer <code className="bg-zinc-800 px-1 rounded text-zinc-200">target</code>,
                return indices of the two numbers such that they add up to target.
              </p>
              <div className="mt-8 border-t border-zinc-800 pt-6">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Interview Chat</span>
                <div className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300">
                  <span className="text-blue-400 font-bold">Bar-Raiser:</span> Welcome, Kartik. Can you walk me through your initial approach?
                  I noticed you haven't considered the O(n) space constraint yet.
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-800" />

        {/* Right Side: Monaco Code Editor */}
        <ResizablePanel defaultSize={60}>
          <div className="h-full border-l border-zinc-800">
            <Editor
              height="100%"
              defaultLanguage="cpp"
              defaultValue="// Write your C++ solution here..."
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--font-jetbrains-mono)',
                scrollBeyondLastLine: false,
                padding: { top: 20 }
              }}
            />
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </main>
  );
}