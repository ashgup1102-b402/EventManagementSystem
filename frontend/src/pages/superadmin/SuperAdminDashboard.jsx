import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  
  // Purge State
  const [purgeFrom, setPurgeFrom] = useState('')
  const [purgeTo, setPurgeTo] = useState('')
  const [purging, setPurging] = useState(false)

  const loadDashboard = () => {
    setLoading(true)
    const params = {}
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate

    api.get('/dashboard/superadmin', { params })
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
  }, [fromDate, toDate])

  const handlePurge = async () => {
    if (!purgeFrom || !purgeTo) return toast.error('Please select both From and To dates for purging.')
    setPurging(true)
    try {
      const countRes = await api.post('/dashboard/audit/purge', { from_date: purgeFrom, to_date: purgeTo, dry_run: true })
      const count = countRes.data?.data?.count || 0
      if (count === 0) { toast('No records found.', { icon: 'ℹ️' }); setPurging(false); return; }
      if (!window.confirm(`Purge ${count} records?`)) { setPurging(false); return; }
      await api.post('/dashboard/audit/purge', { from_date: purgeFrom, to_date: purgeTo, dry_run: false })
      toast.success(`Purged ${count} logs.`)
      setPurgeFrom(''); setPurgeTo(''); loadDashboard()
    } catch (err) { toast.error('Purge failed.') } finally { setPurging(false) }
  }

  if (loading && !data) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>
  if (!data) return <Layout><div className="empty-state"><h3>Dashboard unavailable</h3></div></Layout>

  const { stats, entity_panel, booking_panel } = data

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>🌐 Super Admin Dashboard</h1>
            <p>System-wide Entity & Booking Overview</p>
          </div>
          
          <div className="header-actions" style={{ display: 'flex', gap: 20 }}>
            {/* Global Date Filters */}
            <div className="filter-group-alt">
              <span className="filter-label">Filter Data</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" className="input input-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                <span className="to-text">to</span>
                <input type="date" className="input input-sm" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </div>

            {/* Purge Controls */}
            <div className="filter-group-alt highlight">
              <span className="filter-label">Purge Logs</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" className="input input-sm" value={purgeFrom} onChange={e => setPurgeFrom(e.target.value)} />
                <input type="date" className="input input-sm" value={purgeTo} onChange={e => setPurgeTo(e.target.value)} />
                <button className="btn btn-danger btn-sm" onClick={handlePurge} disabled={purging}>{purging ? '...' : 'Purge'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid stats-grid-enhanced">
        {/* Entity Tile */}
        <div className="stat-card">
          <Link to="/admin/entities" className="stat-link-overlay" />
          <div className="stat-main">
            <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.1)' }}>🏢</div>
            <div className="stat-info">
              <div className="stat-value">{stats.entities.total}</div>
              <div className="stat-label">Total Entities</div>
            </div>
          </div>
          <div className="stat-split">
            <Link to="/admin/entities?status=Active" className="split-item text-success">Active: {stats.entities.active}</Link>
            <Link to="/admin/entities?status=Inactive" className="split-item text-danger">Inactive: {stats.entities.inactive}</Link>
          </div>
        </div>

        {/* User Tile */}
        <div className="stat-card">
          <Link to="/admin/users" className="stat-link-overlay" />
          <div className="stat-main">
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>👥</div>
            <div className="stat-info">
              <div className="stat-value">{stats.users.total}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          <div className="stat-split">
            <Link to="/admin/users?status=Active" className="split-item text-success">Active: {stats.users.active}</Link>
            <Link to="/admin/users?status=Inactive" className="split-item text-danger">Inactive: {stats.users.inactive}</Link>
          </div>
        </div>

        {/* Booking Tile */}
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <Link to="/admin/bookings" className="stat-link-overlay" />
          <div className="stat-main">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>🎟️</div>
            <div className="stat-info">
              <div className="stat-value">{stats.bookings.total} <span className="stat-sub">(₹{stats.bookings.amount})</span></div>
              <div className="stat-label">Total Bookings</div>
            </div>
          </div>
          <div className="stat-split wrap">
            <Link to="/admin/bookings?status=open" className="split-item">Open: {stats.bookings.open}</Link>
            <Link to="/admin/bookings?status=on_hold" className="split-item">On Hold: {stats.bookings.on_hold}</Link>
            <Link to="/admin/bookings?status=completed" className="split-item text-success">Completed: {stats.bookings.completed}</Link>
            <Link to="/admin/bookings?status=cancelled" className="split-item text-danger">Cancelled: {stats.bookings.cancelled}</Link>
          </div>
        </div>
      </div>

      <div className="dashboard-panels">
        {/* Entity Panel */}
        <div className="card panel-card">
          <div className="panel-header">
            <h3>🏢 Recent Entities</h3>
            <Link to="/admin/entities" className="btn btn-ghost btn-xs">View All</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Entity Name</th><th>Code</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {entity_panel.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td><code className="code-tag">{e.entity_code}</code></td>
                    <td><span className={`badge badge-${e.status === 'Active' ? 'success' : 'danger'}`}>{e.status}</span></td>
                    <td className="text-muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Booking Panel */}
        <div className="card panel-card">
          <div className="panel-header">
            <h3>🎟️ Recent Bookings</h3>
            <Link to="/admin/bookings" className="btn btn-ghost btn-xs">View All</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ref</th><th>Entity</th><th>Status</th><th>Event Date</th></tr></thead>
              <tbody>
                {booking_panel.map(b => (
                  <tr key={b.id}>
                    <td>{b.booking_ref}</td>
                    <td>{b.entity?.name}</td>
                    <td><span className={`badge badge-booking-${b.booking_status}`}>{b.booking_status}</span></td>
                    <td>{new Date(b.booking_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
export default SuperAdminDashboard
