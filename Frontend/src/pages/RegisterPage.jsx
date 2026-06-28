import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { authStart, authFailure, clearAuthError } from '../store/authSlice';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    return () => {
      dispatch(clearAuthError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) return;
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    dispatch(authStart());
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      alert('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      dispatch(authFailure(err.message));
    }
  };

  return (
    <div style={{ minHeight: '85vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03)',
      }}>
        {/* Title */}
        <h2 className="serif" style={{ fontSize: 32, color: 'var(--t1)', marginBottom: 8, fontWeight: 400 }}>
          Create Account
        </h2>
        <p style={{ fontSize: 15, color: 'var(--t2)', marginBottom: 28 }}>
          Join FinSight.ai to start researching stocks.
        </p>

        {/* Error message */}
        {(localError || error) && (
          <div style={{
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 13,
            color: '#f87171',
            marginBottom: 24,
            lineHeight: 1.5,
          }}>
            {localError || error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              style={{ height: 46, fontSize: 15 }}
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
              style={{ height: 46, fontSize: 15 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ height: 46, fontSize: 15 }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{
            height: 48, fontSize: 15, fontWeight: 700, marginTop: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12
          }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign Up <ArrowRight size={16} /></>}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 14, color: 'var(--t3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline'
          }}>
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
