"use client";

import { useState, useEffect } from "react";
import { Brain, Flame, GraduationCap } from "lucide-react";

export default function DifficultySelector() {
    const [level, setLevel] = useState(3);
    const [mounted, setMounted] = useState(false);

    // Load saved difficulty from local storage on mount
    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem('sentinel_difficulty');
        if (stored) setLevel(parseInt(stored));
    }, []);

    const handleLevelChange = (newLevel: number) => {
        setLevel(newLevel);
        localStorage.setItem('sentinel_difficulty', newLevel.toString());
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return <div className="h-24 bg-zinc-900/50 border border-zinc-800 rounded-xl mb-8 animate-pulse"></div>;
    }

    const getDifficultyDetails = () => {
        switch (level) {
            case 1:
                return {
                    title: "The Guide",
                    desc: "Supportive and collaborative. Gives hints and guides you to the optimal solution.",
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/30",
                    icon: <GraduationCap className="w-5 h-5 text-emerald-400" />
                };
            case 2:
                return {
                    title: "Standard Interviewer",
                    desc: "Professional and neutral. Asks standard follow-ups and expects standard time/space analysis.",
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/30",
                    icon: <Brain className="w-5 h-5 text-blue-400" />
                };
            case 3:
            default:
                return {
                    title: "The Bar-Raiser",
                    desc: "Relentless and strict. Expects flawless, production-ready code with deep complexity analysis.",
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    border: "border-purple-500/30",
                    icon: <Flame className="w-5 h-5 text-purple-400" />
                };
        }
    };

    const details = getDifficultyDetails();

    return (
        <div className={`mb-8 p-6 rounded-xl border transition-colors duration-300 ${details.border} ${details.bg} backdrop-blur-sm`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Left Side: Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        {details.icon}
                        <h2 className={`text-lg font-bold ${details.color}`}>
                            Interviewer Persona: {details.title}
                        </h2>
                    </div>
                    <p className="text-sm text-zinc-300">
                        {details.desc}
                    </p>
                </div>

                {/* Right Side: Slider */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-medium text-zinc-500 px-1">
                        <span className={level === 1 ? "text-emerald-400" : ""}>Easy</span>
                        <span className={level === 2 ? "text-blue-400" : ""}>Medium</span>
                        <span className={level === 3 ? "text-purple-400" : ""}>Hard</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="1"
                        value={level}
                        onChange={(e) => handleLevelChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                </div>

            </div>
        </div>
    );
}