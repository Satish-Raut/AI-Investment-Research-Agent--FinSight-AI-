import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Compass, User, LogOut } from 'lucide-react';
import { logout } from '../store/authSlice';

const LINKS = [
  { to: '/dashboard',   label: 'Workspace'   },
  { to: '/history',     label: 'Library'     },
  { to: '/compare',     label: 'Compare'     },
  { to: '/methodology', label: 'Methodology' },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    if (!user || !user.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <nav className="no-print" style={{
      position: 'sticky', top: 0, zIndex: 50,
      height: 64,
      background: 'rgba(12,12,14,0.90)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="page-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>

        {/* Logo — left */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #16161c 0%, #0d0d10 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <path d="M12 2L2 22h20L12 2z" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M12 2v20" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
              <circle cx="12" cy="13" r="3" fill="#6366f1" style={{ filter: 'drop-shadow(0 0 6px #6366f1)' }} />
            </svg>
          </div>
          <span style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center'
          }}>
            Fin<span style={{ fontWeight: 400, color: 'var(--t2)' }}>Sight</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: 1, textShadow: '0 0 10px rgba(99,102,241,0.4)' }}>.ai</span>
          </span>
        </NavLink>

        {/* Nav Links — center */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
          {LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* User Auth Info — right */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          {isAuthenticated ? (
            // Logged In Circle
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-ring)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, fontSize: 15,
                transition: 'border-color .15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => { if (!showDropdown) e.currentTarget.style.borderColor = 'var(--accent-ring)'; }}
            >
              {getInitials()}
            </button>
          ) : (
            // Logged Out Button (Links to dedicated login page)
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ fontSize: 13, padding: '7px 18px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              Sign In
            </Link>
          )}

          {/* Dropdown Menu */}
          {showDropdown && isAuthenticated && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 12px)', right: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, width: 220, padding: '12px 0',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
              display: 'flex', flexDirection: 'column', gap: 4, zIndex: 100
            }}>
              {/* User email info */}
              <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Logged in as</span>
                <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 600, wordBreak: 'break-all' }}>{user?.email}</span>
              </div>

              {/* Profile Link */}
              <Link
                to="/profile"
                onClick={() => setShowDropdown(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                  fontSize: 14, color: 'var(--t2)', textDecoration: 'none', cursor: 'pointer',
                  transition: 'background .15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <User size={15} color="var(--t3)" />
                <span>User Profile</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={() => { setShowDropdown(false); dispatch(logout()); navigate('/'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left',
                  fontSize: 14, color: '#f87171', cursor: 'pointer', transition: 'background .15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={15} color="#f87171" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
