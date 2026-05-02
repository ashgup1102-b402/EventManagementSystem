import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import moment from 'moment'

const EntityBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', type: '', search: '' })

  const loadBookings = () => {
    setLoading(true)
    api.get('/bookings', { params: { limit: 200 } })
      .then(r => setBookings(r.data.data))
      .catch(() => toast.error('Failed to load bookings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const filtered = bookings.filter(b => {
    const matchesStatus = filter.status ? b.booking_status === filter.status : true
    const matchesType = filter.type ? b.booking_type === filter.type : true
    const searchLower = filter.search.toLowerCase()
    const matchesSearch = filter.search ? (
      b.booking_ref.toLowerCase().includes(searchLower) ||
      (b.user?.first_name || b.user?.username || '').toLowerCase().includes(searchLower) ||
      (b.user?.email || '').toLowerCase().includes(searchLower)
    ) : true
    return matchesStatus && matchesType && matchesSearch
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return 'badge-success'
      case 'cancelled': return 'badge-danger'
      case 'open': return 'badge-primary'
      case 'on_hold': return 'badge-warning'
      case 'completed': return 'badge-secondary'
      default: return 'badge-muted'
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>🎟️ Bookings Management</h1>
          <p>View and manage all bookings for your property</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: 10 }}>
          <input 
            type="text" 
            className="input" 
            placeholder="Search ref or guest..." 
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            style={{ width: 200 }}
          />
          <select className="input" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="confirmed">Confirmed</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="input" value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            <option value="event_ticket">Event</option>
            <option value="table_reservation">Table/Slot</option>
          </select>
          <button className="btn btn-secondary" onClick={loadBookings}>🔄 Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎟️</div>
          <h3>No bookings found</h3>
          <p className="text-muted">Adjust your filters or search criteria.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Guest Details</th>
                  <th>Type</th>
                  <th>Event / Slot</th>
                  <th>Booking Date</th>
                  <th>Guests</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td>
                      <code style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: 13 }}>{b.booking_ref}</code>
                      <div style={{ fontSize: 10, opacity: 0.6 }}>{moment(b.createdAt).format('DD MMM, HH:mm')}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.user ? `${b.user.first_name} ${b.user.last_name}`.trim() || b.user.username : b.guest_name}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{b.user?.email || b.guest_email}</div>
                    </td>
                    <td><span className="badge badge-light">{b.booking_type?.replace('_',' ')}</span></td>
                    <td>
                      <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                        {b.event?.name || b.slot?.slot_name || '—'}
                      </div>
                    </td>
                    <td>{b.booking_date}</td>
                    <td style={{ textAlign: 'center' }}>{b.num_guests}</td>
                    <td style={{ fontWeight: 700 }}>₹{parseFloat(b.total_amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(b.booking_status)}`}>
                        {b.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default EntityBookings
