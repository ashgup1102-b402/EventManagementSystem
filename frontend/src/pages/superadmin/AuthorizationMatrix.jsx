import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const SCREENS = [
  'Dashboard', 'Entity Management', 'User Management', 'Booking Management', 
  'Event Management', 'Menu Management', 'Slot Management', 'Discount Management',
  'Promotions', 'SMTP Settings', 'Business Rules', 'System Configuration', 'Audit Logs',
  'Role Management', 'Authorization', 'Category Management',
  'Event Types', 'Performers', 'Menu Categories', 'Cuisine Types'
]

const PERMISSIONS = ['None', 'Read Only', 'Read and Edit', 'Full Access']

const AuthorizationMatrix = () => {
  const { user: currentUser } = useAuth()
  const [roles, setRoles] = useState([])
  const [auths, setAuths] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [rRes, aRes] = await Promise.all([
        api.get('/auth/roles'),
        api.get('/auth/authorizations')
      ])
      setRoles(rRes.data.data)
      setAuths(aRes.data.data)
    } catch (err) { toast.error('Failed to load authorization data.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const getPerm = (role, screen) => {
    const found = auths.find(a => a.role_name === role && a.screen_name === screen)
    return found ? found.permission : 'None'
  }

  const updatePerm = (role, screen, perm) => {
    const newAuths = [...auths]
    const idx = newAuths.findIndex(a => a.role_name === role && a.screen_name === screen)
    if (idx > -1) {
      newAuths[idx].permission = perm
    } else {
      newAuths.push({ role_name: role, screen_name: screen, permission: perm })
    }
    setAuths(newAuths)
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      await api.post('/auth/authorizations/bulk', { authorizations: auths })
      toast.success('Authorization matrix updated!')
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to save changes.') 
    }
    finally { setSaving(false) }
  }

  if (loading) return <Layout><div className="spinner" /></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>🔐 Authorization Matrix</h1>
            <p>Define access levels for each role across system screens</p>
          </div>
          <button className="btn btn-primary" onClick={saveAll} disabled={saving}>{saving ? 'Saving...' : 'Save Matrix'}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 10 }}>Screen \ Role</th>
                {roles.map(r => <th key={r.id} className="text-center">{r.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {SCREENS.map(screen => (
                <tr key={screen}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--bg-card)', fontWeight: 600, zIndex: 5 }}>{screen}</td>
                  {roles.map(role => {
                    const isProtected = role.name === 'Super Admin' || (currentUser.role !== 'Super Admin' && role.name === 'Admin');
                    return (
                      <td key={role.id} className="text-center">
                        <select 
                          className="input input-sm" 
                          value={getPerm(role.name, screen)} 
                          onChange={e => updatePerm(role.name, screen, e.target.value)}
                          style={{ width: 'auto', minWidth: 120, opacity: (role.status === 'Inactive' || isProtected) ? 0.6 : 1 }}
                          disabled={role.status === 'Inactive' || isProtected}
                        >
                          {PERMISSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default AuthorizationMatrix
