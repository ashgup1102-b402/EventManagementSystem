import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/admin').then(r => setData(r.data.data)).catch(() => toast.error('Failed to load dashboard.')).finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>
  if (!data) return <Layout><div className="empty-state"><h3>Dashboard unavailable</h3></div></Layout>

  const { stats, recent_bookings, top_properties } = data

  return (
    <Layout>
      <div className="page-header"><h1>📊 Admin Dashboard</h1><p>Portal performance and metrics</p></div>

      <div className="stats-grid">
        {[
          { icon: '🏢', bg: 'rgba(108,99,255,0.15)', val: stats.total_properties, label: 'Total Properties' },
          { icon: '👥', bg: 'rgba(34,197,94,0.15)', val: stats.total_users, label: 'Total End Users' },
          { icon: '🎟️', bg: 'rgba(245,158,11,0.15)', val: stats.total_bookings, label: 'Total Bookings' },
          { icon: '💰', bg: 'rgba(59,130,246,0.15)', val: `₹${stats.total_revenue}`, label: 'Total Platform Revenue' },
          { icon: '📈', bg: 'rgba(239,68,68,0.15)', val: `₹${stats.month_revenue}`, label: 'Month Revenue' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🎟️ Recent Platform Bookings</h3>
          {recent_bookings?.length > 0 ? (
            <div className="table-wrap"><table>
              <thead><tr><th>Property</th><th>Guest</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{recent_bookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.property?.name}</td>
                  <td>{b.user?.first_name || b.user?.username}</td>
                  <td style={{ fontWeight: 600 }}>₹{b.total_amount}</td>
                  <td><span className={`badge ${b.booking_status==='confirmed'?'badge-success':b.booking_status==='cancelled'?'badge-danger':'badge-muted'}`}>{b.booking_status}</span></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p style={{ color: 'var(--text-muted)' }}>No bookings yet</p>}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🏆 Top Properties</h3>
          {top_properties?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {top_properties.map((p, i) => (
                <div key={p.property_id} style={{ display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-muted)', width: 24 }}>#{i+1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.property?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.bookings} bookings</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>₹{p.revenue}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-muted)' }}>No data</p>}
        </div>
      </div>
    </Layout>
  )
}
export default AdminDashboard
