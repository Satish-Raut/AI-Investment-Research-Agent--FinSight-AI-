import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Loader2, TrendingUp, AlertCircle, ShieldAlert, CheckCircle2, TrendingDown, Clock } from 'lucide-react';
import AuthModal from '../components/AuthModal';

const PIPELINE_STEPS = [
  { id: 'resolveTicker',   label: 'Resolve Ticker',     status: 'idle' },
  { id: 'fetchFinancials', label: 'Extract Financials', status: 'idle' },
  { id: 'scoreSentiment',  label: 'Score Sentiment',    status: 'idle' },
  { id: 'compileSWOT',     label: 'Compile SWOT',       status: 'idle' },
  { id: 'writeMemo',        label: 'Write Memo',         status: 'idle' },
];

export default function DashboardPage() {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState(PIPELINE_STEPS);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const statusColor = { idle: 'var(--t3)', running: 'var(--accent)', done: '#4ade80' };
  const statusLabel = { idle: 'Waiting', running: 'Running…', done: 'Done' };

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    
    // Reset pipeline steps
    setSteps(PIPELINE_STEPS.map(s => ({ ...s, status: 'idle' })));

    try {
      const response = await fetch('http://localhost:5000/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server analysis request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          if (line.startsWith('data: ')) {
            const rawPayload = line.slice(6);
            let payload;
            try {
              payload = JSON.parse(rawPayload);
            } catch (e) {
              console.warn('Failed parsing stream payload:', rawPayload);
              continue;
            }

            if (payload.error) {
              throw new Error(payload.error);
            }

            const step = payload.step;
            const data = payload.data;

            // Handle intermediate node responses to update step tracker state
            if (step) {
              setSteps(prev => prev.map((s) => {
                if (s.id === step) return { ...s, status: 'done' };
                // Set the subsequent step to running
                const stepIdx = prev.findIndex(item => item.id === step);
                const currentIdx = prev.findIndex(item => item.id === s.id);
                if (currentIdx === stepIdx + 1) return { ...s, status: 'running' };
                return s;
              }));
            }

            // Handle completion event
            if (step === 'complete') {
              setReport(payload.finalState);
              setSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
              setLoading(false);
            }
          }
        }
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during research execution');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '48px 0' }}>
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

        {/* Auth overlay blocker */}
        {!isAuthenticated && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
            padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: 20, margin: '24px 0', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--accent-ring)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={28} color="var(--accent)" />
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: 28, color: 'var(--t1)', marginBottom: 8 }}>Workspace is Protected</h2>
              <p style={{ fontSize: 16, color: 'var(--t2)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
                FinSight.ai utilizes active agentic node search streams. Please sign in or create an account to start stock research.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAuthModal(true)} style={{ padding: '12px 36px', fontSize: 15 }}>
              Sign In to Workspace
            </button>
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
          </div>
        )}

        {isAuthenticated && (
          <>
            {/* Header */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Workspace</span>
              <h1 className="serif" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', color: 'var(--t1)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Analyze a Company
              </h1>
              <p style={{ fontSize: 16, color: 'var(--t2)' }}>Enter any company name or stock ticker to start a five-agent AI research session.</p>
            </div>

            {/* Search bar */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} color="var(--t3)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 46, fontSize: 16, height: 52, borderRadius: 14 }}
                  placeholder="e.g.  Apple, Nvidia, Tesla, MSFT, Reliance Industries, TCS…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && query.trim() && handleAnalyze()}
                  disabled={loading}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ height: 52, padding: '0 28px', fontSize: 15, borderRadius: 14 }}
                onClick={handleAnalyze}
                disabled={loading || !query.trim()}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                {loading ? 'Analyzing…' : 'Analyze'}
              </button>
            </div>

            {/* Main Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

              {/* Agent pipeline tracker */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 20 }}>Agent Pipeline</span>
                {steps.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: i < steps.length - 1 ? 20 : 0, position: 'relative' }}>
                    {/* Connector line */}
                    {i < steps.length - 1 && (
                      <div style={{ position: 'absolute', left: 11, top: 24, width: 2, height: 'calc(100% - 4px)', background: s.status === 'done' ? '#4ade80' : 'var(--border)' }} />
                    )}
                    {/* Step circle */}
                    <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, background: s.status === 'done' ? 'rgba(74,222,128,0.1)' : s.status === 'running' ? 'var(--accent-dim)' : 'var(--surface2)', border: `2px solid ${statusColor[s.status]}`, color: statusColor[s.status], zIndex: 1 }}>
                      {s.status === 'done' ? '✓' : s.id === 'resolveTicker' ? '1' : s.id === 'fetchFinancials' ? '2' : s.id === 'scoreSentiment' ? '3' : s.id === 'compileSWOT' ? '4' : '5'}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: s.status === 'idle' ? 'var(--t3)' : 'var(--t1)' }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: statusColor[s.status], marginTop: 2 }}>{statusLabel[s.status]}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Result Area */}
              <div style={{ minHeight: 400 }}>
                {error && (
                  <div style={{ background: 'var(--surface)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={24} color="#f87171" />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>Research Session Interrupted</h3>
                    <p style={{ fontSize: 14, color: 'var(--t2)', maxWidth: 400, lineHeight: 1.6 }}>{error}</p>
                    <button className="btn btn-secondary" onClick={handleAnalyze} style={{ padding: '8px 24px', fontSize: 14 }}>Retry Analysis</button>
                  </div>
                )}

                {!report && !error && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                    {loading ? (
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                        <p style={{ fontSize: 16, color: 'var(--t2)' }}>Agents are executing research on <strong style={{ color: 'var(--t1)' }}>{query}</strong>…</p>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-dim)', border: '1px solid var(--accent-ring)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Search size={24} color="var(--accent)" />
                        </div>
                        <p className="serif" style={{ fontSize: 20, color: 'var(--t2)', fontStyle: 'italic', maxWidth: 360 }}>
                          Enter a company name above to run a full AI research session.
                        </p>
                        <p style={{ fontSize: 14, color: 'var(--t3)', maxWidth: 320 }}>Results will stream here in real-time as each agent completes its task.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Main analytical report rendered when data completes */}
                {report && !error && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Memo Title & Recommendation Header */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 20, fontWeight: 800,
                          padding: '8px 20px', borderRadius: 999,
                          background: report.verdict === 'INVEST' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                          color: report.verdict === 'INVEST' ? '#4ade80' : '#f87171',
                        }}>
                          {report.verdict === 'INVEST' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                          {report.verdict}
                        </div>
                        <div>
                          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)' }}>{report.companyName}</h2>
                          <p style={{ fontSize: 13, color: 'var(--t3)', fontFamily: 'monospace' }}>Ticker: {report.ticker} · Conf: {report.confidence}%</p>
                        </div>
                      </div>
                      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', textAlign: 'right' }}>
                        <span style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Target Buy Range</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: report.verdict === 'INVEST' ? '#4ade80' : '#f87171' }}>{report.targetRange}</span>
                      </div>
                    </div>

                    {/* Rationale Memo */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Investment Thesis</span>
                      <p className="serif" style={{ fontSize: 18, color: 'var(--t2)', lineHeight: 1.8, fontStyle: 'italic' }}>
                        "{report.rationale}"
                      </p>
                    </div>

                    {/* Key Metrics and SWOT Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      
                      {/* Financial Metrics Panel */}
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Financial Metrics</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[
                            { l: 'Regular Market Price', v: `$${report.financials?.price}` },
                            { l: 'Trailing P/E Ratio',   v: report.financials?.pe },
                            { l: 'Operating Margin',     v: report.financials?.margin },
                            { l: 'Stock Beta volatility', v: report.financials?.beta },
                            { l: 'Total Revenue (TTM)',  v: report.financials?.revenue },
                            { l: '52-Week Range',        v: `${report.financials?.low} – ${report.financials?.high}` }
                          ].map((m, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                              <span style={{ color: 'var(--t3)' }}>{m.l}</span>
                              <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{m.v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SWOT Matrix Card */}
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>SWOT Analysis</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
                          {[
                            { l: 'STRENGTHS',     color: '#4ade80', items: report.swot?.strengths || [] },
                            { l: 'WEAKNESSES',    color: '#f87171', items: report.swot?.weaknesses || [] },
                            { l: 'OPPORTUNITIES', color: '#818cf8', items: report.swot?.opportunities || [] },
                            { l: 'THREATS',       color: '#fb923c', items: report.swot?.threats || [] }
                          ].map((q, idx) => (
                            <div key={idx} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px' }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: q.color, letterSpacing: '0.05em', marginBottom: 6 }}>{q.l}</div>
                              {q.items.map((bullet, k) => (
                                <div key={k} style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>· {bullet}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Market Sentiment Feed */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>Market Sentiment</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {(report.sentiment || []).map((n, idx) => (
                          <div key={idx} style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 14px', border: `1px solid ${n.sent === 'Bullish' ? 'rgba(74,222,128,0.12)' : n.sent === 'Bearish' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.05)'}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{n.pub}</span>
                              <span style={{
                                fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 999,
                                background: n.sent === 'Bullish' ? 'rgba(74,222,128,0.1)' : n.sent === 'Bearish' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
                                color: n.sent === 'Bullish' ? '#4ade80' : n.sent === 'Bearish' ? '#f87171' : 'var(--t2)'
                              }}>{n.sent}</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.4, flex: 1 }}>{n.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Completion disclaimer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', opacity: 0.7 }}>
                      <CheckCircle2 size={13} color="#4ade80" />
                      <span style={{ fontSize: 12, color: '#4ade80' }}>All 5 analytical agents completed successfully. Data saved to research library.</span>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </>
        )}

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
