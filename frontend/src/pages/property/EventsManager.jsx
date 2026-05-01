import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const EventsManager = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | event obj
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [entityId, setEntityId] = useState(null)

  useEffect(() => {
    api.get('/entities/my').then(r => { setEntityId(r.data.data.id); return api.get('/events', { params: { property_id: r.data.data.id } }) })
      .then(r => setEvents(r.data.data)).catch(() => toast.error('Failed.')).finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setForm({ name:'', type:'singer', description:'', event_date:'', start_time:'20:00', end_time:'23:00', ticket_price:500, total_capacity:100, performer_name:'' }); setModal('add') }
  const openEdit = ev => { setForm({ ...ev }); setModal(ev) }

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...form, property_id: entityId }
      if (modal === 'add') { await api.post('/events', payload); toast.success('Event created!') }
      else { await api.put(`/events/${modal.id}`, payload); toast.success('Event updated!') }
      setModal(null)
      const r = await api.get('/events', { params: { property_id: entityId } })
      setEvents(r.data.data)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const remove = async id => {
    if (!window.confirm('Deactivate this event?')) return
    await api.delete(`/events/${id}`)
    toast.success('Event deactivated.')
    setEvents(events.filter(e => e.id !== id))
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <Layout>
      <div className="page-header"><div className="page-header-row"><div><h1>🎭 Events Manager</h1><p>Create and manage your events</p></div><button className="btn btn-primary" onClick={openAdd}>+ New Event</button></div></div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : events.length === 0 ?
        <div className="empty-state"><div className="empty-icon">🎭</div><h3>No events yet</h3><button className="btn btn-primary mt-3" onClick={openAdd}>Create First Event</button></div> :
        <div className="table-wrap"><table>
          <thead><tr><th>Event</th><th>Type</th><th>Date</th><th>Time</th><th>Price</th><th>Capacity</th><th>Booked</th><th>Actions</th></tr></thead>
          <tbody>{events.map(ev => {
            const avail = ev.total_capacity - ev.booked_count
            return <tr key={ev.id}>
              <td style={{ fontWeight: 600 }}>{ev.name}</td>
              <td><span className="badge badge-primary">{ev.type?.replace('_',' ')}</span></td>
              <td>{ev.event_date}</td>
              <td>{ev.start_time}</td>
              <td style={{ fontWeight: 600 }}>₹{ev.ticket_price}</td>
              <td>{ev.total_capacity}</td>
              <td><span className={`badge ${avail<10?'badge-danger':avail<50?'badge-warning':'badge-success'}`}>{ev.booked_count}/{ev.total_capacity}</span></td>
              <td><div style={{ display:'flex', gap:6 }}><button className="btn btn-secondary btn-sm" onClick={() => openEdit(ev)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(ev.id)}>✕</button></div></td>
            </tr>
          })}</tbody>
        </table></div>
      }

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header"><h2>{modal === 'add' ? 'Create Event' : 'Edit Event'}</h2><button className="modal-close" onClick={() => setModal(null)}>✕</button></div>
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="input-group"><label>Event Name *</label><input className="input" value={form.name||''} onChange={set('name')} /></div>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Type *</label><select className="input" value={form.type||''} onChange={set('type')}>{['singer','comedy','group_troup','dj','live_band','stand_up','dance','theatre','sports','other'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}</select></div>
                <div className="input-group"><label>Performer</label><input className="input" value={form.performer_name||''} onChange={set('performer_name')} /></div>
              </div>
              <div className="input-group"><label>Description</label><textarea className="input" value={form.description||''} onChange={set('description')} rows={2} /></div>
              <div className="form-grid form-grid-3">
                <div className="input-group"><label>Date *</label><input className="input" type="date" value={form.event_date||''} onChange={set('event_date')} /></div>
                <div className="input-group"><label>Start *</label><input className="input" type="time" value={form.start_time||''} onChange={set('start_time')} /></div>
                <div className="input-group"><label>End</label><input className="input" type="time" value={form.end_time||''} onChange={set('end_time')} /></div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Ticket Price (₹) *</label><input className="input" type="number" value={form.ticket_price||''} onChange={set('ticket_price')} /></div>
                <div className="input-group"><label>Total Capacity *</label><input className="input" type="number" value={form.total_capacity||''} onChange={set('total_capacity')} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Event'}</button></div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default EventsManager
