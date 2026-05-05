import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import './AuditLogs.css'

const AuditLogs = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    startDate: '',
    endDate: ''
  })

  const fetchLogs = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/audit', {
        params: { ...filters, page }
      })
      if (data.success) {
        setLogs(data.data)
        setPagination(data.pagination)
      }
    } catch (err) {
      toast.error('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
  }, [filters])

  const getBadgeClass = (action) => {
    if (action.includes('LOGIN')) return 'badge-login'
    if (action.includes('CREATE')) return 'badge-create'
    if (action.includes('UPDATE')) return 'badge-update'
    if (action.includes('DELETE')) return 'badge-delete'
    return 'badge-default'
  }

  return (
    <div className="audit-logs-container fade-in">
      <div className="audit-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/superadmin/dashboard')}>
            ← Dashboard
          </button>
          <h1 className="audit-title">System Audit Logs</h1>
        </div>
        <button className="btn btn-primary" onClick={() => fetchLogs(pagination.page)}>
          🔄 Refresh
        </button>
      </div>

      <div className="audit-filters">
        <div className="filter-item">
          <label>Action</label>
          <input 
            type="text" className="filter-input" placeholder="e.g. LOGIN, UPDATE"
            value={filters.action}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          />
        </div>
        <div className="filter-item">
          <label>Entity Type</label>
          <select 
            className="filter-input"
            value={filters.entity_type}
            onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))}
          >
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="Entity">Entity</option>
            <option value="Booking">Booking</option>
            <option value="Event">Event</option>
            <option value="MenuItem">MenuItem</option>
          </select>
        </div>
        <div className="filter-item">
          <label>From Date</label>
          <input 
            type="date" className="filter-input"
            value={filters.startDate}
            onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
          />
        </div>
        <div className="filter-item">
          <label>To Date</label>
          <input 
            type="date" className="filter-input"
            value={filters.endDate}
            onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="audit-table-wrap">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <p>Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No audit logs found matching filters.</p>
          </div>
        ) : (
          <table className="audit-table">
            <thead>
                <tr>
                <th style={{ width: '120px' }}>Timestamp</th>
                <th style={{ width: '120px' }}>User</th>
                <th style={{ width: '100px' }}>Action</th>
                <th style={{ width: '100px' }}>Entity</th>
                <th style={{ width: '120px' }}>Field</th>
                <th style={{ width: '150px' }}>Old Value</th>
                <th style={{ width: '150px' }}>New Value</th>
                <th style={{ width: '100px' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.createdAt ? format(new Date(log.createdAt), 'MMM dd, yyyy') : 'N/A'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{log.createdAt ? format(new Date(log.createdAt), 'HH:mm:ss') : ''}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.user?.username || 'System'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{log.user?.role}</div>
                  </td>
                  <td>
                    <span className={`action-badge ${getBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{log.entity_type}</div>
                  </td>
                  <td className="change-cell">
                    {(() => {
                      const changedKeys = Object.keys(log.new_values || {}).filter(key => 
                        String(log.old_values?.[key] ?? '') !== String(log.new_values?.[key] ?? '')
                      );
                      return changedKeys.length > 0 ? changedKeys.map(key => (
                        <div key={key} className="change-item">{key}</div>
                      )) : <span className="text-muted">-</span>;
                    })()}
                  </td>
                  <td className="change-cell">
                    {(() => {
                      const changedKeys = Object.keys(log.new_values || {}).filter(key => 
                        String(log.old_values?.[key] ?? '') !== String(log.new_values?.[key] ?? '')
                      );
                      return changedKeys.length > 0 ? changedKeys.map(key => (
                        <div key={key} className="change-item truncate" title={String(log.old_values?.[key])}>
                          {String(log.old_values?.[key] ?? '-')}
                        </div>
                      )) : <span className="text-muted">-</span>;
                    })()}
                  </td>
                  <td className="change-cell">
                    {(() => {
                      const changedKeys = Object.keys(log.new_values || {}).filter(key => 
                        String(log.old_values?.[key] ?? '') !== String(log.new_values?.[key] ?? '')
                      );
                      return changedKeys.length > 0 ? changedKeys.map(key => (
                        <div key={key} className="change-item truncate" title={String(log.new_values?.[key])}>
                          {String(log.new_values?.[key] ?? '-')}
                        </div>
                      )) : <span className="text-muted">-</span>;
                    })()}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn" 
              disabled={pagination.page === 1}
              onClick={() => fetchLogs(pagination.page - 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: 14, color: '#64748b' }}>
              Page <strong>{pagination.page}</strong> of {pagination.totalPages}
            </span>
            <button 
              className="page-btn" 
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogs
