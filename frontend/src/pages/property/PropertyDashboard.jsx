import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import './PropertyDashboard.css'

const EntityDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard/property')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>
  if (!data) return <Layout><div className="empty-state"><h3>Dashboard unavailable</h3></div></Layout>

  const { row1, row2, row3, recent_bookings, guest_list, upcoming_events, revenue_chart } = data
  const chartData = (revenue_chart || []).map(r => ({ 
    month: new Date(r.month).toLocaleDateString('en', { month: 'short', year: '2-digit' }), 
    revenue: parseFloat(r.revenue || 0), 
    bookings: parseInt(r.bookings || 0) 
  }))

  const Tile = ({ icon, label, value, color, onClick, subValue }) => (
    <div className={`dashboard-tile ${onClick ? 'clickable' : ''}`} onClick={onClick} style={{ borderColor: color ? `${color}44` : '' }}>
      <div className="tile-icon" style={{ backgroundColor: color ? `${color}15` : '', color: color }}>{icon}</div>
      <div className="tile-content">
        <div className="tile-label">{label}</div>
        <div className="tile-value">{value}</div>
        {subValue && <div className="tile-sub">{subValue}</div>}
      </div>
    </div>
  )

  const HealthTile = ({ icon, label, active, inactive, color, path, filterType = 'status' }) => (
    <div className="health-tile">
      <div className="health-header">
        <span className="health-icon" style={{ backgroundColor: `${color}15`, color }}>{icon}</span>
        <span className="health-label">{label}</span>
      </div>
      <div className="health-body">
        <div className="health-stat active" onClick={() => navigate(`${path}?${filterType}=${filterType === 'is_active' ? 'true' : 'Active'}`)}>
          <span className="dot"></span>
          <span className="count">{active}</span>
          <span className="txt">Active</span>
        </div>
        <div className="health-stat inactive" onClick={() => navigate(`${path}?${filterType}=${filterType === 'is_active' ? 'false' : 'Inactive'}`)}>
          <span className="dot"></span>
          <span className="count">{inactive}</span>
          <span className="txt">Inactive</span>
        </div>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="dashboard-header">
        <div>
          <h1>📊 Entity Dashboard</h1>
          <p className="text-muted">{data.entity?.name} — Operational Intelligence</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/entity/bookings')}>View All Bookings</button>
        </div>
      </div>

      {/* Row 1: Booking Status */}
      <div className="tile-row row-4">
        <Tile icon="✅" label="Booking Closed" value={row1.completed} color="#10b981" />
        <Tile icon="🔔" label="Booking Open" value={row1.open} color="#3b82f6" />
        <Tile icon="⏳" label="On Hold" value={row1.on_hold} color="#f59e0b" />
        <Tile icon="❌" label="Cancelled" value={row1.cancelled} color="#ef4444" />
      </div>

      {/* Row 2: Financial / Usage */}
      <div className="tile-row row-5 mt-3">
        <Tile icon="👥" label="Total Guests" value={row2.total_guests} color="#6366f1" onClick={() => navigate('/entity/guests')} />
        <Tile icon="💰" label="Total Revenue" value={`₹${row2.total_revenue}`} color="#8b5cf6" />
        <Tile icon="📈" label="Monthly Revenue" value={`₹${row2.monthly_revenue}`} color="#ec4899" />
        <Tile icon="🏷️" label="Platform Comm." value={`₹${row2.platform_commission}`} color="#f43f5e" subValue={`Rate: ${data.entity?.portal_commission_percent}%`} />
        <Tile icon="💸" label="Monthly Comm." value={`₹${row2.monthly_commission}`} color="#f97316" />
      </div>

      {/* Row 3: Module Health */}
      <div className="tile-row row-5 mt-3">
        <HealthTile icon="🍽️" label="Menu" active={row3.menu.active} inactive={row3.menu.inactive} color="#10b981" path="/entity/menu" />
        <HealthTile icon="🎭" label="Events" active={row3.events.active} inactive={row3.events.inactive} color="#3b82f6" path="/entity/events" />
        <HealthTile icon="📅" label="Slots" active={row3.slots.active} inactive={row3.slots.inactive} color="#8b5cf6" path="/entity/slots" filterType="is_active" />
        <HealthTile icon="🏷️" label="Discounts" active={row3.discounts.active} inactive={row3.discounts.inactive} color="#f59e0b" path="/entity/discounts" filterType="is_active" />
        <HealthTile icon="🎁" label="Promotions" active={row3.promotions.active} inactive={row3.promotions.inactive} color="#ec4899" path="/entity/discounts" filterType="is_active" />
      </div>

      <div className="dashboard-grid mt-4">
        {/* Revenue Trend */}
        <div className="card compact">
          <div className="card-header"><h3>📈 Revenue Trend (6 Months)</h3></div>
          <div className="card-body">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#6060a0" fontSize={11} />
                  <YAxis stroke="#6060a0" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#1e1f35', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 8 }} />
                  <Bar dataKey="revenue" fill="#6c63ff" radius={[4,4,0,0]} name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state-sm"><p>No data yet</p></div>}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card compact">
          <div className="card-header"><h3>🎭 Upcoming Events</h3></div>
          <div className="card-body scroll-y" style={{ maxHeight: 220 }}>
            {upcoming_events?.length > 0 ? upcoming_events.map(ev => (
              <div key={ev.id} className="list-item">
                <div className="item-icon">🎭</div>
                <div className="item-details">
                  <div className="item-title">{ev.name}</div>
                  <div className="item-meta">{ev.event_date} · {ev.total_capacity - ev.booked_count} left</div>
                </div>
              </div>
            )) : <p className="text-muted text-xs">No upcoming events</p>}
          </div>
        </div>

        {/* Top Guests */}
        <div className="card compact">
          <div className="card-header" style={{ display:'flex', justifyContent:'space-between' }}>
            <h3>👥 Top Guests</h3>
            <button className="btn-link" onClick={() => navigate('/entity/guests')}>View All</button>
          </div>
          <div className="card-body scroll-y" style={{ maxHeight: 220 }}>
            {guest_list?.length > 0 ? guest_list.map((g, i) => (
              <div key={i} className="list-item">
                <div className="item-icon">👤</div>
                <div className="item-details">
                  <div className="item-title">{g.name}</div>
                  <div className="item-meta">{g.bookings} Bookings · ₹{parseFloat(g.spend).toLocaleString()}</div>
                </div>
              </div>
            )) : <p className="text-muted text-xs">No guest history yet</p>}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card compact mt-4">
        <div className="card-header"><h3>🎟️ Recent Activity</h3></div>
        <div className="card-body">
          {recent_bookings?.length > 0 ? (
            <div className="table-wrap">
              <table className="table-sm">
                <thead><tr><th>Ref</th><th>Guest</th><th>Type</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>{recent_bookings.map(b => (
                  <tr key={b.id}>
                    <td><code>{b.booking_ref}</code></td>
                    <td>{b.user?.first_name || b.user?.username}</td>
                    <td><span className="badge badge-muted">{b.booking_type?.replace('_',' ')}</span></td>
                    <td>{b.booking_date}</td>
                    <td className="fw-600">₹{b.total_amount}</td>
                    <td><span className={`badge ${b.booking_status==='confirmed'?'badge-success':b.booking_status==='cancelled'?'badge-danger':'badge-muted'}`}>{b.booking_status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="text-muted text-sm">No recent bookings</p>}
        </div>
      </div>
    </Layout>
  )
}

export default EntityDashboard
