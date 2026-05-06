import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import moment from 'moment'
import { useAuth } from '../../context/AuthContext'

const SlotManager = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
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
  const mode = queryParams.get('mode')
  const isReadOnly = mode === 'view'
  const noDelete = mode === 'edit_no_delete' || isReadOnly


  useEffect(() => {
    fetchInitial()
  }, [])

  const fetchInitial = async () => {
    try {
      const queryId = queryParams.get('entityId');
      let currentEntityId = queryId;

      if (!currentEntityId) {
        const res = await api.get('/entities/my');
        currentEntityId = res.data.data.id;
      }

      setEntityId(currentEntityId)
      fetchSlots(currentEntityId, initialActive)
    } catch (err) {
      toast.error('Failed to load entity.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSlots = async (id, activeFilter) => {
    try {
      const params = { property_id: id, include_inactive: true }
      if (activeFilter !== null) params.is_active = activeFilter
      const res = await api.get('/slots', { params })
      setSlots(res.data.data)
    } catch (err) {
      toast.error('Failed to load slots.')
    }
  }

  const fetchHistory = async (id) => {
    setHistoryLoading(true)
    setHistoryModal(id)
    try {
      const res = await api.get(`/slots/${id}/history`)
      setHistory(res.data.data)
    } catch (err) {
      toast.error('Failed to load history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const openAdd = () => { 
    setForm({ 
      slot_name:'', slot_date:'', start_time:'', end_time:'', slot_type:'hall', 
      total_capacity:'', price_per_head:0, min_guests:1, max_guests:'', is_active: true 
    }); 
    setModal('add') 
  }
  
  const openEdit = slot => { setForm({ ...slot }); setModal(slot) }

  const save = async () => {
    if (isReadOnly) return
    if (!form.slot_name || !form.slot_date || !form.start_time || !form.end_time) {
      return toast.error('Please fill required fields.')
    }
    setSaving(true)
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === 'image' && typeof form[k] === 'string') return;
        if (['entity', 'property_id', 'createdAt', 'updatedAt', 'id'].includes(k)) return;
        if (form[k] !== null && form[k] !== undefined) fd.append(k, form[k]);
      });
      fd.append('property_id', entityId);

      if (modal === 'add') await api.post('/slots', fd)
      else await api.put(`/slots/${modal.id}`, fd)
      toast.success('Slot saved!')
      setModal(null)
      fetchSlots(entityId)
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed.') 
    } finally { 
      setSaving(false) 
    }
  }

  const deactivate = async id => {
    if (noDelete) return
    if (!window.confirm('Are you sure you want to set this slot to Inactive?')) return
    try {
      await api.delete(`/slots/${id}`)
      toast.success('Slot deactivated.')
      fetchSlots(entityId)
    } catch (err) {
      toast.error('Failed to deactivate.')
    }
  }

  const activate = async id => {
    if (!window.confirm('Are you sure you want to set this slot to Active?')) return
    try {
      await api.put(`/slots/${id}`, { is_active: true })
      toast.success('Slot activated.')
      fetchSlots(entityId)
    } catch (err) {
      toast.error('Failed to activate.')
    }
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
              <h1>📅 Slot Manager</h1>
              <p>Manage table reservations and hall slots</p>
            </div>
          </div>
          {!isReadOnly && (
            <button className="btn btn-primary" onClick={openAdd}>+ New Slot</button>
          )}

        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : slots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No slots configured</h3>
          {!isReadOnly && <button className="btn btn-primary mt-3" onClick={openAdd}>Create Slot</button>}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Guests Limit (Min-Max)</th>
                <th>Price/Head</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(s => (
                <tr key={s.id} className={!s.is_active ? 'row-inactive' : ''}>
                  <td style={{ fontWeight:600 }}>{s.slot_name}</td>
                  <td>{s.slot_date}</td>
                  <td>{s.start_time} - {s.end_time}</td>
                  <td><span className="badge badge-muted">{s.slot_type?.replace('_',' ')}</span></td>
                  <td>{s.total_capacity}</td>
                  <td>{s.min_guests} - {s.max_guests}</td>
                  <td>₹{s.price_per_head}</td>
                  <td>
                    <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>
                        {isReadOnly ? 'View' : 'Edit'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => fetchHistory(s.id)}>📜 History</button>
                      {!noDelete && (
                        s.is_active ? (
                          <button className="btn btn-danger btn-sm" onClick={() => deactivate(s.id)}>Deactivate</button>
                        ) : (
                          <button className="btn btn-success btn-sm" onClick={() => activate(s.id)}>Activate</button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal card" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Create Slot' : (isReadOnly ? 'View Slot' : 'Edit Slot')}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="form-grid" style={{ gap:14 }}>
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>Slot Name *</label>
                  <input className="input" value={form.slot_name||''} onChange={set('slot_name')} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>Type *</label>
                  <select className="input" value={form.slot_type||''} onChange={set('slot_type')} disabled={isReadOnly}>
                    {['hall','outdoor','rooftop','table','private_room'].map(t => (
                      <option key={t} value={t}>{t.replace('_',' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-grid form-grid-3">
                <div className="input-group">
                  <label>Date *</label>
                  <input type="date" className="input" value={form.slot_date||''} onChange={set('slot_date')} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>Start *</label>
                  <input type="time" className="input" value={form.start_time||''} onChange={set('start_time')} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>End *</label>
                  <input type="time" className="input" value={form.end_time||''} onChange={set('end_time')} disabled={isReadOnly} />
                </div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>Total Capacity *</label>
                  <input type="number" className="input" value={form.total_capacity||''} onChange={set('total_capacity')} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>Price / Head (₹)</label>
                  <input type="number" className="input" value={form.price_per_head||''} onChange={set('price_per_head')} disabled={isReadOnly} />
                </div>
              </div>
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>Min Guests</label>
                  <input type="number" className="input" value={form.min_guests||''} onChange={set('min_guests')} disabled={isReadOnly} />
                </div>
                <div className="input-group">
                  <label>Max Guests</label>
                  <input type="number" className="input" value={form.max_guests||''} onChange={set('max_guests')} disabled={isReadOnly} />
                </div>
              </div>
              <div className="input-group">
                <label>Slot Image</label>
                <input type="file" className="input" accept="image/*" onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))} disabled={isReadOnly} />
                {form.image && typeof form.image === 'string' && (
                  <img src={`http://localhost:5000${form.image}`} alt="Preview" style={{ width: 60, height: 40, marginTop: 8, borderRadius: 4, objectFit: 'cover' }} />
                )}
              </div>
              <div className="input-group">
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={set('is_active')} disabled={isReadOnly} /> Active Status
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>{isReadOnly ? 'Close' : 'Cancel'}</button>
              {!isReadOnly && (
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Slot'}
                </button>
              )}
            </div>
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

export default SlotManager
