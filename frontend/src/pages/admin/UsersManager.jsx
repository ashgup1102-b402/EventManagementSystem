import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const UsersManager = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const loadUsers = () => {
    setLoading(true)
    api.get('/users', { params: { limit: 100 } })
      .then(r => setUsers(r.data.data))
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const openAdd = () => { setForm({ username:'', email:'', first_name:'', last_name:'', phone:'', role:'end_user', password:'', is_active:true }); setModal('add') }
  const openEdit = (u) => { setForm({ ...u, password: '' }); setModal(u) }

  const save = async () => {
    setSaving(true)
    try {
      if (modal === 'add') {
        if (!form.password) {
          toast.error('Password is required for new users.');
          setSaving(false);
          return;
        }
        await api.post('/users', form)
        toast.success('User created successfully!')
      } else {
        const payload = { ...form }
        if (!payload.password) delete payload.password // Don't send empty password if not changing
        await api.put(`/users/${modal.id}`, payload)
        toast.success('User updated successfully!')
      }
      setModal(null)
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user.')
    } finally {
      setSaving(false)
    }
  }

  const removeUser = async (u) => {
    if (!window.confirm(`Are you sure you want to completely delete ${u.username}? This action cannot be undone.`)) return
    try {
      await api.delete(`/users/${u.id}`)
      toast.success('User deleted.')
      loadUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.')
    }
  }

  const toggleStatus = async (u) => {
    if (!window.confirm(`Are you sure you want to ${u.is_active ? 'deactivate' : 'activate'} this user?`)) return
    try {
      await api.put(`/users/${u.id}`, { is_active: !u.is_active })
      toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}.`)
      loadUsers()
    } catch (err) {
      toast.error('Failed to update status.')
    }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>👥 Users Management</h1>
            <p>Manage system users, properties, and admins</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No users found</h3>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {u.first_name} {u.last_name}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-primary">{u.role?.replace('_',' ')}</span></td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                      {currentUser?.id !== u.id && (
                        <button 
                          className={`btn ${u.is_active ? 'btn-warning' : 'btn-success'} btn-sm`} 
                          onClick={() => toggleStatus(u)}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {currentUser?.role === 'super_admin' && currentUser?.id !== u.id && (
                        <button className="btn btn-danger btn-sm" onClick={() => removeUser(u)}>✕</button>
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
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add New User' : 'Edit User'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            
            <div className="form-grid" style={{ gap: 14 }}>
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>Username *</label>
                  <input className="input" value={form.username||''} onChange={set('username')} disabled={modal !== 'add'} />
                </div>
                <div className="input-group">
                  <label>Email *</label>
                  <input className="input" type="email" value={form.email||''} onChange={set('email')} />
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>First Name</label>
                  <input className="input" value={form.first_name||''} onChange={set('first_name')} />
                </div>
                <div className="input-group">
                  <label>Last Name</label>
                  <input className="input" value={form.last_name||''} onChange={set('last_name')} />
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label>Role *</label>
                  <select className="input" value={form.role||''} onChange={set('role')}>
                    {['end_user', 'property', 'admin', 'super_admin'].map(r => 
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    )}
                  </select>
                </div>
                <div className="input-group">
                  <label>Phone</label>
                  <input className="input" value={form.phone||''} onChange={set('phone')} />
                </div>
              </div>

              <div className="input-group">
                <label>{modal === 'add' ? 'Password *' : 'New Password (leave blank to keep current)'}</label>
                <input className="input" type="password" value={form.password||''} onChange={set('password')} />
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default UsersManager
