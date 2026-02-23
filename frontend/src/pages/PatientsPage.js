import React, { useEffect, useState, useCallback } from 'react';
import { getPatients, createPatient, updatePatient, getDoctors } from '../services/api';

const emptyForm = {
  name: '', age: '', gender: 'Male', phone: '', address: '', diagnosis: '',
  blood_group: '', emergency_contact: '', admission_date: new Date().toISOString().slice(0, 16), assigned_doctor: ''
};

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('admitted');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getPatients({ status: statusFilter || undefined, search: search || undefined }),
      getDoctors()
    ]).then(([pRes, uRes]) => {
      setPatients(pRes.data.data);
      setDoctors(uRes.data.data);
    }).finally(() => setLoading(false));
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setModal(true); setError(''); };
  const openEdit = (p) => {
    setForm({
      name: p.name, age: p.age, gender: p.gender, phone: p.phone || '', address: p.address || '',
      diagnosis: p.diagnosis || '', blood_group: p.blood_group || '', emergency_contact: p.emergency_contact || '',
      admission_date: p.admission_date?.slice(0, 16) || '', assigned_doctor: p.assigned_doctor || ''
    });
    setEditItem(p); setModal(true); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editItem) { await updatePatient(editItem.id, { ...form, status: editItem.status }); setSuccess('Patient updated!'); }
      else { await createPatient(form); setSuccess('Patient registered!'); }
      setModal(false); load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save patient.'); }
  };

  const handleDischarge = async (id) => {
    if (!window.confirm('Discharge patient? All active resource allocations will be released.')) return;
    try {
      await updatePatient(id, { status: 'discharged', discharge_date: new Date().toISOString() });
      setSuccess('Patient discharged and resources released!');
      load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { alert('Failed to discharge patient.'); }
  };

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.patient_id?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-title">Patient Management</div>
          <div className="page-subtitle">{patients.length} patients • {statusFilter || 'all'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </form>
          <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="admitted">Admitted</option>
            <option value="critical">Critical</option>
            <option value="discharged">Discharged</option>
          </select>
          <button className="btn btn-primary" onClick={openAdd}>+ Register Patient</button>
        </div>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}

      {loading ? <div className="loading-wrap"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age / Gender</th>
                <th>Diagnosis</th>
                <th>Doctor</th>
                <th>Admission</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{p.patient_id}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {p.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>📞 {p.phone}</div>}
                  </td>
                  <td style={{ fontSize: 13 }}>{p.age}y / {p.gender}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.diagnosis || '—'}</td>
                  <td style={{ fontSize: 13 }}>{p.doctor_name || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.admission_date ? new Date(p.admission_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td><span className={`badge badge-${p.status === 'admitted' ? 'admitted' : p.status === 'critical' ? 'danger' : 'released'}`}>{p.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit">✏️</button>
                      {p.status === 'admitted' && (
                        <button className="btn btn-warning btn-sm" onClick={() => handleDischarge(p.id)} style={{ fontSize: 11 }}>Discharge</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No patients found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Edit Patient' : 'Register New Patient'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Patient's full name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age *</label>
                    <input className="form-control" type="number" min="0" max="150" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select className="form-control" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select className="form-control" value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}>
                      <option value="">Select</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Contact number" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Contact</label>
                    <input className="form-control" value={form.emergency_contact} onChange={e => setForm(f => ({ ...f, emergency_contact: e.target.value }))} placeholder="Emergency number" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Diagnosis</label>
                  <input className="form-control" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Condition / diagnosis" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Admission Date *</label>
                    <input className="form-control" type="datetime-local" value={form.admission_date} onChange={e => setForm(f => ({ ...f, admission_date: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assigned Doctor</label>
                    <select className="form-control" value={form.assigned_doctor} onChange={e => setForm(f => ({ ...f, assigned_doctor: e.target.value }))}>
                      <option value="">— Select Doctor —</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-control" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Patient address" style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update Patient' : 'Register Patient'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
