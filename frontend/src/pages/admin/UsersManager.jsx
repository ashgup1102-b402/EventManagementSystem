import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const UsersManager = () => {
  const { user: currentUser } = useAuth()
  const location = useLocation()
  const [users, setUsers] = useState([])
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)
  
  // Get initial search from URL if present (e.g. /admin/users?status=Active)
  const queryParams = new URLSearchParams(location.search)
  const initialStatus = queryParams.get('status') || ''
  
  const [search, setSearch] = useState(initialStatus)
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' })

  const loadData = async () => {
    setLoading(true)
    try {
      const [uRes, eRes] = await Promise.all([
        api.get('/users', { params: { limit: 500 } }),
        api.get('/entities', { params: { limit: 100 } })
      ])
      setUsers(uRes.data.data)
      setEntities(eRes.data.data)
    } catch (err) { 
      toast.error('Failed to load user management data.') 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openAdd = () => { setForm({ username:'', email:'', first_name:'', last_name:'', mobile_1:'', role:'End_User', password:'', status:'Active', entity_id: '' }); setModal('add') }
  const openEdit = (u) => { 
    if (u.role === 'Super Admin') {
      if (!window.confirm('CRITICAL: Are you really sure you want to modify Super Admin user details? Any changes to root accounts can impact system stability.')) return;
    }
    const ent = entities.find(e => e.entity_user_id === u.id);
    setForm({ ...u, password: '', entity_id: ent?.id || '' }); 
    setModal(u) 
  }

  const save = async () => {
    if (modal !== 'add' && modal.role === 'Super Admin') {
      if (!window.confirm('FINAL CONFIRMATION: Are you absolutely sure you want to save changes to this Super Admin account?')) return;
    }

    setSaving(true)
    try {
      if (modal === 'add') {
        if (!form.password) return toast.error('Password is required for new users.');
        if (form.role === 'Entity' && !form.entity_id && form.status === 'Active') {
          return toast.error('Users with role "Entity" must be mapped to an Entity before being activated.');
        }
        await api.post('/users', form)
        toast.success('User created successfully!')
      } else {
        const payload = { ...form }
        if (!payload.password) delete payload.password 
        if (form.role === 'Entity' && !form.entity_id && form.status === 'Active') {
          return toast.error('Users with role "Entity" must be mapped to an Entity before being activated.');
        }
        await api.put(`/users/${modal.id}`, payload)
        toast.success('User updated successfully!')
      }
      setModal(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (u) => {
    if (u.role === 'Super Admin') return toast.error('You cannot deactivate a Super Admin.')
    const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
    
    if (newStatus === 'Active' && u.role === 'Entity') {
      const isMapped = entities.some(e => e.entity_user_id === u.id);
      if (!isMapped) return toast.error('This user cannot be activated because they are not mapped to any Entity.');
    }

    if (!window.confirm(`Are you sure you want to set this user as ${newStatus}?`)) return
    try {
      await api.put(`/users/${u.id}`, { status: newStatus })
      toast.success(`User marked as ${newStatus}.`)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.')
    }
  }

  const set = k => e => {
    const val = e.target.type === 'checkbox' ? (e.target.checked ? 'Active' : 'Inactive') : e.target.value;
    setForm(f => {
      const next = { ...f, [k]: val };
      if (k === 'role' && val === 'Entity' && !next.entity_id) next.status = 'Inactive';
      return next;
    });
  }

  const formatDate = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  }

  // --- Intellisense Filtering & Multi-level Sorting ---
  const rolePriority = { 'Super Admin': 1, 'Admin': 2, 'Entity': 3, 'End_User': 4 };
  
  const processedUsers = [...users]
    .filter(u => {
      if (currentUser?.role !== 'Super Admin' && u.role === 'Super Admin') return false;
      const term = search.toLowerCase();
      return (
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.first_name?.toLowerCase().includes(term) ||
        u.last_name?.toLowerCase().includes(term) ||
        u.role?.toLowerCase().includes(term) ||
        u.mobile_1?.toLowerCase().includes(term) ||
        (term === 'active' ? u.status?.toLowerCase() === 'active' : u.status?.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      // 1. Sort by Status (Active first)
      if (a.status !== b.status) {
        return a.status === 'Active' ? -1 : 1;
      }
      
      // 2. Sort by Role Priority
      const pA = rolePriority[a.role] || 99;
      const pB = rolePriority[b.role] || 99;
      if (pA !== pB) return pA - pB;

      // 3. User Detail Sort (Custom or default)
      const valA = (a[sortConfig.key] || '').toString().toLowerCase();
      const valB = (b[sortConfig.key] || '').toString().toLowerCase();
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const availableEntities = entities.filter(e => {
    const activeUser = users.find(u => u.id === e.entity_user_id && u.status === 'Active');
    return !activeUser || (modal && modal !== 'add' && e.entity_user_id === modal.id);
  });

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>👥 Users Management</h1>
            <p>Manage system users and access levels (Deactivation Only)</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="🔍 Search users (Intellisense)..." 
                className="input" 
                style={{ width: 280 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : processedUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No matching users found</h3>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('username')} style={{ cursor: 'pointer' }}>
                  User Details {sortConfig.key === 'username' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                  Email & Phone {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                  Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('last_login')} style={{ cursor: 'pointer' }}>
                  Last Login {sortConfig.key === 'last_login' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedUsers.map(u => (
                <tr key={u.id} className={u.status === 'Inactive' ? 'row-inactive' : ''}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{u.username}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{u.first_name} {u.last_name}</div>
                    {u.role === 'Entity' && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Property: {entities.find(e => e.entity_user_id === u.id)?.name || 'Unmapped'}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.mobile_1 || u.phone || 'No Phone'}</div>
                  </td>
                  <td><span className={`badge ${u.role === 'Super Admin' ? 'badge-danger' : 'badge-primary'}`}>{u.role}</span></td>
                  <td><div style={{ fontSize: 13 }}>{formatDate(u.last_login)}</div></td>
                  <td>
                    <span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                      {currentUser?.id !== u.id && u.role !== 'Super Admin' && (
                        <button 
                          className={`btn ${u.status === 'Active' ? 'btn-warning' : 'btn-success'} btn-sm`} 
                          onClick={() => toggleStatus(u)}
                          title={u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        >
                          {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
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
                  <input className="input" value={form.username||''} onChange={set('username')} disabled={modal !== 'add'} placeholder="Auto-generated if left blank" />
                </div>
                <div className="input-group">
                  <label>Email *</label>
                  <input className="input" type="email" value={form.email||''} onChange={set('email')} placeholder="email@example.com" />
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
                  <select 
                    className="input" 
                    value={form.role||''} 
                    onChange={set('role')}
                    disabled={modal !== 'add' && modal.role === 'Super Admin'}
                  >
                    {['End_User', 'Entity', 'Admin', 'Super Admin'].filter(r => currentUser?.role === 'Super Admin' || r !== 'Super Admin').map(r => 
                      <option key={r} value={r}>{r}</option>
                    )}
                  </select>
                  {modal !== 'add' && modal.role === 'Super Admin' && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Role cannot be changed for Super Admin accounts.</p>
                  )}
                </div>
                <div className="input-group">
                  <label>Phone / Mobile</label>
                  <input className="input" value={form.mobile_1||form.phone||''} onChange={set('mobile_1')} />
                </div>
              </div>

              {form.role === 'Entity' && (
                <div className="input-group">
                  <label>Map to Entity *</label>
                  <select className="input" value={form.entity_id||''} onChange={set('entity_id')}>
                    <option value="">-- Select Entity --</option>
                    {availableEntities.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.city})</option>
                    ))}
                  </select>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Note: User must be mapped to be activated.
                  </p>
                </div>
              )}

              <div className="input-group">
                <label>{modal === 'add' ? 'Password *' : 'New Password (leave blank to keep current)'}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="input" 
                    type={showPass ? 'text' : 'password'} 
                    value={form.password||''} 
                    onChange={set('password')} 
                    style={{ paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    {showPass ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Status</label>
                <select className="input" value={form.status||'Active'} onChange={set('status')}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
