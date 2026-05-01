import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const RoleManagement = () => {
  const { user: currentUser } = useAuth()
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const loadRoles = () => {
    setLoading(true)
    api.get('/auth/roles')
      .then(r => setRoles(r.data.data))
      .catch(() => toast.error('Failed to load roles.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRoles() }, [])

  const save = async () => {
    if (!form.name) return toast.error('Role name is required.')
    setSaving(true)
    try {
      if (modal === 'add') {
        await api.post('/auth/roles', form)
        toast.success('Role created!')
      } else {
        await api.put(`/auth/roles/${modal.id}`, form)
        toast.success('Role updated!')
      }
      setModal(null); loadRoles()
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to save role.') 
    } finally { 
      setSaving(false) 
    }
  }

  const removeRole = async (role) => {
    if (!window.confirm(`Are you sure you want to delete the role "${role.name}"? This will also remove its authorization matrix.`)) return
    try {
      await api.delete(`/auth/roles/${role.id}`)
      toast.success('Role deleted successfully.')
      loadRoles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role.')
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>🛡️ Role Management</h1>
            <p>Define custom roles for system access</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '' }); setModal('add') }}>+ Create Role</button>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Role Name</th><th>Description</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.description || '—'}</td>
                  <td>{r.is_system ? <span className="badge badge-muted">System</span> : <span className="badge badge-primary">Custom</span>}</td>
                  <td>
                    <span className={`badge ${r.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {r.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setForm({ ...r, status: r.status || 'Active' }); setModal(r) }}>Edit</button>
                      {currentUser?.role === 'Super Admin' && !['Super Admin', 'Admin', 'Entity', 'End_User'].includes(r.name) && (
                        <button className="btn btn-danger btn-sm" onClick={() => removeRole(r)}>Delete</button>
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
        <div className="modal-overlay">
          <div className="modal">
            <h2>{modal === 'add' ? 'Create Role' : 'Edit Role'}</h2>
            <div className="input-group mt-3">
              <label>Role Name</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={modal.is_system && modal.name === 'Super Admin'} />
            </div>
            <div className="input-group mt-3">
              <label>Description</label>
              <textarea className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="input-group mt-3">
              <label>Status</label>
              <select 
                className="input" 
                value={form.status} 
                onChange={e => setForm({...form, status: e.target.value})}
                disabled={modal.name === 'Super Admin'}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default RoleManagement
