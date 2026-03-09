'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
// Import your new Server Action!
import ReactMarkdown from 'react-markdown';

export default function InterviewPage({ params }: { params: { id: string } }) {
  const problemTitle = "Two Sum (O(n) space constraint)";

  // 1. React State to track the Interview Arena
  const [code, setCode] = useState<string>(`#include <vector>
#include <unordered_map>

using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your optimized solution here...
        
    }
};`);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Welcome, Kartik. Can you walk me through your initial approach? I noticed you haven't considered the O(n) space constraint yet." }
  ]);

  // 2. The function to handle streaming messages
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user's message and clear input
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Add an empty placeholder message for the AI that we will fill up chunk-by-chunk
    setMessages((prev) => [...prev, { role: 'ai', content: '' }]);

    try {
      // Hit our new API Route
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userMessage: input, 
          currentCode: code, 
          language: 'cpp',
          sessionId: '22222222-2222-2222-2222-222222222222' // Our hardcoded dummy session
        })
      });
      if (!res.body) throw new Error("No stream returned");

      // Set up the reader to process the incoming byte stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      // Loop to read the stream until it's finished
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the byte chunk back into text
        const chunkText = decoder.decode(value, { stream: true });
        aiResponse += chunkText;

        // Update the LAST message in the state array (the AI's placeholder) with the new text
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = aiResponse;
          return updated;
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="h-full flex flex-col p-6 bg-zinc-950">
            {/* Problem Statement (Top) */}
            <div className="prose prose-invert max-w-none mb-6">
              <h1 className="text-2xl font-bold text-blue-400">Problem Statement</h1>
              <p className="text-zinc-400 mt-4 leading-relaxed">
                Given an array of integers <code className="bg-zinc-800 px-1 rounded text-zinc-200">nums</code> and an integer <code className="bg-zinc-800 px-1 rounded text-zinc-200">target</code>,
                return indices of the two numbers such that they add up to target.
              </p>
            </div>

            {/* Dynamic Chat History (Middle) */}
            {/* Dynamic Chat History (Middle) */}
            <div className="flex-1 overflow-y-auto border-t border-zinc-800 pt-6 mb-4 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Interview Chat</span>

              {messages.map((msg, idx) => (
                <div key={idx} className={`p-4 rounded-lg text-sm ${msg.role === 'ai' ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-blue-900/20 border border-blue-900/50 text-blue-100 ml-8'}`}>
                  <div className={`font-bold mb-2 ${msg.role === 'ai' ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {msg.role === 'ai' ? 'Bar-Raiser:' : 'You:'}
                  </div>
                  
                  {/* Added whitespace-pre-wrap for spacing, and a slick loading state for the blank card */}
                  <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 whitespace-pre-wrap">
                    {msg.content === '' ? (
                      <span className="flex items-center gap-2 text-zinc-500 animate-pulse">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Analyzing code complexity...
                      </span>
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}

              {/* Notice we removed the old floating isLoading text from down here! */}
            </div>

            {/* Chat Input Box (Bottom) */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Explain your logic..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Send
              </button>
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
              value={code}
              onChange={(val) => setCode(val || '')} // Syncs editor changes to React State
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