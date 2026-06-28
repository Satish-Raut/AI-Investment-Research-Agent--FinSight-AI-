import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, X, TrendingUp, TrendingDown, BarChart3, ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';
import AuthModal from '../components/AuthModal';

const METRICS = [
  { key: 'verdict',     label: 'AI Verdict'     },
  { key: 'confidence',  label: 'Confidence'     },
  { key: 'pe',          label: 'P/E Ratio'      },
  { key: 'margin',      label: 'Profit Margin'  },
  { key: 'beta',        label: 'Beta'           },
  { key: 'revenue',     label: 'Revenue (TTM)'  },
  { key: 'targetRange', label: 'Target Range'   },
];

export default function ComparisonPage() {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stocksMap, setStocksMap] = useState({});
  const [selected, setSelected] = useState([]);
  const [adding, setAdding] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
        
        // Compile unique ticker list mapping ticker -> stock data
        const uniqueStocks = {};
        data.forEach(item => {
          uniqueStocks[item.ticker] = {
            name: item.companyName,
            ticker: item.ticker,
            verdict: item.verdict,
            confidence: item.confidence,
            pe: item.financials?.pe || 'N/A',
            margin: item.financials?.margin || 'N/A',
            beta: item.financials?.beta || '1.0',
            revenue: item.financials?.revenue || 'N/A',
            targetRange: item.targetRange || 'N/A',
          };
        });

        setStocksMap(uniqueStocks);

        // Pre-select up to 2 tickers if available
        const tickers = Object.keys(uniqueStocks);
        if (tickers.length >= 2) {
          setSelected([tickers[0], tickers[1]]);
        } else if (tickers.length === 1) {
          setSelected([tickers[0]]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, token]);

  const tickersList = Object.keys(stocksMap);

  const add = (t) => {
    if (!selected.includes(t) && selected.length < 4) {
      setSelected(p => [...p, t]);
    }
    setAdding(false);
  };
  const remove = (t) => setSelected(p => p.filter(x => x !== t));

  const renderVal = (metric, row) => {
    if (metric === 'verdict') return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 800,
        padding: '4px 12px', borderRadius: 999,
        background: row.verdict === 'INVEST' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
        color: row.verdict === 'INVEST' ? '#4ade80' : '#f87171',
      }}>
        {row.verdict === 'INVEST' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {row.verdict}
      </span>
    );
    if (metric === 'confidence') return <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{row.confidence}%</span>;
    if (metric === 'targetRange') return <span style={{ fontSize: 15, fontWeight: 700, color: row.verdict === 'INVEST' ? '#4ade80' : '#f87171' }}>{row.targetRange}</span>;
    return <span style={{ fontSize: 15, color: 'var(--t1)', fontWeight: 600 }}>{row[metric]}</span>;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '48px 0' }}>
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Auth Blocker */}
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
              <h2 className="serif" style={{ fontSize: 28, color: 'var(--t1)', marginBottom: 8 }}>Compare is Protected</h2>
              <p style={{ fontSize: 16, color: 'var(--t2)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
                Please sign in to compare metrics of previously analyzed companies side-by-side.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAuthModal(true)} style={{ padding: '12px 36px', fontSize: 15 }}>
              Sign In to Compare
            </button>
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
          </div>
        )}

        {isAuthenticated && (
          <>
            {/* Header */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Side-by-Side</span>
              <h1 className="serif" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', color: 'var(--t1)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Compare Companies
              </h1>
              <p style={{ fontSize: 16, color: 'var(--t2)' }}>Select up to 4 companies to compare their AI-generated research metrics side-by-side.</p>
            </div>

            {loading ? (
              <div style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 14, color: 'var(--t2)' }}>Loading comparison library…</span>
              </div>
            ) : error ? (
              <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <AlertCircle size={24} color="#f87171" />
                <span style={{ fontSize: 14, color: '#f87171' }}>{error}</span>
              </div>
            ) : tickersList.length === 0 ? (
              // Empty comparison library helper
              <div style={{ padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-dim)', border: '1px solid var(--accent-ring)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={24} color="var(--accent)" />
                </div>
                <h3 className="serif" style={{ fontSize: 22, color: 'var(--t1)' }}>No Stocks Available to Compare</h3>
                <p style={{ fontSize: 15, color: 'var(--t2)', maxWidth: 440, lineHeight: 1.6 }}>
                  You haven't run any research analyses yet. Go to the Workspace and analyze a couple of stocks (e.g. Nvidia, Apple) to compare them side-by-side here.
                </p>
              </div>
            ) : (
              /* Comparison table */
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${selected.length + (selected.length < 4 ? 1 : 0)}, 1fr)`, borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  <div style={{ padding: '18px 20px' }} />
                  {selected.map(t => (
                    <div key={t} style={{ padding: '18px 16px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
                      <button onClick={() => remove(t)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 2, lineHeight: 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
                      ><X size={14} /></button>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)', fontFamily: 'monospace' }}>{t}</span>
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>{stocksMap[t].name}</span>
                    </div>
                  ))}
                  {selected.length < 4 && (
                    <div style={{ padding: '18px 16px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {adding ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                          {tickersList.filter(t => !selected.includes(t)).map(t => (
                            <button key={t} onClick={() => add(t)} style={{ padding: '7px 12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-ring)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--accent)', textAlign: 'left' }}>
                              {t} — {stocksMap[t].name}
                            </button>
                          ))}
                          <button onClick={() => setAdding(false)} style={{ padding: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 12 }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setAdding(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: '1px dashed var(--border2)', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', color: 'var(--t3)', transition: 'color .15s, border-color .15s', width: '100%' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-ring)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          <Plus size={20} />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>Add Company</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Metric rows */}
                {METRICS.map((m, mi) => (
                  <div key={m.key} style={{ display: 'grid', gridTemplateColumns: `200px repeat(${selected.length + (selected.length < 4 ? 1 : 0)}, 1fr)`, borderBottom: mi < METRICS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)' }}>{m.label}</span>
                    </div>
                    {selected.map(t => (
                      <div key={t} style={{ padding: '16px 16px', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                        {renderVal(m.key, stocksMap[t])}
                      </div>
                    ))}
                    {selected.length < 4 && <div style={{ borderLeft: '1px solid var(--border)' }} />}
                  </div>
                ))}

              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
