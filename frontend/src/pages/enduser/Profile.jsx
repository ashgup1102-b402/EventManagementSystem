import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [bookings, setBookings] = useState([])
  const [preferences, setPreferences] = useState(['Live Music', 'Comedy Shows', 'Food Festivals'])
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [form, setForm] = useState({})
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showPassModal, setShowPassModal] = useState(false)
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    if (user) setForm(user)
    const fetchData = async () => {
      try {
        const [bRes, dRes] = await Promise.all([
          api.get('/bookings?limit=3'),
          api.get('/discounts?status=active')
        ])
        setBookings(bRes.data.data || [])
        setDiscounts(dRes.data.data?.slice(0, 2) || [])
      } catch (err) {
        // Silently fail if not an end-user (bookings might not exist)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  }

  const handlePassChange = async () => {
    if (!passForm.current_password || !passForm.new_password) return toast.error('Fill all fields.')
    if (passForm.new_password !== passForm.confirm_password) return toast.error('Passwords do not match.')
    
    setSaving(true)
    try {
      await api.put('/auth/change-password', {
        current_password: passForm.current_password,
        new_password: passForm.new_password
      })
      toast.success('Password changed successfully!')
      setShowPassModal(false)
      setPassForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('first_name', form.first_name || '')
      formData.append('last_name', form.last_name || '')
      formData.append('email', form.email || '')
      formData.append('mobile_1', form.mobile_1 || form.phone || '')
      if (photoFile) formData.append('profile_photo', photoFile)

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Profile updated!')
      
      // Update context state
      updateUser(res.data.data)
      setPhotoFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (pref) => {
    setPreferences(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref])
  }

  if (loading) return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>👤 My Profile</h1>
            <p className="text-muted">Manage your personal details and identity.</p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Personal Details */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Personal Details</h3>
            <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'center' }}>
               <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--brand-primary)', position: 'relative', background: 'var(--bg-tertiary)' }}>
                 {photoFile ? (
                   <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : user?.profile_photo ? (
                   <img src={getImgUrl(user.profile_photo)} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 }}>
                     {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                   </div>
                 )}
                 <label style={{ position: 'absolute', bottom: 0, right: 0, left: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 10, textAlign: 'center', cursor: 'pointer', padding: '2px 0' }}>
                   Change
                   <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
                 </label>
               </div>
               <div>
                 <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.username}</div>
                 <div className="badge badge-primary">{user?.role}</div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="input-group">
                <label>First Name</label>
                <input className="input" type="text" value={form.first_name || ''} onChange={e => setForm({...form, first_name: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <input className="input" type="text" value={form.last_name || ''} onChange={e => setForm({...form, last_name: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input className="input" type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input className="input" type="text" value={form.mobile_1 || form.phone || ''} onChange={e => setForm({...form, mobile_1: e.target.value})} />
              </div>
            </div>
          </div>

          {user?.role === 'End_User' && (
            <>
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
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {user?.role === 'End_User' && (
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand-primary), #6b21a8)', color: 'white', border: 'none' }}>
              <h3 style={{ marginBottom: 16, color: 'white' }}>💎 Reward Points</h3>
              <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>1250</div>
              <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>You earn points on every booking!</p>
              <button className="btn" style={{ background: 'white', color: 'var(--brand-primary)', width: '100%', fontWeight: 700 }}>
                Redeem on Next Booking
              </button>
            </div>
          )}

          {/* Account Security */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Account Security</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => setShowPassModal(true)}>🔒 Change Password</button>
               <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>🚪 Delete Account</button>
            </div>
          </div>
        </div>
      </div>

      {showPassModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: 20 }}>🔒 Change Password</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>Current Password</label>
                <input className="input" type="password" value={passForm.current_password} onChange={e => setPassForm({...passForm, current_password: e.target.value})} />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input className="input" type="password" value={passForm.new_password} onChange={e => setPassForm({...passForm, new_password: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Confirm New Password</label>
                <input className="input" type="password" value={passForm.confirm_password} onChange={e => setPassForm({...passForm, confirm_password: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePassChange} disabled={saving}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
                <button className="btn btn-secondary" onClick={() => { setShowPassModal(false); setPassForm({ current_password: '', new_password: '', confirm_password: '' }) }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Profile
