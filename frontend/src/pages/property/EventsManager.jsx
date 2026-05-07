import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import moment from 'moment'
import { useAuth } from '../../context/AuthContext'

const EventsManager = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [eventTypes, setEventTypes] = useState([])
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | event obj
  const [historyModal, setHistoryModal] = useState(null) // event id
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
  const mode = queryParams.get('mode') // 'view', 'edit_no_delete', or null

  const [auths, setAuths] = useState([])
  const [permissions, setPermissions] = useState({ isReadOnly: false, noDelete: false })

  useEffect(() => {
    if (mode) {
      setPermissions({
        isReadOnly: mode === 'view',
        noDelete: mode === 'edit_no_delete' || mode === 'view'
      })
    } else if (currentUser) {
      // If no mode in URL, check current user's authorizations
      api.get('/auth/authorizations').then(r => {
        const myAuths = r.data.data.filter(a => a.role_name === currentUser.role)
        const screenAuth = myAuths.find(a => a.screen_name === 'Event Management')
        const perm = screenAuth ? screenAuth.permission : 'Full Access' // Default to Full if not found (legacy)
        
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

      const [typesRes, perfRes] = await Promise.all([
        api.get('/masters/event-types?status=Active'),
        api.get('/masters/performers?status=Active')
      ])

      if (!currentEntityId) {
        const entRes = await api.get('/entities/my');
        currentEntityId = entRes.data.data.id;
      }
      
      setEntityId(currentEntityId)
      setEventTypes(typesRes.data.data)
      setPerformers(perfRes.data.data)
      fetchEvents(currentEntityId, initialStatus)
    } catch (err) { toast.error('Failed to load initial data.') }
    finally { setLoading(false) }
  }

  const fetchEvents = async (id, statusFilter) => {
    try {
      const params = { property_id: id }
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/events', { params })
      setEvents(res.data.data)
    } catch (err) { toast.error('Failed to load events.') }
  }

  const fetchHistory = async (id) => {
    try {
      const res = await api.get(`/events/${id}/history`)
      setHistory(res.data.data)
      setHistoryModal(id)
    } catch (err) { toast.error('Failed to load history.') }
  }

  const validate = () => {
    if (!form.name || !form.event_date || !form.start_time || !form.event_type_id) {
      toast.error('Please fill required fields.')
      return false
    }
    if (moment(form.event_date).isBefore(moment(), 'day')) {
      toast.error('Event date cannot be in the past.')
      return false
    }
    if (form.end_time && form.start_time && (!form.end_date || form.end_date === form.event_date)) {
      if (form.end_time <= form.start_time) {
        toast.error('End time must be after start time.')
        return false
      }
    }
    if (form.ticket_price < 0 || form.total_capacity < 0) {
      toast.error('Price and capacity cannot be negative.')
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
        // Skip keys that are handled separately, calculated fields, or are objects/refs
        if (k === 'image' && typeof form[k] === 'string') return;
        if (['entity', 'event_type_ref', 'performer_ref', 'property_id', 'booked_count', 'createdAt', 'updatedAt', 'id'].includes(k)) return;
        
        if (form[k] !== null && form[k] !== undefined) fd.append(k, form[k]);
      });
      fd.append('property_id', entityId);

      if (modal === 'add') { await api.post('/events', fd); toast.success('Event created!') }
      else { await api.put(`/events/${modal.id}`, fd); toast.success('Event updated!') }
      setModal(null)
      fetchEvents(entityId)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const deactivate = async id => {
    if (noDelete) return
    if (!window.confirm('Deactivate this event?')) return
    try {
      await api.delete(`/events/${id}`)
      toast.success('Event deactivated.')
      fetchEvents(entityId)
    } catch (err) { toast.error('Failed to deactivate.') }
  }

  const activate = async id => {
    if (!window.confirm('Activate this event?')) return
    try {
      await api.put(`/events/${id}`, { status: 'Active' })
      toast.success('Event activated.')
      fetchEvents(entityId)
    } catch (err) { toast.error('Failed to activate.') }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const filteredPerformers = performers.filter(p => !form.event_type_id || p.event_type_id === form.event_type_id)

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/entity/dashboard')}>
              📊 Dashboard
            </button>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && queryParams.get('entityId') && (
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/entities')}>
                ← Back to Entities
              </button>
            )}
            <div>
              <h1>🎭 Events Manager</h1>
              <p>Manage performance-based events and performer mapping.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {queryParams.get('status') && (
              <button className="btn btn-ghost btn-sm" onClick={() => { navigate(window.location.pathname); fetchEvents(entityId, 'all'); }}>✕ Clear Filters</button>
            )}
            {!isReadOnly && (
              <button className="btn btn-primary" onClick={() => { setForm({ ticket_price:0, total_capacity:100, status:'Active' }); setModal('add'); }}>
                + New Event
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : events.length === 0 ?
        <div className="empty-state">
          <div className="empty-icon">🎭</div>
          <h3>No events found</h3>
          {!isReadOnly && <button className="btn btn-primary mt-3" onClick={() => setModal('add')}>Create First Event</button>}
        </div> :
        <div className="table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Type</th>
                <th>Performer</th>
                <th>Date / Time</th>
                <th>Pricing</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {ev.image ? (
                      <img src={getImgUrl(ev.image)} alt="Img" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: 'var(--bg-tertiary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎭</div>
                    )}
                    <div>
                      <strong>{ev.name}</strong>
                    </div>
                  </td>
                  <td>{ev.event_type_ref?.name || '-'}</td>
                  <td>{ev.performer_ref?.name || ev.performer_name || '-'}</td>
                  <td>
                    <div>{ev.event_date}</div>
                    <div className="text-muted text-xs">{ev.start_time} - {ev.end_time || 'TBD'}</div>
                  </td>
                  <td><span className="fw-600">₹{ev.ticket_price}</span></td>
                  <td><span className="badge badge-light">{ev.booked_count}/{ev.total_capacity}</span></td>
                  <td>
                    <span className={`badge ${ev.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-sm btn-light" onClick={() => { setForm({...ev}); setModal(ev); }}>
                        {isReadOnly ? 'View' : 'Edit'}
                      </button>
                      <button className="btn btn-sm btn-light" onClick={() => fetchHistory(ev.id)}>📜 History</button>
                      {canActivate && ev.status !== 'Active' && (
                        <button className="btn btn-sm btn-success" onClick={() => activate(ev.id)}>Activate</button>
                      )}
                      {canDeactivate && ev.status === 'Active' && (
                        <button className="btn btn-sm btn-danger" onClick={() => deactivate(ev.id)}>Deactivate</button>
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
              <h2>
                {modal === 'add' ? 'Create Event' : (isReadOnly ? 'View Event' : 'Edit Event')}
              </h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="form-grid" style={{ gap: 16 }}>
              <div className="input-group">
                <label>Event Name *</label>
                <input className="input" value={form.name||''} onChange={set('name')} placeholder="e.g. Rock Night 2024" disabled={isReadOnly} />
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label>Event Type *</label>
                  <select className="input" value={form.event_type_id||''} onChange={e => setForm({...form, event_type_id: e.target.value, performer_id: ''})} disabled={isReadOnly}>
                    <option value="">Select Type</option>
                    {eventTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Performer</label>
                  <select className="input" value={form.performer_id||''} onChange={set('performer_id')} disabled={isReadOnly}>
                    <option value="">Select Performer</option>
                    {filteredPerformers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea className="input" value={form.description||''} onChange={set('description')} rows={2} disabled={isReadOnly} />
              </div>

              <div className="form-grid-3">
                <div className="input-group">
                  <label>Start Date *</label>
                  <input className="input" type="date" value={form.event_date||''} onChange={set('event_date')} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>End Date</label>
                  <input className="input" type="date" value={form.end_date||''} onChange={set('end_date')} min={form.event_date} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select className="input" value={form.status||'Active'} onChange={set('status')} disabled={isReadOnly}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label>Start Time *</label>
                  <input className="input" type="time" value={form.start_time||''} onChange={set('start_time')} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>End Time</label>
                  <input className="input" type="time" value={form.end_time||''} onChange={set('end_time')} disabled={isReadOnly} />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label>Ticket Price (₹) *</label>
                  <input className="input" type="number" min="0" value={form.ticket_price||0} onChange={set('ticket_price')} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>Total Capacity *</label>
                  <input className="input" type="number" min="1" value={form.total_capacity||100} onChange={set('total_capacity')} disabled={isReadOnly} />
                </div>
              </div>

              <div className="input-group">
                <label>Event Banner</label>
                <input type="file" className="input" accept="image/*" onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))} disabled={isReadOnly} />
                {form.image && typeof form.image === 'string' && (
                  <img src={`http://localhost:5000${form.image}`} alt="Preview" style={{ width: 60, height: 40, marginTop: 8, borderRadius: 4, objectFit: 'cover' }} />
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Event'}
                </button>
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

export default EventsManager
