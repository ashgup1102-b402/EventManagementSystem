import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import '../auth/Login.css'

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) return toast.error('Please fill required fields.')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      await login(form.username, form.password)
      toast.success('Account created! Welcome 🎉')
      navigate('/search')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally { setLoading(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" /><div className="login-orb login-orb-2" />
      </div>
      <div className="login-card slide-up" style={{ maxWidth: 480 }}>
        <div className="login-brand">
          <div className="login-brand-icon">🎪</div>
          <h1 className="login-brand-name">EventPortal</h1>
        </div>
        <h2 className="login-title">Create Account</h2>
        <p className="login-subtitle">Join thousands discovering amazing events</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-grid form-grid-2">
            <div className="input-group"><label>First Name</label><input className="input" placeholder="First name" value={form.first_name} onChange={set('first_name')} /></div>
            <div className="input-group"><label>Last Name</label><input className="input" placeholder="Last name" value={form.last_name} onChange={set('last_name')} /></div>
          </div>
          <div className="input-group"><label>Username *</label><div className="input-icon-wrap"><span className="icon">👤</span><input className="input" placeholder="Choose a username" value={form.username} onChange={set('username')} required /></div></div>
          <div className="input-group"><label>Email *</label><div className="input-icon-wrap"><span className="icon">✉️</span><input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required /></div></div>
          <div className="input-group"><label>Phone</label><div className="input-icon-wrap"><span className="icon">📱</span><input className="input" placeholder="Mobile number" value={form.phone} onChange={set('phone')} /></div></div>
          <div className="input-group"><label>Password *</label><div className="input-icon-wrap"><span className="icon">🔒</span><input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required /></div></div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : '→ Create Account'}
          </button>
        </form>
        <div className="login-register">Already have an account? <a href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Sign in</a></div>
      </div>
    </div>
  )
}

export default Register
