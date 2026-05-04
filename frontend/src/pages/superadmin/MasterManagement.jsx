import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const MasterManagement = () => {
  const { type } = useParams() // event-types, performers, menu-categories, cuisine-types
  const [data, setData] = useState([])
  const [eventTypes, setEventTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active', event_type_id: '' })
  const [photoFile, setPhotoFile] = useState(null)
  const BASE_URL = 'http://localhost:5000';

  const titles = {
    'event-types': '🎭 Event Types',
    'performers': '🎤 Performers',
    'menu-categories': '🍽️ Menu Categories',
    'cuisine-types': '🍜 Cuisine Types'
  }

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:5000${cleanPath}`;
  }

  useEffect(() => {
    fetchData()
    if (type === 'performers') fetchEventTypes()
  }, [type])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/masters/${type}`)
      setData(res.data.data)
    } catch (err) { toast.error('Failed to fetch data') }
    finally { setLoading(false) }
  }

  const fetchEventTypes = async () => {
    try {
      const res = await api.get('/masters/event-types?status=Active')
      setEventTypes(res.data.data)
    } catch (err) { console.error(err) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('name', formData.name)
      fd.append('description', formData.description)
      fd.append('status', formData.status)
      if (type === 'performers') fd.append('event_type_id', formData.event_type_id)
      if (photoFile) fd.append('image', photoFile)

      if (editingItem) {
        await api.put(`/masters/${type}/${editingItem.id}`, fd)
        toast.success('Updated successfully')
      } else {
        await api.post(`/masters/${type}`, fd)
        toast.success('Created successfully')
      }
      setShowModal(false)
      setEditingItem(null)
      setPhotoFile(null)
      setFormData({ name: '', description: '', status: 'Active', event_type_id: '' })
      fetchData()
    } catch (err) { 
      const msg = err.response?.data?.errors 
        ? err.response.data.errors.map(e => `${e.field}: ${e.message}`).join(', ')
        : err.response?.data?.message || 'Error saving'
      toast.error(msg)
    }
  }

  const edit = (item) => {
    setEditingItem(item)
    setPhotoFile(null)
    setFormData({ 
      name: item.name, 
      description: item.description || '', 
      status: item.status,
      event_type_id: item.event_type_id || ''
    })
    setShowModal(true)
  }

  const remove = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this item?')) return
    try {
      await api.delete(`/masters/${type}/${id}`)
      toast.success('Deactivated successfully')
      fetchData()
    } catch (err) { toast.error('Failed to deactivate') }
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>{titles[type] || 'Master Management'}</h1>
            <p>Configure system masters for dropdowns and categorization.</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({ name: '', description: '', status: 'Active', event_type_id: '' }); setShowModal(true); }}>
            + Add New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="card no-padding overflow-hidden">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Name</th>
                {type === 'performers' && <th>Event Type</th>}
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {item.image ? (
                      <img src={getImgUrl(item.image)} alt="Img" crossOrigin="anonymous" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, background: 'var(--bg-tertiary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🖼️</div>
                    )}
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                  </td>
                  {type === 'performers' && <td>{item.event_type?.name || '-'}</td>}
                  <td>{item.description || '-'}</td>
                  <td>
                    <span className={`badge ${item.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-sm btn-light" onClick={() => edit(item)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(item.id)}>Deactivate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h2>{editingItem ? 'Edit Item' : 'Create Item'}</h2>
            <form onSubmit={handleSubmit} className="form-grid">
              <div className="input-group">
                <label>Name</label>
                <input className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Enter name" />
              </div>

              {type !== 'performers' && (
                <div className="input-group">
                  <label>Image</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {(photoFile || editingItem?.image) && (
                      <img 
                        src={photoFile ? URL.createObjectURL(photoFile) : getImgUrl(editingItem.image)} 
                        alt="Preview" 
                        style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-subtle)' }} 
                      />
                    )}
                    <input type="file" onChange={e => setPhotoFile(e.target.files[0])} accept="image/*" />
                  </div>
                </div>
              )}
              
              {type === 'performers' && (
                <div className="input-group">
                  <label>Event Type</label>
                  <select className="input" required value={formData.event_type_id} onChange={e => setFormData({...formData, event_type_id: e.target.value})}>
                    <option value="">Select Event Type</option>
                    {eventTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                  </select>
                </div>
              )}

              <div className="input-group">
                <label>Description</label>
                <textarea className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Enter description..." />
              </div>
              <div className="input-group">
                <label>Status</label>
                <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default MasterManagement
