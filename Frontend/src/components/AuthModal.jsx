import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Loader2 } from 'lucide-react';
import { authStart, authSuccess, authFailure, clearAuthError } from '../store/authSlice';

export default function AuthModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(authStart());
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        dispatch(authSuccess({ token: data.token, user: data.user }));
        onClose();
      } else {
        // Register successful, toggle to login
        setIsLogin(true);
        setPassword('');
        alert('Registration successful! Please login.');
        dispatch(clearAuthError());
      }
    } catch (err) {
      dispatch(authFailure(err.message));
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5, 5, 6, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        position: 'relative',
        boxShadow: '0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03)',
      }}>
        {/* Close Button */}
        <button onClick={() => { dispatch(clearAuthError()); onClose(); }} style={{
          position: 'absolute', top: 20, right: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--t3)', transition: 'color .15s'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="serif" style={{ fontSize: 28, color: 'var(--t1)', marginBottom: 10, fontWeight: 400 }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 24 }}>
          {isLogin ? 'Sign in to access research & library tools' : 'Join FinSight.ai to save stock histories'}
        </p>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13,
            color: '#f87171',
            marginBottom: 20,
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              style={{ height: 44 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ height: 44 }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{
            height: 44, fontSize: 14, fontWeight: 700, marginTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--t3)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { dispatch(clearAuthError()); setIsLogin(!isLogin); }} style={{
            background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer',
            fontWeight: 600, padding: 0, textDecoration: 'underline'
          }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

      </div>
    </div>
  );
}
