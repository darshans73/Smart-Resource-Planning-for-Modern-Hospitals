import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@hospital.com', password: 'Admin@123' },
      doctor: { email: 'doctor@hospital.com', password: 'Admin@123' },
      nurse: { email: 'nurse@hospital.com', password: 'Admin@123' },
      reception: { email: 'reception@hospital.com', password: 'Admin@123' },
    };
    setForm(creds[role]);
  };

  return (
    <div className="login-page">
      {/* Left side */}
      <div className="login-left">
        <div className="login-bg-pattern" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <div style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(14,165,233,0.1)', borderRadius: 20, border: '1px solid rgba(14,165,233,0.2)' }}>
            <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>🏥 Hospital Resource Management</span>
          </div>
          <h1 className="login-hero-title">Smart Resource Planning for Modern Hospitals</h1>
          <p className="login-hero-sub">Efficiently manage beds, operation theaters, equipment, and staff all in one integrated platform.</p>

          <div className="login-feature">
            <div className="feat-icon">🛏️</div>
            <div>
              <div className="feat-title">Real-Time Bed Management</div>
              <div className="feat-desc">Track ICU and general bed availability instantly across all wards</div>
            </div>
          </div>
          <div className="login-feature">
            <div className="feat-icon">🔬</div>
            <div>
              <div className="feat-title">OT Scheduling & Conflict Prevention</div>
              <div className="feat-desc">Schedule surgeries with automatic conflict detection for rooms and doctors</div>
            </div>
          </div>
          <div className="login-feature">
            <div className="feat-icon">📊</div>
            <div>
              <div className="feat-title">Analytics & Reports</div>
              <div className="feat-desc">Monitor resource utilization and generate detailed operational reports</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-logo">
            <div className="logo-sq">🏥</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Hospital RMS</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Resource Planning System</div>
            </div>
          </div>

          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtitle">Sign in to access the hospital management portal</p>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                type="email"
                placeholder="your@hospital.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginBottom: 16 }}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : '→ Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Demo Credentials</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['admin', 'doctor', 'nurse', 'reception'].map(role => (
                <button key={role} onClick={() => fillDemo(role)} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center', textTransform: 'capitalize' }}>
                  {role === 'admin' ? '👑' : role === 'doctor' ? '🩺' : role === 'nurse' ? '💉' : '📋'} {role}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Password for all: <strong style={{ color: 'var(--text-secondary)' }}>Admin@123</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
