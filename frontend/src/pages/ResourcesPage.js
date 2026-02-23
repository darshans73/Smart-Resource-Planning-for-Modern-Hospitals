import React, { useEffect, useState, useCallback } from 'react';
import { getResources, createResource, updateResource, deleteResource } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TYPES = ['ICU Bed', 'General Bed', 'Operation Theater', 'Ventilator', 'MRI Machine', 'CT Scanner', 'Ambulance', 'Equipment'];
const STATUSES = ['Available', 'In Use', 'Maintenance'];

const emptyForm = { resource_name: '', type: 'ICU Bed', status: 'Available', location: '', description: '', total_count: 1 };

const ResourcesPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getResources({ type: filter.type, status: filter.status })
      .then(res => setResources(res.data.data))
      .finally(() => setLoading(false));
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setModal(true); setError(''); };
  const openEdit = (r) => { setForm({ resource_name: r.resource_name, type: r.type, status: r.status, location: r.location || '', description: r.description || '', total_count: r.total_count, available_count: r.available_count }); setEditItem(r); setModal(true); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editItem) { await updateResource(editItem.id, form); setSuccess('Resource updated!'); }
      else { await createResource(form); setSuccess('Resource added!'); }
      setModal(false); load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save resource.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await deleteResource(id); setSuccess('Resource deleted!');
      load(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Cannot delete resource.'); }
  };

  const statusClass = (s) => s === 'Available' ? 'available' : s === 'In Use' ? 'in-use' : 'maintenance';
  const badgeClass = (s) => s === 'Available' ? 'badge-available' : s === 'In Use' ? 'badge-inuse' : 'badge-maintenance';
  const typeIcons = { 'ICU Bed': '🛏️', 'General Bed': '🛏️', 'Operation Theater': '🔬', 'Ventilator': '💨', 'MRI Machine': '🧲', 'CT Scanner': '🔍', 'Ambulance': '🚑', 'Equipment': '⚕️' };

  const filtered = resources.filter(r => r.resource_name.toLowerCase().includes(search.toLowerCase()) || r.location?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="page-title">Resource Management</div>
          <div className="page-subtitle">{resources.length} total resources in the system</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={openAdd}>+ Add Resource</button>
          )}
        </div>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : (
        <div className="resource-grid">
          {filtered.map(r => (
            <div key={r.id} className={`resource-card ${statusClass(r.status)}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontSize: 24 }}>{typeIcons[r.type] || '🏥'}</div>
                <span className={`badge ${badgeClass(r.status)}`}>
                  <span className={`status-dot ${r.status === 'Available' ? 'dot-green' : r.status === 'In Use' ? 'dot-red' : 'dot-yellow'}`} />
                  {r.status}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.resource_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{r.type}</div>
              {r.location && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>📍 {r.location}</div>}
              {r.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>{r.description}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {r.available_count}/{r.total_count} available
                </span>
                {user?.role === 'admin' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(r)} title="Edit">✏️</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(r.id)} title="Delete">🗑️</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon">🏗️</div>
              <div className="empty-title">No resources found</div>
              <div className="empty-desc">Try adjusting your filters or add new resources</div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Edit Resource' : 'Add New Resource'}</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">⚠️ {error}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Resource Name *</label>
                    <input className="form-control" value={form.resource_name} onChange={e => setForm(f => ({ ...f, resource_name: e.target.value }))} required placeholder="e.g. ICU Bed 101" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Count</label>
                    <input className="form-control" type="number" min="1" value={form.total_count} onChange={e => setForm(f => ({ ...f, total_count: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-control" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. ICU Ward - Floor 2" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes..." style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Add Resource'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
