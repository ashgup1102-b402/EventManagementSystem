import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import moment from 'moment'
import { useAuth } from '../../context/AuthContext'

const DiscountManager = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [discounts, setDiscounts] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('discounts')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [entityId, setEntityId] = useState(null)
  
  const [historyModal, setHistoryModal] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const { search: urlSearch } = useLocation()
  const queryParams = new URLSearchParams(urlSearch)
  const initialActive = queryParams.get('is_active')

  useEffect(() => {
    fetchInit()
  }, [])

  const fetchInit = async () => {
    try {
      const queryId = queryParams.get('entityId');
      let currentEntityId = queryId;

      if (!currentEntityId) {
        const entRes = await api.get('/entities/my');
        currentEntityId = entRes.data.data.id;
      }

      setEntityId(currentEntityId)
      await fetchAll(currentEntityId, initialActive)
    } catch (err) {
      toast.error('Failed to load initial data.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAll = async (id, activeFilter) => {
    try {
      const params = { property_id: id }
      if (activeFilter !== null) params.is_active = activeFilter
      const [d, c] = await Promise.all([
        api.get('/discounts/discounts', { params }),
        api.get('/discounts/combos', { params })
      ])
      setDiscounts(d.data.data); 
      setCombos(c.data.data)
    } catch (err) {
      toast.error('Failed to reload data.')
    }
  }

  const fetchHistory = async (type, id) => {
    setHistoryLoading(true)
    setHistoryModal({ type, id })
    try {
      const res = await api.get(`/discounts/${type}/${id}/history`)
      setHistory(res.data.data)
    } catch (err) {
      toast.error('Failed to load history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const openDiscount = (item) => {
    setForm(item || { name:'', discount_type:'percentage', discount_value:'', applicable_on:'total', min_booking_amount:0, max_discount_amount:'', valid_from:'', valid_to:'', promo_code:'', is_active:true })
    setModal(item ? { type:'discount', item } : { type:'discount', item:null })
  }

  const openCombo = (item) => {
    setForm(item || { name:'', description:'', original_price:'', deal_price:'', valid_from:'', valid_to:'', is_active:true })
    setModal(item ? { type:'combo', item } : { type:'combo', item:null })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, property_id: entityId }
      if (modal.type === 'discount') {
        if (modal.item) await api.put(`/discounts/discounts/${modal.item.id}`, payload)
        else await api.post('/discounts/discounts', payload)
      } else {
        if (modal.item) await api.put(`/discounts/combos/${modal.item.id}`, payload)
        else await api.post('/discounts/combos', payload)
      }
      toast.success('Saved!'); setModal(null); fetchAll(entityId)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const deactivate = async (type, id) => {
    if (!window.confirm(`Deactivate this ${type}?`)) return
    try {
      if (type === 'discount') await api.delete(`/discounts/discounts/${id}`)
      else await api.delete(`/discounts/combos/${id}`)
      toast.success('Deactivated.')
      fetchAll(entityId)
    } catch (err) { toast.error('Failed to deactivate.') }
  }

  const activate = async (type, id) => {
    if (!window.confirm(`Activate this ${type}?`)) return
    try {
      if (type === 'discount') await api.put(`/discounts/discounts/${id}`, { is_active: true })
      else await api.put(`/discounts/combos/${id}`, { is_active: true })
      toast.success('Activated.')
      fetchAll(entityId)
    } catch (err) { toast.error('Failed to activate.') }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>

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
              <h1>🏷️ Discounts & Combos</h1>
              <p>Manage offers, promos and combo deals</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}><button className="btn btn-primary" onClick={() => openDiscount(null)}>+ Discount</button><button className="btn btn-secondary" onClick={() => openCombo(null)}>+ Combo Deal</button></div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20, maxWidth: 320 }}>
        <button className={`tab-btn ${tab==='discounts'?'active':''}`} onClick={() => setTab('discounts')}>Discounts ({discounts.length})</button>
        <button className={`tab-btn ${tab==='combos'?'active':''}`} onClick={() => setTab('combos')}>Combos ({combos.length})</button>
      </div>

      {tab === 'discounts' && (
        discounts.length === 0 ? <div className="empty-state"><div className="empty-icon">🏷️</div><h3>No discounts</h3></div> :
        <div className="table-wrap">
          <table className="matrix-table">
            <thead><tr><th>Name</th><th>Type</th><th>Value</th><th>Applies To</th><th>Promo Code</th><th>Valid</th><th>Used</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{discounts.map(d => (
              <tr key={d.id} className={!d.is_active ? 'row-inactive' : ''}>
                <td style={{ fontWeight:600 }}>{d.name}</td>
                <td><span className="badge badge-primary">{d.discount_type}</span></td>
                <td style={{ fontWeight:700 }}>{d.discount_type==='percentage' ? `${d.discount_value}%` : `₹${d.discount_value}`}</td>
                <td>{d.applicable_on?.replace('_',' ')}</td>
                <td>{d.promo_code || '—'}</td>
                <td style={{ fontSize:12 }}>{d.valid_from||'∞'} → {d.valid_to||'∞'}</td>
                <td>{d.used_count}{d.usage_limit ? `/${d.usage_limit}` : ''}</td>
                <td><span className={`badge ${d.is_active?'badge-success':'badge-danger'}`}>{d.is_active?'Active':'Inactive'}</span></td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openDiscount(d)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => fetchHistory('discount', d.id)}>📜</button>
                    {d.is_active ? (
                      <button className="btn btn-danger btn-sm" onClick={() => deactivate('discount', d.id)}>✕</button>
                    ) : (
                      <button className="btn btn-success btn-sm" onClick={() => activate('discount', d.id)}>✓</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 'combos' && (
        combos.length === 0 ? <div className="empty-state"><div className="empty-icon">🎁</div><h3>No combos</h3></div> :
        <div className="grid-auto">{combos.map(c => (
          <div key={c.id} className={`card card-hover ${!c.is_active ? 'card-inactive' : ''}`} style={{ padding: 20, cursor:'pointer', position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div className="badge badge-warning">🎁 Combo Deal</div>
              <div className={`badge ${c.is_active?'badge-success':'badge-danger'}`}>{c.is_active?'Active':'Inactive'}</div>
            </div>
            <div onClick={() => openCombo(c)}>
              <div style={{ fontWeight:700, fontSize:18, marginBottom:4 }}>{c.name}</div>
              {c.description && <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:10 }}>{c.description}</div>}
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={{ fontSize:14, color:'var(--text-muted)', textDecoration:'line-through' }}>₹{c.original_price}</span>
                <span style={{ fontSize:22, fontWeight:800, color:'var(--success)' }}>₹{c.deal_price}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>{c.valid_from||'∞'} → {c.valid_to||'∞'}</div>
            </div>
            <div style={{ marginTop:16, display:'flex', gap:8, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => fetchHistory('combo', c.id)}>📜 History</button>
              {c.is_active ? (
                <button className="btn btn-danger btn-sm" onClick={() => deactivate('combo', c.id)}>Deactivate</button>
              ) : (
                <button className="btn btn-success btn-sm" onClick={() => activate('combo', c.id)}>Activate</button>
              )}
            </div>
          </div>
        ))}</div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal card" style={{ maxWidth: 600 }}>
            <div className="modal-header"><h2>{modal.item ? 'Edit' : 'Create'} {modal.type === 'discount' ? 'Discount' : 'Combo Deal'}</h2><button className="modal-close" onClick={() => setModal(null)}>✕</button></div>
            <div className="form-grid" style={{ gap:14 }}>
              <div className="input-group"><label>Name *</label><input className="input" value={form.name||''} onChange={set('name')} /></div>
              {modal.type === 'discount' ? <>
                <div className="form-grid form-grid-2">
                  <div className="input-group"><label>Type</label><select className="input" value={form.discount_type||''} onChange={set('discount_type')}><option value="percentage">Percentage</option><option value="flat">Flat Amount</option></select></div>
                  <div className="input-group"><label>Value *</label><input className="input" type="number" value={form.discount_value||''} onChange={set('discount_value')} placeholder={form.discount_type==='percentage'?'e.g. 10':'e.g. 100'} /></div>
                </div>
                <div className="form-grid form-grid-2">
                  <div className="input-group"><label>Applies To</label><select className="input" value={form.applicable_on||''} onChange={set('applicable_on')}>{['total','all_menu','all_events','menu_item','event','slot','combo_deal'].map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}</select></div>
                  <div className="input-group"><label>Promo Code</label><input className="input" value={form.promo_code||''} onChange={set('promo_code')} placeholder="Optional" /></div>
                </div>
                <div className="form-grid form-grid-2">
                  <div className="input-group"><label>Min Booking ₹</label><input className="input" type="number" value={form.min_booking_amount||''} onChange={set('min_booking_amount')} /></div>
                  <div className="input-group"><label>Max Discount ₹</label><input className="input" type="number" value={form.max_discount_amount||''} onChange={set('max_discount_amount')} /></div>
                </div>
              </> : <>
                <div className="input-group"><label>Description</label><textarea className="input" value={form.description||''} onChange={set('description')} rows={2} /></div>
                <div className="form-grid form-grid-2">
                  <div className="input-group"><label>Original Price ₹ *</label><input className="input" type="number" value={form.original_price||''} onChange={set('original_price')} /></div>
                  <div className="input-group"><label>Deal Price ₹ *</label><input className="input" type="number" value={form.deal_price||''} onChange={set('deal_price')} /></div>
                </div>
              </>}
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Valid From</label><input className="input" type="date" value={form.valid_from||''} onChange={set('valid_from')} /></div>
                <div className="input-group"><label>Valid To</label><input className="input" type="date" value={form.valid_to||''} onChange={set('valid_to')} /></div>
              </div>
              <div className="input-group">
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={set('is_active')} /> Active Status
                </label>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></div>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setHistoryModal(null)}>
          <div className="modal card" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>📜 Change History</h2>
              <button className="modal-close" onClick={() => setHistoryModal(null)}>✕</button>
            </div>
            <div className="history-list" style={{ maxHeight: 400, overflowY: 'auto' }}>
              {historyLoading ? (
                <div className="loading-center"><div className="spinner" /></div>
              ) : history.length === 0 ? (
                <p className="text-muted p-4">No changes recorded.</p>
              ) : (
                <table className="matrix-table">
                  <thead>
                    <tr><th>Who</th><th>When</th><th>Field</th><th>Old</th><th>New</th></tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td>{h.user}</td>
                        <td>{moment(h.timestamp).format('DD MMM YY HH:mm')}</td>
                        <td><strong>{h.field}</strong></td>
                        <td className="text-danger strike">{h.old_value}</td>
                        <td className="text-success">{h.new_value}</td>
                      </tr>
                    ))}
                  </tbody>
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

export default DiscountManager
