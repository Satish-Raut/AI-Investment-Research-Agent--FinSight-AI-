import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { User, Calendar, LogOut, Loader2, ArrowRight, TrendingUp, TrendingDown, Clock, ShieldAlert, AlertCircle, X } from 'lucide-react';
import { logout } from '../store/authSlice';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);

  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeItem, setActiveItem] = useState(null); // Selected item for detailed view

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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

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
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

        {/* Auth Blocker */}
        {!isAuthenticated ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
            padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: 20, margin: '24px 0', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--accent-ring)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={28} color="var(--accent)" />
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: 28, color: 'var(--t1)', marginBottom: 8 }}>Profile is Protected</h2>
              <p style={{ fontSize: 16, color: 'var(--t2)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
                Please sign in to access your user profile dashboard and history analytics.
              </p>
            </div>
            <Link to="/login" className="btn btn-primary" style={{ padding: '12px 36px', fontSize: 15 }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          /* Profile Content */
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32, alignItems: 'start' }}>
            
            {/* Sidebar Profile Card */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
              padding: 28, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
              {/* User Avatar Circle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--accent-dim)', border: '2px solid var(--accent-ring)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, color: 'var(--accent)', fontWeight: 800
                }}>
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', wordBreak: 'break-all', margin: '0 0 4px 0' }}>{user?.email}</h3>
                  <span style={{ fontSize: 13, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <Calendar size={13} /> Active Research Node
                  </span>
                </div>
              </div>

              {/* Stats Counters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Analyses Run', val: historyList.length, color: 'var(--accent)' },
                  { label: 'INVEST Verdicts', val: historyList.filter(h => h.verdict === 'INVEST').length, color: '#4ade80' },
                  { label: 'PASS Verdicts', val: historyList.filter(h => h.verdict === 'PASS').length, color: '#f87171' },
                ].map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 16, color: s.color, fontWeight: 700 }}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 0', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171',
                  background: 'rgba(248,113,113,0.03)', borderRadius: 12, cursor: 'pointer', transition: 'background .15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.03)'}
              >
                <LogOut size={16} /> Logout Session
              </button>
            </div>

            {/* Main Area: Recent Activity Memos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Account Summary</span>
                <h1 className="serif" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', color: 'var(--t1)', fontWeight: 400, letterSpacing: '-0.02em', margin: 0 }}>
                  Profile Dashboard
                </h1>
              </div>

              {loading ? (
                <div style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                  <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 14, color: 'var(--t2)' }}>Loading recent reports…</span>
                </div>
              ) : error ? (
                <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                  <AlertCircle size={24} color="#f87171" />
                  <span style={{ fontSize: 14, color: '#f87171' }}>{error}</span>
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ padding: '64px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-dim)', border: '1px solid var(--accent-ring)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={24} color="var(--accent)" />
                  </div>
                  <h3 className="serif" style={{ fontSize: 22, color: 'var(--t1)' }}>No Stock Analyses Saved</h3>
                  <p style={{ fontSize: 15, color: 'var(--t2)', maxWidth: 440, lineHeight: 1.6 }}>
                    Run a company query in the Workspace to populate your profile activity with research reports.
                  </p>
                  <Link to="/dashboard" className="btn btn-primary" style={{ padding: '10px 28px', fontSize: 14 }}>
                    Go to Workspace <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Research Reports</span>
                  {historyList.slice(0, 3).map((item) => (
                    <div key={item.id}
                      style={{
                        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18,
                        padding: 24, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer',
                        transition: 'border-color .15s, box-shadow .15s'
                      }}
                      onClick={() => setActiveItem(item)}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-ring)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800,
                            padding: '3px 10px', borderRadius: 999,
                            background: item.verdict === 'INVEST' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                            color: item.verdict === 'INVEST' ? '#4ade80' : '#f87171',
                          }}>
                            {item.verdict === 'INVEST' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {item.verdict}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>{item.companyName}</span>
                          <span style={{ fontSize: 12, color: 'var(--t3)', fontFamily: 'monospace' }}>({item.ticker})</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={12} /> {formatDate(item.createdAt)}
                        </div>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>
                        "{item.summary}"
                      </p>
                    </div>
                  ))}
                  {historyList.length > 3 && (
                    <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', width: 'fit-content' }}>
                      View all {historyList.length} analyses in Library <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Detailed view Modal */}
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

            {/* Header */}
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

            {/* Rationale Thesis */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Hedge Fund Thesis</span>
              <p className="serif" style={{ fontSize: 18, color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.75, margin: 0 }}>
                "{activeItem.summary}"
              </p>
            </div>

            {/* SWOT & Metrics Grid */}
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

              {/* SWOT Matrix */}
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

            {/* News Sentiment */}
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

    </div>
  );
}
