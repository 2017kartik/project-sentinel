export type ProblemStatus = 'PASS' | 'FAIL' | 'Unsolved';

export interface Problem {
  slug: string;
  title: string;
  optimal_time: string;
  optimal_space: string;
  status?: ProblemStatus;
}

export interface Session {
  id: string;
  user_id: string;
  problem_title: string;
  difficulty_mode: string;
  status: string;
}

export interface Message {
  session_id: string;
  role: 'user' | 'ai' | 'model';
  content: string;
}
