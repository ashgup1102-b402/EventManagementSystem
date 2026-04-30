import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const BookingFlow = ({ property, bookingData, onClose, onSuccess }) => {
  const { user } = useAuth()
  const { type, item } = bookingData
  const [step, setStep] = useState(1)
  const [guests, setGuests] = useState(1)
  const [date, setDate] = useState(type === 'event_ticket' ? item.event_date : '')
  const [promoCode, setPromoCode] = useState('')
  const [requests, setRequests] = useState('')
  
  // Guest fields
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  const [loading, setLoading] = useState(false)

  const pricePerHead = type === 'event_ticket' ? parseFloat(item.ticket_price) : parseFloat(item.price_per_head || 0)
  const subtotal = pricePerHead * guests
  const maxGuests = type === 'event_ticket' ? (item.total_capacity - item.booked_count) : (item.max_guests || 50)

  const confirm = async () => {
    setLoading(true)
    try {
      await api.post('/bookings', {
        property_id: property.id,
        booking_type: type,
        event_id: type === 'event_ticket' ? item.id : null,
        slot_id: type === 'table_reservation' ? item.id : null,
        booking_date: date,
        num_guests: guests,
        promo_code: promoCode || null,
        special_requests: requests || null,
        guest_name: user ? null : guestName,
        guest_email: user ? null : guestEmail,
        guest_phone: user ? null : guestPhone
      })
      toast.success('Booking confirmed! Check your email.')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div>
            <h2>{type === 'event_ticket' ? '🎟️ Book Tickets' : '📅 Reserve Table'}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{property.name}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'var(--brand-primary)' : 'var(--border)', transition: 'background 0.3s' }} />
          ))}
        </div>

        {step === 1 && (
          <div className="slide-up">
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>1. Select Details</h3>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{item.name}</div>
              {type === 'event_ticket' && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📅 {item.event_date} · ⏰ {item.start_time}</div>}
              {type === 'table_reservation' && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📅 {item.slot_date} · ⏰ {item.start_time}–{item.end_time}</div>}
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-primary)', marginTop: 8 }}>₹{pricePerHead}/person</div>
            </div>
            {type === 'table_reservation' && (
              <div className="input-group" style={{ marginBottom: 16 }}>
                <label>Reservation Date *</label>
                <input type="date" className="input" value={date} min={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} />
              </div>
            )}
            <div className="input-group">
              <label>Number of Guests * <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(max {maxGuests})</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button className="btn btn-secondary btn-icon" onClick={() => setGuests(g => Math.max(1, g - 1))}>−</button>
                <span style={{ fontSize: 24, fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{guests}</span>
                <button className="btn btn-secondary btn-icon" onClick={() => setGuests(g => Math.min(maxGuests, g + 1))}>+</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { if (!date) return toast.error('Please select a date.'); setStep(2) }}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="slide-up">
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>2. Promo & Notes</h3>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Promo Code (optional)</label>
              <input className="input" placeholder="Enter promo code" value={promoCode} onChange={e => setPromoCode(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Special Requests (optional)</label>
              <textarea className="input" placeholder="Dietary requirements, seating preferences…" value={requests} onChange={e => setRequests(e.target.value)} rows={3} />
            </div>

            {!user && (
              <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ marginBottom: 16 }}>Guest Details</h4>
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label>Full Name *</label>
                  <input className="input" placeholder="John Doe" value={guestName} onChange={e => setGuestName(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label>Email *</label>
                  <input className="input" type="email" placeholder="john@example.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <label>Phone Number *</label>
                  <input className="input" type="tel" placeholder="1234567890" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                  <a href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Login to your account</a> to track your bookings.
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={() => {
                if (!user && (!guestName || !guestEmail || !guestPhone)) {
                  return toast.error('Please fill in your contact details.')
                }
                setStep(3)
              }}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="slide-up">
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>3. Confirm Booking</h3>
            <div className="card" style={{ background: 'var(--bg-tertiary)', marginBottom: 16 }}>
              {[
                { label: 'Item', val: item.name },
                { label: 'Venue', val: property.name },
                { label: 'Date', val: date },
                { label: 'Guests', val: guests },
                { label: 'Price/head', val: `₹${pricePerHead}` },
                { label: 'Subtotal', val: `₹${subtotal}` },
                promoCode && { label: 'Promo', val: promoCode },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{row.val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: 18, fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: 'var(--brand-primary)' }}>₹{subtotal}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              📧 Confirmation will be sent to <strong>{user?.email || guestEmail}</strong> · Payment at venue
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary btn-lg" onClick={confirm} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : '✓ Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingFlow
