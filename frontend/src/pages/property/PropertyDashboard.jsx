import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const EntityDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/property').then(r => setData(r.data.data)).catch(() => toast.error('Failed to load dashboard.')).finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>
  if (!data) return <Layout><div className="empty-state"><h3>Dashboard unavailable</h3></div></Layout>

  const { stats, recent_bookings, guest_list, upcoming_events, revenue_chart } = data
  const chartData = (revenue_chart || []).map(r => ({ month: new Date(r.month).toLocaleDateString('en',{month:'short',year:'2-digit'}), revenue: parseFloat(r.revenue || 0), bookings: parseInt(r.bookings || 0) }))

  return (
    <Layout>
      <div className="page-header"><h1>📊 Entity Dashboard</h1><p>{data.entity?.name} — Performance Overview</p></div>

      <div className="stats-grid">
        {[
          { icon: '🎟️', bg: 'rgba(108,99,255,0.15)', val: stats.total_bookings, label: 'Total Bookings' },
          { icon: '📅', bg: 'rgba(34,197,94,0.15)', val: stats.this_month_bookings, label: 'This Month' },
          { icon: '💰', bg: 'rgba(245,158,11,0.15)', val: `₹${stats.total_revenue}`, label: 'Total Revenue' },
          { icon: '📈', bg: 'rgba(59,130,246,0.15)', val: `₹${stats.this_month_revenue}`, label: 'Month Revenue' },
          { icon: '🏷️', bg: 'rgba(239,68,68,0.15)', val: `${stats.commission_percent}%`, label: 'Portal Commission' },
          { icon: '💸', bg: 'rgba(168,85,247,0.15)', val: `₹${stats.commission_this_month}`, label: 'Commission (Month)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Revenue Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📈 Revenue Trend (6 Months)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#6060a0" fontSize={12} />
                <YAxis stroke="#6060a0" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1e1f35', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="#6c63ff" radius={[6,6,0,0]} name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🎭 Upcoming Events</h3>
          {upcoming_events?.length > 0 ? upcoming_events.map(ev => (
            <div key={ev.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 24 }}>🎭</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ev.event_date} · {ev.total_capacity - ev.booked_count} seats left</div>
              </div>
            </div>
          )) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No upcoming events</p>}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>🎟️ Recent Bookings</h3>
        {recent_bookings?.length > 0 ? (
          <div className="table-wrap"><table>
            <thead><tr><th>Ref</th><th>Guest</th><th>Type</th><th>Date</th><th>Guests</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>{recent_bookings.map(b => (
              <tr key={b.id}>
                <td><span style={{ fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 600 }}>{b.booking_ref}</span></td>
                <td>{b.user?.first_name || b.user?.username}</td>
                <td><span className="badge badge-muted">{b.booking_type?.replace('_',' ')}</span></td>
                <td>{b.booking_date}</td>
                <td>{b.num_guests}</td>
                <td style={{ fontWeight: 600 }}>₹{b.total_amount}</td>
                <td><span className={`badge ${b.booking_status==='confirmed'?'badge-success':b.booking_status==='cancelled'?'badge-danger':'badge-muted'}`}>{b.booking_status}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p style={{ color: 'var(--text-muted)' }}>No bookings yet</p>}
      </div>

      {/* Guest List */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>👥 Upcoming Guest List</h3>
        {guest_list?.length > 0 ? (
          <div className="table-wrap"><table>
            <thead><tr><th>Guest</th><th>Phone</th><th>Email</th><th>Date</th><th>Guests</th></tr></thead>
            <tbody>{guest_list.map(b => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600 }}>{b.user?.first_name} {b.user?.last_name}</td>
                <td>{b.user?.phone || '—'}</td>
                <td>{b.user?.email}</td>
                <td>{b.booking_date}</td>
                <td>{b.num_guests}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p style={{ color: 'var(--text-muted)' }}>No upcoming guests</p>}
      </div>
    </Layout>
  )
}

export default EntityDashboard
