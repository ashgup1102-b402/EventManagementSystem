import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { indiaData } from '../../data/indiaData'
import { useAuth } from '../../context/AuthContext'

const EntityManager = () => {
  const { user: currentUser } = useAuth()
  const location = useLocation()
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  
  // Get initial search from URL if present (e.g. /admin/entities?status=Active)
  const queryParams = new URLSearchParams(location.search)
  const initialStatus = queryParams.get('status') || ''
  
  const [search, setSearch] = useState(initialStatus)
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' })

  // History State
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTarget, setHistoryTarget] = useState(null)

  const loadHistory = async (ent) => {
    setHistoryTarget(ent)
    setHistoryLoading(true)
    setShowHistory(true)
    try {
      const res = await api.get(`/entities/${ent.id}/history`)
      setHistory(res.data.data)
    } catch (err) {
      toast.error('Failed to load history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadEntities = () => {
    setLoading(true)
    api.get('/entities', { params: { limit: 500 } })
      .then(r => setEntities(r.data.data))
      .catch(() => toast.error('Failed to load entities.'))
      .finally(() => setLoading(false))
  }

  const loadCategories = () => {
    api.get('/categories', { params: { status: 'Active' } })
      .then(r => setCategories(r.data.data))
      .catch(console.error)
  }

  useEffect(() => {
    loadEntities()
    loadCategories()
  }, [])

  const openAdd = () => { 
    setForm({ 
      name:'', entity_type: 'Organization', country: 'India', description:'', address:'', city:'', state:'', 
      category_id: categories[0]?.id || '', 
      status:'Active', mobile_1:'', entity_code: ''
    }); 
    setModal('add') 
  }

  const openEdit = (ent) => { 
    if (!ent) return
    // Strip nested objects to keep the form flat and clean
    const { admin, entity_category, events, menu_items, bookings, ...cleanForm } = ent
    setForm(cleanForm)
    setModal(ent) 
  }

  const save = async () => {
    // Validation logic
    if (form.entity_type === 'Individual') {
      if (!form.pan_number && !form.aadhar_number) {
        return toast.error('For Individuals, either PAN or Aadhar Number is mandatory.')
      }
    } else {
      if (!form.gst_number) {
        return toast.error('For Organizations, GST Number is mandatory.')
      }
    }

    if (!form.state || !form.city) {
      return toast.error('State and District are mandatory.')
    }

    if (modal === 'add' && currentUser?.role === 'Super Admin' && form.entity_code) {
      if (form.entity_code.length !== 8) {
        return toast.error('Entity Code must be exactly 8 characters.')
      }
    }

    setSaving(true)
    try {
      if (modal === 'add') {
        await api.post('/entities', form)
        toast.success('Entity created successfully!')
      } else {
        await api.put(`/entities/${modal.id}`, form)
        toast.success('Entity updated successfully!')
      }
      setModal(null)
      loadEntities()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save entity.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (ent) => {
    const newStatus = ent.status === 'Active' ? 'Inactive' : 'Active'
    if (!window.confirm(`Are you sure you want to set this entity to ${newStatus}?`)) return
    try {
      await api.put(`/entities/${ent.id}`, { status: newStatus })
      toast.success(`Entity status set to ${newStatus}.`)
      loadEntities()
    } catch (err) {
      toast.error('Failed to update status.')
    }
  }

  const set = k => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => {
      const next = { ...f, [k]: val }
      if (k === 'state') next.city = '' // Reset district when state changes
      return next
    })
  }

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  }

  // --- Intellisense Filtering & Sorting ---
  const processedEntities = [...entities]
    .filter(e => {
      const term = search.toLowerCase();
      return (
        e.name?.toLowerCase().includes(term) ||
        e.entity_code?.toLowerCase().includes(term) ||
        e.unique_number?.toLowerCase().includes(term) ||
        e.city?.toLowerCase().includes(term) ||
        e.state?.toLowerCase().includes(term) ||
        e.entity_category?.name?.toLowerCase().includes(term) ||
        (term === 'active' ? e.status?.toLowerCase() === 'active' : e.status?.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      // 1. Status (Active first)
      if (a.status !== b.status) return a.status === 'Active' ? -1 : 1;
      
      // 2. Custom Sort
      const valA = (a[sortConfig.key] || '').toString().toLowerCase();
      const valB = (b[sortConfig.key] || '').toString().toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const states = Object.keys(indiaData)
  const cities = (form.state && indiaData[form.state]) ? indiaData[form.state] : []

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>🏢 Entity Management</h1>
            <p>Manage entities and their unique identification</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="🔍 Search entities..." 
                className="input" 
                style={{ width: 250 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Entity</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : processedEntities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No matching entities found</h3>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Entity Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Type</th>
                <th>Category</th>
                <th onClick={() => handleSort('entity_code')} style={{ cursor: 'pointer' }}>
                  Unique Code {sortConfig.key === 'entity_code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedEntities.map(e => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.name}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.unique_number}</div>
                  </td>
                  <td><span className="badge badge-light">{e.entity_type}</span></td>
                  <td><span className="badge badge-secondary" style={{fontSize: 11}}>{e.entity_category?.name || 'N/A'}</span></td>
                  <td><code className="code-tag">{e.entity_code}</code></td>
                  <td>
                    <span className={`badge ${e.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td>{e.city}, {e.state}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => loadHistory(e)}>📜 History</button>
                      <button 
                        className={`btn ${e.status === 'Active' ? 'btn-danger' : 'btn-success'} btn-sm`} 
                        onClick={() => toggleStatus(e)}
                      >
                        {e.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 850 }}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add New Entity' : 'Edit Entity'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="form-grid form-grid-3">
                <div className="input-group">
                  <label>Entity Type *</label>
                  <div className="radio-group" style={{ display: 'flex', gap: 15, marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" name="entity_type" value="Organization" checked={form.entity_type === 'Organization'} onChange={set('entity_type')} /> 
                      Organization
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" name="entity_type" value="Individual" checked={form.entity_type === 'Individual'} onChange={set('entity_type')} /> 
                      Individual
                    </label>
                  </div>
                </div>
                <div className="input-group">
                  <label>Category *</label>
                  <select className="input" value={form.category_id||''} onChange={set('category_id')}>
                    <option value="">Select Category</option>
                    {categories.map(c => 
                      <option key={c.id} value={c.id}>{c.name}</option>
                    )}
                  </select>
                </div>
                <div className="input-group">
                  <label>Unique Code *</label>
                  <input className="input" value={form.entity_code||''} onChange={set('entity_code')} maxLength={8} placeholder="8 chars (e.g. AB123456)" />
                  <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4 }}>
                    Revised ID: {(() => {
                      const date = modal === 'add' ? new Date() : new Date(modal.createdAt)
                      const dateStr = date.toISOString().slice(0,10).replace(/-/g, '')
                      return `${dateStr}${form.entity_code || '________'}`
                    })()}
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Entity Name *</label>
                <input className="input" value={form.name||''} onChange={set('name')} placeholder="Unique Legal Name" />
              </div>

              <div className="form-grid form-grid-3">
                <div className="input-group">
                  <label>PAN Number {form.entity_type === 'Individual' ? '*' : ''}</label>
                  <input className="input" value={form.pan_number||''} onChange={set('pan_number')} maxLength={10} placeholder="ABCDE1234F" />
                </div>
                <div className="input-group">
                  <label>Aadhar Number {form.entity_type === 'Individual' ? '*' : ''}</label>
                  <input className="input" value={form.aadhar_number||''} onChange={set('aadhar_number')} maxLength={12} placeholder="12-digit number" />
                </div>
                <div className="input-group">
                  <label>GSTIN {form.entity_type === 'Organization' ? '*' : ''}</label>
                  <input className="input" value={form.gst_number||''} onChange={set('gst_number')} maxLength={15} placeholder="15-digit GSTIN" />
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>Mobile Number 1 *</label>
                  <input className="input" value={form.mobile_1||''} onChange={set('mobile_1')} />
                </div>
                <div className="input-group">
                  <label>Email ID</label>
                  <input className="input" type="email" value={form.email||''} onChange={set('email')} />
                </div>
              </div>

              <div className="input-group">
                <label>Address *</label>
                <input className="input" value={form.address||''} onChange={set('address')} />
              </div>

              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>Country *</label>
                  <select className="input" value={form.country||'India'} onChange={set('country')}>
                    <option value="India">India</option>
                  </select>
                </div>
                <div className="form-grid form-grid-3">
                  <div className="input-group">
                    <label>State *</label>
                    <select className="input" value={form.state||''} onChange={set('state')}>
                      <option value="">Select State</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>District/City *</label>
                    <select className="input" value={form.city||''} onChange={set('city')} disabled={!form.state}>
                      <option value="">Select District</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Status</label>
                    <select className="input" value={form.status||'Active'} onChange={set('status')}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {modal === 'add' && (
                <div className="alert alert-info" style={{ marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: 12 }}>Note: Creating an entity will automatically create a unique username (YYYYMMDD+CODE) and default password (Entity123) for this entity.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Entity'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showHistory && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: 900, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>📜 Change History - {historyTarget?.name}</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowHistory(false)}>✕ Close</button>
            </div>
            
            <div className="table-wrap" style={{ flex: 1, overflowY: 'auto' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No changes tracked yet.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Login User</th>
                      <th>Date & Time</th>
                      <th>Field Name</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td>{h.user}</td>
                        <td>{new Date(h.timestamp).toLocaleString()}</td>
                        <td><span className="badge badge-muted">{h.field}</span></td>
                        <td style={{ color: 'var(--danger)', textDecoration: 'line-through', fontSize: '13px' }}>{h.old_value}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600, fontSize: '13px' }}>{h.new_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default EntityManager
