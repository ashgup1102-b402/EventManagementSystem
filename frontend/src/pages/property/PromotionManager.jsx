import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import moment from 'moment'
import { useAuth } from '../../context/AuthContext'

const PromotionManager = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
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
  
  const [historyModal, setHistoryModal] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  const { search: urlSearch } = useLocation()
  const queryParams = new URLSearchParams(urlSearch)
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
        const screenAuth = myAuths.find(a => a.screen_name === 'Promotions')
        const perm = screenAuth ? screenAuth.permission : 'Full Access'
        
        setPermissions({
          isReadOnly: perm === 'Read Only' || perm === 'None',
          noDelete: perm === 'Read and Edit' || perm === 'Read Only' || perm === 'None'
        })
      }).catch(console.error)
    }
  }, [mode, currentUser])

  const { isReadOnly, noDelete } = permissions

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
      await fetchPromos(currentEntityId)
    } catch (err) {
      toast.error('Failed to load initial data.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPromos = async (id) => {
    try {
      const { data } = await api.get('/promotions', { params: { property_id: id, is_active: 'all' } })
      setPromotions(data.data)
    } catch (err) {
      toast.error('Failed to reload promotions.')
    }
  }
  
  const fetchHistory = async (id) => {
    setHistoryLoading(true)
    setHistoryModal(id)
    try {
      const res = await api.get(`/promotions/${id}/history`)
      setHistory(res.data.data)
    } catch (err) {
      toast.error('Failed to load history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const openModal = (item) => {
    setForm(item || { title: '', description: '', valid_from: '', valid_to: '', is_active: true, display_order: 0 })
    setModal(item ? 'edit' : 'add')
  }

  const save = async () => {
    if (isReadOnly) return
    if (!form.title) return toast.error('Title is required.')
    setSaving(true)
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === 'image' && typeof form[k] === 'string') return;
        if (['entity', 'property_id', 'createdAt', 'updatedAt', 'id'].includes(k)) return;
        if (form[k] !== null && form[k] !== undefined) fd.append(k, form[k]);
      });
      fd.append('property_id', entityId);

      if (modal === 'add') await api.post('/promotions', fd)
      else await api.put(`/promotions/${form.id}`, fd)
      
      toast.success('Promotion saved!'); setModal(null); fetchPromos(entityId)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>🚀 Promotions & Highlights</h1>
            <p>Create visual banners and special highlights for the Discover page</p>
          </div>
          {!isReadOnly && <button className="btn btn-primary" onClick={() => openModal(null)}>+ New Promotion</button>}
        </div>
      </div>

      <div className="grid-auto">
        {promotions.map(p => (
          <div key={p.id} className={`card ${!p.is_active ? 'card-inactive' : ''}`} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 160, background: 'var(--bg-tertiary)', position: 'relative' }}>
              {p.image ? (
                <img src={getImgUrl(p.image)} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:40 }}>🚀</div>
              )}
              <div style={{ position:'absolute', top:10, right:10 }}>
                <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>{p.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 8 }}>{p.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{p.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.valid_from || '∞'} - {p.valid_to || '∞'}</span>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openModal(p)}>{isReadOnly ? 'View' : 'Edit'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => fetchHistory(p.id)}>📜</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal card" style={{ maxWidth: 600 }}>
            <div className="modal-header"><h2>{modal === 'add' ? 'Create' : 'Edit'} Promotion</h2><button className="modal-close" onClick={() => setModal(null)}>✕</button></div>
            <div className="form-grid" style={{ gap:14 }}>
              <div className="input-group"><label>Title *</label><input className="input" value={form.title||''} onChange={set('title')} disabled={isReadOnly} /></div>
              <div className="input-group"><label>Description</label><textarea className="input" value={form.description||''} onChange={set('description')} rows={3} disabled={isReadOnly} /></div>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Valid From</label><input className="input" type="date" value={form.valid_from||''} onChange={set('valid_from')} disabled={isReadOnly} /></div>
                <div className="input-group"><label>Valid To</label><input className="input" type="date" value={form.valid_to||''} onChange={set('valid_to')} disabled={isReadOnly} /></div>
              </div>
              <div className="input-group">
                <label>Promotion Image</label>
                <input type="file" className="input" accept="image/*" onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))} disabled={isReadOnly} />
                {form.image && typeof form.image === 'string' && (
                  <img src={`http://localhost:5000${form.image}`} alt="Preview" style={{ width: 100, height: 60, marginTop: 8, borderRadius: 4, objectFit: 'cover' }} />
                )}
              </div>
              <div className="form-grid form-grid-2">
                <div className="input-group"><label>Display Order</label><input className="input" type="number" value={form.display_order} onChange={set('display_order')} disabled={isReadOnly} /></div>
                <div className="input-group" style={{ display:'flex', alignItems:'center', paddingTop:28 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                    <input type="checkbox" checked={form.is_active} onChange={set('is_active')} disabled={isReadOnly} /> Active Status
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>{isReadOnly ? 'Close' : 'Cancel'}</button>
              {!isReadOnly && <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Promotion'}</button>}
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
                    <tr><th>Who</th><th>When</th><th>IP</th><th>Field</th><th>Old</th><th>New</th></tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td>{h.user}</td>
                        <td>{moment(h.timestamp).format('DD MMM YY HH:mm')}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.ip_address}</td>
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
export default PromotionManager
