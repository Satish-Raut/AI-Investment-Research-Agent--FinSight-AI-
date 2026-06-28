import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, TrendingUp, TrendingDown,
  CheckCircle2, BarChart3, Newspaper, Cpu, FileText, ArrowUp, Loader2
} from 'lucide-react';

/* ─── Ticker data ─────────────────────────────────────────────── */
const TICKERS = [
  { sym: 'AAPL',        price: '211.45', chg: '+1.23%', up: true  },
  { sym: 'NVDA',        price: '138.92', chg: '+3.47%', up: true  },
  { sym: 'TSLA',        price: '182.31', chg: '-0.89%', up: false },
  { sym: 'MSFT',        price: '445.70', chg: '+0.62%', up: true  },
  { sym: 'META',        price: '631.45', chg: '+2.11%', up: true  },
  { sym: 'GOOGL',       price: '192.53', chg: '-0.37%', up: false },
  { sym: 'JPM',         price: '268.90', chg: '+0.88%', up: true  },
  { sym: 'RELIANCE.NS', price: '1482.3', chg: '-0.55%', up: false },
  { sym: 'TCS.NS',      price: '3891.2', chg: '+1.02%', up: true  },
];

/* ─── Quotes ──────────────────────────────────────────────────── */
const QUOTES = [
  { text: 'The stock market is a device for transferring money from the impatient to the patient.', by: 'Warren Buffett'    },
  { text: 'Risk comes from not knowing what you are doing.',                                        by: 'Warren Buffett'    },
  { text: 'An investment in knowledge pays the best interest.',                                     by: 'Benjamin Franklin' },
  { text: 'The individual investor should act consistently as an investor and not as a speculator.', by: 'Benjamin Graham'  },
];

/* ─── Features ────────────────────────────────────────────────── */
const FEATURES = [
  { icon: BarChart3, title: 'Live Financial Data',         desc: 'Pulls real-time income statements, balance sheets, and 12-month price history directly from Yahoo Finance with every query.' },
  { icon: Newspaper, title: 'News Sentiment Engine',       desc: 'Reads current market news and classifies each article as Bullish, Bearish, or Neutral — giving you the market pulse instantly.' },
  { icon: Cpu,       title: 'Multi-Agent Reasoning',       desc: 'Five LangGraph agents work in sequence — each verifying and enriching the previous output — before writing the final thesis.' },
  { icon: FileText,  title: 'Hedge-Fund Research Memos',   desc: 'Generates a structured INVEST / PASS verdict, target price range, SWOT matrix, and full written rationale in plain English.' },
];

/* ─── Footer links ────────────────────────────────────────────── */
const FOOTER_LINKS = [
  { to: '/',            label: 'Home'        },
  { to: '/dashboard',   label: 'Workspace'   },
  { to: '/history',     label: 'Library'     },
  { to: '/compare',     label: 'Compare'     },
  { to: '/methodology', label: 'Methodology' },
];

/* ─── Interactive Mockup Cycle Data ───────────────────────────── */
const DEMO_STOCKS = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    verdict: 'INVEST',
    verdictColor: '#4ade80',
    verdictBg: 'rgba(74,222,128,0.1)',
    confidence: '91%',
    targetRange: '$130 – $148',
    pe: '52.1×',
    margin: '55.0%',
    beta: '1.62',
    swot: {
      strengths: ['Strong FCF', 'Market leader'],
      weaknesses: ['High valuation', 'GPU reliance'],
      opportunities: ['AI expansion', 'Autonomous tech'],
      threats: ['Export curbs', 'Chip competitors']
    },
    sentiment: [
      { pub: 'Bloomberg', sent: 'Bullish', title: 'Nvidia crushes Q3 earnings expectations' },
      { pub: 'Reuters', sent: 'Bullish', title: 'Blackwell demand is insane, says CEO' },
      { pub: 'FT', sent: 'Bearish', title: 'Chip shortage concerns resurface in Asia' }
    ]
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    verdict: 'INVEST',
    verdictColor: '#4ade80',
    verdictBg: 'rgba(74,222,128,0.1)',
    confidence: '84%',
    targetRange: '$220 – $245',
    pe: '28.4×',
    margin: '26.4%',
    beta: '0.98',
    swot: {
      strengths: ['Brand loyalty', 'Ecosystem lock-in'],
      weaknesses: ['Slowing hardware sales', 'Antitrust heat'],
      opportunities: ['Apple Intelligence', 'Services growth'],
      threats: ['Supply chain friction', 'Smartphone fatigue']
    },
    sentiment: [
      { pub: 'Bloomberg', sent: 'Bullish', title: 'Apple Intelligence rolls out globally' },
      { pub: 'WSJ', sent: 'Neutral', title: 'iPhone shipments steady ahead of holiday season' },
      { pub: 'Reuters', sent: 'Bullish', title: 'Services revenue hits all-time record high' }
    ]
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    verdict: 'PASS',
    verdictColor: '#f87171',
    verdictBg: 'rgba(248,113,113,0.1)',
    confidence: '62%',
    targetRange: '$175 – $195',
    pe: '68.2×',
    margin: '8.2%',
    beta: '2.10',
    swot: {
      strengths: ['EV brand dominance', 'Supercharger net'],
      weaknesses: ['Declining margins', 'Autopilot delays'],
      opportunities: ['Robotaxi deployment', 'Energy storage scaling'],
      threats: ['BYD market share', 'Pricing pressure']
    },
    sentiment: [
      { pub: 'Reuters', sent: 'Bearish', title: 'Tesla EV deliveries drop below consensus' },
      { pub: 'Bloomberg', sent: 'Neutral', title: 'Musk announces new Gigafactory delays' },
      { pub: 'Electrek', sent: 'Bullish', title: 'Energy storage installations spike by 150%' }
    ]
  }
];

export default function LandingPage() {
  const [qi, setQi] = useState(0);

  // Rotating quotes interval
  useEffect(() => {
    const t = setInterval(() => setQi(q => (q + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // State machine for demo cycle
  const [stockIndex, setStockIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [demoState, setDemoState] = useState('typing'); // typing -> analyzing -> done

  useEffect(() => {
    let active = true;
    const targetTicker = DEMO_STOCKS[stockIndex].ticker;

    // Phase 1: Typing effect
    setDemoState('typing');
    setInputText('');
    let charIndex = 0;
    
    const typeTimer = setInterval(() => {
      if (!active) return;
      if (charIndex < targetTicker.length) {
        setInputText(prev => prev + targetTicker[charIndex]);
        charIndex++;
      } else {
        clearInterval(typeTimer);
        
        // Phase 2: Analyzing state
        setTimeout(() => {
          if (!active) return;
          setDemoState('analyzing');
          
          // Phase 3: Done showing results
          setTimeout(() => {
            if (!active) return;
            setDemoState('done');
            
            // Loop transition
            setTimeout(() => {
              if (!active) return;
              setStockIndex(prev => (prev + 1) % DEMO_STOCKS.length);
            }, 6000);

          }, 2000);

        }, 500);
      }
    }, 200);

    return () => {
      active = false;
      clearInterval(typeTimer);
    };
  }, [stockIndex]);

  const currentStock = DEMO_STOCKS[stockIndex];

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--t1)', overflowX: 'hidden' }}>

      {/* ════════════════════════════════
          TICKER TAPE (full bleed)
      ════════════════════════════════ */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', overflow: 'hidden', padding: '6px 0' }}>
        <div className="ticker-anim" style={{ display: 'flex', gap: 40, whiteSpace: 'nowrap' }}>
          {[...TICKERS, ...TICKERS].map((t, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
              <span style={{ color: 'var(--t3)', fontWeight: 700, letterSpacing: '0.05em' }}>{t.sym}</span>
              <span style={{ color: 'var(--t1)', fontWeight: 600 }}>${t.price}</span>
              <span style={{ color: t.up ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: 2 }}>
                {t.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {t.chg}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════
          SECTION 1 — HERO
      ════════════════════════════════ */}
      <section style={{ padding: '88px 0 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, pointerEvents: 'none', background: 'radial-gradient(ellipse, rgba(99,102,241,0.09) 0%, transparent 65%)' }} />

        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0, position: 'relative', zIndex: 1 }}>

          {/* Badge */}
          <span className="badge" style={{ marginBottom: 32, fontSize: 13, padding: '6px 14px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            AI-Powered Investment Research · Live
          </span>

          {/* Headline — Rubik Lines */}
          <h1 className="rubik-lines" style={{
            fontSize: 'clamp(44px, 5.5vw, 72px)',
            color: '#c4c4cc',
            lineHeight: 1.1,
            letterSpacing: '0.02em',
            maxWidth: 760,
            marginBottom: 28,
          }}>
            Understand companies<br />
            before you invest.
          </h1>

          {/* Sub-copy */}
          <p style={{ fontSize: 19, color: 'var(--t2)', lineHeight: 1.85, maxWidth: 520, marginBottom: 40 }}>
            Five autonomous AI agents extract live financials, score news sentiment,
            compile SWOT matrices, and write a professional research memo — in under 15 seconds.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
            <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: 15, padding: '13px 34px' }}>
              Start Analyzing <ArrowRight size={16} />
            </Link>
            <Link to="/methodology" className="btn btn-secondary" style={{ fontSize: 15, padding: '13px 34px' }}>
              How It Works
            </Link>
          </div>

          {/* Rotating quote */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p className="serif" style={{ fontSize: 17, fontStyle: 'italic', color: 'var(--t2)', lineHeight: 1.75 }}>
              "{QUOTES[qi].text}"
            </p>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t3)', letterSpacing: '0.06em' }}>
              — {QUOTES[qi].by}
            </span>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════
          SECTION 2 — ANIMATED DASHBOARD DEMO
      ════════════════════════════════ */}
      <section style={{ padding: '88px 0' }}>
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44 }}>

          {/* Section header */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
              See it in action
            </span>
            <h2 className="serif" style={{ fontSize: 'clamp(34px, 4vw, 52px)', color: 'var(--t1)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              From a name to a full research<br />memo in under 15 seconds.
            </h2>
          </div>

          {/* Browser chrome mockup */}
          <div className="glow-card" style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)', position: 'relative' }}>
            
            {/* Ambient scanning beam when analyzing */}
            {demoState === 'analyzing' && <div className="scan-beam" />}

            {/* Chrome bar */}
            <div style={{ background: '#0f0f13', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', gap: 7 }}>
                {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                  <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'block' }} />
                ))}
              </div>
              
              {/* Mock search input inside chrome */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  background: 'var(--bg)', borderRadius: 8, padding: '6px 14px', fontSize: 13,
                  color: 'var(--t2)', border: '1px solid var(--border)', width: '100%', maxWidth: 360,
                  display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
                }}>
                  <span>🔍</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {inputText}
                  </span>
                  {demoState === 'typing' && <span className="cursor-blink" style={{ width: 2, height: 14, background: 'var(--accent)', marginLeft: -4 }} />}
                </div>
              </div>
            </div>

            {/* Dashboard contents */}
            <div style={{ padding: 28, background: '#0b0b0f', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, minHeight: 380, position: 'relative' }}>
              
              {demoState === 'analyzing' ? (
                /* Loading screen */
                <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <Loader2 size={36} color="var(--accent)" style={{ animation: 'spin 1.2s linear infinite' }} />
                  <span style={{ fontSize: 15, color: 'var(--t2)', letterSpacing: '0.03em', fontWeight: 500 }}>
                    Agents researching <strong style={{ color: 'var(--t1)' }}>{currentStock.ticker}</strong>...
                  </span>
                </div>
              ) : (
                /* Results screen (Fades in) */
                <>
                  {/* Verdict card */}
                  <div className="animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>AI Verdict</span>
                    <div>
                      <div className="serif" style={{ fontSize: 44, color: currentStock.verdictColor, lineHeight: 1 }}>
                        {currentStock.verdict}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>Confidence · {currentStock.confidence}</div>
                    </div>
                    
                    <div style={{ background: currentStock.verdictBg, border: `1px solid ${currentStock.verdictColor}28`, borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 3 }}>Target Range</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: currentStock.verdictColor }}>{currentStock.targetRange}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {[
                        { l: 'P/E Ratio', v: currentStock.pe },
                        { l: 'Profit Margin', v: currentStock.margin },
                        { l: 'Beta', v: currentStock.beta }
                      ].map((r, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                          <span style={{ color: 'var(--t3)' }}>{r.l}</span>
                          <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SWOT card */}
                  <div className="animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>SWOT Matrix</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
                      {[
                        { l: 'STRENGTHS',     color: '#4ade80', items: currentStock.swot.strengths },
                        { l: 'WEAKNESSES',    color: '#f87171', items: currentStock.swot.weaknesses },
                        { l: 'OPPORTUNITIES', color: '#818cf8', items: currentStock.swot.opportunities },
                        { l: 'THREATS',       color: '#fb923c', items: currentStock.swot.threats }
                      ].map((q, i) => (
                        <div key={i} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: q.color, letterSpacing: '0.1em', marginBottom: 6 }}>{q.l}</div>
                          {q.items.map((it, j) => (
                            <div key={j} style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>· {it}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sentiment card */}
                  <div className="animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Market Sentiment</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {currentStock.sentiment.map((n, i) => (
                        <div key={i} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '11px 13px', border: `1px solid ${n.sent === 'Bullish' ? 'rgba(74,222,128,0.12)' : n.sent === 'Bearish' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.05)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{n.pub}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                              background: n.sent === 'Bullish' ? 'rgba(74,222,128,0.1)' : n.sent === 'Bearish' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
                              color: n.sent === 'Bullish' ? '#4ade80' : n.sent === 'Bearish' ? '#f87171' : 'var(--t2)'
                            }}>
                              {n.sent}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.45 }}>{n.title}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', paddingTop: 8 }}>
                      <CheckCircle2 size={14} color="#4ade80" />
                      <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
                        Analysis Complete · {currentStock.ticker}
                      </span>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════
          SECTION 3 — ABOUT / FEATURES
      ════════════════════════════════ */}
      <section style={{ padding: '88px 0' }}>
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 52 }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>About the platform</span>
            <h2 className="serif" style={{ fontSize: 'clamp(34px, 4.2vw, 54px)', fontWeight: 400, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Built for serious investors,<br />accessible to everyone.
            </h2>
            <p style={{ fontSize: 19, color: 'var(--t2)', maxWidth: 560, margin: '0 auto', lineHeight: 1.85 }}>
              FinSight.ai automates the most time-consuming parts of stock research using a
              five-node LangGraph state machine running on a Node.js + Express backend.
            </p>
          </div>

          {/* Feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: 16, transition: 'border-color .2s, box-shadow .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-ring)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(99,102,241,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--accent-dim)', border: '1px solid var(--accent-ring)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color="var(--accent)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ fontSize: 15, color: 'var(--t2)', lineHeight: 1.8 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats band */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '34px 36px' }}>
            {[
              { v: '40+',   l: 'Data points extracted per company'    },
              { v: '< 15s', l: 'Full analysis, start to finish'       },
              { v: '5',     l: 'Autonomous AI agents in the pipeline' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none', padding: '0 24px' }}>
                <div className="serif" style={{ fontSize: 56, color: 'var(--t1)', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 14, color: 'var(--t3)', marginTop: 8, fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════
          SECTION 4 — FOOTER
      ════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid var(--border)', marginTop: 60 }}>

        {/* Giant faded watermark */}
        <div style={{ textAlign: 'center', padding: '72px 40px 0', overflow: 'hidden', userSelect: 'none' }}>
          <div className="rubik-lines" style={{
            fontSize: 'clamp(72px, 14vw, 200px)',
            lineHeight: 1,
            letterSpacing: '0.01em',
            background: 'linear-gradient(to bottom, rgba(99,102,241,0.32) 0%, rgba(99,102,241,0.10) 60%, transparent 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            pointerEvents: 'none',
          }}>
            FinSight.ai
          </div>
          <div style={{ marginTop: -14, marginBottom: 44 }}>
            <p className="serif" style={{ fontSize: 18, color: 'var(--t2)', fontStyle: 'italic' }}>
              Understand companies before you invest.
            </p>
            <p style={{ fontSize: 14, color: 'var(--t3)', marginTop: 6 }}>
              Powered by LangGraph · Yahoo Finance · Google Gemini
            </p>
          </div>
        </div>

        {/* Footer links grid */}
        <div className="page-container" style={{ padding: '40px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, borderTop: '1px solid var(--border)' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center'
            }}>
              Fin<span style={{ fontWeight: 400, color: 'var(--t2)' }}>Sight</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: 1, textShadow: '0 0 10px rgba(99,102,241,0.4)' }}>.ai</span>
            </span>
            <p style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.8, maxWidth: 280 }}>
              A high-fidelity AI research platform built to automate fundamental analysis
              using LangGraph state machines and live market data.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {['React', 'Redux', 'LangGraph', 'Express', 'MySQL'].map((tech, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', border: '1px solid var(--border2)', borderRadius: 999, color: 'var(--t3)', letterSpacing: '0.04em' }}>{tech}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Quick Links</span>
            {FOOTER_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} style={{ fontSize: 15, color: 'var(--t2)', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => e.target.style.color = 'var(--t1)'}
                onMouseLeave={e => e.target.style.color = 'var(--t2)'}
              >
                · {label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Project Info</span>
            {[
              { l: 'Author',  v: 'Satish Raut'     },
              { l: 'License', v: 'MIT License'     },
              { l: 'Status',  v: 'Beta · v1.0'     },
              { l: 'Model',   v: 'Gemini · OpenAI' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.l}</span>
                <span style={{ fontSize: 15, color: 'var(--t2)' }}>{r.v}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Copyright bar */}
        <div className="page-container" style={{ padding: '18px 40px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500 }}>
            © 2026 FinSight.ai. All rights reserved.
          </span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--t3)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px', cursor: 'pointer', transition: 'color .15s, border-color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <ArrowUp size={13} /> Back to Top
          </button>
        </div>

      </footer>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
