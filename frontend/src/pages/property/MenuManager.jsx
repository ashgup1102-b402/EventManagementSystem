import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import moment from 'moment'
import { useAuth } from '../../context/AuthContext'

const MenuManager = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [cuisines, setCuisines] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [historyModal, setHistoryModal] = useState(null)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [entityId, setEntityId] = useState(null)
  const BASE_URL = 'http://localhost:5000';

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
  }

  const { search: urlSearch } = useLocation()
  const queryParams = new URLSearchParams(urlSearch)
  const initialStatus = queryParams.get('status')
  const mode = queryParams.get('mode')

  const [permissions, setPermissions] = useState({ isReadOnly: false, noDelete: false })

  useEffect(() => {
    if (mode) {
      setPermissions({
        isReadOnly: mode === 'view',
        noDelete: mode === 'edit_no_delete' || mode === 'view'
      })
    } else if (currentUser) {
      api.get('/auth/authorizations').then(r => {
        const myAuths = r.data.data.filter(a => a.role_name === currentUser.role)
        const screenAuth = myAuths.find(a => a.screen_name === 'Menu Management')
        const perm = screenAuth ? screenAuth.permission : 'Full Access'
        
        setPermissions({
          isReadOnly: perm === 'Read Only' || perm === 'None',
          noDelete: perm === 'Read and Edit' || perm === 'Read Only' || perm === 'None'
        })
      }).catch(console.error)
    }
  }, [mode, currentUser])

  const { isReadOnly, noDelete } = permissions
  const canActivate = !isReadOnly
  const canDeactivate = !noDelete


  useEffect(() => {
    fetchInit()
  }, [])

  const fetchInit = async () => {
    try {
      const queryId = queryParams.get('entityId');
      let currentEntityId = queryId;

      const [catRes, cuisRes] = await Promise.all([
        api.get('/masters/menu-categories?status=Active'),
        api.get('/masters/cuisine-types?status=Active')
      ])

      if (!currentEntityId) {
        const entRes = await api.get('/entities/my');
        currentEntityId = entRes.data.data.id;
      }

      setEntityId(currentEntityId)
      setCategories(catRes.data.data)
      setCuisines(cuisRes.data.data)
      fetchMenu(currentEntityId, initialStatus)
    } catch (err) { toast.error('Failed to load initial data.') }
    finally { setLoading(false) }
  }

  const fetchMenu = async (id, statusFilter) => {
    try {
      const params = { property_id: id }
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/menu', { params })
      setItems(res.data.data)
    } catch (err) { toast.error('Failed to load menu.') }
  }

  const fetchHistory = async (id) => {
    try {
      const res = await api.get(`/menu/${id}/history`)
      setHistory(res.data.data)
      setHistoryModal(id)
    } catch (err) { toast.error('Failed to load history.') }
  }

  const validate = () => {
    if (!form.name || !form.price || !form.menu_category_id) {
      toast.error('Please fill required fields.')
      return false
    }
    if (form.price < 0) {
      toast.error('Price cannot be negative.')
      return false
    }
    return true
  }

  const save = async () => {
    if (isReadOnly) return
    if (!validate()) return
    setSaving(true)
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === 'image' && typeof form[k] === 'string') return;
        if (['entity', 'property_id', 'menu_category_ref', 'cuisine_type_ref', 'createdAt', 'updatedAt', 'id'].includes(k)) return;
        if (form[k] !== null && form[k] !== undefined) fd.append(k, form[k]);
      });
      fd.append('property_id', entityId);

      if (modal === 'add') await api.post('/menu', fd)
      else await api.put(`/menu/${modal.id}`, fd)
      toast.success('Menu item saved!')
      setModal(null)
      fetchMenu(entityId)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const deactivate = async id => {
    if (noDelete) return
    if (!window.confirm('Deactivate this menu item?')) return
    try {
      await api.delete(`/menu/${id}`)
      toast.success('Item deactivated.')
      fetchMenu(entityId)
    } catch (err) { toast.error('Failed to deactivate.') }
  }

  const activate = async id => {
    if (!window.confirm('Activate this menu item?')) return
    try {
      await api.put(`/menu/${id}`, { status: 'Active' })
      toast.success('Item activated.')
      fetchMenu(entityId)
    } catch (err) { toast.error('Failed to activate.') }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && queryParams.get('entityId') && (
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/entities')}>
                ← Back to Entities
              </button>
            )}
            <div>
              <h1>🍽️ Menu Manager</h1>
              <p>Manage your food items, categories, and cuisine types.</p>
            </div>
          </div>
          {!isReadOnly && (
            <button className="btn btn-primary" onClick={() => { setForm({ price:0, is_veg:true, is_available:true, status:'Active' }); setModal('add'); }}>
              + Add Item
            </button>
          )}
        </div>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : items.length === 0 ?
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>No menu items</h3>
          {!isReadOnly && <button className="btn btn-primary mt-3" onClick={() => setModal('add')}>Add First Item</button>}
        </div> :
        <div className="table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Cuisine</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.image ? (
                      <img src={getImgUrl(item.image)} alt="Img" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: 'var(--bg-tertiary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🍽️</div>
                    )}
                    <div>
                      <strong>{item.name}</strong>
                      <div className="text-muted text-xs">{item.is_veg ? '🟢 Veg' : '🔴 Non-veg'} · {item.is_available ? 'Available' : 'Sold Out'}</div>
                    </div>
                  </td>
                  <td>{item.menu_category_ref?.name || '-'}</td>
                  <td>{item.cuisine_type_ref?.name || '-'}</td>
                  <td><span className="fw-700 color-primary">₹{item.price}</span></td>
                  <td>
                    <span className={`badge ${item.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-sm btn-light" onClick={() => { setForm({...item}); setModal(item); }}>
                        {isReadOnly ? 'View' : 'Edit'}
                      </button>
                      <button className="btn btn-sm btn-light" onClick={() => fetchHistory(item.id)}>📜 History</button>
                      {canActivate && item.status !== 'Active' && (
                        <button className="btn btn-sm btn-success" onClick={() => activate(item.id)}>Activate</button>
                      )}
                      {canDeactivate && item.status === 'Active' && (
                        <button className="btn btn-sm btn-danger" onClick={() => deactivate(item.id)}>Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {modal && (
        <div className="modal-overlay">
          <div className="modal card" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add Menu Item' : (isReadOnly ? 'View Menu Item' : 'Edit Menu Item')}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="form-grid" style={{ gap: 16 }}>
              <div className="input-group">
                <label>Item Name *</label>
                <input className="input" value={form.name||''} onChange={set('name')} placeholder="e.g. Paneer Tikka" disabled={isReadOnly} />
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label>Category *</label>
                  <select className="input" value={form.menu_category_id||''} onChange={set('menu_category_id')} disabled={isReadOnly}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Cuisine Type</label>
                  <select className="input" value={form.cuisine_type_id||''} onChange={set('cuisine_type_id')} disabled={isReadOnly}>
                    <option value="">Select Cuisine</option>
                    {cuisines.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea className="input" value={form.description||''} onChange={set('description')} rows={2} disabled={isReadOnly} />
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label>Price (₹) *</label>
                  <input className="input" type="number" step="0.01" min="0" value={form.price||''} onChange={set('price')} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select className="input" value={form.status||'Active'} onChange={set('status')} disabled={isReadOnly}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display:'flex', gap:20, alignItems:'center' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.is_veg} onChange={set('is_veg')} disabled={isReadOnly} /> 🟢 Vegetarian
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.is_available} onChange={set('is_available')} disabled={isReadOnly} /> Available In Inventory
                </label>
              </div>

              <div className="input-group">
                <label>Item Image</label>
                <input type="file" className="input" accept="image/*" onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))} disabled={isReadOnly} />
                {form.image && typeof form.image === 'string' && (
                  <img src={`http://localhost:5000${form.image}`} alt="Preview" style={{ width: 60, height: 40, marginTop: 8, borderRadius: 4, objectFit: 'cover' }} />
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>{isReadOnly ? 'Close' : 'Cancel'}</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Item'}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="modal-overlay">
          <div className="modal card" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2>📜 Change History</h2>
              <button className="modal-close" onClick={() => setHistoryModal(null)}>✕</button>
            </div>
            <div className="history-list" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {history.length === 0 ? <p className="text-muted p-4">No changes recorded.</p> : (
                <table className="matrix-table">
                  <thead><tr><th>Who</th><th>When</th><th>IP</th><th>Field</th><th>Old</th><th>New</th></tr></thead>
                  <tbody>{history.map((h, i) => (
                    <tr key={i}>
                      <td>{h.user}</td>
                      <td>{moment(h.timestamp).format('DD MMM YY HH:mm')}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.ip_address}</td>
                      <td><strong>{h.field}</strong></td>
                      <td className="text-danger strike">{h.old_value}</td>
                      <td className="text-success">{h.new_value}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setHistoryModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default MenuManager
