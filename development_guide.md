# AI Investment Research Agent — Complete Development Guide

This guide contains the step-by-step setup commands and the complete code for every file in the project. Follow this guide to build the application locally.

---

## 1. Directory Structure

Create the following folder structure in your workspace:
```text
inside-iim-project/
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   └── lib/
│   │       ├── yahooFinance.ts
│   │       └── agent/
│   │           ├── state.ts
│   │           ├── nodes.ts
│   │           └── graph.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css
    │   └── components/
    │       ├── StockChart.tsx
    │       ├── SentimentFeed.tsx
    │       ├── FinancialTable.tsx
    │       └── ExecutionTracker.tsx
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── index.html
```

---

## 2. Backend Setup & Code

### Step 2.1: Initialize Backend Directory
Navigate to the root directory and run:
```bash
mkdir backend
cd backend
npm init -y
```

### Step 2.2: Create `backend/package.json`
Save the following file in `backend/package.json`:
```json
{
  "name": "investment-agent-backend",
  "version": "1.0.0",
  "description": "Express server running the LangGraph AI Investment Research Agent",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@langchain/core": "^0.3.0",
    "@langchain/google-genai": "^0.1.1",
    "@langchain/langgraph": "^0.2.0",
    "@langchain/openai": "^0.3.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "yahoo-finance2": "^2.11.3"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.12",
    "tsx": "^4.10.5",
    "typescript": "^5.4.5"
  }
}
```

### Step 2.3: Create `backend/tsconfig.json`
Save the following file in `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

### Step 2.4: Create `backend/.env`
Save the following file in `backend/.env`. Replace with your actual keys:
```env
PORT=5000
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
DEFAULT_PROVIDER=gemini
```

### Step 2.5: Create `backend/src/lib/yahooFinance.ts`
This helper wraps the `yahoo-finance2` library to scrape quote, profile, financials, news, and history:
```typescript
import yahooFinance from 'yahoo-finance2';

yahooFinance.setGlobalConfig({
  validation: { logErrors: false }
});

export interface HistoricalPricePoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface CompanyDetails {
  symbol: string;
  longName: string;
  shortName: string;
  industry?: string;
  sector?: string;
  longBusinessSummary?: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  peRatio?: number;
  pegRatio?: number;
  eps?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  debtToEquity?: number;
  operatingMargins?: number;
  profitMargins?: number;
  beta?: number;
  financials: {
    incomeStatement: any[];
    balanceSheet: any[];
    cashflowStatement: any[];
  };
  news: any[];
}

export async function searchTicker(query: string): Promise<{ symbol: string; name: string } | null> {
  try {
    const result = await yahooFinance.search(query);
    const firstResult = result.quotes.find((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');
    if (firstResult && firstResult.symbol) {
      return {
        symbol: firstResult.symbol,
        name: firstResult.longname || firstResult.shortname || firstResult.symbol
      };
    }
    if (result.quotes.length > 0 && result.quotes[0].symbol) {
      return {
        symbol: result.quotes[0].symbol,
        name: result.quotes[0].longname || result.quotes[0].shortname || result.quotes[0].symbol
      };
    }
    return null;
  } catch (error) {
    console.error(`Error searching ticker for "${query}":`, error);
    return null;
  }
}

export async function getHistoricalPrices(symbol: string, days: number = 365): Promise<HistoricalPricePoint[]> {
  try {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: today,
      interval: '1d'
    });

    if (!result || !result.quotes) return [];

    return result.quotes
      .filter((q) => q.date && q.close !== undefined)
      .map((q) => ({
        date: q.date instanceof Date ? q.date.toISOString().split('T')[0] : String(q.date).split('T')[0],
        close: q.close || 0,
        open: q.open || 0,
        high: q.high || 0,
        low: q.low || 0,
        volume: q.volume || 0
      }));
  } catch (error) {
    console.error(`Error fetching historical prices for "${symbol}":`, error);
    return [];
  }
}

export async function getCompanyDetails(symbol: string): Promise<CompanyDetails | null> {
  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote) return null;

    let news: any[] = [];
    try {
      const searchResult = await yahooFinance.search(symbol);
      news = searchResult.news || [];
    } catch (e) {
      console.warn(`Could not fetch news for "${symbol}":`, e);
    }

    let incomeStatement: any[] = [];
    let balanceSheet: any[] = [];
    let cashflowStatement: any[] = [];
    let keyStats: any = {};
    let summaryProfile: any = {};

    try {
      const summaryResult = await yahooFinance.quoteSummary(symbol, {
        modules: [
          'incomeStatementHistory',
          'balanceSheetHistory',
          'cashflowStatementHistory',
          'defaultKeyStatistics',
          'summaryProfile'
        ]
      });

      if (summaryResult) {
        incomeStatement = summaryResult.incomeStatementHistory?.incomeStatementHistory || [];
        balanceSheet = summaryResult.balanceSheetHistory?.balanceSheetHistory || [];
        cashflowStatement = summaryResult.cashflowStatementHistory?.cashflowStatementHistory || [];
        keyStats = summaryResult.defaultKeyStatistics || {};
        summaryProfile = summaryResult.summaryProfile || {};
      }
    } catch (e) {
      console.warn(`Could not fetch quoteSummary for "${symbol}":`, e);
    }

    return {
      symbol: symbol,
      longName: quote.longName || quote.shortName || symbol,
      shortName: quote.shortName || symbol,
      industry: summaryProfile.industry,
      sector: summaryProfile.sector,
      longBusinessSummary: summaryProfile.longBusinessSummary,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      marketCap: quote.marketCap,
      peRatio: quote.trailingPE,
      pegRatio: keyStats.pegRatio,
      eps: quote.epsTrailingTwelveMonths,
      dividendYield: quote.trailingAnnualDividendYield ? quote.trailingAnnualDividendYield * 100 : undefined,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      debtToEquity: keyStats.debtToEquity,
      operatingMargins: quote.operatingMargins,
      profitMargins: quote.profitMargins,
      beta: keyStats.beta,
      financials: {
        incomeStatement: incomeStatement.map((item: any) => ({
          endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : 'N/A',
          totalRevenue: item.totalRevenue?.raw || null,
          grossProfit: item.grossProfit?.raw || null,
          netIncome: item.netIncome?.raw || null,
          operatingIncome: item.operatingIncome?.raw || null
        })),
        balanceSheet: balanceSheet.map((item: any) => ({
          endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : 'N/A',
          totalAssets: item.totalAssets?.raw || null,
          totalLiab: item.totalLiab?.raw || null,
          cash: item.cash?.raw || null,
          shortTermInvestments: item.shortTermInvestments?.raw || null,
          longTermDebt: item.longTermDebt?.raw || null
        })),
        cashflowStatement: cashflowStatement.map((item: any) => ({
          endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : 'N/A',
          totalCashFromOperatingActivities: item.totalCashFromOperatingActivities?.raw || null,
          capitalExpenditures: item.capitalExpenditures?.raw || null,
          freeCashflow: (item.totalCashFromOperatingActivities?.raw || 0) + (item.capitalExpenditures?.raw || 0)
        }))
      },
      news: news.map((item: any) => ({
        title: item.title,
        link: item.link,
        publisher: item.publisher,
        providerPublishTime: item.providerPublishTime,
        type: item.type
      }))
    };
  } catch (error) {
    console.error(`Error loading company details for "${symbol}":`, error);
    return null;
  }
}
```

### Step 2.6: Create `backend/src/lib/agent/state.ts`
Defines the state structure of the LangGraph state graph.
```typescript
import { Annotation } from '@langchain/langgraph';
import { CompanyDetails, HistoricalPricePoint } from '../yahooFinance';

export interface LogEntry {
  timestamp: string;
  stage: 'START' | 'RESOLVE' | 'FETCH_DATA' | 'FETCH_NEWS' | 'ANALYZE' | 'DECIDE' | 'ERROR';
  message: string;
}

export interface NewsSentiment {
  title: string;
  link: string;
  publisher: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export const AgentStateAnnotation = Annotation.Root({
  query: Annotation<string>,
  llmProvider: Annotation<'gemini' | 'openai'>,
  ticker: Annotation<string>,
  tickerName: Annotation<string>,
  companyDetails: Annotation<CompanyDetails | null>,
  historicalPrices: Annotation<HistoricalPricePoint[]>,
  newsSentiment: Annotation<NewsSentiment[]>,
  swotAnalysis: Annotation<SwotAnalysis | null>,
  decision: Annotation<'INVEST' | 'PASS' | 'HOLD'>,
  confidence: Annotation<number>,
  targetRange: Annotation<string>,
  investmentThesis: Annotation<string>,
  logs: Annotation<LogEntry[]>({
    reducer: (left, right) => left.concat(right),
    default: () => []
  }),
  error: Annotation<string | null>
});

export type AgentState = typeof AgentStateAnnotation.State;
```

### Step 2.7: Create `backend/src/lib/agent/nodes.ts`
Defines each node in the LangGraph process. Note how it dynamically adapts to OpenAI/Gemini:
```typescript
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AgentState, LogEntry, NewsSentiment, SwotAnalysis } from './state';
import { searchTicker, getCompanyDetails, getHistoricalPrices } from '../yahooFinance';
import * as dotenv from 'dotenv';

dotenv.config();

function createLog(stage: LogEntry['stage'], message: string): LogEntry {
  return { timestamp: new Date().toISOString(), stage, message };
}

function getLLM(provider: 'gemini' | 'openai'): BaseChatModel {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (provider === 'gemini' && geminiKey) {
    return new ChatGoogleGenAI({
      modelName: 'gemini-1.5-flash',
      apiKey: geminiKey,
      temperature: 0.1
    }) as any;
  } else if (provider === 'openai' && openaiKey) {
    return new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      openAIApiKey: openaiKey,
      temperature: 0.1
    });
  }
  if (geminiKey) return new ChatGoogleGenAI({ modelName: 'gemini-1.5-flash', apiKey: geminiKey, temperature: 0.1 }) as any;
  if (openaiKey) return new ChatOpenAI({ modelName: 'gpt-4o-mini', openAIApiKey: openaiKey, temperature: 0.1 });
  throw new Error('API Key missing. Please provide GEMINI_API_KEY or OPENAI_API_KEY in backend/.env.');
}

export async function resolveTickerNode(state: AgentState) {
  const query = state.query.trim();
  const logs = [createLog('START', `Research request received for query: "${query}"`)];

  try {
    const isTickerPattern = /^[A-Z0-9.\-]{1,6}$/i.test(query);
    if (isTickerPattern) {
      const details = await getCompanyDetails(query.toUpperCase());
      if (details) {
        logs.push(createLog('RESOLVE', `Ticker resolved directly: ${details.symbol} (${details.longName})`));
        return { ticker: details.symbol, tickerName: details.longName, logs };
      }
    }

    const searchRes = await searchTicker(query);
    if (searchRes) {
      logs.push(createLog('RESOLVE', `Ticker resolved via search: ${searchRes.symbol} (${searchRes.name})`));
      return { ticker: searchRes.symbol, tickerName: searchRes.name, logs };
    }

    logs.push(createLog('RESOLVE', `Yahoo Finance search failed. Querying LLM helper...`));
    const llm = getLLM(state.llmProvider);
    const systemPrompt = `You are a financial stock resolver. Identify the global stock ticker symbol for the query.
Return ONLY valid JSON:
{
  "ticker": "TICKER_SYMBOL",
  "name": "Full Company Name"
}
If unknown, return {"ticker": "UNKNOWN", "name": "UNKNOWN"}. Do not add markdown headers.`;

    const response = await llm.invoke([{ role: 'system', content: systemPrompt }, { role: 'user', content: `Query: "${query}"` }]);
    const cleanContent = String(response.content).replace(/```json/g, '').replace(/```/g, '').trim();
    const resolved = JSON.parse(cleanContent);

    if (resolved.ticker && resolved.ticker !== 'UNKNOWN') {
      logs.push(createLog('RESOLVE', `Ticker resolved via LLM: ${resolved.ticker} (${resolved.name})`));
      return { ticker: resolved.ticker.toUpperCase(), tickerName: resolved.name, logs };
    }
    throw new Error(`Could not resolve ticker symbol for "${query}"`);
  } catch (err: any) {
    logs.push(createLog('ERROR', `Ticker resolution failed: ${err.message}`));
    return { error: err.message, logs };
  }
}

export async function fetchDataNode(state: AgentState) {
  if (state.error) return state;
  const logs = [createLog('FETCH_DATA', `Harvesting financial statements for: ${state.ticker}...`)];
  try {
    const companyDetails = await getCompanyDetails(state.ticker);
    if (!companyDetails) throw new Error(`Failed to load company details for: ${state.ticker}`);

    logs.push(createLog('FETCH_DATA', `Fetched summary profiles, balance sheet, cash flows, and news.`));
    logs.push(createLog('FETCH_DATA', `Fetching 1-year historical chart coordinates...`));
    const historicalPrices = await getHistoricalPrices(state.ticker);
    logs.push(createLog('FETCH_DATA', `Fetched ${historicalPrices.length} chart coordinates.`));

    return { companyDetails, historicalPrices, logs };
  } catch (err: any) {
    logs.push(createLog('ERROR', `Financial statements harvest failed: ${err.message}`));
    return { error: err.message, logs };
  }
}

export async function analyzeSentimentNode(state: AgentState) {
  if (state.error || !state.companyDetails) return state;
  const logs = [createLog('FETCH_NEWS', `Extracting latest headlines and running AI sentiment classifier...`)];
  const news = state.companyDetails.news.slice(0, 6);

  if (news.length === 0) {
    logs.push(createLog('FETCH_NEWS', `No recent news articles found. Skipping sentiment.`));
    return { newsSentiment: [], logs };
  }

  try {
    const llm = getLLM(state.llmProvider);
    const systemPrompt = `You are a financial sentiment classifier. Classify news article sentiment as 'Bullish', 'Bearish', or 'Neutral'.
Return ONLY a JSON array of objects conforming to the schema below:
[
  {
    "title": "Article Title",
    "link": "Article Link",
    "publisher": "Publisher Name",
    "sentiment": "Bullish" | "Bearish" | "Neutral",
    "summary": "1-sentence summary of news impact"
  }
]
Do not wrap in markdown or backticks.`;

    const response = await llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Ticker: ${state.ticker}\nArticles:\n${JSON.stringify(news, null, 2)}` }
    ]);

    const cleanContent = String(response.content).replace(/```json/g, '').replace(/```/g, '').trim();
    const sentimentResults = JSON.parse(cleanContent) as NewsSentiment[];

    const bullish = sentimentResults.filter((n) => n.sentiment === 'Bullish').length;
    const bearish = sentimentResults.filter((n) => n.sentiment === 'Bearish').length;
    logs.push(createLog('FETCH_NEWS', `Sentiment completed: ${bullish} Bullish, ${bearish} Bearish, ${sentimentResults.length - bullish - bearish} Neutral.`));

    return { newsSentiment: sentimentResults, logs };
  } catch (err: any) {
    logs.push(createLog('FETCH_NEWS', `News sentiment node fallback: ${err.message}`));
    const neutralNews = news.map((item) => ({
      title: item.title,
      link: item.link,
      publisher: item.publisher || 'Unknown',
      sentiment: 'Neutral' as const,
      summary: 'Headline fetched, sentiment analysis skipped.'
    }));
    return { newsSentiment: neutralNews, logs };
  }
}

export async function analyzeSWOTNode(state: AgentState) {
  if (state.error || !state.companyDetails) return state;
  const logs = [createLog('ANALYZE', `Starting SWOT Matrix compilation node based on financial metrics...`)];
  try {
    const details = state.companyDetails;
    const financialSummary = {
      peRatio: details.peRatio,
      pegRatio: details.pegRatio,
      debtToEquity: details.debtToEquity,
      operatingMargins: details.operatingMargins,
      profitMargins: details.profitMargins,
      recentBalanceSheets: details.financials.balanceSheet,
      recentIncomeStatements: details.financials.incomeStatement
    };

    const llm = getLLM(state.llmProvider);
    const systemPrompt = `You are an Equity Research Analyst. Compile a SWOT matrix.
Return ONLY JSON:
{
  "strengths": ["Strengths"],
  "weaknesses": ["Weaknesses"],
  "opportunities": ["Opportunities"],
  "threats": ["Threats"]
}
Do not write explanations outside JSON.`;

    const response = await llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Company Summary:\n${details.longBusinessSummary}\nMetrics:\n${JSON.stringify(financialSummary)}` }
    ]);

    const cleanContent = String(response.content).replace(/```json/g, '').replace(/```/g, '').trim();
    const swotAnalysis = JSON.parse(cleanContent) as SwotAnalysis;
    logs.push(createLog('ANALYZE', `SWOT matrix compiled successfully.`));

    return { swotAnalysis, logs };
  } catch (err: any) {
    logs.push(createLog('ANALYZE', `SWOT compilation error: ${err.message}. Using default matrix.`));
    const swotAnalysis = {
      strengths: ['Stable corporate footprint', 'Recognizable trade brand'],
      weaknesses: ['Vulnerable to macro cycle fluctuations', 'Rising relative operating costs'],
      opportunities: ['Technological upgrades', 'Product line extension'],
      threats: ['Regulatory oversight increases', 'Intensifying regional competitors']
    };
    return { swotAnalysis, logs };
  }
}

export async function generateDecisionNode(state: AgentState) {
  if (state.error || !state.companyDetails) return state;
  const logs = [createLog('DECIDE', `Synthesizing news feeds, SWOT, and financials to generate thesis...`)];
  try {
    const details = state.companyDetails;
    const summaryContext = {
      ticker: details.symbol,
      price: details.price,
      changePercent: details.changePercent,
      peRatio: details.peRatio,
      debtToEquity: details.debtToEquity,
      operatingMargins: details.operatingMargins,
      marketCap: details.marketCap
    };

    const llm = getLLM(state.llmProvider);
    const systemPrompt = `You are a legendary portfolio hedge fund manager. Review financial metrics, SWOT, and news.
Decide whether to "INVEST", "PASS", or "HOLD".
Compute a confidence score (0-100) and target buy price range.
Write an Investment Thesis in Markdown containing:
1. Executive Summary
2. Financial Health Valuation
3. Catalysts & Market sentiment
4. Key Investment Risks & Mitigation
5. Recommendation & Price Target Logic

Return ONLY JSON:
{
  "decision": "INVEST" | "PASS" | "HOLD",
  "confidence": number,
  "targetRange": "string range",
  "investmentThesis": "Full markdown-formatted thesis string"
}
Do not write text outside JSON.`;

    const response = await llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Details: ${JSON.stringify(summaryContext)}\nSWOT: ${JSON.stringify(state.swotAnalysis)}\nSentiment: ${JSON.stringify(state.newsSentiment)}` }
    ]);

    const cleanContent = String(response.content).replace(/```json/g, '').replace(/```/g, '').trim();
    const finalReport = JSON.parse(cleanContent);
    logs.push(createLog('DECIDE', `Analysis complete. Recommendation: ${finalReport.decision} (Confidence: ${finalReport.confidence}%)`));

    return {
      decision: finalReport.decision,
      confidence: finalReport.confidence,
      targetRange: finalReport.targetRange,
      investmentThesis: finalReport.investmentThesis,
      logs
    };
  } catch (err: any) {
    logs.push(createLog('ERROR', `Report generation failed: ${err.message}`));
    return { error: err.message, logs };
  }
}
```

### Step 2.8: Create `backend/src/lib/agent/graph.ts`
Compiles all nodes into the executable workflow:
```typescript
import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentStateAnnotation } from './state';
import {
  resolveTickerNode,
  fetchDataNode,
  analyzeSentimentNode,
  analyzeSWOTNode,
  generateDecisionNode
} from './nodes';

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('resolveTicker', resolveTickerNode)
  .addNode('fetchData', fetchDataNode)
  .addNode('analyzeSentiment', analyzeSentimentNode)
  .addNode('analyzeSWOT', analyzeSWOTNode)
  .addNode('generateDecision', generateDecisionNode)
  .addEdge(START, 'resolveTicker')
  .addEdge('resolveTicker', 'fetchData')
  .addEdge('fetchData', 'analyzeSentiment')
  .addEdge('analyzeSentiment', 'analyzeSWOT')
  .addEdge('analyzeSWOT', 'generateDecision')
  .addEdge('generateDecision', END);

export const graph = workflow.compile();
export default graph;
```

### Step 2.9: Create `backend/src/index.ts`
Hooks the graph up to Express, streaming execution steps using Server-Sent Events (SSE) so the React UI updates in real-time:
```typescript
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { graph } from './lib/agent/graph';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/research', async (req, res) => {
  const { query, provider = 'gemini' } = req.body;

  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'A company name or ticker query is required.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  console.log(`Starting stock research stream for: "${query}" using provider: "${provider}"`);

  try {
    const stream = await graph.stream(
      {
        query: query.trim(),
        llmProvider: provider as 'gemini' | 'openai',
        logs: []
      },
      {
        streamMode: 'updates'
      }
    );

    for await (const chunk of stream) {
      const nodeName = Object.keys(chunk)[0];
      const nodeData = chunk[nodeName];

      res.write(`data: ${JSON.stringify({ node: nodeName, ...nodeData })}\n\n`);

      // @ts-ignore
      if (typeof res.flush === 'function') res.flush();
    }

    res.write('event: complete\ndata: {}\n\n');
    res.end();
  } catch (err: any) {
    console.error('Error running stock research stream:', err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message || 'Unknown agent execution error.' })}\n\n`);
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Express Server running on http://localhost:${port}`);
});
```

---

## 3. Frontend Setup & Code

### Step 3.1: Create Vite + React Frontend
From the root directory, create the React App:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### Step 3.2: Install Frontend Dependencies
```bash
npm install recharts lucide-react framer-motion clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer
```

### Step 3.3: Initialize Tailwind
Generate tailwind configuration files:
```bash
npx tailwindcss init -p
```

### Step 3.4: Configure `frontend/tailwind.config.js`
Replace the file contents to enable support for scanning class names in source files:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090a0f',
        cardBg: 'rgba(17, 19, 31, 0.7)',
        accentCyan: '#06b6d4',
        accentEmerald: '#10b981',
        accentRose: '#f43f5e',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
```

### Step 3.5: Create `frontend/src/index.css`
Sets up global scrollbars, fonts (Outfit or Inter), and modern gradients:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

body {
  background-color: #05060b;
  color: #f1f5f9;
  font-family: 'Outfit', sans-serif;
  overflow-x: hidden;
}

/* Glassmorphism custom classes */
.glass-panel {
  background: rgba(13, 16, 28, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.glass-card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.glass-card-hover:hover {
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 0 25px rgba(6, 182, 212, 0.1);
  transform: translateY(-2px);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #090a0f;
}
::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #334155;
}

/* PDF Print styles */
@media print {
  body {
    background: white !important;
    color: black !important;
  }
  .no-print {
    display: none !important;
  }
  .glass-panel {
    background: transparent !important;
    border: 1px solid #ccc !important;
    box-shadow: none !important;
    color: black !important;
  }
}
```

### Step 3.6: Create `frontend/src/components/StockChart.tsx`
Creates an interactive historical performance stock price line chart using Recharts:
```tsx
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartPoint {
  date: string;
  close: number;
}

interface StockChartProps {
  data: ChartPoint[];
  ticker: string;
}

export const StockChart: React.FC<StockChartProps> = ({ data, ticker }) => {
  const [timeframe, setTimeframe] = useState<30 | 180 | 365>(365);

  const filteredData = data.slice(-timeframe);

  if (filteredData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 glass-panel rounded-xl">
        No chart coordinates available for this asset.
      </div>
    );
  }

  const startPrice = filteredData[0].close;
  const endPrice = filteredData[filteredData.length - 1].close;
  const pctChange = ((endPrice - startPrice) / startPrice) * 100;

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">Performance Chart ({ticker})</h3>
          <p className="text-xl font-bold flex items-baseline space-x-2 mt-1">
            <span>${endPrice.toFixed(2)}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pctChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
            </span>
          </p>
        </div>
        <div className="flex space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/5">
          {([
            { label: '1M', val: 30 },
            { label: '6M', val: 180 },
            { label: '1Y', val: 365 }
          ] as const).map((opt) => (
            <button
              key={opt.val}
              onClick={() => setTimeframe(opt.val)}
              className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all ${timeframe === opt.val ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25' : 'text-slate-400 hover:text-white'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={pctChange >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={pctChange >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              dx={-5}
            />
            <Tooltip
              contentStyle={{ background: '#0d101c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
              labelStyle={{ color: '#64748b', fontSize: '11px' }}
              itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
              formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Close']}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={pctChange >= 0 ? '#10b981' : '#f43f5e'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClose)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

### Step 3.7: Create `frontend/src/components/SentimentFeed.tsx`
Renders news cards with dynamic sentiment colors:
```tsx
import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { NewsSentiment } from '../../../backend/src/lib/agent/state';

interface SentimentFeedProps {
  news: NewsSentiment[];
}

export const SentimentFeed: React.FC<SentimentFeedProps> = ({ news }) => {
  if (news.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center text-slate-400">
        No recent news items were loaded for sentiment parsing.
      </div>
    );
  }

  const getSentimentStyles = (sent: NewsSentiment['sentiment']) => {
    switch (sent) {
      case 'Bullish':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300',
          icon: <TrendingUp className="w-3.5 h-3.5" />
        };
      case 'Bearish':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40',
          text: 'text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300',
          icon: <TrendingDown className="w-3.5 h-3.5" />
        };
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/20 hover:border-slate-500/40',
          text: 'text-slate-400',
          badge: 'bg-slate-500/20 text-slate-300',
          icon: <Minus className="w-3.5 h-3.5" />
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {news.map((item, idx) => {
        const styles = getSentimentStyles(item.sentiment);
        return (
          <div
            key={idx}
            className={`border rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${styles.bg}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {item.publisher}
                </span>
                <span className={`flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles.badge}`}>
                  {styles.icon}
                  <span>{item.sentiment}</span>
                </span>
              </div>
              <h4 className="font-semibold text-sm text-slate-100 line-clamp-2">
                {item.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "{item.summary}"
              </p>
            </div>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-1 text-xs font-semibold mt-4 transition-all hover:underline self-start ${styles.text}`}
              >
                <span>Read Original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

### Step 3.8: Create `frontend/src/components/FinancialTable.tsx`
Renders structured corporate statement data dynamically:
```tsx
import React, { useState } from 'react';

interface Statement {
  endDate: string;
  [key: string]: any;
}

interface FinancialTableProps {
  financials: {
    incomeStatement: Statement[];
    balanceSheet: Statement[];
    cashflowStatement: Statement[];
  };
}

export const FinancialTable: React.FC<FinancialTableProps> = ({ financials }) => {
  const [activeTab, setActiveTab] = useState<'income' | 'balance' | 'cashflow'>('income');

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    if (Math.abs(num) >= 1.0e9) {
      return (num / 1.0e9).toFixed(2) + 'B';
    }
    if (Math.abs(num) >= 1.0e6) {
      return (num / 1.0e6).toFixed(2) + 'M';
    }
    return num.toLocaleString();
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'balance':
        return {
          title: 'Balance Sheet Statements',
          headers: ['Period End', 'Total Assets', 'Total Liabilities', 'Cash Reserves', 'Short-Term Inv.', 'Long-Term Debt'],
          keys: ['endDate', 'totalAssets', 'totalLiab', 'cash', 'shortTermInvestments', 'longTermDebt'],
          data: financials.balanceSheet
        };
      case 'cashflow':
        return {
          title: 'Cash Flow Statements',
          headers: ['Period End', 'Operating Cash Flow', 'Capital Expend. (CapEx)', 'Free Cash Flow'],
          keys: ['endDate', 'totalCashFromOperatingActivities', 'capitalExpenditures', 'freeCashflow'],
          data: financials.cashflowStatement
        };
      default:
        return {
          title: 'Income Statements',
          headers: ['Period End', 'Total Revenue', 'Gross Profit', 'Operating Income', 'Net Income'],
          keys: ['endDate', 'totalRevenue', 'grossProfit', 'operatingIncome', 'netIncome'],
          data: financials.incomeStatement
        };
    }
  };

  const current = getActiveData();

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 space-y-3 sm:space-y-0">
        <h3 className="font-semibold text-slate-200">{current.title}</h3>
        <div className="flex p-0.5 bg-slate-950/80 rounded-xl border border-white/5 self-start">
          {(['income', 'balance', 'cashflow'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              {tab === 'income' ? 'Income' : tab === 'balance' ? 'Balance Sheet' : 'Cash Flow'}
            </button>
          ))}
        </div>
      </div>

      {current.data.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          No financial histories loaded for this statement.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400">
                {current.headers.map((h, i) => (
                  <th key={i} className="pb-3 font-semibold uppercase tracking-wider px-3 first:pl-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {current.data.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  {current.keys.map((k, colIdx) => (
                    <td key={colIdx} className="py-3.5 px-3 first:pl-0 font-medium text-slate-200">
                      {k === 'endDate' ? row[k] : formatNumber(row[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```

### Step 3.9: Create `frontend/src/components/ExecutionTracker.tsx`
Animates active agents as they coordinate the query tasks:
```tsx
import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';
import { LogEntry } from '../../../backend/src/lib/agent/state';

interface ExecutionTrackerProps {
  logs: LogEntry[];
  activeStage: LogEntry['stage'] | 'IDLE' | 'COMPLETED';
}

export const ExecutionTracker: React.FC<ExecutionTrackerProps> = ({ logs, activeStage }) => {
  const workflowStages: { key: LogEntry['stage']; label: string; desc: string }[] = [
    { key: 'START', label: 'Initialization', desc: 'Starting multi-agent stock memo compiler...' },
    { key: 'RESOLVE', label: 'Ticker Resolution', desc: 'Parsing name index and locating correct ticker' },
    { key: 'FETCH_DATA', label: 'Financial Extraction', desc: 'Downloading sheets, profiles, and chart data' },
    { key: 'FETCH_NEWS', label: 'Sentiment Classifying', desc: 'Analyzing news vectors and sentiment weights' },
    { key: 'ANALYZE', label: 'SWOT Analysis', desc: 'Compiling core metrics and strategic positioning' },
    { key: 'DECIDE', label: 'Final Resolution', desc: 'Synthesizing recommendations and writing thesis' }
  ];

  const getStageStatus = (stageKey: LogEntry['stage']) => {
    const hasError = logs.some((l) => l.stage === 'ERROR');
    const isStageLogged = logs.some((l) => l.stage === stageKey);
    const isCurrentActive = activeStage === stageKey;

    if (hasError && isCurrentActive) return 'error';
    if (isStageLogged && !isCurrentActive) return 'completed';
    if (isCurrentActive) return 'active';
    return 'pending';
  };

  const getStatusIcon = (status: 'completed' | 'active' | 'error' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <PlayCircle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4">
      <div className="border-b border-white/5 pb-3">
        <h3 className="font-semibold text-slate-200 text-sm tracking-wider uppercase">Agent Execution Stream</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">LangGraph StateGraph Execution Pipeline</p>
      </div>

      <div className="relative border-l border-white/5 ml-3 pl-6 space-y-6 my-2">
        {workflowStages.map((stage, idx) => {
          const status = getStageStatus(stage.key);
          const icon = getStatusIcon(status);

          return (
            <div key={idx} className="relative group">
              <span className="absolute -left-[35px] top-0 bg-[#05060b] p-1 rounded-full border border-white/5">
                {icon}
              </span>
              <div className={`transition-all ${status === 'active' ? 'text-white' : status === 'completed' ? 'text-slate-300' : 'text-slate-500'}`}>
                <h4 className={`text-xs font-bold ${status === 'active' ? 'text-cyan-400' : status === 'error' ? 'text-rose-500' : ''}`}>
                  {stage.label}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {logs.length > 0 && (
        <div className="bg-slate-950/80 rounded-xl border border-white/5 p-3 font-mono text-[10px] text-slate-400 max-h-40 overflow-y-auto space-y-1.5">
          {logs.map((log, i) => (
            <div key={i} className="flex space-x-2">
              <span className="text-cyan-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className={`font-bold text-[9px] uppercase px-1.5 py-0.25 rounded-md inline-block ${log.stage === 'ERROR' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                {log.stage}
              </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Step 3.10: Create `frontend/src/App.tsx`
This compiles the entire client dashboard logic, linking all interactive views and saving history cards inside local storage:
```tsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  Award,
  Download,
  AlertTriangle,
  History,
  Info
} from 'lucide-react';
import { StockChart } from './components/StockChart';
import { SentimentFeed } from './components/SentimentFeed';
import { FinancialTable } from './components/FinancialTable';
import { ExecutionTracker } from './components/ExecutionTracker';

interface HistoryItem {
  timestamp: string;
  ticker: string;
  tickerName: string;
  decision: 'INVEST' | 'PASS' | 'HOLD';
  confidence: number;
  targetRange: string;
  investmentThesis: string;
  swotAnalysis: any;
  newsSentiment: any[];
  companyDetails: any;
  historicalPrices: any[];
}

export default function App() {
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<any>('IDLE');
  const [logs, setLogs] = useState<any[]>([]);

  const [ticker, setTicker] = useState('');
  const [tickerName, setTickerName] = useState('');
  const [decision, setDecision] = useState<'INVEST' | 'PASS' | 'HOLD' | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [targetRange, setTargetRange] = useState('');
  const [thesis, setThesis] = useState('');
  const [swot, setSwot] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [details, setDetails] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('research_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setLogs([]);
    setActiveStage('START');
    setDecision(null);
    setDetails(null);
    setChartData([]);
    setSwot(null);
    setNews([]);
    setThesis('');

    try {
      const response = await fetch('http://localhost:5000/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, provider })
      });

      if (!response.ok) {
        throw new Error('Backend failed to respond.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream reader available.');

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6);
            try {
              const parsed = JSON.parse(rawData);
              processNodeUpdate(parsed);
            } catch (e) {
              // Ignore parse errors from non-json messages
            }
          } else if (line.startsWith('event: complete')) {
            setActiveStage('COMPLETED');
          } else if (line.startsWith('event: error')) {
            const errData = JSON.parse(line.slice(12));
            throw new Error(errData.error || 'Agent execution failed.');
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during search.');
      setActiveStage('ERROR');
      setLogs((prev) => [...prev, { timestamp: new Date().toISOString(), stage: 'ERROR', message: err.message }]);
      setLoading(false);
    }
  };

  const processNodeUpdate = (update: any) => {
    const { node, logs: nodeLogs, error } = update;

    if (error) {
      setErrorMsg(error);
      setActiveStage('ERROR');
      setLoading(false);
      return;
    }

    if (nodeLogs) {
      setLogs((prev) => {
        const combined = [...prev, ...nodeLogs];
        return combined.filter(
          (log, index, self) =>
            self.findIndex((l) => l.timestamp === log.timestamp && l.message === log.message) === index
        );
      });
    }

    if (node) {
      setActiveStage(node.toUpperCase());
    }

    switch (node) {
      case 'resolveTicker':
        setTicker(update.ticker);
        setTickerName(update.tickerName);
        break;
      case 'fetchData':
        setDetails(update.companyDetails);
        setChartData(update.historicalPrices);
        break;
      case 'analyzeSentiment':
        setNews(update.newsSentiment);
        break;
      case 'analyzeSWOT':
        setSwot(update.swotAnalysis);
        break;
      case 'generateDecision':
        setDecision(update.decision);
        setConfidence(update.confidence);
        setTargetRange(update.targetRange);
        setThesis(update.investmentThesis);
        setLoading(false);

        const newHistoryItem: HistoryItem = {
          timestamp: new Date().toISOString(),
          ticker: update.ticker || ticker,
          tickerName: update.tickerName || tickerName,
          decision: update.decision,
          confidence: update.confidence,
          targetRange: update.targetRange,
          investmentThesis: update.investmentThesis,
          swotAnalysis: update.swotAnalysis || swot,
          newsSentiment: update.newsSentiment || news,
          companyDetails: update.companyDetails || details,
          historicalPrices: update.historicalPrices || chartData
        };

        setHistory((prev) => {
          const filtered = prev.filter((item) => item.ticker !== newHistoryItem.ticker);
          const updated = [newHistoryItem, ...filtered].slice(0, 10);
          localStorage.setItem('research_history', JSON.stringify(updated));
          return updated;
        });
        break;
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setTicker(item.ticker);
    setTickerName(item.tickerName);
    setDecision(item.decision);
    setConfidence(item.confidence);
    setTargetRange(item.targetRange);
    setThesis(item.investmentThesis);
    setSwot(item.swotAnalysis);
    setNews(item.newsSentiment);
    setDetails(item.companyDetails);
    setChartData(item.historicalPrices);
    setErrorMsg(null);
    setLogs([]);
    setActiveStage('COMPLETED');
  };

  const clearHistory = () => {
    localStorage.removeItem('research_history');
    setHistory([]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#05060b] flex">
      {/* Sidebar - History */}
      <aside className="w-80 border-r border-white/5 bg-[#08090f]/90 p-5 flex flex-col justify-between no-print shrink-0">
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <History className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm">Research History</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Recent company analyses</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No previous checks stored.</p>
            ) : (
              history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => loadHistoryItem(item)}
                  className="w-full text-left p-3 rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all flex justify-between items-center group bg-white/[0.01] hover:bg-white/[0.02]"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {item.ticker}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.tickerName}</p>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase ${item.decision === 'INVEST' ? 'bg-emerald-500/10 text-emerald-400' : item.decision === 'PASS' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'}`}>
                    {item.decision}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-rose-400 border border-dashed border-white/5 hover:border-rose-500/20 rounded-xl transition-all"
          >
            Clear History Cache
          </button>
        )}
      </aside>

      {/* Main Layout Area */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 space-y-4 md:space-y-0 no-print">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <span>InsideIIM</span>
              <span className="text-cyan-500 font-medium">Investment Labs</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Multi-Agent AI Equity Research & Valuation Platform</p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search company (e.g. Apple, Nvidia)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                className="w-full bg-[#0d101c] border border-white/5 focus:border-cyan-500/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none placeholder-slate-500 transition-all font-medium focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>

            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              disabled={loading}
              className="bg-[#0d101c] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold cursor-pointer outline-none focus:border-cyan-500/40 transition-all"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI GPT</option>
            </select>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:shadow-none shrink-0"
            >
              Analyze
            </button>
          </form>
        </header>

        {/* Loading state dashboard */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
            <div className="lg:col-span-2 flex flex-col items-center justify-center min-h-[400px] glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 animate-pulse" />
              <div className="relative flex flex-col items-center space-y-4 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-cyan-500/10 border-t-cyan-500 animate-spin" />
                  <BookOpen className="w-6 h-6 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-slate-100 font-bold text-sm uppercase tracking-widest animate-pulse">Running Research Agent</h3>
                  <p className="text-xs text-slate-400">Scraping statements, financial figures, and headlines for "{query}"</p>
                </div>
              </div>
            </div>
            <ExecutionTracker logs={logs} activeStage={activeStage} />
          </div>
        )}

        {/* Error State */}
        {errorMsg && !loading && (
          <div className="glass-panel p-6 rounded-2xl border-rose-500/20 bg-rose-950/10 text-rose-300 space-y-3 flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Agent Investigation Interrupted</h3>
              <p className="text-xs text-slate-400 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Initial screen guidance */}
        {!decision && !loading && !errorMsg && (
          <div className="flex flex-col items-center justify-center min-h-[450px] glass-panel rounded-3xl p-10 text-center space-y-5 border-dashed border-white/10 max-w-3xl mx-auto mt-8">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center">
              <Info className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-200">Start Stock Investigation</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Enter any company name or stock exchange ticker symbol above. The LangGraph Multi-Agent system will scrape Yahoo Finance profiles, financials, and news, compile a SWOT grid, evaluate sentiment, and output a structured INVEST/PASS verdict.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {['Nvidia', 'Tesla', 'Apple', 'Reliance', 'TATA MOTORS'].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                  }}
                  className="px-3 py-1.5 text-[11px] font-semibold bg-slate-900 border border-white/5 rounded-lg text-slate-300 hover:border-cyan-500/30 hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Complete Dashboard Results View */}
        {decision && !loading && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex justify-between items-center no-print">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>Resolved Target:</span>
                <span className="font-bold text-slate-200 uppercase bg-slate-900 px-2 py-0.5 rounded border border-white/5">
                  {ticker}
                </span>
                <span>—</span>
                <span className="font-medium text-slate-300">{tickerName}</span>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF Memo</span>
              </button>
            </div>

            {/* Grid 1: Recommendation summary & key statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recommendation Card */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 rounded-full ${decision === 'INVEST' ? 'bg-emerald-500' : decision === 'PASS' ? 'bg-rose-500' : 'bg-amber-500'}`} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">VERDICT</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">CONFIDENCE</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`text-4xl font-black tracking-wider uppercase ${decision === 'INVEST' ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]' : decision === 'PASS' ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'text-amber-400'}`}>
                        {decision}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold mt-1">HEDGE FUND RECOMMENDATION</span>
                    </div>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke={decision === 'INVEST' ? '#10b981' : decision === 'PASS' ? '#f43f5e' : '#f59e0b'}
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - confidence / 100)}
                        />
                      </svg>
                      <span className="absolute text-xs font-bold text-slate-100">{confidence}%</span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Target Range:</span>
                      <span className="font-bold text-slate-200">{targetRange}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Current Valuation:</span>
                      <span className="font-semibold text-slate-200">${details?.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-6 text-xs p-3 rounded-xl border leading-relaxed ${decision === 'INVEST' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300/90' : decision === 'PASS' ? 'bg-rose-500/5 border-rose-500/10 text-rose-300/90' : 'bg-slate-500/5 border-slate-500/10 text-slate-300/90'}`}>
                  {decision === 'INVEST'
                    ? 'Growth vectors and valuation margins support entry. Accumulate shares inside target range.'
                    : decision === 'PASS'
                      ? 'Macro headwinds, valuation stress, or leverage flags identified. Reallocate funds to alternative assets.'
                      : 'Hold entry positioning. Wait for a short pull-back into the target entry range.'}
                </div>
              </div>

              {/* Key Statistics Grid */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-semibold text-slate-200 text-sm tracking-wider uppercase">Key Financial Ratios</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Summary metrics at a glance</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-4">
                  {[
                    { label: 'P/E Ratio', value: details?.peRatio ? details.peRatio.toFixed(2) : 'N/A' },
                    { label: 'PEG Ratio', value: details?.pegRatio ? details.pegRatio.toFixed(2) : 'N/A' },
                    { label: 'Debt to Equity', value: details?.debtToEquity ? (details.debtToEquity).toFixed(2) + '%' : 'N/A' },
                    { label: 'Operating Margin', value: details?.operatingMargins ? (details.operatingMargins * 100).toFixed(2) + '%' : 'N/A' },
                    { label: 'Profit Margin', value: details?.profitMargins ? (details.profitMargins * 100).toFixed(2) + '%' : 'N/A' },
                    { label: 'Beta (Volatility)', value: details?.beta ? details.beta.toFixed(2) : 'N/A' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-950/80 border border-white/5 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-semibold block">{stat.label}</span>
                      <span className="text-sm font-bold text-slate-100 block mt-1">{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 text-[10px] text-slate-400 font-semibold">
                  <span>Sector: {details?.sector || 'N/A'}</span>
                  <span>Industry: {details?.industry || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Grid 2: Stock performance chart & SWOT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StockChart data={chartData} ticker={ticker} />
              </div>

              {/* SWOT Quadrant Component */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-semibold text-slate-200 text-sm tracking-wider uppercase font-bold">SWOT Matrix</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Asset strategic analysis parameters</p>
                </div>

                <div className="grid grid-cols-2 gap-3 h-72">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl overflow-y-auto">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">STRENGTHS</span>
                    <ul className="text-[9px] text-emerald-200/80 space-y-1 mt-1.5 list-disc pl-3 leading-relaxed">
                      {swot?.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl overflow-y-auto">
                    <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">WEAKNESSES</span>
                    <ul className="text-[9px] text-rose-200/80 space-y-1 mt-1.5 list-disc pl-3 leading-relaxed">
                      {swot?.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                  <div className="bg-cyan-500/5 border border-cyan-500/10 p-3 rounded-xl overflow-y-auto">
                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">OPPORTUNITIES</span>
                    <ul className="text-[9px] text-cyan-200/80 space-y-1 mt-1.5 list-disc pl-3 leading-relaxed">
                      {swot?.opportunities?.map((o: string, i: number) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl overflow-y-auto">
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">THREATS</span>
                    <ul className="text-[9px] text-amber-200/80 space-y-1 mt-1.5 list-disc pl-3 leading-relaxed">
                      {swot?.threats?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Financial Statements */}
            {details?.financials && (
              <FinancialTable financials={details.financials} />
            )}

            {/* Grid 4: Full Markdown Thesis Memo & Sentiment Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Detailed Markdown Investment Thesis */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-semibold text-slate-200 text-sm tracking-wider uppercase">Analyst Research Memo</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Written report compiled by Equity Research Agent</p>
                </div>

                <article className="prose prose-invert prose-xs text-slate-300 text-xs leading-relaxed max-w-none space-y-4 pr-1">
                  {thesis.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('###')) {
                      return <h4 key={index} className="text-slate-100 font-bold text-sm mt-5">{paragraph.replace('###', '')}</h4>;
                    }
                    if (paragraph.startsWith('##')) {
                      return <h3 key={index} className="text-slate-100 font-extrabold text-base mt-6 border-b border-white/5 pb-1 uppercase tracking-wider">{paragraph.replace('##', '')}</h3>;
                    }
                    if (paragraph.startsWith('#')) {
                      return <h2 key={index} className="text-cyan-400 font-extrabold text-lg mt-8 border-b border-white/10 pb-2 uppercase">{paragraph.replace('#', '')}</h2>;
                    }
                    if (paragraph.startsWith('-')) {
                      return (
                        <ul key={index} className="list-disc pl-4 space-y-1 my-2">
                          {paragraph.split('\n').map((item, itemIdx) => (
                            <li key={itemIdx}>{item.replace('-', '').trim()}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={index} className="text-slate-300 text-xs leading-relaxed text-justify">{paragraph}</p>;
                  })}
                </article>
              </div>

              {/* News Sentiment Feed */}
              <div className="flex flex-col space-y-4">
                <div className="border-b border-white/5 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm tracking-wider uppercase">Market Sentiment</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">AI Sentiment classified index feed</p>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1">
                  <SentimentFeed news={news} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## 4. How to Run the Project Locally

Follow these steps in your terminal to start the environment:

### Step 4.1: Start the Backend Server
Open a terminal in the `backend` directory:
```bash
cd backend
npm install
npm run dev
```
The server will boot and display:
```text
Express Server running on http://localhost:5000
Health check: http://localhost:5000/api/health
```

### Step 4.2: Start the React Frontend Dev Server
Open a second terminal inside the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
Vite will compile and launch the frontend, providing a link like:
```text
  VITE v5.2.11  ready in 320 ms
  ➜  Local:   http://localhost:5173/
```
Ctrl+Click the link to open the dashboard in your browser!

---

## 5. Key Decisions & Architecture Rationale

1. **StateGraph Orchestrator (LangGraph.js)**:
   Structuring the analysis in nodes prevents random LLM responses. If news parsing crashes, the system still evaluates financials.
2. **Server-Side API Proxy**:
   Yahoo Finance restricts browser-side access due to strict CORS rules. Express functions as a secure middle proxy, fetching data and performing LLM prompt evaluations on the server.
3. **Server-Sent Events (SSE) Streaming**:
   Evaluating stock fundamentals and scoring headlines takes time. Using SSE, the agent streams incremental node updates back to the UI in real-time. The user sees a live workflow log tracker instead of a frozen loader.
4. **Offline LocalStorage History Cache**:
   Every successful investigation registers inside the browser's `localStorage` so users can switch between researched stocks instantly.
