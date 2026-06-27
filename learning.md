# AI Investment Research Agent — Backend Learning Log

This document serves as a study reference guide for key backend concepts. It covers the theoretical principles and practical code implementations used in this project to help you consolidate your understanding.

---

## 1. MVC & Layered Architecture (Separation of Concerns)

### Theoretical Understanding
In backend development, **Separation of Concerns (SoC)** is the design principle of dividing a computer program into distinct sections, such that each section addresses a separate concern. 
If we put database queries, API routing, server configurations, and AI prompts in a single file:
1. It becomes extremely difficult to test (you can't test your AI logic without booting up the server).
2. Debugging is hard since errors can originate from anywhere.
3. Multiple developers cannot work on the project at the same time without merge conflicts.

We solve this by separating the code into layers:
- **Routes (Road Sign)**: Inspects the URL and HTTP verb (GET/POST) and maps it to a Controller.
- **Controllers (Dispatcher)**: Reads request headers, cookies, query parameters, or bodies. Calls the correct services and sends the response.
- **Services (Worker)**: Performs calculations, calls external databases, or queries APIs.
- **Agent (AI Brain)**: Executes LLM actions.

### Practical Example
Here is how a request flows through our backend layers:
```text
Client Request ──> Route (/api/research) ──> Controller ──> Agent Graph ──> Service (Yahoo Finance)
                                                │
                                                └─── SSE Stream Response ──> Client UI
```

---

## 2. CORS (Cross-Origin Resource Sharing)

### Theoretical Understanding
**CORS** is a browser security mechanism. By default, browsers enforce the **Same-Origin Policy**, which prevents scripts on one website (e.g. `http://localhost:5173`) from making API calls to a different domain or port (e.g. `http://localhost:5000`) without explicit permission from the server.

If the backend server does not include the correct headers in its response, the browser blocks the frontend from reading the API response, resulting in a console error:
`Access to fetch at 'http://localhost:5000/api/research' from origin 'http://localhost:5173' has been blocked by CORS policy.`

### Practical Code Example
In Express, we configure the server to return the `Access-Control-Allow-Origin` header using the `cors` package:
```typescript
import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow ONLY our Vite frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```
When Vite calls the API, Express attaches:
`Access-Control-Allow-Origin: http://localhost:5173`
in the response headers, which tells the browser it is safe to release the data to React.

---

## 3. Server-Sent Events (SSE) vs WebSockets

### Theoretical Comparison
When an operation takes a long time (like our multi-step AI agent which runs for 10-15 seconds), we cannot use a simple HTTP request because the browser will wait in a frozen state. We have two main choices for real-time updates:

| Feature | Server-Sent Events (SSE) | WebSockets |
| :--- | :--- | :--- |
| **Communication** | One-way (Server $\rightarrow$ Client) | Two-way (Bi-directional) |
| **Protocol** | Standard HTTP | WebSocket Custom Protocol (`ws://`) |
| **Complexity** | Extremely simple (uses standard HTTP request) | High (requires separate handshake & socket management) |
| **Reconnection** | Built-in automatic reconnection | Must be implemented manually |
| **Best Used For** | Log streaming, ChatGPT-like text generation | Multi-player games, real-time chat widgets |

For our stock agent, we only need the server to send logs to the client. The client doesn't need to speak back during the calculation. Therefore, **SSE** is the simplest and most efficient protocol.

### Practical Code Example (Express SSE Endpoint)
```typescript
app.post('/api/research', (req, res) => {
  // 1. Tell browser we are streaming text, not sending a single JSON
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // 2. Stream message chunks
  res.write('data: {"status": "Starting node..."}\n\n');
  
  // 3. Complete stream when finished
  res.write('event: complete\ndata: {}\n\n');
  res.end();
});
```

---

## 4. JWT Authentication (JSON Web Tokens)

### Theoretical Understanding
JWT is a compact, URL-safe way of representing claims to be transferred between two parties. It is used to verify who you are without the server having to look up your session in a database on every single request.

A JWT consists of 3 parts separated by dots: `header.payload.signature`
1. **Header**: Declares the token type (JWT) and encryption algorithm (HS256).
2. **Payload**: Contains user data (e.g. user ID, email). Never put passwords here because it is just Base64 encoded and can be read by anyone.
3. **Signature**: Validates that the token has not been tampered with. It is created by taking the encoded header, encoded payload, and signing them with a secret key known only to the backend.

```text
  [Header]  .  [Payload]  .  [Signature]
 (Base64Url)  (Base64Url)   (HMAC-SHA256)
```

### Practical Code Example
Signing a token in a controller:
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id, email: user.email }, // Payload
  process.env.JWT_SECRET || 'secretkey',  // Secret key
  { expiresIn: '7d' }                      // Options
);
```

Checking the token in middleware:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded; // Attach user claims to req object
    next();             // Pass to controller
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
}
```

---

## 5. LangGraph.js: State Graphs & Graph Execution Loops

### Theoretical Understanding
Instead of writing an LLM prompt that tries to fetch data and write an analysis in one single command (which fails for complex tasks), **LangGraph.js** models the task as a **State Machine**.
- **State**: The single source of truth containing all research data.
- **Nodes**: Functions that perform specialized sub-tasks (resolving symbol $\rightarrow$ fetching quote $\rightarrow$ fetching news $\rightarrow$ writing decision). Each node takes the current state and returns updates to it.
- **Edges**: Paths connecting the nodes. They dictate which node runs next.

By breaking the code into nodes, we gain complete control over the execution loop. If the news fetch fails, the app still progresses to the SWOT node using whatever financial numbers were collected.

### Practical Flow
We compile nodes and invoke the graph:
```typescript
const result = await graph.invoke({ query: 'Apple Inc.' });
console.log(result.ticker); // 'AAPL'
console.log(result.decision); // 'INVEST'
```
During execution, each node runs sequentially, making updates to the global state object before saving the final thesis markdown in the output state.

---

## 6. Database Integration in AI Projects

### Theoretical Understanding
Do we need a database for this project?
For a bare minimum submission, no. You can save history in the browser's `localStorage`. However, for a **production-grade or assignment-winning application**, a database is highly recommended:
1. **Caching LLM Reports (Save Token Costs)**: Running our AI agent takes news headlines, details, and prompts, costing API tokens (Gemini or OpenAI). If two users search for "TSLA", we can check our database first. If we have a report generated recently (e.g. within 24 hours), we return it instantly. This is called a **write-through cache**.
2. **User Profiles & History**: Keeping search history in `localStorage` means a user loses their history if they switch browsers or clear their cookies. A database links history to the user's account.

### Practical Architecture
For this project, **SQLite** or **MongoDB** is excellent. SQLite is a file-based SQL database, meaning it doesn't require installing any external software—it runs in a simple file like `database.sqlite` inside the backend directory.

---

## 7. Hybrid Authentication (JWT + Session / Refresh Token)

### Theoretical Understanding
- **Pure JWT Auth**: Completely stateless. The server issues a token and forgets it.
  - *Problem*: If a user's account is compromised, you cannot force logout or revoke their token because it remains cryptographically valid until its expiration time.
- **Pure Session Auth**: State is kept on the server (in memory or Redis). On every single database lookup, we query the session.
  - *Problem*: Slows down performance for microservices and doesn't scale without database caching layers.
- **Hybrid Auth (Access + Refresh Tokens)**:
  - **Access Token (Short-lived JWT, e.g. 15 minutes)**: Stored in memory or headers. Used to authenticate fast, stateless requests.
  - **Refresh Token (Long-lived Token, e.g. 7 days)**: Stored in a database and sent via a secure `HttpOnly` cookie.
  - *How it works*: When the Access Token expires, the frontend calls `/api/auth/refresh`. The backend checks the Refresh Token against the database. If it is valid and hasn't been revoked, it issues a new Access Token.
  - *Why it wins*: You get the speed of stateless verification for active API operations, combined with the absolute control of stateful sessions (you can delete a Refresh Token from the DB, instantly logging out the user).

### Practical Flow
1. **Login**: Server generates `accessToken` and `refreshToken`. Stores `refreshToken` in DB.
2. **Accessing API**: Client attaches `accessToken` in request header: `Authorization: Bearer <token>`. Server verifies it statelessly in middleware.
3. **Token Expiry**: If `accessToken` is expired (errors with 401), client calls `/api/auth/refresh` sending the cookie.
4. **Revocation/Logout**: Server deletes the `refreshToken` from the database. The user is instantly logged out because their refresh attempt will fail.

---

## 8. Database Engines vs ORMs (Drizzle ORM, SQLite & MySQL)

### Theoretical Understanding
It is important to separate **Database Engines** (the storage systems) from **ORMs** (the code tools that communicate with them).

1. **Database Engine (Where data resides)**:
   - **SQLite**: A file-based SQL database. The database is literally a local file on your machine (e.g. `dev.db`). No servers to install, no passwords, no ports to open. 
   - **MySQL**: A client-server database. You must install a MySQL Server program, configure ports (`3306`), set a root password, and keep the service running in the background.

2. **ORM (Object-Relational Mapper - How code interacts with DB)**:
   - **Drizzle ORM** is a TypeScript-first ORM. It sits *between* your backend code and the database engine.
   - Drizzle supports *both* MySQL and SQLite.
   - Instead of writing raw SQL strings (`SELECT * FROM users`), you write TypeScript objects. Drizzle compiles your TypeScript commands into the SQL format required by the database you are using.

```text
  TypeScript Code ──> Drizzle ORM ──> [Compiles to SQL] ──> Database Engine (SQLite or MySQL)
```

### Side-by-Side Comparison

| Feature | SQLite | MySQL |
| :--- | :--- | :--- |
| **Setup** | Zero-install. (Database is just a local `.db` file). | Requires installing MySQL server or Docker setup. |
| **Port** | None. Reads/writes directly to the file system. | Custom network ports (Default: `3306`). |
| **Concurrency** | Good for single/light users. Locks during heavy simultaneous writes. | Excellent. Handles thousands of active parallel users. |
| **Best For** | Local development, mobile apps, low-traffic websites, simple submissions. | Large-scale production web apps, cloud hosting. |

### Practical Code Comparison (Drizzle ORM Setup)

Drizzle keeps your queries the same. Only the initialization step changes:

#### A. Initializing SQLite with Drizzle:
```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite);
```

#### B. Initializing MySQL with Drizzle:
```typescript
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'mypassword',
  database: 'research_db',
  port: 3306
});

export const db = drizzle(pool);
```

#### C. Running Queries (Exactly the same for both!):
```typescript
// Insert a user (Drizzle syntax is identical regardless of SQLite or MySQL engine!)
await db.insert(users).values({
  email: 'intern@insideiim.com',
  name: 'Candidate'
});

// Fetch reports
const reports = await db.select().from(researchReports);
```

---

## 9. Technical Interview Prep — Stack Selection & Rationale

When interviewing for Full-Stack or AI roles, developers must explain *why* they chose specific tools. This guide details typical questions and standard answers.

### 1. Frontend: Vite + React vs Next.js
* **Question**: Why choose Vite + React instead of Next.js for this project?
* **Theoretical Rationale**: Next.js is designed for Server-Side Rendering (SSR) and search indexing (SEO). For a dashboard where data is loaded client-side via active search triggers and logs are streamed dynamically, SSR is unnecessary. Vite provides a fast, lightweight SPA (Single Page Application) container.
* **Alternative**: Next.js, Remix, or Svelte.
* **Production Scaling**: Keep the main application dashboard as a Client-Side React SPA behind user auth, but host the marketing landing page on Next.js to rank on Google.

### 2. State: Redux Toolkit vs React Context API
* **Question**: Why use Redux Toolkit (RTK) instead of standard Context API?
* **Theoretical Rationale**: Standard Context API triggers a full re-render of all components in its tree whenever any context property changes. Redux Toolkit provides granular subscriptions (selectors). In our dashboard, logs are streamed frequently and charts refresh continuously. Redux avoids unnecessary re-renders and manages nested slices cleanly.
* **Alternative**: Zustand (lighter and modern), MobX, or React Context.

### 3. Backend: Node.js (Express) vs Python
* **Question**: Why build the backend API in Node.js instead of Python, since Python is the AI standard?
* **Theoretical Rationale**: Python is the standard for training local ML models, but our server functions as an API orchestrator. Node.js is asynchronous and event-driven, which makes streaming Server-Sent Events (SSE) highly performant. Using TypeScript on both client and server allows shared models and interfaces.
* **Alternative**: Python (FastAPI/Flask) or Go.
* **Production Scaling**: If custom ML sentiment classifiers or local embeddings are required, spin them up on a separate microservice in Python (FastAPI) and query them from the main Express gateway.

### 4. Database: MySQL vs SQLite
* **Question**: Why choose MySQL instead of SQLite for the final DB?
* **Theoretical Rationale**: SQLite runs inside a local file system. If the backend is hosted on a free cloud server (like Render), the file system is reset during restarts, erasing the SQLite file. MySQL runs as a separate database service, supporting robust concurrent writes, secure network connections, and permanent backups.
* **Alternative**: PostgreSQL, SQLite, or MongoDB (NoSQL).

### 5. ORM: Drizzle ORM vs Prisma ORM
* **Question**: Why choose Drizzle ORM instead of Prisma ORM?
* **Theoretical Rationale**: Prisma loads a heavy Rust binary query engine in the background, which increases cold starts and server load times on serverless platforms. Drizzle is a lightweight TypeScript-first ORM. It generates zero-overhead SQL commands directly and allows writing queries using standard object structures.
* **Alternative**: Prisma ORM, Sequelize, or raw SQL strings.

### 6. AI: LangGraph.js vs Simple LLM Prompt
* **Question**: Why build a LangGraph workflow instead of a single LLM query?
* **Theoretical Rationale**: Trying to run ticker resolution, financial sheet analysis, SWOT generation, and recommendation checks in a single LLM call causes hallucinations, errors, and context window issues. LangGraph builds a **Stateful Multi-Agent Workflow** where each node has a single responsibility. This gives developer transparency, node error handling, and streams step progress logs dynamically.
* **Alternative**: LangChain chains, LlamaIndex, or building manual callback loops.
