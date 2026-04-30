import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const AllBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const loadBookings = () => {
    setLoading(true)
    api.get('/bookings', { params: { limit: 100 } })
      .then(r => setBookings(r.data.data))
      .catch(() => toast.error('Failed to load bookings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBookings()
  }, [])

  return (
    <Layout>
      <div className="page-header">
        <h1>🎟️ All Bookings</h1>
        <p>Global view of all portal bookings</p>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎟️</div>
          <h3>No bookings found</h3>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Property</th>
                  <th>Guest</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Guests</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-primary)' }}>{b.booking_ref}</span></td>
                    <td style={{ fontWeight: 600 }}>{b.property?.name}</td>
                    <td>
                      <div>{b.user?.first_name || b.user?.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.user?.email}</div>
                    </td>
                    <td>{b.booking_date}</td>
                    <td><span className="badge badge-muted">{b.booking_type?.replace('_',' ')}</span></td>
                    <td>{b.num_guests}</td>
                    <td style={{ fontWeight: 600 }}>₹{b.total_amount}</td>
                    <td>
                      <span className={`badge ${b.booking_status === 'confirmed' ? 'badge-success' : b.booking_status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
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

export default AllBookings
