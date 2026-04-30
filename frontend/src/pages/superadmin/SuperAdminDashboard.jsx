import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Purge State
  const [purgeFrom, setPurgeFrom] = useState('')
  const [purgeTo, setPurgeTo] = useState('')
  const [purging, setPurging] = useState(false)

  const loadDashboard = () => {
    setLoading(true)
    api.get('/dashboard/superadmin')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handlePurge = async () => {
    if (!purgeFrom || !purgeTo) {
      return toast.error('Please select both From and To dates for purging.')
    }
    setPurging(true)
    try {
      // Step 1: Get count (dry run)
      const countRes = await api.post('/dashboard/audit/purge', { from_date: purgeFrom, to_date: purgeTo, dry_run: true })
      const count = countRes.data?.data?.count || 0
      
      if (count === 0) {
        toast('No records found in this date range.', { icon: 'ℹ️' })
        setPurging(false)
        return
      }

      // Step 2: Confirm
      const confirmed = window.confirm(`Do you really want to purge data? \n\n${count} records will be deleted from ${purgeFrom} till ${purgeTo}.`)
      if (!confirmed) {
        setPurging(false)
        return
      }

      // Step 3: Delete
      await api.post('/dashboard/audit/purge', { from_date: purgeFrom, to_date: purgeTo, dry_run: false })
      toast.success(`Successfully purged ${count} audit logs.`)
      
      // Reset and reload
      setPurgeFrom('')
      setPurgeTo('')
      loadDashboard()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to purge audit logs.')
    } finally {
      setPurging(false)
    }
  }

  const formatTooltip = (log) => {
    let text = `ACTION: ${log.action.toUpperCase()}\n`;
    text += `ENTITY: ${log.entity_type} (${log.entity_id || 'N/A'})\n`;
    text += `-----------------------------------\n`;
    
    if (log.old_values && Object.keys(log.old_values).length > 0) {
      text += `OLD DATA:\n${JSON.stringify(log.old_values, null, 2)}\n\n`;
    }
    if (log.new_values && Object.keys(log.new_values).length > 0) {
      text += `NEW DATA:\n${JSON.stringify(log.new_values, null, 2)}`;
    }
    return text.trim();
  }

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>
  if (!data) return <Layout><div className="empty-state"><h3>Dashboard unavailable</h3></div></Layout>

  const { stats, audit_logs } = data

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>🌐 Super Admin Dashboard</h1>
            <p>System-wide overview and audit</p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(108,99,255,0.05)', padding: '12px 20px', borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: 4 }}>Purge Audit Logs</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input 
                  type="date" 
                  className="input" 
                  style={{ padding: '6px 10px', minWidth: 140, height: 36 }} 
                  value={purgeFrom} 
                  onChange={e => setPurgeFrom(e.target.value)} 
                  title="From Date"
                />
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
                <input 
                  type="date" 
                  className="input" 
                  style={{ padding: '6px 10px', minWidth: 140, height: 36 }} 
                  value={purgeTo} 
                  onChange={e => setPurgeTo(e.target.value)} 
                  title="To Date"
                />
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={handlePurge} 
                  disabled={purging || !purgeFrom || !purgeTo}
                  style={{ height: 36, padding: '0 16px' }}
                >
                  {purging ? '⏳' : 'Purge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>📋 Recent System Audit Logs</h3>
        </div>

        {audit_logs?.length > 0 ? (
          <div className="table-wrap"><table>
            <thead><tr><th>Date & Time</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th></tr></thead>
            <tbody>{audit_logs.map(log => {
              const logDate = log.created_at || log.createdAt;
              const dateObj = new Date(logDate);
              const formattedDate = !isNaN(dateObj) ? dateObj.toLocaleString('en-IN', { 
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
              }).replace(',', '') : 'Unknown Date';
              return (
              <tr key={log.id}>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formattedDate}</td>
                <td style={{ fontWeight: 600 }}>{log.user?.username}</td>
                <td><span className="badge badge-primary">{log.user?.role?.replace('_',' ')}</span></td>
                <td title={formatTooltip(log)} style={{ cursor: 'help' }}>
                  <span className="badge badge-muted" style={{ borderBottom: '1px dotted #888' }}>{log.action}</span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{log.entity_type} {log.entity_id ? `#${log.entity_id.substring(0,8)}...` : ''}</td>
              </tr>
            )})}</tbody>
          </table></div>
        ) : <p style={{ color: 'var(--text-muted)' }}>No audit logs</p>}
      </div>
    </Layout>
  )
}
export default SuperAdminDashboard
