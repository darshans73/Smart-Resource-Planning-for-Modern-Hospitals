import React, { useEffect, useState } from 'react';
import { getResources, createAllocation, releaseAllocation, getAllocations, getPatients } from '../services/api';

const EQUIPMENT_TYPES = ['Ventilator', 'MRI Machine', 'CT Scanner', 'Ambulance', 'Equipment'];

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ patient_id: '', start_time: new Date().toISOString().slice(0, 16), notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      getResources(),
      getAllocations(),
      getPatients({ status: 'admitted' })
    ]).then(([rRes, aRes, pRes]) => {
      setEquipment(rRes.data.data.filter(r => EQUIPMENT_TYPES.includes(r.type)));
      setBookings(aRes.data.data.filter(a => EQUIPMENT_TYPES.includes(a.resource_type) && a.status === 'active'));
      setPatients(pRes.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openBook = (resource) => {
    setSelected(resource);
    setForm({ patient_id: '', start_time: new Date().toISOString().slice(0, 16), notes: '' });
    setError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await createAllocation({ ...form, resource_id: selected.id });
      setSuccess(`${selected.resource_name} booked!`);
      setModal(false); load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to book equipment.'); }
  };

  const handleRelease = async (id) => {
    if (!window.confirm('Release this equipment?')) return;
    try { await releaseAllocation(id); setSuccess('Equipment released!'); load(); setTimeout(() => setSuccess(''), 3000); }
    catch (err) { alert('Failed to release.'); }
  };

  const typeIcons = { Ventilator: '💨', 'MRI Machine': '🧲', 'CT Scanner': '🔍', Ambulance: '🚑', Equipment: '⚕️' };
  const statusClass = (s) => s === 'Available' ? 'available' : s === 'In Use' ? 'in-use' : 'maintenance';

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-title">Equipment Booking</div>
          <div className="page-subtitle">Track and reserve medical equipment</div>
        </div>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Equipment Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Medical Equipment Status</div>
        {loading ? <div className="loading-wrap"><div className="spinner" /></div> : (
          <div className="resource-grid">
            {equipment.map(r => (
              <div key={r.id} className={`resource-card ${statusClass(r.status)}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 28 }}>{typeIcons[r.type] || '⚕️'}</div>
                  <span className={`badge ${r.status === 'Available' ? 'badge-available' : r.status === 'In Use' ? 'badge-inuse' : 'badge-maintenance'}`}>
                    <span className={`status-dot ${r.status === 'Available' ? 'dot-green' : r.status === 'In Use' ? 'dot-red' : 'dot-yellow'}`} />
                    {r.status}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.resource_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{r.type}</div>
                {r.location && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>📍 {r.location}</div>}
                <button
                  className={`btn btn-sm ${r.status === 'Available' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => openBook(r)}
                  disabled={r.status !== 'Available'}
                >
                  {r.status === 'Available' ? '📌 Reserve' : r.status === 'In Use' ? '🔴 In Use' : '🟡 Maintenance'}
                </button>
              </div>
            ))}
            {equipment.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div className="empty-icon">⚕️</div>
                <div className="empty-title">No equipment found</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Bookings */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>🔗 Active Equipment Bookings ({bookings.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Equipment</th><th>Type</th><th>Patient</th><th>Since</th><th>Action</th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.resource_name}</td>
                  <td><span className="badge badge-info">{b.resource_type}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{b.patient_name || '—'}</div>
                    {b.patient_code && <div style={{ fontSize: 11, color: 'var(--primary)', fontFamily: 'monospace' }}>{b.patient_code}</div>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(b.start_time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td><button className="btn btn-warning btn-sm" onClick={() => handleRelease(b.id)}>Release</button></td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No active bookings</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {modal && selected && (
        <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Reserve: {selected.resource_name}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-group">
                  <label className="form-label">Patient (optional)</label>
                  <select className="form-control" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                    <option value="">— No patient (general use) —</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_id})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input className="form-control" type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Purpose / Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Reserve Equipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
