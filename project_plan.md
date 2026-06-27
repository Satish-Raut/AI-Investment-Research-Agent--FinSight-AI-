# AI Investment Research Agent — Project Documentation & Plan

Welcome to the AI Investment Research Agent project. This document serves as a comprehensive reference guide for the product design, problem statements, architecture, folder structure, tech stack, and planned features.

---

## 1. Product Explanation & Real-World Use Cases

The **AI Investment Research Agent** is a full-stack, AI-powered financial analysis dashboard. The application accepts a company name or ticker (e.g., "Tesla" or "TSLA"), triggers an automated multi-agent workflow that researches the company's financials, charts, and news feeds, and presents a clean binary decision: **INVEST** or **PASS**, supported by a thorough investment thesis.

### Under the Hood
The core logic utilizes **LangGraph.js** to coordinate a multi-step investigation loop:
1. **Ticker Resolver Agent**: Takes search queries (e.g. "Google") and converts them into standardized ticker symbols (e.g. "GOOGL").
2. **Data Harvester Agent**: Fetches historical stock price data, recent balance sheets, income statements, and cash flows using Yahoo Finance data.
3. **Sentiment Analyst Agent**: Scrapes recent news articles about the target stock and scores them as *Bullish*, *Bearish*, or *Neutral*.
4. **Equity Researcher Agent (LLM)**: Integrates all metrics, analyzes valuation multiples, performs SWOT analysis, and makes a structured investment recommendation.

### Real-World Use Cases
- **Retail Investors**: An easy-to-use research interface that explains complex financial metrics in plain English.
- **Wealth Managers & Analysts**: An automated screening assistant that runs preliminary fundamental analysis on companies.
- **Content Creation**: Instantly generates rich, data-backed stock reports and charts for financial blogs or newsletters.

---

## 2. Problem Statements Addressed

- **Data Fragmentation**: Market news, stock charts, and financial statements are spread across multiple websites. The dashboard consolidates these data sources into one beautiful UI.
- **Cognitive Overload**: A typical corporate report contains hundreds of metrics. The agent extracts, highlights, and contextualizes the critical metrics (P/E, D/E, profit margins, growth trends).
- **Time Constraints**: Doing a proper fundamental analysis takes hours of manual gathering and reading. The AI Agent completes this research in under 30 seconds.
- **Lack of Actionability**: Generic research reports avoid taking a clear stance. This agent delivers a direct **INVEST** or **PASS** decision with a structured, logic-backed thesis.

---

## 3. Tech Stack

We will build the application using the following production-ready stack:

- **Frontend**: **Vite + React** (TypeScript) for the interactive user interface, rendering tables, custom gauges, and streaming text.
- **Backend API**: **Node.js + Express** (TypeScript) to handle secure LLM API calls, fetch financial metrics, and route agent requests.
- **Agent Framework**: **LangGraph.js** to implement a robust, state-guided workflow.
- **AI Models**: Configurable support for **Google Gemini API** (`gemini-1.5-flash` / `gemini-1.5-pro`) and **OpenAI API** (`gpt-4o-mini` / `gpt-4o`).
- **Data Integration**: **`yahoo-finance2`** npm library for retrieving real-time quotes, balance sheets, and headlines.
- **Visualizations**: **Recharts** for interactive historical price graphs.
- **Styling**: **Tailwind CSS v3** featuring a customized dark-theme layout, glassmorphic card overlays, and **Framer Motion** for micro-animations.
- **Iconography**: **Lucide React** vectors.

---

## 4. Planned Folder Structure

```text
inside-iim-project/
├── backend/                    # Node.js + Express Backend
│   ├── .env.example            # Environment configurations (API keys)
│   ├── package.json            # Node backend dependencies
│   ├── tsconfig.json           # TypeScript server config
│   └── src/
│       ├── index.ts            # Server entry and research endpoints
│       ├── lib/
│       │   ├── agent/
│       │   │   ├── graph.ts    # Compiles state and nodes into a graph
│       │   │   ├── state.ts    # LangGraph State Annotation
│       │   │   └── nodes.ts    # Node implementation (fetch, parse, decision)
│       │   └── yahooFinance.ts # Wrapper for yahoo-finance2
│       └── types/
│           └── index.ts        # Data structures
└── frontend/                   # Vite + React Frontend
    ├── package.json            # Frontend client dependencies
    ├── tsconfig.json           # TypeScript UI config
    ├── tailwind.config.js      # Tailwind configurations
    ├── postcss.config.js       # PostCSS plugins
    ├── index.html              # Main HTML mount point
    └── src/
        ├── main.tsx            # React root mount
        ├── App.tsx             # Main dashboard layout
        ├── components/
        │   ├── StockChart.tsx  # Recharts stock price tracker
        │   ├── SentimentFeed.tsx # Sentiment analysis news cards
        │   ├── FinancialTable.tsx # Statements (Income, Balance, Cash)
        │   └── ExecutionTracker.tsx # Interactive execution log
        └── index.css           # Custom CSS and Tailwind directives
```

---

## 5. Product Features & Functionalities

1. **AI Ticker Resolver**: Type any company name (e.g. "Apple") or ticker (e.g. "AAPL") and the resolver guarantees matching with the proper financial symbol.
2. **Interactive Execution Log (State Graph Tracker)**: Displays the agent's progress in real-time as it executes different steps of the LangGraph state machine.
3. **Core Dashboard View**:
   - **Recommendation Badge**: Glowing green **INVEST** or red **PASS** banner with a confidence score.
   - **Financial Health Summary**: A structured grid showing metrics like P/E, PEG, Debt-to-Equity, and Margins.
   - **SWOT Analysis Card**: Four-quadrant summary of Strengths, Weaknesses, Opportunities, and Threats.
   - **Stock Price Performance Chart**: Interactive graph showing the stock's trend over 1 month, 6 months, or 1 year.
   - **News Feed & Sentiment**: Chronological news articles with LLM-evaluated Bullish/Neutral/Bearish sentiments.
   - **Detailed Investment Memo**: A comprehensive, markdown-rendered document outlining key catalysts, valuation, and potential risks.
4. **Research History**: Fast loading of previous search reports saved to the browser's local storage.
5. **PDF Memo Downloader**: Export the final report and charts to a clean, print-friendly PDF.
