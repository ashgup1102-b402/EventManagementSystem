import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const DiscountManager = () => {
  const [discounts, setDiscounts] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('discounts')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [entityId, setEntityId] = useState(null)

  useEffect(() => {
    api.get('/entities/my').then(r => {
      setEntityId(r.data.data.id)
      return Promise.all([
        api.get('/discounts/discounts', { params: { property_id: r.data.data.id } }),
        api.get('/discounts/combos', { params: { property_id: r.data.data.id } })
      ])
    }).then(([d, c]) => { setDiscounts(d.data.data); setCombos(c.data.data) })
      .catch(() => toast.error('Failed.')).finally(() => setLoading(false))
  }, [])

  const reload = async () => {
    const [d, c] = await Promise.all([
      api.get('/discounts/discounts', { params: { property_id: entityId } }),
      api.get('/discounts/combos', { params: { property_id: entityId } })
    ])
    setDiscounts(d.data.data); setCombos(c.data.data)
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
      toast.success('Saved!'); setModal(null); reload()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>

  return (
    <Layout>
      <div className="page-header"><div className="page-header-row"><div><h1>🏷️ Discounts & Combos</h1><p>Manage offers, promos and combo deals</p></div>
        <div style={{ display:'flex', gap:8 }}><button className="btn btn-primary" onClick={() => openDiscount(null)}>+ Discount</button><button className="btn btn-secondary" onClick={() => openCombo(null)}>+ Combo Deal</button></div>
      </div></div>

      <div className="tabs" style={{ marginBottom: 20, maxWidth: 320 }}>
        <button className={`tab-btn ${tab==='discounts'?'active':''}`} onClick={() => setTab('discounts')}>Discounts ({discounts.length})</button>
        <button className={`tab-btn ${tab==='combos'?'active':''}`} onClick={() => setTab('combos')}>Combos ({combos.length})</button>
      </div>

      {tab === 'discounts' && (
        discounts.length === 0 ? <div className="empty-state"><div className="empty-icon">🏷️</div><h3>No discounts</h3></div> :
        <div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Type</th><th>Value</th><th>Applies To</th><th>Promo Code</th><th>Valid</th><th>Used</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>{discounts.map(d => (
            <tr key={d.id}>
              <td style={{ fontWeight:600 }}>{d.name}</td>
              <td><span className="badge badge-primary">{d.discount_type}</span></td>
              <td style={{ fontWeight:700 }}>{d.discount_type==='percentage' ? `${d.discount_value}%` : `₹${d.discount_value}`}</td>
              <td>{d.applicable_on?.replace('_',' ')}</td>
              <td>{d.promo_code || '—'}</td>
              <td style={{ fontSize:12 }}>{d.valid_from||'∞'} → {d.valid_to||'∞'}</td>
              <td>{d.used_count}{d.usage_limit ? `/${d.usage_limit}` : ''}</td>
              <td><span className={`badge ${d.is_active?'badge-success':'badge-danger'}`}>{d.is_active?'Yes':'No'}</span></td>
              <td><button className="btn btn-secondary btn-sm" onClick={() => openDiscount(d)}>Edit</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}

      {tab === 'combos' && (
        combos.length === 0 ? <div className="empty-state"><div className="empty-icon">🎁</div><h3>No combos</h3></div> :
        <div className="grid-auto">{combos.map(c => (
          <div key={c.id} className="card card-hover" onClick={() => openCombo(c)} style={{ cursor:'pointer' }}>
            <div className="badge badge-warning" style={{ marginBottom:8 }}>🎁 Combo</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>{c.name}</div>
            {c.description && <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:10 }}>{c.description}</div>}
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontSize:14, color:'var(--text-muted)', textDecoration:'line-through' }}>₹{c.original_price}</span>
              <span style={{ fontSize:22, fontWeight:800, color:'var(--success)' }}>₹{c.deal_price}</span>
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>{c.valid_from||'∞'} → {c.valid_to||'∞'}</div>
          </div>
        ))}</div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
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
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}
export default DiscountManager
