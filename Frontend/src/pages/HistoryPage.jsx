import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, TrendingUp, TrendingDown, Calendar, AlertCircle, ShieldAlert, Loader2, X } from 'lucide-react';
import AuthModal from '../components/AuthModal';

export default function HistoryPage() {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  
  const [search, setSearch] = useState('');
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null); // Selected item for detailed memo view modal

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/api/research/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch research logs');
        }
        const data = await response.json();
        setHistoryList(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, token]);

  const filtered = historyList.filter(h =>
    h.companyName.toLowerCase().includes(search.toLowerCase()) ||
    h.ticker.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '48px 0' }}>
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Auth blocker */}
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
              <h2 className="serif" style={{ fontSize: 28, color: 'var(--t1)', marginBottom: 8 }}>Library is Protected</h2>
              <p style={{ fontSize: 16, color: 'var(--t2)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
                Please sign in to access your historical stock research analyses and saved reports.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAuthModal(true)} style={{ padding: '12px 36px', fontSize: 15 }}>
              Sign In to Library
            </button>
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
          </div>
        )}

        {isAuthenticated && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Research Library</span>
                <h1 className="serif" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', color: 'var(--t1)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Past Analyses
                </h1>
                <p style={{ fontSize: 16, color: 'var(--t2)' }}>All companies you've previously researched with FinSight.ai.</p>
              </div>
              {/* Search */}
              <div style={{ position: 'relative', width: 280 }}>
                <Search size={15} color="var(--t3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input" style={{ paddingLeft: 40, height: 44 }} placeholder="Search by company or ticker…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Total Analyses',    val: historyList.length,                                         color: 'var(--accent)'  },
                { label: 'INVEST Verdicts',   val: historyList.filter(h => h.verdict === 'INVEST').length,      color: '#4ade80'        },
                { label: 'PASS Verdicts',     val: historyList.filter(h => h.verdict === 'PASS').length,        color: '#f87171'        },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 600 }}>{s.label}</span>
                  <span className="serif" style={{ fontSize: 36, color: s.color, lineHeight: 1 }}>{s.val}</span>
                </div>
              ))}
            </div>

            {/* Content Table / Loader */}
            {loading ? (
              <div style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 14, color: 'var(--t2)' }}>Loading saved reports…</span>
              </div>
            ) : error ? (
              <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <AlertCircle size={24} color="#f87171" />
                <span style={{ fontSize: 14, color: '#f87171' }}>{error}</span>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {/* Table head */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 140px 100px', gap: 0, padding: '14px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  {['Company', 'Ticker', 'Verdict', 'Confidence', 'Date', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>

                {/* Rows */}
                {filtered.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--t3)' }}>
                    {search ? `No results found for "${search}"` : 'No analyses saved in your library yet.'}
                  </div>
                ) : (
                  filtered.map((h, i) => (
                    <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 140px 100px', gap: 0, padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>{h.companyName}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)', fontFamily: 'monospace' }}>{h.ticker}</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800,
                        padding: '4px 10px', borderRadius: 999, width: 'fit-content',
                        background: h.verdict === 'INVEST' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                        color: h.verdict === 'INVEST' ? '#4ade80' : '#f87171',
                      }}>
                        {h.verdict === 'INVEST' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {h.verdict}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{h.confidence}%</span>
                      <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                        {formatDate(h.createdAt)}
                      </div>
                      <button
                        onClick={() => setActiveItem(h)}
                        style={{
                          background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer',
                          padding: '6px 14px', color: 'var(--t2)', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          transition: 'color .15s, border-color .15s, background .15s', width: 'fit-content'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        View Memo
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* Detailed Analysis Modal Overlay */}
      {activeItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 5, 6, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
            padding: 32, width: '90%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto',
            position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column', gap: 24
          }}>
            <button onClick={() => setActiveItem(null)} style={{
              position: 'absolute', top: 20, right: 20, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--t3)'
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
            >
              <X size={22} />
            </button>

            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 800,
                  padding: '6px 16px', borderRadius: 999,
                  background: activeItem.verdict === 'INVEST' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                  color: activeItem.verdict === 'INVEST' ? '#4ade80' : '#f87171',
                }}>
                  {activeItem.verdict === 'INVEST' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {activeItem.verdict}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>{activeItem.companyName}</h3>
                  <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'monospace' }}>{activeItem.ticker} · Confidence: {activeItem.confidence}%</span>
                </div>
              </div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 14px' }}>
                <span style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', display: 'block' }}>Target Range</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: activeItem.verdict === 'INVEST' ? '#4ade80' : '#f87171' }}>{activeItem.targetRange}</span>
              </div>
            </div>

            {/* Thesis Rationale */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Hedge Fund Thesis</span>
              <p className="serif" style={{ fontSize: 18, color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.75, margin: 0 }}>
                "{activeItem.summary}"
              </p>
            </div>

            {/* Metrics & SWOT Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              
              {/* Financial Metrics */}
              <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Financial Metrics</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { l: 'Trailing P/E Ratio', v: activeItem.financials?.pe },
                    { l: 'Operating Margin',   v: activeItem.financials?.margin },
                    { l: 'Stock Beta volatility', v: activeItem.financials?.beta },
                    { l: 'Total Revenue (TTM)', v: activeItem.financials?.revenue },
                    { l: '52-Week High Range',  v: activeItem.financials?.high },
                    { l: '52-Week Low Range',   v: activeItem.financials?.low }
                  ].map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid var(--border)', paddingBottom: 5 }}>
                      <span style={{ color: 'var(--t3)' }}>{m.l}</span>
                      <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{m.v || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SWOT quadrants */}
              <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>SWOT Profile</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'STRENGTHS',     color: '#4ade80', items: activeItem.swot?.strengths || [] },
                    { l: 'WEAKNESSES',    color: '#f87171', items: activeItem.swot?.weaknesses || [] },
                    { l: 'OPPORTUNITIES', color: '#818cf8', items: activeItem.swot?.opportunities || [] },
                    { l: 'THREATS',       color: '#fb923c', items: activeItem.swot?.threats || [] }
                  ].map((q, idx) => (
                    <div key={idx} style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: q.color, marginBottom: 4 }}>{q.l}</div>
                      {q.items.map((bullet, k) => (
                        <div key={k} style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.4 }}>· {bullet}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* News sentiment feed */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Market Sentiment News</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {(activeItem.sentiment || []).map((n, idx) => (
                  <div key={idx} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px', border: `1px solid ${n.sent === 'Bullish' ? 'rgba(74,222,128,0.1)' : n.sent === 'Bearish' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>{n.pub}</span>
                      <span style={{
                        fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 999,
                        background: n.sent === 'Bullish' ? 'rgba(74,222,128,0.1)' : n.sent === 'Bearish' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
                        color: n.sent === 'Bullish' ? '#4ade80' : n.sent === 'Bearish' ? '#f87171' : 'var(--t2)'
                      }}>{n.sent}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--t1)', lineHeight: 1.4, margin: 0 }}>{n.title}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
