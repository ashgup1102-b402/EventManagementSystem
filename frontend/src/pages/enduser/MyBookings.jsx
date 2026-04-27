import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Layout from '../../components/Layout'
import toast from 'react-hot-toast'

const STATUS_COLOR = { confirmed:'badge-success', cancelled:'badge-danger', completed:'badge-info', no_show:'badge-muted' }

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [cancelling, setCancelling] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/bookings').then(r => setBookings(r.data.data)).catch(() => toast.error('Failed to load bookings.')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const cancel = async id => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    setCancelling(id)
    try {
      await api.patch(`/bookings/${id}/cancel`)
      toast.success('Booking cancelled.')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Cancellation failed.') }
    finally { setCancelling(null) }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.booking_status === filter)

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>🎟️ My Bookings</h1><p>Track and manage your bookings</p></div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 24, maxWidth: 480 }}>
        {[{k:'all',l:'All'},{k:'confirmed',l:'Confirmed'},{k:'completed',l:'Completed'},{k:'cancelled',l:'Cancelled'}].map(t => (
          <button key={t.k} className={`tab-btn ${filter===t.k?'active':''}`} onClick={() => setFilter(t.k)}>{t.l}</button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ?
        <div className="empty-state"><div className="empty-icon">🎟️</div><h3>No bookings found</h3><p>Discover amazing events and venues!</p><a href="/search" className="btn btn-primary mt-3">Explore Now</a></div> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 40, flexShrink: 0 }}>{b.booking_type === 'event_ticket' ? '🎭' : '📅'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{b.event?.name || b.slot?.slot_name || b.booking_type?.replace('_',' ')}</span>
                  <span className={`badge ${STATUS_COLOR[b.booking_status] || 'badge-muted'}`}>{b.booking_status}</span>
                  <span className="badge badge-muted">{b.payment_status}</span>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <span>📍 {b.property?.name}, {b.property?.city}</span>
                  <span>📅 {b.booking_date}</span>
                  <span>👥 {b.num_guests} guest{b.num_guests > 1 ? 's' : ''}</span>
                  <span style={{ fontFamily: 'monospace', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4, color: 'var(--brand-primary)', fontWeight: 600 }}>{b.booking_ref}</span>
                </div>
                {b.special_requests && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{b.special_requests}"</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand-primary)', marginBottom: 8 }}>₹{b.total_amount}</div>
                {b.discount_amount > 0 && <div style={{ fontSize: 12, color: 'var(--success)', marginBottom: 8 }}>Saved ₹{b.discount_amount}</div>}
                {b.booking_status === 'confirmed' && (
                  <button className="btn btn-danger btn-sm" onClick={() => cancel(b.id)} disabled={cancelling === b.id}>
                    {cancelling === b.id ? '…' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      }
    </Layout>
  )
}

export default MyBookings
