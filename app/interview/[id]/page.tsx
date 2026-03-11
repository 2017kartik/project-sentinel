'use client';

import React, { useState, useEffect, use } from 'react';
import Editor from '@monaco-editor/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import ReactMarkdown from 'react-markdown';

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // 1. Dynamic State
  const [code, setCode] = useState<string>('// Loading editor...');
  const [problem, setProblem] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'description' | 'chat'>('description');

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Welcome, Kartik. Can you walk me through your initial approach?" }
  ]);

  // 2. Fetch Problem Data on Load
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await fetch(`/api/problems/${id}`);
        if (!res.ok) throw new Error("Problem not found");
        const data = await res.json();

        setProblem(data);
        setCode(data.boilerplate_cpp);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProblem();
  }, [id]);

  // 3. Interview Timer & Lock State
  const INTERVIEW_DURATION = 45 * 60;
  const [timeLeft, setTimeLeft] = useState(INTERVIEW_DURATION);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsLocked(true);
      return;
    }
    if (isLocked) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLocked]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 4. Handle Standard Chat Messages
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'ai', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: input,
          currentCode: code,
          language: 'cpp',
          sessionId: '22222222-2222-2222-2222-222222222222',
          // --- NEW: Pass dynamic context to the AI ---
          problemTitle: problem?.title,
          optimalTime: problem?.optimal_time,
          optimalSpace: problem?.optimal_space
        })
      });
      if (!res.body) throw new Error("No stream returned");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        aiResponse += chunkText;

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

  // 5. Handle Final Submission
  const handleProposeSolution = async () => {
    const submitPrompt = "I am proposing this as my final, production-ready solution. Please evaluate my time and space complexity. If it is fully optimal and handles all edge cases, give me your final feedback and end your response with EXACTLY the string: [RESULT: PASS]. If it is not optimal, end with EXACTLY: [RESULT: FAIL].";

    const newMessages = [...messages, { role: 'user', content: "I am ready to submit my final solution for grading." }];
    setMessages(newMessages);
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'ai', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: submitPrompt,
          currentCode: code,
          language: 'cpp',
          sessionId: '22222222-2222-2222-2222-222222222222',
          // --- NEW: Pass dynamic context to the AI ---
          problemTitle: problem?.title,
          optimalTime: problem?.optimal_time,
          optimalSpace: problem?.optimal_space
        })
      });

      if (!res.body) throw new Error("No stream returned");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        aiResponse += chunkText;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = aiResponse;
          return updated;
        });

        if (aiResponse.includes('[RESULT: PASS]') || aiResponse.includes('[RESULT: FAIL]')) {
          setIsLocked(true);

          const finalResult = aiResponse.includes('PASS') ? 'PASS' : 'FAIL';

          fetch('/api/session/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: '22222222-2222-2222-2222-222222222222',
              finalResult: finalResult
            })
          }).catch(err => console.error("Failed to mark session complete:", err));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen w-full bg-zinc-950 flex flex-col">
      <header className="h-14 border-b border-zinc-800 flex items-center px-6 justify-between bg-zinc-900">
        {/* --- NEW: Dynamic Title --- */}
        <h2 className="font-semibold text-zinc-200">{problem ? problem.title : 'Loading...'}</h2>

        <div className="flex items-center gap-6">
          <div className={`font-mono text-lg font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={handleProposeSolution}
            disabled={isLocked || isLoading || !problem}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${isLocked
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
          >
            {isLocked ? "Interview Concluded" : "Propose Solution"}
          </button>
        </div>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col p-6 bg-zinc-950">
            {/* --- TAB HEADER --- */}
            <div className="flex bg-zinc-900 border-b border-zinc-800 px-4 pt-2">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'description'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'chat'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
              >
                AI Interviewer
              </button>
            </div>

            {/* --- TAB CONTENT AREA --- */}
            <div className="flex-1 overflow-hidden flex flex-col bg-zinc-950">

              {/* TAB 1: PROBLEM DESCRIPTION */}
              {activeTab === 'description' && (
                <div className="flex-1 overflow-y-auto p-6 pr-2 
                  [&::-webkit-scrollbar]:w-2 
                  [&::-webkit-scrollbar-track]:bg-transparent 
                  [&::-webkit-scrollbar-thumb]:bg-zinc-700 
                  [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600"
                >
                  {/* Inner container with pr-6 creates a safe zone away from the scrollbar */}
                  <div className="pr-6 prose prose-invert max-w-none wrap-break-word
                    prose-p:leading-relaxed prose-pre:bg-[#1e1e1e] prose-pre:p-4 
                    prose-pre:rounded-lg prose-pre:max-w-full prose-pre:overflow-x-auto 
                    prose-code:bg-zinc-800 prose-code:text-zinc-200 prose-code:px-1.5 
                    prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono 
                    prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none 
                    prose-ul:list-disc prose-ul:pl-5 marker:text-zinc-500">
                    
                    {/* Add a specific margin to the title to match spacing */}
                    <h1 className="text-2xl font-bold text-zinc-100 mb-6">
                      {problem ? problem.title : 'Loading...'}
                    </h1>
                    
                    <ReactMarkdown>
                      {problem ? problem.description : 'Loading problem description...'}
                    </ReactMarkdown>

                  </div>
                </div>
              )}

              {/* TAB 2: AI CHAT */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 block">
                      Live Interview
                    </span>

                    {messages.map((msg, idx) => (
                      <div key={idx} className={`p-4 rounded-lg text-sm ${msg.role === 'ai' ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-blue-900/20 border border-blue-900/50 text-blue-100 ml-8'}`}>
                        <div className={`font-bold mb-2 ${msg.role === 'ai' ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {msg.role === 'ai' ? 'Bar-Raiser:' : 'You:'}
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 whitespace-pre-wrap">
                          {msg.content === '' ? (
                            <span className="flex items-center gap-2 text-zinc-500 animate-pulse">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Analyzing...
                            </span>
                          ) : (
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input Box */}
                  <div className="flex gap-2 pt-4 border-t border-zinc-800 mt-4">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Explain your logic..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      disabled={isLoading || isLocked}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || isLocked}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/50 disabled:text-zinc-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-800" />

        <ResizablePanel defaultSize={60}>
          <div className="h-full border-l border-zinc-800">
            <Editor
              height="100%"
              defaultLanguage="cpp"
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--font-jetbrains-mono)',
                scrollBeyondLastLine: false,
                padding: { top: 20 },
                readOnly: isLocked
              }}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}