'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Editor from '@monaco-editor/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import ReactMarkdown from 'react-markdown';

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [code, setCode] = useState<string>('// Loading editor...');
  const [problem, setProblem] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'chat'>('description');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  
  const [difficultyLevel, setDifficultyLevel] = useState(3);
  const [personaName, setPersonaName] = useState('The Bar-Raiser');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('sentinel_difficulty');
    const level = stored ? parseInt(stored) : 3;
    setDifficultyLevel(level);

    let initialMsg = "I am ready. Walk me through your optimal approach.";
    if (level === 1) {
      setPersonaName('The Guide');
      initialMsg = "Welcome! Take a deep breath. Let's work through this problem together. What are your initial thoughts?";
    } else if (level === 2) {
      setPersonaName('The Standard Interviewer');
      initialMsg = "Hello. Please read the problem description and explain your initial approach before writing code.";
    } else {
      setPersonaName('The Bar-Raiser');
    }
    
    setMessages([{ role: 'ai', content: initialMsg }]);

    const fetchProblem = async () => {
      try {
        setFetchError(null);
        const res = await fetch(`/api/problems/${id}`);
        if (!res.ok) throw new Error("Database timeout or problem not found. Please wake up the database.");
        
        const data = await res.json();
        setProblem(data);
        setCode(data.boilerplate_cpp);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setFetchError(err.message || "Failed to load problem.");
      }
    };
    fetchProblem();
  }, [id]);

  const INTERVIEW_DURATION = 45 * 60;
  const [timeLeft, setTimeLeft] = useState(INTERVIEW_DURATION);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!problem) return; 

    if (timeLeft <= 0) {
      setIsLocked(true);
      return;
    }
    if (isLocked) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLocked, problem]); 

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
          sessionId: sessionId,
          problemTitle: problem?.title,
          optimalTime: problem?.optimal_time,
          optimalSpace: problem?.optimal_space,
          difficultyLevel: difficultyLevel,
          previousMessages: messages
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

  const handleProposeSolution = async () => {
    setActiveTab('chat'); 

    // STRICT PROMPT so the AI doesn't ask more questions
    const submitPrompt = `I am proposing this as my final, production-ready solution. 
    Based ONLY on the code currently in the editor and my previous explanations in this chat, evaluate my solution. 
    Do NOT ask any more follow-up questions. You must make a final decision right now. 
    If the code is fully optimal, bug-free, and handles edge cases, you MUST end your response with EXACTLY the string: [RESULT: PASS]. 
    If it is not optimal, or has bugs, you MUST end with EXACTLY: [RESULT: FAIL].`;

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
          sessionId: sessionId,
          problemTitle: problem?.title,
          optimalTime: problem?.optimal_time,
          optimalSpace: problem?.optimal_space,
          difficultyLevel: difficultyLevel,
          previousMessages: messages
        })
      });

      if (!res.body) throw new Error("No stream returned");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      
      // --- FIX: Add a flag to prevent API spam! ---
      let hasGraded = false; 

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

        // If it finds PASS or FAIL, trigger the DB update ONLY ONCE
        if (!hasGraded && (aiResponse.includes('[RESULT: PASS]') || aiResponse.includes('[RESULT: FAIL]'))) {
          hasGraded = true; 
          setIsLocked(true);

          const finalResult = aiResponse.includes('PASS') ? 'PASS' : 'FAIL';
          
          // --- NEW: Browser Console Logs ---
          console.log(`🎯 Frontend detected ${finalResult}! Sending to database for problem: ${id}...`);

          fetch('/api/session/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemSlug: id, 
              finalResult: finalResult
            })
          })
          .then(res => res.json())
          .then(data => console.log("💾 Database save response:", data)) // <--- NEW LOG
          .catch(err => console.error("❌ Failed to mark session complete:", err));
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
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h2 className="font-semibold text-zinc-200">
          {fetchError ? 'Connection Error' : problem ? problem.title : 'Loading...'}
        </h2>

        <div className="flex items-center gap-6">
          <div className={`font-mono text-lg font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={handleProposeSolution}
            disabled={isLocked || isLoading || !problem || !!fetchError}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${isLocked || fetchError
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
          <div className="h-full flex flex-col bg-zinc-950">
            <div className="flex bg-zinc-900 border-b border-zinc-800 px-6 pt-2">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'description'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'chat'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
              >
                AI Interviewer
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-zinc-950">
              {activeTab === 'description' && (
                <div className="flex-1 overflow-y-auto p-6 pr-2 
                  [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
                  <div className="pr-6 prose prose-invert max-w-none wrap-break-word prose-p:leading-relaxed prose-pre:bg-[#1e1e1e] prose-pre:p-4 prose-pre:rounded-lg prose-pre:max-w-full prose-pre:overflow-x-auto prose-code:bg-zinc-800 prose-code:text-zinc-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none prose-ul:list-disc prose-ul:pl-5 marker:text-zinc-500">
                    {fetchError ? (
                      <div className="flex flex-col items-center justify-center p-8 mt-10 border border-red-900/50 bg-red-950/20 rounded-xl">
                        <p className="text-red-400 font-medium mb-4">{fetchError}</p>
                        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors">
                          Refresh & Retry
                        </button>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold text-zinc-100 mb-6">{problem ? problem.title : 'Loading...'}</h1>
                        <ReactMarkdown>{problem ? problem.description : 'Loading problem description...'}</ReactMarkdown>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 block">Live Interview</span>
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`p-4 rounded-lg text-sm ${msg.role === 'ai' ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' : 'bg-blue-900/20 border border-blue-900/50 text-blue-100 ml-8'}`}>
                        <div className={`font-bold mb-2 ${msg.role === 'ai' ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {msg.role === 'ai' ? `${personaName}:` : 'You:'}
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 whitespace-pre-wrap">
                          {msg.content === '' ? (
                            <span className="flex items-center gap-2 text-zinc-500 animate-pulse">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Analyzing...
                            </span>
                          ) : (
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

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