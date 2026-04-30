import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const PropertiesManager = () => {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | property object
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const loadProperties = () => {
    setLoading(true)
    api.get('/properties', { params: { limit: 100 } })
      .then(r => setProperties(r.data.data))
      .catch(() => toast.error('Failed to load properties.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProperties()
  }, [])

  const openAdd = () => { setForm({ name:'', description:'', address:'', city:'', state:'', category:'restaurant', is_active:true }); setModal('add') }
  const openEdit = (prop) => { setForm({ ...prop }); setModal(prop) }

  const save = async () => {
    setSaving(true)
    try {
      if (modal === 'add') {
        await api.post('/properties', form)
        toast.success('Property created successfully!')
      } else {
        await api.put(`/properties/${modal.id}`, form)
        toast.success('Property updated successfully!')
      }
      setModal(null)
      loadProperties()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save property.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (prop) => {
    if (!window.confirm(`Are you sure you want to ${prop.is_active ? 'deactivate' : 'activate'} this property?`)) return
    try {
      await api.put(`/properties/${prop.id}`, { is_active: !prop.is_active })
      toast.success(`Property ${prop.is_active ? 'deactivated' : 'activated'}.`)
      loadProperties()
    } catch (err) {
      toast.error('Failed to update status.')
    }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>🏢 Properties Management</h1>
            <p>Add, edit, and manage portal properties</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Property</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No properties found</h3>
          <button className="btn btn-primary mt-3" onClick={openAdd}>Create First Property</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Property Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Admin assigned</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td><span className="badge badge-primary">{p.category?.replace('_',' ')}</span></td>
                  <td>{p.city}, {p.state}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.admin?.username || '—'}</td>
                  <td>
                    <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button 
                        className={`btn ${p.is_active ? 'btn-danger' : 'btn-success'} btn-sm`} 
                        onClick={() => toggleStatus(p)}
                      >
                        {p.is_active ? 'Deactivate' : 'Activate'}
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
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add New Property' : 'Edit Property'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="input-group">
                <label>Property Name *</label>
                <input className="input" value={form.name||''} onChange={set('name')} />
              </div>
              
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>Category *</label>
                  <select className="input" value={form.category||''} onChange={set('category')}>
                    {['restaurant','club','banquet_hall','bar','lounge','rooftop','resort','other'].map(c => 
                      <option key={c} value={c}>{c.replace('_',' ')}</option>
                    )}
                  </select>
                </div>
                <div className="input-group">
                  <label>Commission (%)</label>
                  <input className="input" type="number" step="0.1" value={form.portal_commission_percent||''} onChange={set('portal_commission_percent')} />
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea className="input" value={form.description||''} onChange={set('description')} rows={2} />
              </div>

              <div className="input-group">
                <label>Address *</label>
                <input className="input" value={form.address||''} onChange={set('address')} />
              </div>

              <div className="form-grid form-grid-3">
                <div className="input-group">
                  <label>City *</label>
                  <input className="input" value={form.city||''} onChange={set('city')} />
                </div>
                <div className="input-group">
                  <label>State *</label>
                  <input className="input" value={form.state||''} onChange={set('state')} />
                </div>
                <div className="input-group">
                  <label>Pincode</label>
                  <input className="input" value={form.pincode||''} onChange={set('pincode')} />
                </div>
              </div>
              
              {modal === 'add' && (
                <div className="input-group" style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Note: This property will automatically be assigned to your admin account. You can assign a specific Property Manager user later from the Users module.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default PropertiesManager
