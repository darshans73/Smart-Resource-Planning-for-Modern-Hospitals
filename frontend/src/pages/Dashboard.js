import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span>Loading dashboard...</span>
    </div>
  );

  if (error) return <div className="alert alert-error">{error}</div>;

  const { stats, resource_summary, recent_admissions, upcoming_surgeries } = data;

  const typeIcons = {
    'ICU Bed': '🛏️', 'General Bed': '🛏️',
    'Operation Theater': '🔬', 'Ventilator': '💨',
    'MRI Machine': '🧲', 'CT Scanner': '🔍',
    'Ambulance': '🚑', 'Equipment': '⚕️'
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Real-time hospital resource overview</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            🕒 {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div>
            <div className="stat-value">{stats.total_patients}</div>
            <div className="stat-label">Admitted Patients</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🛏️</div>
          <div>
            <div className="stat-value">{stats.available_beds}</div>
            <div className="stat-label">Available Beds</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🔬</div>
          <div>
            <div className="stat-value">{stats.scheduled_surgeries}</div>
            <div className="stat-label">Scheduled Surgeries</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🏗️</div>
          <div>
            <div className="stat-value">{stats.total_resources}</div>
            <div className="stat-label">Total Resources</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teal">⚕️</div>
          <div>
            <div className="stat-value">{stats.available_ot}</div>
            <div className="stat-label">Available OT Rooms</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🔗</div>
          <div>
            <div className="stat-value">{stats.active_allocations}</div>
            <div className="stat-label">Active Allocations</div>
          </div>
        </div>
      </div>

      {/* Resource Summary */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Resource Status Overview</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {resource_summary.map(r => {
            const util = r.total > 0 ? Math.round((r.in_use / r.total) * 100) : 0;
            return (
              <div key={r.type} style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
                    <span>{typeIcons[r.type] || '🏥'}</span> {r.type}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.total} total</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${util}%`, background: util > 80 ? 'var(--danger)' : util > 50 ? 'var(--warning)' : 'var(--success)', borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                  <span style={{ color: 'var(--success)' }}>✅ {r.available} Available</span>
                  <span style={{ color: 'var(--danger)' }}>🔴 {r.in_use} In Use</span>
                  {r.maintenance > 0 && <span style={{ color: 'var(--warning)' }}>🟡 {r.maintenance} Maint.</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two column bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent Admissions */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Recent Admissions</div>
          {recent_admissions.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">👥</div>
              <div className="empty-title">No recent admissions</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent_admissions.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'var(--bg-input)', borderRadius: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--primary)', flexShrink: 0 }}>
                    {p.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.patient_id} • {p.diagnosis || 'N/A'}</div>
                  </div>
                  <div>
                    <span className={`badge badge-${p.status === 'admitted' ? 'admitted' : p.status === 'critical' ? 'danger' : 'released'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Surgeries */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Upcoming Surgeries</div>
          {upcoming_surgeries.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-icon">🔬</div>
              <div className="empty-title">No surgeries scheduled</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming_surgeries.map((s, i) => (
                <div key={i} style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, borderLeft: '3px solid var(--warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.patient_name}</div>
                    <span style={{ fontSize: 11, color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 4 }}>{s.ot_room}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Dr. {s.doctor_name} • {s.surgery_type || 'Surgery'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4 }}>
                    🕒 {new Date(s.surgery_date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
