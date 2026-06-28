import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck, Users, Workflow, FileEdit } from 'lucide-react';

const AGENTS = [
  {
    num: '01', name: 'Ticker Resolver', color: '#818cf8',
    summary: 'Converts any natural-language company name into its canonical exchange ticker symbol (e.g. "Apple" → AAPL, "Reliance" → RELIANCE.NS).',
    how: 'Uses a combination of Yahoo Finance search API and LLM-assisted fuzzy matching to resolve ambiguous inputs with zero hallucination.',
    output: 'A validated ticker string passed to the next agent in the LangGraph state.',
  },
  {
    num: '02', name: 'Financial Extractor', color: '#34d399',
    summary: 'Pulls live income statements, balance sheets, key ratios, and 12-month price history directly from Yahoo Finance for the resolved ticker.',
    how: 'Calls yfinance under the hood, normalises currency values, and structures the data into a typed schema consumed by downstream agents.',
    output: 'Structured financial payload: revenue, profit margin, P/E, beta, 52-week high/low, and current price.',
  },
  {
    num: '03', name: 'Sentiment Scorer', color: '#fbbf24',
    summary: 'Fetches the 10 most recent news articles for the company and classifies each as Bullish, Bearish, or Neutral using an LLM.',
    how: 'Uses Yahoo Finance RSS news feed, passes each headline + snippet to Gemini / OpenAI, and aggregates a sentiment score weighted by recency.',
    output: 'A sentiment object: { bullish: N, bearish: N, neutral: N, dominantSignal, headlines[] }',
  },
  {
    num: '04', name: 'SWOT Compiler', color: '#f87171',
    summary: 'Synthesises the financial data and sentiment signal into a structured SWOT matrix — Strengths, Weaknesses, Opportunities, and Threats.',
    how: 'Prompts the LLM with full financial context + sentiment summary, asking it to produce four bullet-point lists grounded in the numeric data.',
    output: 'A SWOT JSON object with 3–4 bullet points per quadrant, each citing a specific data point.',
  },
  {
    num: '05', name: 'Memo Writer', color: '#a78bfa',
    summary: 'Writes the final hedge-fund-grade research memo: a clear INVEST or PASS verdict, a 12-month target price range, and a full written rationale.',
    how: 'Acts as a "hedge fund analyst" persona in the LLM prompt. Uses CoT (chain-of-thought) to derive the verdict before writing the memo, reducing hallucination.',
    output: 'Structured report: { verdict, confidenceScore, targetRange, rationale, disclaimer }',
  },
];

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Data Grounding & Accuracy',
    desc: 'All research findings are strictly mapped to real-time financials and verified historical data points. The agents are instructed to flag missing information rather than make assumptions or hallucinate metrics.',
  },
  {
    icon: Users,
    title: 'Multi-Agent Consensus',
    desc: 'The investment thesis is cross-examined by consecutive, independent nodes. A SWOT output or news sentiment signal is verified against actual numbers before the final writing agent makes a determination.',
  },
  {
    icon: Workflow,
    title: 'Structured Chain of Thought',
    desc: 'Before rendering an INVEST or PASS decision, the Memo Writer agent must write out intermediate logic steps and calculate supporting margins, ensuring rational reasoning that users can follow step-by-step.',
  },
  {
    icon: FileEdit,
    title: 'Analyst Empowerment',
    desc: 'We treat AI as a powerful co-pilot, not a replacement. Reports are structured to allow human analysts to easily override variables, pressure-test projections, and insert subjective market viewpoints.',
  },
];

function AgentCard({ agent }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', transition: 'border-color .2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = agent.color + '55'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: agent.color, minWidth: 28 }}>{agent.num}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', display: 'block' }}>{agent.name}</span>
          <span style={{ fontSize: 14, color: 'var(--t2)', marginTop: 3, display: 'block', lineHeight: 1.6 }}>{agent.summary}</span>
        </div>
        <div style={{ color: 'var(--t3)', flexShrink: 0 }}>
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px 18px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>How it works</span>
              <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.75 }}>{agent.how}</p>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px 18px' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Output</span>
              <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.75, fontFamily: 'monospace' }}>{agent.output}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '48px 0' }}>
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>

        {/* Header */}
        <div style={{ maxWidth: 680 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Methodology</span>
          <h1 className="serif" style={{ fontSize: 'clamp(30px, 4vw, 48px)', color: 'var(--t1)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.15 }}>
            How FinSight.ai<br />researches a company.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--t2)', lineHeight: 1.85 }}>
            Every analysis runs through a five-node <strong style={{ color: 'var(--t1)', fontWeight: 600 }}>LangGraph state machine</strong> — a directed acyclic graph where each node is a specialised AI agent that validates, enriches, and passes state to the next.
          </p>
        </div>

        {/* Pipeline visual */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>The 5-Agent Pipeline</span>
          {AGENTS.map((a, i) => (
            <div key={a.num} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <AgentCard agent={a} />
              {i < AGENTS.length - 1 && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 2, height: 16, background: 'var(--border)' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Core Principles */}
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 20 }}>Research Pillars & Safety Guardrails</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            {PRINCIPLES.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid var(--accent-ring)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color="var(--accent)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>{p.title}</h3>
                    <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.75 }}>{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.8 }}>
            <strong style={{ color: 'var(--t1)' }}>Disclaimer — </strong>
            FinSight.ai is an educational and informational project. Nothing generated by this platform constitutes financial advice.
            Always conduct independent due diligence and consult a qualified financial advisor before making any investment decision.
          </p>
        </div>

      </div>
    </div>
  );
}

