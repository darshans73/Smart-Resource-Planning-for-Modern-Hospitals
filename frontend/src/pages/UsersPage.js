import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';

const ROLES = ['admin', 'doctor', 'nurse', 'reception'];
const ROLE_ICONS = { admin: '👑', doctor: '🩺', nurse: '💉', reception: '📋' };
const ROLE_COLORS = { admin: 'var(--danger)', doctor: 'var(--primary)', nurse: 'var(--success)', reception: 'var(--warning)' };

const emptyForm = { name: '', email: '', password: '', role: 'reception', department: '', phone: '', is_active: true };

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    getUsers().then(res => setUsers(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setModal(true); setError(''); };
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || '', phone: u.phone || '', is_active: u.is_active });
    setEditItem(u); setModal(true); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editItem) {
        const data = { name: form.name, role: form.role, department: form.department, phone: form.phone, is_active: form.is_active };
        await updateUser(editItem.id, data);
        setSuccess('User updated successfully!');
      } else {
        await createUser(form);
        setSuccess('User created successfully!');
      }
      setModal(false); load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save user.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await deleteUser(id); setSuccess('User deleted!'); load(); setTimeout(() => setSuccess(''), 3000); }
    catch (err) { alert(err.response?.data?.message || 'Cannot delete user.'); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {});

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-subtitle">{users.length} staff members registered</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
        </div>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Role stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {ROLES.map(r => (
          <div key={r} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{ROLE_ICONS[r]}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{roleCounts[r]}</div>
              <div style={{ fontSize: 12, color: ROLE_COLORS[r], textTransform: 'capitalize', fontWeight: 500 }}>{r}s</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? <div className="loading-wrap"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `rgba(${u.role === 'admin' ? '239,68,68' : u.role === 'doctor' ? '14,165,233' : u.role === 'nurse' ? '16,185,129' : '245,158,11'},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: 12, color: ROLE_COLORS[u.role], background: `rgba(${u.role === 'admin' ? '239,68,68' : u.role === 'doctor' ? '14,165,233' : u.role === 'nurse' ? '16,185,129' : '245,158,11'},0.1)`, padding: '3px 10px', borderRadius: 20 }}>
                      {ROLE_ICONS[u.role]} {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-available' : 'badge-released'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(u)} title="Edit">✏️</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(u.id)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Edit User' : 'Add New User'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Staff name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_ICONS[r]} {r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={!!editItem} placeholder="staff@hospital.com" />
                  {editItem && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed after creation</div>}
                </div>
                {!editItem && (
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input className="form-control" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Minimum 6 characters" minLength={6} />
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Cardiology" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Contact number" />
                  </div>
                </div>
                {editItem && (
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                      Active User
                    </label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
