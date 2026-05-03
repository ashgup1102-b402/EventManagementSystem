import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [siteConfig, setSiteConfig] = useState({ site_name: 'EventPortal' })
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    api.get('/config').then(r => {
      if (r.data?.data) setSiteConfig(r.data.data)
    }).catch(() => {})

    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); }

  const endUserLinks = [
    { to: '/search', label: 'Discover' },
    { to: '/bookings', label: 'My Bookings' },
    { to: '/profile', label: 'Profile' }
  ]

  // We could add links for admins, but since they have dashboards, we might just link them to dashboard.
  const dashboardLink = 
    user?.role === 'Super Admin' ? '/superadmin/dashboard' :
    user?.role === 'Admin' ? '/admin/dashboard' :
    user?.role === 'Entity' ? '/entity/dashboard' : null

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const BASE_URL = 'http://localhost:5000';
    return `${BASE_URL}${path}`;
  }

  return (
    <nav className={`site-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="site-navbar-container">
        
        <Link to="/search" className="site-navbar-brand">
          {siteConfig.site_logo ? (
            <img 
              src={getImgUrl(siteConfig.site_logo)} 
              alt="Logo" 
              style={{ height: '32px', objectFit: 'contain' }} 
            />
          ) : (
            <span className="brand-icon">🎪</span>
          )}
          <span className="brand-name">{siteConfig.site_name}</span>
          {user?.role === 'Super Admin' && <span className="badge badge-primary ml-2" style={{ fontSize: '10px' }}>Super Admin</span>}
          {user?.role === 'Admin' && <span className="badge badge-secondary ml-2" style={{ fontSize: '10px' }}>Admin</span>}
          {user?.role === 'Entity' && <span className="badge badge-muted ml-2" style={{ fontSize: '10px' }}>Entity</span>}
        </Link>

        <div className="site-navbar-actions">
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginRight: '8px' }}>
            <Link to="/search" className="nav-link">Discover</Link>
            {user?.role === 'End_User' && (
              <>
                <Link to="/bookings" className="nav-link">My Bookings</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
              </>
            )}
            {dashboardLink && (
              <Link to={dashboardLink} className="nav-link">Dashboard</Link>
            )}
          </div>

          {user ? (
            <div className="user-dropdown-wrapper">
              <button className="user-avatar-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="avatar avatar-sm overflow-hidden">
                  {user.profile_photo || user.avatar ? (
                    <img 
                      src={getImgUrl(user.profile_photo || user.avatar)} 
                      alt="Profile" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()
                  )}
                </div>
              </button>
              {menuOpen && (
                <div className="user-dropdown slide-up">
                  <div className="dropdown-header">
                    <strong>{user.first_name || user.username}</strong>
                    <div className="text-xs text-muted">{user.email}</div>
                  </div>
                  <div className="dropdown-divider"></div>
                  {user?.role === 'End_User' ? (
                    <>
                      <Link to="/bookings" className="dropdown-item" onClick={() => setMenuOpen(false)}>🎟️ My Bookings</Link>
                      <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>👤 Profile</Link>
                    </>
                  ) : (
                    <Link to={dashboardLink} className="dropdown-item" onClick={() => setMenuOpen(false)}>📊 Dashboard</Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item text-danger w-full" style={{ textAlign: 'left' }} onClick={handleLogout}>🚪 Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ borderRadius: 'var(--radius-full)' }}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
