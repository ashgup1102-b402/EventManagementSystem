import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const MenuManager = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [propId, setPropId] = useState(null)

  useEffect(() => {
    api.get('/properties/my').then(r => { setPropId(r.data.data.id); return api.get('/menu', { params: { property_id: r.data.data.id, is_available: '' } }) })
      .then(r => setItems(r.data.data)).catch(() => toast.error('Failed.')).finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setForm({ name:'', category:'main_course', price:'', description:'', is_veg:true, cuisine_type:'', is_available:true }); setModal('add') }
  const openEdit = item => { setForm({ ...item }); setModal(item) }

  const reload = () => api.get('/menu', { params: { property_id: propId, is_available: '' } }).then(r => setItems(r.data.data))

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, property_id: propId }
      if (modal === 'add') await api.post('/menu', payload)
      else await api.put(`/menu/${modal.id}`, payload)
      toast.success('Menu item saved!')
      setModal(null); reload()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const remove = async id => {
    if (!window.confirm('Delete this item?')) return
    await api.delete(`/menu/${id}`); toast.success('Deleted.'); reload()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <Layout>
      <div className="page-header"><div className="page-header-row"><div><h1>🍽️ Menu Manager</h1><p>Manage food items and pricing</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add Item</button></div></div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : items.length === 0 ?
        <div className="empty-state"><div className="empty-icon">🍽️</div><h3>No menu items</h3><button className="btn btn-primary mt-3" onClick={openAdd}>Add First Item</button></div> :
        <div className="table-wrap"><table>
          <thead><tr><th>Item</th><th>Category</th><th>Cuisine</th><th>Price</th><th>Type</th><th>Available</th><th>Actions</th></tr></thead>
          <tbody>{items.map(item => (
            <tr key={item.id}>
              <td style={{ fontWeight:600 }}>{item.name}</td>
              <td><span className="badge badge-muted">{item.category?.replace('_',' ')}</span></td>
              <td>{item.cuisine_type || '—'}</td>
              <td style={{ fontWeight:700, color:'var(--brand-primary)' }}>₹{item.price}</td>
              <td>{item.is_veg ? '🟢 Veg' : '🔴 Non-veg'}</td>
              <td><span className={`badge ${item.is_available?'badge-success':'badge-danger'}`}>{item.is_available?'Yes':'No'}</span></td>
              <td><div style={{ display:'flex', gap:6 }}><button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>✕</button></div></td>
            </tr>
          ))}</tbody>
        </table></div>
      }

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h2>{modal === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}</h2><button className="modal-close" onClick={() => setModal(null)}>✕</button></div>
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="input-group"><label>Name *</label><input className="input" value={form.name||''} onChange={set('name')} /></div>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Category *</label><select className="input" value={form.category||''} onChange={set('category')}>{['starter','main_course','dessert','beverage','cocktail','mocktail','snack','bread','soup','salad','other'].map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}</select></div>
                <div className="input-group"><label>Cuisine Type</label><input className="input" value={form.cuisine_type||''} onChange={set('cuisine_type')} placeholder="e.g. Indian, Chinese" /></div>
              </div>
              <div className="input-group"><label>Description</label><textarea className="input" value={form.description||''} onChange={set('description')} rows={2} /></div>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Price (₹) *</label><input className="input" type="number" step="0.01" value={form.price||''} onChange={set('price')} /></div>
                <div style={{ display:'flex', gap:20, alignItems:'center', marginTop:24 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}><input type="checkbox" checked={form.is_veg} onChange={set('is_veg')} /> 🟢 Vegetarian</label>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}><input type="checkbox" checked={form.is_available} onChange={set('is_available')} /> Available</label>
                </div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Item'}</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default MenuManager
