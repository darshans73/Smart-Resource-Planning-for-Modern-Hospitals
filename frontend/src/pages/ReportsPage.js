import React, { useEffect, useState } from 'react';
import { getUtilization, getBedOccupancy, getDashboard } from '../services/api';

const ReportsPage = () => {
  const [utilization, setUtilization] = useState([]);
  const [bedOccupancy, setBedOccupancy] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([getUtilization(), getBedOccupancy(), getDashboard()])
      .then(([uRes, bRes, dRes]) => {
        setUtilization(uRes.data.data);
        setBedOccupancy(bRes.data.data);
        setDashboard(dRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'utilization', label: '📈 Utilization' },
    { id: 'beds', label: '🛏️ Bed Occupancy' },
  ];

  if (loading) return <div className="loading-wrap"><div className="spinner" /><span>Loading reports...</span></div>;

  const totalBeds = bedOccupancy.length;
  const occupiedBeds = bedOccupancy.filter(b => b.patient_name).length;
  const occupancy_rate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">Hospital resource utilization insights</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && dashboard && (
        <>
          {/* KPI Cards */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-icon green">🛏️</div>
              <div>
                <div className="stat-value">{occupancy_rate}%</div>
                <div className="stat-label">Bed Occupancy Rate</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">👥</div>
              <div>
                <div className="stat-value">{dashboard.stats.total_patients}</div>
                <div className="stat-label">Current Admissions</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">🔗</div>
              <div>
                <div className="stat-value">{dashboard.stats.active_allocations}</div>
                <div className="stat-label">Active Allocations</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">🔬</div>
              <div>
                <div className="stat-value">{dashboard.stats.scheduled_surgeries}</div>
                <div className="stat-label">Upcoming Surgeries</div>
              </div>
            </div>
          </div>

          {/* Resource Type Breakdown */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Resource Type Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {dashboard.resource_summary.map(r => {
                const util = r.total > 0 ? Math.round((r.in_use / r.total) * 100) : 0;
                const maint = r.total > 0 ? Math.round((r.maintenance / r.total) * 100) : 0;
                const color = util > 80 ? 'var(--danger)' : util > 50 ? 'var(--warning)' : 'var(--success)';
                return (
                  <div key={r.type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{r.type}</span>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--success)' }}>✅ {r.available} avail</span>
                        <span style={{ color: 'var(--danger)' }}>🔴 {r.in_use} in use</span>
                        {r.maintenance > 0 && <span style={{ color: 'var(--warning)' }}>🟡 {r.maintenance} maint</span>}
                        <span style={{ fontWeight: 700, color }}>{util}% utilized</span>
                      </div>
                    </div>
                    <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${util}%`, background: color, transition: 'width 1s ease' }} />
                      {maint > 0 && <div style={{ width: `${maint}%`, background: 'var(--warning)', opacity: 0.6 }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Table */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Resource Summary Table</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Resource Type</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>In Use</th>
                    <th>Maintenance</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.resource_summary.map(r => {
                    const util = r.total > 0 ? Math.round((r.in_use / r.total) * 100) : 0;
                    return (
                      <tr key={r.type}>
                        <td style={{ fontWeight: 600 }}>{r.type}</td>
                        <td>{r.total}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 500 }}>{r.available}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 500 }}>{r.in_use}</td>
                        <td style={{ color: 'var(--warning)', fontWeight: 500 }}>{r.maintenance}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                              <div style={{ height: '100%', width: `${util}%`, background: util > 80 ? 'var(--danger)' : util > 50 ? 'var(--warning)' : 'var(--success)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 38, color: util > 80 ? 'var(--danger)' : util > 50 ? 'var(--warning)' : 'var(--success)' }}>{util}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* UTILIZATION TAB */}
      {activeTab === 'utilization' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Resource Utilization Report</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{utilization.length} resources</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Resource Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Total / Available</th>
                  <th>Total Allocations</th>
                  <th>Active</th>
                  <th>Utilization Rate</th>
                </tr>
              </thead>
              <tbody>
                {utilization.map(r => (
                  <tr key={r.resource_name}>
                    <td style={{ fontWeight: 600 }}>{r.resource_name}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.type}</td>
                    <td>
                      <span className={`badge ${r.status === 'Available' ? 'badge-available' : r.status === 'In Use' ? 'badge-inuse' : 'badge-maintenance'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{r.available_count} / {r.total_count}</td>
                    <td style={{ fontSize: 13 }}>{r.total_allocations}</td>
                    <td style={{ fontSize: 13, color: r.active_allocations > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{r.active_allocations}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${r.utilization_rate}%`, background: r.utilization_rate > 80 ? 'var(--danger)' : r.utilization_rate > 50 ? 'var(--warning)' : 'var(--success)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: r.utilization_rate > 80 ? 'var(--danger)' : r.utilization_rate > 50 ? 'var(--warning)' : 'var(--success)' }}>
                          {r.utilization_rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BED OCCUPANCY TAB */}
      {activeTab === 'beds' && (
        <>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-icon blue">🛏️</div>
              <div><div className="stat-value">{totalBeds}</div><div className="stat-label">Total Beds</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">🔴</div>
              <div><div className="stat-value">{occupiedBeds}</div><div className="stat-label">Occupied Beds</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div><div className="stat-value">{totalBeds - occupiedBeds}</div><div className="stat-label">Available Beds</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">📊</div>
              <div><div className="stat-value">{occupancy_rate}%</div><div className="stat-label">Occupancy Rate</div></div>
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Bed Occupancy Details</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Bed Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Patient</th>
                    <th>Diagnosis</th>
                    <th>Admission</th>
                  </tr>
                </thead>
                <tbody>
                  {bedOccupancy.map((b, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{b.resource_name}</td>
                      <td><span className="badge badge-info">{b.type}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.location || '—'}</td>
                      <td>
                        <span className={`badge ${b.status === 'Available' ? 'badge-available' : b.status === 'In Use' ? 'badge-inuse' : 'badge-maintenance'}`}>
                          <span className={`status-dot ${b.status === 'Available' ? 'dot-green' : b.status === 'In Use' ? 'dot-red' : 'dot-yellow'}`} />
                          {b.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: b.patient_name ? 600 : 400, color: b.patient_name ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {b.patient_name || '—'}
                        {b.patient_code && <div style={{ fontSize: 11, color: 'var(--primary)', fontFamily: 'monospace' }}>{b.patient_code}</div>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.diagnosis || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {b.admission_date ? new Date(b.admission_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
