import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import './Login.css'

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const ROLE_HOME = {
    end_user: '/search',
    property: '/property/dashboard',
    admin: '/admin/dashboard',
    super_admin: '/superadmin/dashboard'
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error('Please fill in all fields.')
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      toast.success(`Welcome back, ${user.first_name || user.username}! 🎉`)
      const from = location.state?.from?.pathname || ROLE_HOME[user.role] || '/search'
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-card slide-up">
        <div className="login-brand">
          <div className="login-brand-icon">🎪</div>
          <h1 className="login-brand-name">EventPortal</h1>
          <p className="login-brand-tag">Discover · Book · Celebrate</p>
        </div>

        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-icon-wrap">
              <span className="icon">👤</span>
              <input
                id="username" type="text" className="input"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrap" style={{ position: 'relative' }}>
              <span className="icon">🔒</span>
              <input
                id="password" type={showPass ? 'text' : 'password'} className="input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</> : '→ Sign In'}
          </button>
        </form>

        <div className="login-register">
          New here?{' '}
          <a href="/register" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Create an account</a>
        </div>

        <div className="login-demo">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Demo Accounts</p>
          {[
            { role: 'Super Admin', user: 'superadmin', pass: 'Admin@1234' },
            { role: 'Admin', user: 'admin', pass: 'Admin@1234' },
            { role: 'Property', user: 'thegrandvenue', pass: 'Prop@1234' },
            { role: 'Guest', user: 'john_doe', pass: 'User@1234' },
          ].map(d => (
            <button key={d.role} className="demo-btn" onClick={() => setForm({ username: d.user, password: d.pass })}>
              {d.role}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Login
