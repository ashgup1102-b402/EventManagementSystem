import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

const NAV = {
  End_User: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/search', icon: '🔍', label: 'Discover' },
    { to: '/bookings', icon: '🎟️', label: 'My Bookings' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ],
  Entity: [
    { to: '/entity/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/entity/events', icon: '🎭', label: 'Events' },
    { to: '/entity/menu', icon: '🍽️', label: 'Menu' },
    { to: '/entity/slots', icon: '📅', label: 'Slots' },
    { to: '/entity/discounts', icon: '🏷️', label: 'Discounts & Combos' },
    { to: '/entity/guests', icon: '👥', label: 'Guest List' },
    { to: '/entity/whatsapp', icon: '💬', label: 'Promotions' },
    { to: '/entity/settings', icon: '⚙️', label: 'Entity Settings' },
  ],
  Admin: [
    { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/admin/entities', icon: '🏢', label: 'Entity Management' },
    { to: '/admin/users', icon: '👥', label: 'Users' },
    { to: '/admin/bookings', icon: '🎟️', label: 'All Bookings' },
    { to: '/admin/reports', icon: '📈', label: 'Reports' },
    { to: '/admin/smtp', icon: '📧', label: 'SMTP Settings' },
    { to: '/admin/rules', icon: '📜', label: 'Business Rules' },
  ],
  'Super Admin': [
    { to: '/superadmin/dashboard', icon: '🌐', label: 'Dashboard' },
    { to: '/admin/entities', icon: '🏢', label: 'Entity Management' },
    { to: '/admin/users', icon: '👥', label: 'Users' },
    { to: '/admin/bookings', icon: '🎟️', label: 'All Bookings' },
    { to: '/admin/reports', icon: '📈', label: 'Reports' },
    { to: '/superadmin/roles', icon: '🛡️', label: 'Role Management' },
    { to: '/superadmin/auth', icon: '🔐', label: 'Authorization' },
    { to: '/superadmin/categories', icon: '📂', label: 'Category Management' },
    { to: '/superadmin/masters/event-types', icon: '🎭', label: 'Event Types' },
    { to: '/superadmin/masters/performers', icon: '🎤', label: 'Performers' },
    { to: '/superadmin/masters/menu-categories', icon: '🍽️', label: 'Menu Categories' },
    { to: '/superadmin/masters/cuisine-types', icon: '🍜', label: 'Cuisine Types' },
    { to: '/superadmin/config', icon: '⚙️', label: 'System Config' },
    { to: '/admin/smtp', icon: '📧', label: 'SMTP Settings' },
    { to: '/admin/rules', icon: '📜', label: 'Business Rules' },
    { to: '/superadmin/audit', icon: '📋', label: 'Audit Logs' },
  ],
  guest: [
    { to: '/search', icon: '🔍', label: 'Discover' }
  ]
}

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [siteConfig, setSiteConfig] = useState({ site_name: 'EventPortal', site_tagline: 'Discover · Book · Celebrate' })
  
  const BASE_URL = 'http://localhost:5000'; // Define backend base URL
  
  useEffect(() => {
    api.get('/config').then(r => {
      if (r.data?.data) {
        setSiteConfig(r.data.data)
      }
    }).catch(console.error)
  }, [])

  const links = NAV[user?.role || 'guest'] || []

  const handleLogout = () => { logout(); navigate('/login') }
  const handleLogin = () => { navigate('/login') }

  const roleLabelMap = { End_User: 'Guest', Entity: 'Entity', Admin: 'Admin', 'Super Admin': 'Super Admin', guest: 'Visitor' }
  const roleLabel = roleLabelMap[user?.role || 'guest'] || 'Visitor'

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          {siteConfig.site_logo ? (
            <img src={getImgUrl(siteConfig.site_logo)} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          ) : '🎪'}
        </div>
        <div>
          <div className="sidebar-logo-name">{siteConfig.site_name}</div>
          <div className="sidebar-logo-tag">{siteConfig.site_tagline || 'Discover · Book · Celebrate'}</div>
        </div>
      </div>

      <Link to="/profile" className="sidebar-user" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
        <div className="avatar avatar-md" style={{ overflow: 'hidden' }}>
          {user?.profile_photo ? (
            <img src={getImgUrl(user.profile_photo)} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user ? (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase() : 'G'
          )}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user ? (user?.first_name || user?.username) : 'Guest User'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="badge badge-primary" style={{ fontSize: '9px' }}>{roleLabel}</span>
            <span style={{ fontSize: '10px', opacity: 0.7 }}>✎ Edit</span>
          </div>
        </div>
      </Link>

      <nav className="sidebar-nav">
        {links.map(link => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="sidebar-link-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {user ? (
        <button className="sidebar-logout" onClick={handleLogout}>
          <span>🚪</span> Sign Out
        </button>
      ) : (
        <button className="sidebar-logout" onClick={handleLogin} style={{ background: 'var(--brand-primary)', color: 'white', borderColor: 'transparent' }}>
          <span>🔑</span> Sign In
        </button>
      )}
    </aside>
  )
}

export default Sidebar
