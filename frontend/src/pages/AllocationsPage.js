import React, { useEffect, useState } from 'react';
import { getAllocations, createAllocation, releaseAllocation, getPatients, getResources } from '../services/api';

const AllocationsPage = () => {
  const [allocations, setAllocations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ patient_id: '', resource_id: '', start_time: new Date().toISOString().slice(0, 16), notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getAllocations(), getPatients({ status: 'admitted' }), getResources({ status: 'Available' })])
      .then(([aRes, pRes, rRes]) => {
        setAllocations(aRes.data.data);
        setPatients(pRes.data.data);
        setResources(rRes.data.data.filter(r => ['ICU Bed', 'General Bed'].includes(r.type)));
      }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await createAllocation(form);
      setSuccess('Bed allocated successfully!');
      setModal(false); load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to allocate bed.'); }
  };

  const handleRelease = async (id) => {
    if (!window.confirm('Release this bed/resource?')) return;
    try {
      await releaseAllocation(id);
      setSuccess('Resource released!');
      load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { alert('Failed to release.'); }
  };

  const active = allocations.filter(a => a.status === 'active');
  const released = allocations.filter(a => a.status !== 'active');

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-title">Bed Allocation</div>
          <div className="page-subtitle">{active.length} beds currently occupied</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal(true); setError(''); setForm({ patient_id: '', resource_id: '', start_time: new Date().toISOString().slice(0, 16), notes: '' }); }}>
          + Assign Bed
        </button>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Active allocations */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>🔴 Currently Occupied Beds ({active.length})</div>
        {loading ? <div className="loading-wrap" style={{ minHeight: 150 }}><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>Allocated By</th>
                  <th>Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {active.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.patient_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--primary)', fontFamily: 'monospace' }}>{a.patient_code}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{a.resource_name}</td>
                    <td><span className="badge badge-info">{a.resource_type}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.allocated_by_name || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(a.start_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <button className="btn btn-warning btn-sm" onClick={() => handleRelease(a.id)}>Release</button>
                    </td>
                  </tr>
                ))}
                {active.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No active allocations</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Released */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>✅ Released Allocations ({released.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Resource</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {released.slice(0, 10).map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.patient_name}</td>
                  <td>{a.resource_name}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.start_time).toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.end_time ? new Date(a.end_time).toLocaleString('en-IN') : '—'}</td>
                  <td><span className={`badge badge-${a.status === 'released' ? 'released' : 'danger'}`}>{a.status}</span></td>
                </tr>
              ))}
              {released.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No released allocations</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Assign Bed to Patient</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-group">
                  <label className="form-label">Patient (Admitted) *</label>
                  <select className="form-control" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} required>
                    <option value="">— Select Patient —</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bed *</label>
                  <select className="form-control" value={form.resource_id} onChange={e => setForm(f => ({ ...f, resource_id: e.target.value }))} required>
                    <option value="">— Select Available Bed —</option>
                    {resources.map(r => <option key={r.id} value={r.id}>{r.resource_name} ({r.type}) — {r.location || 'N/A'}</option>)}
                  </select>
                  {resources.length === 0 && <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>⚠ No beds available</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Allocation Time *</label>
                  <input className="form-control" type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Bed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationsPage;
