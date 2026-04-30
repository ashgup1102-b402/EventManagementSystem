import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [preferences, setPreferences] = useState(['Live Music', 'Comedy Shows', 'Food Festivals'])
  const [discounts, setDiscounts] = useState([])
  const [rewardPoints, setRewardPoints] = useState(1250)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, dRes] = await Promise.all([
          api.get('/bookings?limit=3'),
          api.get('/discounts?status=active')
        ])
        setBookings(bRes.data.data || [])
        // In a real scenario, discounts would be filtered by those applicable to this user.
        setDiscounts(dRes.data.data?.slice(0, 2) || [])
      } catch (err) {
        toast.error('Failed to load profile data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const togglePreference = (pref) => {
    setPreferences(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref])
  }

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>

  return (
    <Layout>
      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p className="text-muted">Manage your personal details, preferences, and rewards.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Personal Details */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Personal Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label>First Name</label>
                <input className="input" type="text" defaultValue={user?.first_name || ''} readOnly />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input className="input" type="text" defaultValue={user?.last_name || ''} readOnly />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input className="input" type="email" defaultValue={user?.email || ''} readOnly />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input className="input" type="text" defaultValue={user?.phone || ''} readOnly />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Interests & Preferences</h3>
            <p className="text-muted" style={{ marginBottom: 16 }}>Select what you're interested in so we can personalize your Discover feed.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {['Live Music', 'Comedy Shows', 'Food Festivals', 'Art Exhibitions', 'Nightlife', 'Workshops'].map(pref => (
                <button 
                  key={pref} 
                  className={`btn ${preferences.includes(pref) ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ borderRadius: 20 }}
                  onClick={() => togglePreference(pref)}
                >
                  {preferences.includes(pref) ? '✓ ' : '+ '}{pref}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Recent Bookings</h3>
              <Link to="/bookings" className="text-primary" style={{ fontSize: 14, fontWeight: 600 }}>View All →</Link>
            </div>
            {bookings.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-icon" style={{ fontSize: 32 }}>🎟️</div>
                <h4 style={{ margin: '8px 0' }}>No recent bookings</h4>
                <p className="text-muted">You haven't made any bookings yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bookings.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{b.property?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {b.booking_type === 'event_ticket' ? '🎭 Event' : '📅 Table Reservation'} • {b.booking_date}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>₹{b.total_amount}</div>
                      <span className={`badge badge-${b.booking_status === 'confirmed' ? 'success' : 'muted'}`}>{b.booking_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Rewards Profile */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand-primary), #6b21a8)', color: 'white', border: 'none' }}>
            <h3 style={{ marginBottom: 16, color: 'white' }}>💎 Reward Points</h3>
            <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>{rewardPoints}</div>
            <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>You earn points on every booking!</p>
            <button className="btn" style={{ background: 'white', color: 'var(--brand-primary)', width: '100%', fontWeight: 700 }}>
              Redeem on Next Booking
            </button>
          </div>

          {/* Exclusive Offers */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Exclusive Offers</h3>
            {discounts.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 14 }}>No exclusive offers at the moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {discounts.map(d => (
                  <div key={d.id} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--brand-secondary)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.code}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.description || 'Special discount just for you.'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Profile
