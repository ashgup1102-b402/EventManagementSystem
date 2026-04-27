import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/superadmin').then(r => setData(r.data.data)).catch(() => toast.error('Failed to load dashboard.')).finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>
  if (!data) return <Layout><div className="empty-state"><h3>Dashboard unavailable</h3></div></Layout>

  const { stats, audit_logs } = data

  return (
    <Layout>
      <div className="page-header"><h1>🌐 Super Admin Dashboard</h1><p>System-wide overview and audit</p></div>

      <div className="stats-grid">
        {[
          { icon: '🏢', bg: 'rgba(108,99,255,0.15)', val: stats.total_properties, label: 'Properties' },
          { icon: '👥', bg: 'rgba(34,197,94,0.15)', val: stats.total_users, label: 'Users' },
          { icon: '🎟️', bg: 'rgba(245,158,11,0.15)', val: stats.total_bookings, label: 'Bookings' },
          { icon: '💰', bg: 'rgba(59,130,246,0.15)', val: `₹${stats.total_revenue}`, label: 'Total Revenue' },
          { icon: '💎', bg: 'rgba(168,85,247,0.15)', val: `₹${stats.total_commission}`, label: 'Platform Profit' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>📋 Recent System Audit Logs</h3>
        {audit_logs?.length > 0 ? (
          <div className="table-wrap"><table>
            <thead><tr><th>Time</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th></tr></thead>
            <tbody>{audit_logs.map(log => (
              <tr key={log.id}>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(log.created_at).toLocaleString()}</td>
                <td style={{ fontWeight: 600 }}>{log.user?.username}</td>
                <td><span className="badge badge-primary">{log.user?.role?.replace('_',' ')}</span></td>
                <td><span className="badge badge-muted">{log.action}</span></td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p style={{ color: 'var(--text-muted)' }}>No audit logs</p>}
      </div>
    </Layout>
  )
}
export default SuperAdminDashboard
