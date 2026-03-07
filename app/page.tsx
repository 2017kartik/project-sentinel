'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [difficulty, setDifficulty] = useState([1]);

  // A helper function to translate the number into our persona
  const getPersona = (level: number) => {
    if (level === 1) return 'The Guide (Collaborative & Friendly)';
    if (level === 2) return 'The Standard Interviewer (Professional)';
    return 'The Bar-Raiser (Relentless & Tough)';
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-24 text-zinc-50">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Project Sentinel</h1>
          <p className="text-zinc-400">Select your interviewer's intensity.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-blue-400">
              {getPersona(difficulty[0])}
            </h2>
            
            <Slider 
              defaultValue={[1]} 
              max={3} 
              min={1} 
              step={1}
              onValueChange={setDifficulty}
              className="py-4"
            />
          </div>

          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg">
            <Link href="/dashboard">Enter Interview Sandbox</Link>
          </Button>
        </div>

      </div>
    </main>
  );
}