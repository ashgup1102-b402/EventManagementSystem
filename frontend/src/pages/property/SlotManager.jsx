import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const SlotManager = () => {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [entityId, setEntityId] = useState(null)

  useEffect(() => {
    api.get('/entities/my').then(r => {
      setEntityId(r.data.data.id)
      return api.get('/slots', { params: { property_id: r.data.data.id } })
    }).then(r => setSlots(r.data.data)).catch(() => toast.error('Failed to load slots.')).finally(() => setLoading(false))
  }, [])

  const reload = () => api.get('/slots', { params: { property_id: entityId } }).then(r => setSlots(r.data.data))

  const openAdd = () => { setForm({ slot_name:'', slot_date:'', start_time:'', end_time:'', slot_type:'hall', total_capacity:'', price_per_head:0, min_guests:1, max_guests:'' }); setModal('add') }
  const openEdit = slot => { setForm({ ...slot }); setModal(slot) }

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, property_id: entityId }
      if (modal === 'add') await api.post('/slots', payload)
      else await api.put(`/slots/${modal.id}`, payload)
      toast.success('Slot saved!')
      setModal(null); reload()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const remove = async id => {
    if (!window.confirm('Delete this slot?')) return
    await api.delete(`/slots/${id}`); toast.success('Deleted.'); reload()
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Layout>
      <div className="page-header"><div className="page-header-row"><div><h1>📅 Slot Manager</h1><p>Manage table reservations and hall slots</p></div><button className="btn btn-primary" onClick={openAdd}>+ New Slot</button></div></div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : slots.length === 0 ?
        <div className="empty-state"><div className="empty-icon">📅</div><h3>No slots configured</h3><button className="btn btn-primary mt-3" onClick={openAdd}>Create Slot</button></div> :
        <div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Date</th><th>Time</th><th>Type</th><th>Capacity</th><th>Guests Limit</th><th>Price/Head</th><th>Actions</th></tr></thead>
          <tbody>{slots.map(s => (
            <tr key={s.id}>
              <td style={{ fontWeight:600 }}>{s.slot_name}</td>
              <td>{s.slot_date}</td>
              <td>{s.start_time} - {s.end_time}</td>
              <td><span className="badge badge-muted">{s.slot_type?.replace('_',' ')}</span></td>
              <td>{s.total_capacity}</td>
              <td>{s.min_guests} - {s.max_guests}</td>
              <td>₹{s.price_per_head}</td>
              <td><div style={{ display:'flex', gap:6 }}><button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>✕</button></div></td>
            </tr>
          ))}</tbody>
        </table></div>
      }

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h2>{modal === 'add' ? 'Create Slot' : 'Edit Slot'}</h2><button className="modal-close" onClick={() => setModal(null)}>✕</button></div>
            <div className="form-grid" style={{ gap:14 }}>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Slot Name *</label><input className="input" value={form.slot_name||''} onChange={set('slot_name')} /></div>
                <div className="input-group"><label>Type *</label><select className="input" value={form.slot_type||''} onChange={set('slot_type')}>{['hall','outdoor','rooftop','table','private_room'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}</select></div>
              </div>
              <div className="form-grid form-grid-3">
                <div className="input-group"><label>Date *</label><input type="date" className="input" value={form.slot_date||''} onChange={set('slot_date')} /></div>
                <div className="input-group"><label>Start *</label><input type="time" className="input" value={form.start_time||''} onChange={set('start_time')} /></div>
                <div className="input-group"><label>End *</label><input type="time" className="input" value={form.end_time||''} onChange={set('end_time')} /></div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Total Capacity *</label><input type="number" className="input" value={form.total_capacity||''} onChange={set('total_capacity')} /></div>
                <div className="input-group"><label>Price / Head (₹)</label><input type="number" className="input" value={form.price_per_head||''} onChange={set('price_per_head')} /></div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Min Guests</label><input type="number" className="input" value={form.min_guests||''} onChange={set('min_guests')} /></div>
                <div className="input-group"><label>Max Guests</label><input type="number" className="input" value={form.max_guests||''} onChange={set('max_guests')} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Slot'}</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}
export default SlotManager
