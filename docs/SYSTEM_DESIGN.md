# Design Document: Project Sentinel
### Stateful DSA & LLD Mock Interviewer

| Field | Value |
|---|---|
| **Author** | Kartik Agrawal |
| **Status** | In Progress |
| **Created** | March 2026 |
| **Last Updated** | September 2026 |
| **Version** | 0.1.0 |

---

## Table of Contents
1. [Overview & Objective](#1-overview--objective)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Actual Technology Stack](#3-actual-technology-stack)
4. [High-Level System Architecture](#4-high-level-system-architecture)
5. [Project Structure](#5-project-structure)
6. [Core Workflows](#6-core-workflows)
7. [API Reference](#7-api-reference)
8. [Data Model](#8-data-model)
9. [AI Engine Design](#9-ai-engine-design)
10. [Security & Privacy](#10-security--privacy)
11. [Known Limitations & Future Work](#11-known-limitations--future-work)

---

## 1. Overview & Objective

Current algorithmic practice platforms validate syntax and basic time/space complexity, but fail to simulate the psychological and communicative rigors of a real Software Development Engineer (SDE) interview.

**Project Sentinel** is a full-stack Next.js 16 application designed to conduct stateful, high-pressure mock interviews for Data Structures, Algorithms, and Low-Level Design. The system combines a browser-based Monaco code editor with a Google Gemini-powered AI engine capable of dynamic **persona shifts** — ranging from a collaborative guide to a relentless interrogator that forces candidates to fiercely defend their architectural choices.

The core differentiator is the **"Think Out Loud" Gate**: the AI actively enforces a verbal-reasoning phase before unlocking the code editor, mirroring the communication requirements of a real interview.

---

## 2. Goals & Non-Goals

### Goals
- Provide a real-time, browser-based code editor (Monaco) supporting C++, Java, Python, JavaScript, TypeScript, and SQL.
- Implement a stateful AI interviewer (Google Gemini 2.5 Flash) that remembers session context and adapts constraints dynamically.
- Enforce a "Think Out Loud" gate — the editor is locked until the candidate verbally justifies an approach that satisfies the target time/space complexity.
- Implement a **Difficulty Dial** (levels 1–3) controlling the interviewer's persona:
  - **Level 1 — The Guide:** Encouraging, hints-first, collaborative.
  - **Level 2 — The Standard Interviewer:** Professional, neutral, objective.
  - **Level 3 — The Bar-Raiser:** Relentless, critical, production-quality standards.
- Persist interview sessions and per-problem user progress in a PostgreSQL database (Neon).
- Authenticate users via Clerk and protect all interview/dashboard routes.
- Stream AI responses in real time to the client.
- Track a 45-minute session countdown timer with a locked state on expiry.

### Non-Goals
- Teaching basic programming syntax from scratch.
- Replacing standard IDEs for large-scale enterprise development.
- Code execution / test-case validation (Judge0 integration is deferred — see §11).
- Multi-user / collaborative interview rooms.

---

## 3. Actual Technology Stack

> This section reflects `package.json` as of v0.1.0 and supersedes any prior plans.

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js 16.1.6 (App Router) | React 19, TypeScript 5 |
| **Language** | TypeScript | Strict mode |
| **Styling** | Tailwind CSS v4 + `tw-animate-css` | Via PostCSS |
| **UI Components** | shadcn/ui (Radix UI primitives) | `components/ui/` |
| **Code Editor** | `@monaco-editor/react` v4.7 | Monaco Editor in browser |
| **Authentication** | **Clerk** (`@clerk/nextjs` v7) | Replaces the original NextAuth.js plan |
| **AI Provider** | **Google GenAI** (`@google/genai` v1.44) | Replaces Vercel AI SDK plan; model: `gemini-2.5-flash` |
| **Database Client** | `@neondatabase/serverless` v1 | Neon PostgreSQL (serverless/HTTP) |
| **Markdown Rendering** | `react-markdown` v10 | Problem descriptions & AI chat |
| **Layout** | `react-resizable-panels` v4.7 | Resizable left/right panel split |
| **Icons** | `lucide-react` v0.577 | |
| **Package Manager** | `pnpm` (with `pnpm-workspace.yaml`) | |
| **Linting** | ESLint 9 + `eslint-config-next` | |
| **Seeding** | `tsx` + custom scripts | `npm run seed`, `npm run bulk-seed` |

---

## 4. High-Level System Architecture

The application follows a **Backend-for-Frontend (BFF)** pattern via the Next.js App Router. All external API secrets (Clerk, Google Gemini, Neon DB) are exclusively accessed server-side.

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│  ┌───────────────┐  ┌─────────────────┐  ┌───────────────┐   │
│  │ Monaco Editor │  │  AI Chat Panel  │  │   Problem     │   │
│  │  (React 19)   │  │ (Streaming body)│  │  Description  │   │
│  └───────┬───────┘  └────────┬────────┘  └───────┬───────┘   │
└──────────┼──────────────────-┼───────────────────┼──────────-┘
           │ HTTPS             │ HTTPS fetch        │ HTTPS
           │ (code payload)    │ (streaming body)   │
┌──────────┼───────────────────┼────────────────────┼──────────-┐
│          │   Next.js 16 (Node.js Runtime + Edge)  │           │
│  ┌───────▼───────────────────▼────────────────────▼────────-┐ │
│  │              Clerk Middleware (Edge)                     │ │
│  │    Protects /dashboard(.*) and /interview(.*)            │ │
│  └──────────────────────────┬───────────────────────────────┘ │
│                             │                                 │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │              Route Handlers (Node.js)                   │  │
│  │  POST /api/chat  |  POST /api/session/complete          │  │
│  │  GET  /api/problems/[slug]                              │  │
│  └──────┬──────────────────────────┬───────────────┬───────┘  │
└─────────┼──────────────────────────┼───────────────┼──────────┘
          │                          │               │
   ┌──────▼───────┐        ┌─────────▼──────┐  ┌────▼────────┐
   │ Google Gemini│        │  Neon          │  │  (Future)   │
   │ 2.5 Flash    │        │  PostgreSQL    │  │  Judge0     │
   │ (Streaming)  │        │ (Serverless)   │  │  Sandbox    │
   └──────────────┘        └────────────────┘  └─────────────┘
```

---

## 5. Project Structure

```
project-sentinel/
├── app/
│   ├── (auth)/              # Clerk auth group (sign-in, sign-up)
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts     # POST: AI streaming interview endpoint
│   │   ├── problems/
│   │   │   └── [slug]/
│   │   │       └── route.ts # GET: Fetch a single problem by slug
│   │   └── session/
│   │       └── complete/
│   │           └── route.ts # POST: Persist PASS/FAIL result
│   ├── dashboard/
│   │   ├── layout.tsx       # Dashboard shell layout
│   │   ├── loading.tsx      # Suspense loading skeleton
│   │   └── page.tsx         # Problem list + user progress (Server Component)
│   ├── interview/
│   │   └── [id]/
│   │       └── page.tsx     # Full interview UI (Client Component)
│   ├── seed/                # DB seed utility page
│   ├── layout.tsx           # Root layout (ClerkProvider, fonts)
│   ├── page.tsx             # Landing page
│   └── globals.css
├── components/
│   └── ui/
│       ├── DifficultySelector.tsx  # Persists difficulty level to localStorage
│       └── resizable.tsx           # shadcn resizable panels wrapper
├── lib/
│   ├── ai.ts                # GoogleGenAI client singleton
│   ├── db.ts                # Neon SQL client + withRetry utility
│   ├── repositories/
│   │   ├── problemRepository.ts   # DB queries: problems & user_progress
│   │   └── sessionRepository.ts   # DB queries: sessions & messages
│   └── services/
│       ├── aiService.ts     # Formats Gemini prompt; returns AsyncGenerator<string>
│       └── interviewService.ts    # Orchestrates DB + AI; returns ReadableStream
├── scripts/
│   ├── seed.ts              # Seeds problems.json into DB
│   └── bulk_fetch.ts        # Bulk problem fetcher utility
├── types/
│   └── index.ts             # Shared TypeScript interfaces (Problem, Session, Message)
├── middleware.ts             # Clerk route protection (Edge)
└── problems.json            # Static problem seed definitions
```

---

## 6. Core Workflows

### Flow A: Authentication & Problem Selection

```
User visits /dashboard
        │
        ▼
Clerk Middleware (Edge) checks session token
        │
   ┌────▼────────────┐
   │ Unauthenticated │──► Redirect to /sign-in (Clerk hosted UI)
   └────┬────────────┘
        │ Authenticated
        ▼
DashboardPage (Server Component)
   └─► ProblemRepository.getProblemsWithUserProgress(userId)
         └─► SELECT problems LEFT JOIN user_progress ON user_id
        │
        ▼
Renders problem table with status badges (PASS ✓ / FAIL ✗ / Unsolved ●)
User sets Difficulty Dial (DifficultySelector → saves to localStorage)
User clicks "Solve" → navigates to /interview/[slug]
```

### Flow B: The "Think Out Loud" Gate

This is the primary mechanism that enforces verbal reasoning before code is written.

```
InterviewPage mounts
        │
        ├─► Reads difficultyLevel from localStorage
        ├─► Sets persona name + initial greeting message
        ├─► Fetches problem: GET /api/problems/[id]
        └─► Starts 45-minute countdown timer
        │
        ▼
Code editor is LOCKED (blur overlay + Lock icon displayed)
        │
User types verbal approach in chat → POST /api/chat
        │
        ▼
Gemini evaluates approach against problem's optimal_time + optimal_space
        │
   ┌────▼──────────────────────────────────────────────────┐
   │ AI response does NOT contain [EDITOR_UNLOCKED]        │
   │ AI interrogates complexity, edge cases, or logic gaps  │
   └────┬──────────────────────────────────────────────────┘
        │ (conversation continues)
        ▼
   ┌────▼──────────────────────────────────────────────────┐
   │ AI response CONTAINS [EDITOR_UNLOCKED]                │
   │ (candidate demonstrated a valid optimal approach)     │
   └────┬──────────────────────────────────────────────────┘
        │
        ▼
setIsCodeUnlocked(true) → Monaco editor becomes fully editable
[EDITOR_UNLOCKED] token is stripped from the displayed message
```

> **Implementation note:** `[EDITOR_UNLOCKED]` is an out-of-band sentinel token injected via the AI system prompt and detected via `String.includes()` on the streaming response. It is never rendered in the chat UI.

### Flow C: Code Submission & Final Grading

```
User clicks "Propose Solution"
        │
        ▼
Frontend constructs a strict grading prompt:
  "Evaluate ONLY the code in the editor. Do NOT ask further questions.
   End with EXACTLY [RESULT: PASS] or [RESULT: FAIL]."
        │
        ▼
POST /api/chat (same streaming endpoint, persona-aware)
        │
        ▼
InterviewService pipeline:
  1. sessionRepository.createSession()       ← ON CONFLICT DO NOTHING (idempotent)
  2. sessionRepository.addMessageToSession() ← saves user message
  3. aiService.generateInterviewResponseStream()
  4. ReadableStream: streams chunks to client AND accumulates full response
  5. On stream end: sessionRepository.addMessageToSession() ← saves full AI response
        │
        ▼
Client reads streaming body chunk-by-chunk
  └─► Watches for [RESULT: PASS] or [RESULT: FAIL] token (hasGraded guard prevents double-fire)
        │
   ┌────▼──────────────────────────────────────────────────┐
   │ Token detected                                        │
   │ setIsLocked(true) — session concluded, UI frozen      │
   └────┬──────────────────────────────────────────────────┘
        │
        ▼
POST /api/session/complete { problemSlug, finalResult }
        │
        ▼
ProblemRepository.updateUserProgress(userId, slug, 'PASS' | 'FAIL')
  └─► INSERT INTO user_progress ON CONFLICT (user_id, slug) DO UPDATE
```

---

## 7. API Reference

### `POST /api/chat`

Streams an AI interview response. Requires a valid Clerk session.

**Request Body:**
```jsonc
{
  "userMessage": "I'll use a two-pointer approach with a running minimum...",
  "currentCode": "#include <vector>\n...",   // Current Monaco editor contents
  "language": "cpp",                         // cpp | java | python | javascript | typescript | sql
  "sessionId": "550e8400-e29b-...",          // crypto.randomUUID() — generated on client mount
  "problemTitle": "Best Time to Buy and Sell Stock",
  "optimalTime": "O(n)",
  "optimalSpace": "O(1)",
  "difficultyLevel": 3,                      // 1 | 2 | 3
  "previousMessages": [                      // Full in-memory chat history for context
    { "role": "ai",   "content": "I am ready. Walk me through your approach." },
    { "role": "user", "content": "I was thinking of brute force first..." }
  ]
}
```

**Response:** `200 OK`, `Content-Type: text/plain; charset=utf-8`, streaming body (raw text chunks).

Special out-of-band tokens embedded in the response stream:
| Token | Client Action |
|---|---|
| `[EDITOR_UNLOCKED]` | `setIsCodeUnlocked(true)`, token stripped from display |
| `[RESULT: PASS]` | `setIsLocked(true)`, triggers `POST /api/session/complete` with `"PASS"` |
| `[RESULT: FAIL]` | `setIsLocked(true)`, triggers `POST /api/session/complete` with `"FAIL"` |

**Error Responses:**
| Status | Condition |
|---|---|
| `401` | No Clerk session present |
| `500` with `fetch failed` in body | Neon DB cold-start timeout; user-friendly retry message returned |
| `500` with `CRITICAL ERROR: ...` | Unexpected Gemini or server error |

---

### `GET /api/problems/[slug]`

Fetches a single problem's full definition including boilerplate code.

**Response:** `200 OK`
```jsonc
{
  "slug": "valid-parentheses",
  "title": "Valid Parentheses",
  "description": "Given a string s containing...",  // Markdown-formatted string
  "optimal_time": "O(n)",
  "optimal_space": "O(n)",
  "boilerplate_cpp": "#include <string>\n#include <stack>\n..."
}
```

---

### `POST /api/session/complete`

Persists the final grading result for a problem. Requires a valid Clerk session.

**Request Body:**
```jsonc
{
  "problemSlug": "valid-parentheses",
  "finalResult": "PASS"   // "PASS" | "FAIL"
}
```

**Response:** `200 OK`
```jsonc
{ "success": true }
```

**Error Responses:**
| Status | Condition |
|---|---|
| `401` | No Clerk session |
| `400` | Missing `problemSlug` or `finalResult` |
| `500` | DB write failure |

---

## 8. Data Model

The database is a **Neon PostgreSQL** instance accessed via the `@neondatabase/serverless` HTTP driver — no persistent TCP connections, compatible with serverless and Edge runtimes.

### Schema

```sql
-- Core problem definitions (seeded from problems.json)
CREATE TABLE problems (
  slug            TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  optimal_time    TEXT,
  optimal_space   TEXT,
  boilerplate_cpp TEXT
);

-- One session per (user × problem × attempt)
CREATE TABLE sessions (
  id              UUID PRIMARY KEY,
  user_id         TEXT NOT NULL,         -- Clerk user ID (e.g. "user_abc123xyz")
  problem_title   TEXT NOT NULL,
  difficulty_mode TEXT NOT NULL,         -- "The Guide" | "The Standard Interviewer" | "The Bar-Raiser"
  status          TEXT DEFAULT 'In Progress',  -- 'In Progress' | 'Completed'
  score           INTEGER,               -- Reserved: future numeric scoring
  feedback        TEXT,                  -- Reserved: AI-generated post-session summary
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Full chat message log per session (provides AI context window)
CREATE TABLE messages (
  id          SERIAL PRIMARY KEY,
  session_id  UUID NOT NULL REFERENCES sessions(id),
  role        TEXT NOT NULL,             -- 'user' | 'ai'
  content     TEXT NOT NULL,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);

-- Best outcome per user per problem; upserted on session complete
CREATE TABLE user_progress (
  user_id  TEXT NOT NULL,               -- Clerk user ID
  slug     TEXT NOT NULL REFERENCES problems(slug),
  status   TEXT NOT NULL,               -- 'PASS' | 'FAIL'
  PRIMARY KEY (user_id, slug)
);
```

> **Deferred:** The originally planned `Submission` table (`language`, `code_snippet`, `execution_time`, `memory_used`, `passed_cases`) is not yet created. It will be introduced when Judge0 integration is implemented (see §11).

### Entity Relationships

```
Clerk User (external)
     │
     ├──< sessions >── problems
     │        │
     │        └──< messages
     │
     └──< user_progress (slug FK → problems)
```

### Database Resilience

`lib/db.ts` exports a `withRetry<T>(dbCall, retries = 3)` utility that retries transient failures (Neon cold starts) with a fixed 1500ms delay between attempts. Used by all write operations in `sessionRepository`.

---

## 9. AI Engine Design

### Client Initialization

`lib/ai.ts` exports a singleton `GoogleGenAI` instance. The Gemini API key is read from the `GEMINI_API_KEY` environment variable server-side and is **never** sent to the browser.

### Prompt Architecture

`AiService.generateInterviewResponseStream()` composes a Gemini multi-turn request with three logical layers:

**Layer 1 — System Instruction (Persona + Rules)**

Dynamically selected by `InterviewService` based on `difficultyLevel`, then extended with:
```
FORMATTING RULES:
- Always use Markdown.
- Use bullet points when listing multiple issues.
- Add double line breaks between paragraphs for readability.
- Use inline code backticks for variable/function names.
- THINK OUT LOUD GATE: Candidate MUST explain their approach before writing code.
  Interrogate their logic. Once their approach matches the optimal time AND space
  complexity, append EXACTLY the string [EDITOR_UNLOCKED] to the end of your message.
```

**Layer 2 — Conversational History**

Prior messages from client state formatted as `{role: "user"|"model", parts: [{text}]}`. Empty messages are filtered out before being sent.

**Layer 3 — Current Turn (State Injection)**

```
[CURRENT INTERVIEW STATE]
Problem: "Best Time to Buy and Sell Stock"
Target Time Complexity: O(n)
Target Space Complexity: O(1)

[CANDIDATE'S CURRENT CODE (cpp)]
```cpp
<current editor contents>
```

[CANDIDATE'S LATEST MESSAGE]
"I'll track a running minimum and compute profit at each index."

Respond to the candidate's latest message in character as 'The Bar-Raiser'.
Do NOT repeat questions you have already asked in the chat history.
```

### Streaming Pipeline

```
Gemini SDK
  └─► generateContentStream() → AsyncIterable<GenerateContentResponse>
        │
        ▼ AiService.generateInterviewResponseStream()
        │  └─► async function* streamGenerator() { yield chunk.text }
        │
        ▼ InterviewService.handleChatMessage()
        │  └─► new ReadableStream({ start(controller) {
        │          for await (chunk of aiStream) {
        │            fullAiResponse += chunk;
        │            controller.enqueue(encode(chunk)); // → client
        │          }
        │          await saveAiMessageToDB(fullAiResponse); // → DB
        │        }})
        │
        ▼ Route Handler
        │  └─► return new Response(stream)
        │
        ▼ Browser
           └─► res.body.getReader() → read loop → update React state
```

This **tee-style** architecture streams to the client in real time while building the full response in memory for a single DB write on completion — no second round trip needed.

### Persona Definitions

| Level | Persona Name | Instruction Summary |
|---|---|---|
| 1 | **The Guide** | Friendly, encouraging, gives gentle hints, collaboratively guides toward optimal complexity without providing the answer directly |
| 2 | **The Standard Interviewer** | Professional, neutral, objective, points out bugs, requests complexity analysis, allows struggle but hints if stuck too long |
| 3 | **The Bar-Raiser** *(default)* | Elite, relentless, highly critical, expects production-ready code, probes edge cases, never gives away the answer |

---

## 10. Security & Privacy

### Authentication & Route Protection
- All protected routes (`/dashboard/**`, `/interview/**`) are guarded by `clerkMiddleware` in `middleware.ts`, which runs at the **Edge** before any server component or handler executes.
- Unauthenticated requests are automatically redirected to `/sign-in`.
- All API route handlers perform a server-side `auth()` call and short-circuit with `401` if no session is present — protecting against direct API calls that bypass the UI.

### API Key Isolation
- `GEMINI_API_KEY`, `DATABASE_URL`, and `CLERK_SECRET_KEY` are server-only environment variables.
- No secrets are exposed to the browser bundle or client components.

### Code Execution Security
- User-written code is **never executed on the Next.js server**.
- The Monaco editor is a display surface only; submission sends the code as a plain text string to the AI for review.
- Future Judge0 integration will route all execution to an isolated sandbox with CPU/memory/time limits.

### SQL Injection Prevention
- All database queries use parameterized tagged-template literals provided by `@neondatabase/serverless`. User-supplied strings are never interpolated directly into SQL.

### Denial-of-Service Mitigations
- **Current:** None beyond Clerk's built-in session validation.
- **Planned:** Per-user rate limiting on `/api/chat` and `/api/session/complete` to prevent LLM API abuse and DB exhaustion.

---

## 11. Known Limitations & Future Work

| Item | Priority | Status | Notes |
|---|---|---|---|
| **Judge0 code execution sandbox** | 🔴 High | Deferred | Core original goal; blocked on hosting or RapidAPI quota. Needed for test-case pass/fail validation. |
| **`Submission` table** | 🔴 High | Deferred | Depends on Judge0. Will track `language`, `code_snippet`, `execution_time`, `memory_used`, `passed_cases`. |
| **Session history reload on page refresh** | 🟡 Medium | Not started | `messages` state is in-memory only. Refreshing the page loses the conversation. Fix: load from `messages` table on mount using `sessionId`. |
| **Rate limiting on API routes** | 🟡 Medium | Not started | No per-user request limits on `/api/chat` or `/api/session/complete`. |
| **`boilerplate_java` and other languages** | 🟡 Medium | Not started | Only `boilerplate_cpp` is seeded. Java/Python/JS/TS/SQL show a generic placeholder comment. |
| **`sessions.score` and `sessions.feedback`** | 🟢 Low | Schema only | Columns are defined but never written. Intended for a post-interview AI summary generation step. |
| **LLD problem type** | 🟢 Low | Not started | Requires a different schema (no boilerplate code, open-ended textual evaluation). |
| **Dashboard analytics** | 🟢 Low | Not started | No per-user stats (total solved, pass rate by difficulty, time averages). |
| **Bulk problem seeding documentation** | 🟢 Low | Not started | `scripts/bulk_fetch.ts` is undocumented. Should be described in README. |
