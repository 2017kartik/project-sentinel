# Design Document: Project Sentinel (Stateful DSA & LLD Mock Interviewer)
**Author:** Kartik Agrawal
**Status:** Proposed
**Date:** March 2026

## 1. Overview and Objective
Current algorithmic practice platforms validate syntax and basic time/space complexity, but fail to simulate the psychological and communicative rigors of a real Software Development Engineer (SDE) interview. 

**Project Sentinel** is a full-stack Next.js application designed to conduct stateful, high-pressure mock interviews for Data Structures, Algorithms, and Low-Level Design. The system will leverage a secure code execution sandbox alongside an AI engine capable of dynamic persona shifts—ranging from a collaborative guide to a tough, uncompromising, and relentless interrogator that forces candidates to fiercely defend their architectural choices.

## 2. Goals & Non-Goals
**Goals:**
* Provide a real-time, browser-based code editor supporting C++ and Java.
* Implement a secure code execution environment to compile and test user submissions.
* Build a stateful AI interviewer that remembers the context of the current session and adapts constraints dynamically (e.g., escalating from O(N) to O(1) space complexity).
* Implement a "Difficulty Dial" to control the interviewer's persona (Guide, Standard, Relentless).

**Non-Goals:**
* Teaching basic programming syntax from scratch.
* Replacing standard IDEs for large-scale enterprise development.

## 3. High-Level System Architecture
The application will follow a Backend-for-Frontend (BFF) pattern utilizing the Next.js App Router.

* **Frontend (Client):** React.js and Tailwind CSS. Responsible for the UI, code editor (via Monaco Editor), and rendering streaming AI responses.
* **Routing & API (Edge/Node):** Next.js Server Actions and Route Handlers to securely bridge the frontend with external services, keeping API keys hidden.
* **Authentication:** NextAuth.js securing routes via Edge Proxy/Middleware.
* **Code Sandbox:** Judge0 API. A secure, isolated environment to compile and execute C++ and Java submissions, returning standard output, execution time, and memory usage.
* **AI Engine:** Vercel AI SDK connected to an LLM. Responsible for parsing the user's code, the Judge0 output, and streaming tactical feedback back to the client.
* **Database:** PostgreSQL.

## 4. Core Workflows

### Flow A: The "Think Out Loud" Gate
1. User selects a problem and a difficulty level (e.g., "Relentless").
2. Before writing code, the user submits a text-based approach.
3. The AI Engine evaluates the logic. If flawed, it blocks execution and interrogates the user's time/space complexity assumptions.

### Flow B: Code Execution & Evaluation
1. User submits C++ or Java code via the React frontend.
2. A Next.js Server Action sends the payload to the Judge0 API.
3. Judge0 returns the execution results (Pass/Fail, Time, Memory).
4. The Server Action forwards the user's code, the execution results, and the selected persona prompt to the Vercel AI SDK.
5. The AI streams a highly contextual critique back to the UI, potentially introducing a new constraint.

## 5. Data Model (PostgreSQL Schema)
A relational model to persist user progress and interview history.

* **`User` Table:** `id`, `email`, `name`, `created_at`
* **`InterviewSession` Table:** `id`, `user_id`, `problem_title`, `difficulty_mode`, `status` (in-progress, completed), `created_at`
* **`Message` Table:** `id`, `session_id`, `role` (user/ai), `content`, `timestamp` (Stores the chat history for RAG/context).
* **`Submission` Table:** `id`, `session_id`, `language` (C++/Java), `code_snippet`, `execution_time`, `memory_used`, `passed_cases`.

## 6. Security & Privacy Considerations
* **Malicious Code:** Under no circumstances will user code be executed directly on the Next.js Node server. All execution is strictly offloaded to the isolated Judge0 sandbox.
* **Route Protection:** Middleware will block unauthorized access to the `/interview` dashboard.
* **Rate Limiting:** Implement limits on Server Actions to prevent API abuse of the LLM and Judge0 services.