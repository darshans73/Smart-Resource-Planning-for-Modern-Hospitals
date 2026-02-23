import React, { useEffect, useState } from 'react';
import { getSurgeries, createSurgery, updateSurgery, cancelSurgery, getPatients, getDoctors } from '../services/api';

const STATUS_COLORS = { scheduled: 'badge-scheduled', in_progress: 'badge-inuse', completed: 'badge-success', cancelled: 'badge-released' };

const SurgeriesPage = () => {
  const [surgeries, setSurgeries] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    patient_id: '', doctor_id: '', ot_room: 'OT-1', surgery_date: '',
    duration_minutes: 60, surgery_type: '', notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([getSurgeries(), getPatients({ status: 'admitted' }), getDoctors()])
      .then(([sRes, pRes, uRes]) => {
        setSurgeries(sRes.data.data);
        setPatients(pRes.data.data);
        setDoctors(uRes.data.data);
      }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await createSurgery(form);
      setSuccess('Surgery scheduled successfully!');
      setModal(false); load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to schedule surgery.'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this surgery?')) return;
    try { await cancelSurgery(id); setSuccess('Surgery cancelled.'); load(); setTimeout(() => setSuccess(''), 3000); }
    catch (err) { alert('Failed to cancel surgery.'); }
  };

  const handleComplete = async (id) => {
    try { await updateSurgery(id, { status: 'completed' }); setSuccess('Surgery marked complete!'); load(); setTimeout(() => setSuccess(''), 3000); }
    catch (err) { alert('Failed to update.'); }
  };

  const upcoming = surgeries.filter(s => s.status === 'scheduled');
  const past = surgeries.filter(s => s.status !== 'scheduled');

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-title">OT Scheduling</div>
          <div className="page-subtitle">{upcoming.length} upcoming surgeries</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal(true); setError(''); setForm({ patient_id: '', doctor_id: '', ot_room: 'OT-1', surgery_date: '', duration_minutes: 60, surgery_type: '', notes: '' }); }}>
          + Schedule Surgery
        </button>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Upcoming */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>🗓️ Upcoming Surgeries</div>
        {loading ? <div className="loading-wrap" style={{ minHeight: 100 }}><div className="spinner" /></div> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {upcoming.map(s => (
              <div key={s.id} style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '16px', borderLeft: '4px solid var(--warning)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.patient_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--primary)', fontFamily: 'monospace' }}>{s.patient_code}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {s.surgery_type || 'Surgery'} • Dr. {s.doctor_name}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>OT Room</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.ot_room}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date & Time</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {new Date(s.surgery_date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Duration</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.duration_minutes} min</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-success btn-sm" onClick={() => handleComplete(s.id)}>✓ Complete</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(s.id)}>✕ Cancel</button>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && <div className="empty-state" style={{ padding: '30px 0' }}><div className="empty-icon">🔬</div><div className="empty-title">No upcoming surgeries</div></div>}
          </div>
        )}
      </div>

      {/* Past */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>History</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Patient</th><th>Doctor</th><th>OT Room</th><th>Type</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {past.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.patient_name}</td>
                  <td style={{ fontSize: 13 }}>Dr. {s.doctor_name}</td>
                  <td style={{ fontSize: 13 }}>{s.ot_room}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.surgery_type || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(s.surgery_date).toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge ${STATUS_COLORS[s.status] || 'badge-info'}`}>{s.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
              {past.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No surgery history</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && setModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div className="modal-title">Schedule Surgery</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select className="form-control" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} required>
                      <option value="">— Select Patient —</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Doctor *</label>
                    <select className="form-control" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} required>
                      <option value="">— Select Doctor —</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">OT Room *</label>
                    <select className="form-control" value={form.ot_room} onChange={e => setForm(f => ({ ...f, ot_room: e.target.value }))}>
                      {['OT-1','OT-2','OT-3','OT-4'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (minutes)</label>
                    <input className="form-control" type="number" min="15" step="15" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Surgery Date & Time *</label>
                    <input className="form-control" type="datetime-local" value={form.surgery_date} onChange={e => setForm(f => ({ ...f, surgery_date: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Surgery Type</label>
                    <input className="form-control" value={form.surgery_type} onChange={e => setForm(f => ({ ...f, surgery_type: e.target.value }))} placeholder="e.g. Appendectomy" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
                <div className="alert alert-warning" style={{ fontSize: 12 }}>⚠️ The system will automatically check for OT room and doctor scheduling conflicts.</div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Surgery</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurgeriesPage;
