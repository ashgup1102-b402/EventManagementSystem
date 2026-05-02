import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'
import moment from 'moment'

const GuestList = () => {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      const res = await api.get('/bookings/guests')
      setGuests(res.data.data)
    } catch (err) {
      toast.error('Failed to load guest list.')
    } finally {
      setLoading(false)
    }
  }

  const filteredGuests = guests.filter(g => 
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.email?.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search)
  )

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>👥 Guest List</h1>
          <p>View all guests who have booked at your property and their history.</p>
        </div>
        <div className="header-actions">
          <input 
            type="text" 
            className="input" 
            placeholder="Search guests..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filteredGuests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No guests found</h3>
          <p className="text-muted">Once guests start booking, they will appear here.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Guest Details</th>
                <th>Status</th>
                <th>Total Bookings</th>
                <th>Total Spend</th>
                <th>Last Booking</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map(g => (
                <tr key={g.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{g.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{g.email} · {g.phone}</div>
                  </td>
                  <td>
                    <span className={`badge ${g.is_registered ? 'badge-success' : 'badge-muted'}`}>
                      {g.is_registered ? 'Registered' : 'Guest'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, textAlign: 'center' }}>{g.total_bookings}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>₹{g.total_spend.toLocaleString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{g.last_booking_date}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{g.last_booking_type?.replace('_', ' ')} · {g.last_booking_ref}</div>
                  </td>
                  <td>
                    <div className="badge badge-light" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {g.last_booking_target}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}

export default GuestList
