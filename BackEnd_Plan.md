# AI Investment Research Agent — Backend Plan

This document details the architecture, file organization, frontend-backend communications, user authentication options, and the integration of LangChain and LangGraph.js on the Express server.

---

## 1. Clean Layered Architecture (MVC Style)

To keep the backend organized, modular, and easy to maintain, we will adopt a layered architecture based on MVC (Model-View-Controller) principles. In API services, **Controllers** handle HTTP requests/responses, **Services** handle business logic (like calling Yahoo Finance), and **Agents** handle AI processing.

```text
backend/
├── src/
│   ├── index.ts                  # Server entry & initialization
│   ├── config/
│   │   └── dotenv.ts             # Environment configuration manager
│   ├── routes/
│   │   ├── researchRoutes.ts     # Route definitions for AI / stock queries
│   │   └── authRoutes.ts         # Authentication routes (Login, Register, Logout)
│   ├── controllers/
│   │   ├── researchController.ts # Logic for handling query request & SSE stream response
│   │   └── authController.ts     # Logic for sign-in, tokens, and registration
│   ├── services/
│   │   ├── yahooFinance.ts       # Service layer pulling stock metrics and news
│   │   └── llmService.ts         # Node model loaders (Gemini vs OpenAI)
│   ├── middlewares/
│   │   ├── authMiddleware.ts     # JWT validator protecting endpoints
│   │   └── errorMiddleware.ts    # Centralized Express error handler
│   ├── agent/
│   │   ├── graph.ts              # LangGraph compilation layout
│   │   ├── state.ts              # State schema specifications
│   │   └── nodes.ts              # Individual step processors (tools and solvers)
│   └── types/
│       └── index.ts              # Shared TypeScript definitions
```

### Purpose of Each Layer & File
- **`src/index.ts`**: The entry point. Boots the Express app, configures global middlewares (CORS, body parser), and registers route mounts.
- **`src/routes/`**: Handles path routing. Directs HTTP paths (e.g. `/api/research`) to the correct controller actions.
- **`src/controllers/`**: Extracts data from HTTP requests (params, body), coordinates service calls, and forms HTTP/SSE responses. Doesn't write SQL or directly trigger models.
- **`src/services/`**: Reusable business units. Fetches data from Yahoo Finance or performs helper operations.
- **`src/middlewares/`**: Interceptors. Runs checks (like confirming the user is authenticated via headers) before hitting controller endpoints.
- **`src/agent/`**: The core AI logic. Defines the LangGraph workflow structure. It runs outside Express routes, making it completely testable in CLI files.

---

## 2. Frontend-Backend Connection Details

Since the client (React at port `5173`) and server (Express at port `5000`) run on different origins, they require a clean handshaking structure.

### 1. CORS Configuration (Cross-Origin Resource Sharing)
By default, browsers block frontend scripts from reading backend APIs on separate ports. We will use the `cors` Express package:
```typescript
app.use(cors({
  origin: 'http://localhost:5173', // Only allow our React frontend
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 2. Communication Protocols
- **HTTP POST (`/api/research`) with Server-Sent Events (SSE)**:
  - Performing a complete stock research cycle takes 10 to 15 seconds. If we used standard JSON HTTP, the frontend would freeze in a loading state.
  - Instead, we set headers `Content-Type: text/event-stream` and stream execution updates node-by-node (e.g., when the ticker is resolved, it streams an update; when financials are extracted, it streams another).
- **HTTP POST (`/api/auth/register` and `/api/auth/login`)**:
  - Standard JSON requests that return user parameters and JWT tokens.

---

## 3. User Authentication Options

To secure the application and allow users to save their research histories on the cloud, we need authentication. Here are the top 5 options suitable for this project:

### Option A: Custom JWT Authentication (Recommended for Learning)
- **What is it?**: You build registration and login routes manually using `bcryptjs` (to hash passwords) and `jsonwebtoken` (to sign tokens). Passwords are saved in a local database (like PostgreSQL or MongoDB), and the client sends the token in the `Authorization` header.
- **Pros**: Gives you complete control over your database; provides the best backend learning experience for understanding how cookies, tokens, and headers work.
- **Cons**: You have to manage password resets, session expirations, and security risks manually.

### Option B: Firebase Authentication (Fastest Implementation)
- **What is it?**: A Google-hosted authentication service. Google manages sign-up pages, tokens, and passwords. You just import the Firebase SDK in your frontend and backend.
- **Pros**: Built-in integrations for Gmail/GitHub login; zero database security setup.
- **Cons**: Heavy lock-in to Google Firebase; harder to write custom backend logic during authentication hooks.

### Option C: Auth0 / Clerk (Premium Modern Developer Standard)
- **What is it?**: Third-party SaaS services that provide pre-made react login cards and handle token validations.
- **Pros**: Beautiful out-of-the-box UI screens; supports passwordless/magic links.
- **Cons**: High costs after free tier limits; clerk requires internet connection and specific middleware structures.

### Option D: Supabase Auth (Best for SQL DBs)
- **What is it?**: Open-source alternative to Firebase. If you choose PostgreSQL as your database, Supabase provides database storage and user authentication in one package.
- **Pros**: Matches PostgreSQL tables perfectly; handles social logins easily.
- **Cons**: Forces you to use Supabase client methods instead of raw SQL/Express controllers.

---

## 4. LangChain and LangGraph.js Integration

We integrate LangChain and LangGraph.js inside the **`src/agent/`** directory.

### 1. State Definition (`state.ts`)
We define what data gets shared across execution steps. We use `Annotation.Root` from `@langchain/langgraph` to create a TypeScript-safe state map.

### 2. Node Implementations (`nodes.ts`)
Each node is a normal TypeScript function that:
1. Receives the current state.
2. Performs an action (e.g. queries Yahoo Finance or calls a LangChain model).
3. Returns a partial update to the state.
```typescript
export async function resolveTickerNode(state: AgentState) {
  const result = await yahooFinance.search(state.query);
  return { ticker: result.symbol }; // Updates State
}
```

### 3. Graph Compilation (`graph.ts`)
We connect nodes using edges and compile the workflow:
```typescript
import { StateGraph, START, END } from '@langchain/langgraph';
import { resolveTickerNode, fetchDataNode } from './nodes';
import { AgentStateAnnotation } from './state';

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('resolveTicker', resolveTickerNode)
  .addNode('fetchData', fetchDataNode)
  .addEdge(START, 'resolveTicker')
  .addEdge('resolveTicker', 'fetchData')
  .addEdge('fetchData', END);

export const graph = workflow.compile();
```

### 4. SSE Stream execution in Route Controllers
When Express receives a query, it starts the graph stream:
```typescript
const stream = await graph.stream({ query, llmProvider: 'gemini' });
for await (const chunk of stream) {
  // Find which node just finished executing
  const nodeName = Object.keys(chunk)[0];
  const nodeData = chunk[nodeName];
  
  // Write this data to the HTTP SSE channel
  res.write(`data: ${JSON.stringify({ node: nodeName, ...nodeData })}\n\n`);
}
```
This sends live progress logs to the React client!
