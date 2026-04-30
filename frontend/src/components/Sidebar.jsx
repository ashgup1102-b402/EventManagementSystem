import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

const NAV = {
  end_user: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/search', icon: '🔍', label: 'Discover' },
    { to: '/bookings', icon: '🎟️', label: 'My Bookings' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ],
  property: [
    { to: '/property/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/property/events', icon: '🎭', label: 'Events' },
    { to: '/property/menu', icon: '🍽️', label: 'Menu' },
    { to: '/property/slots', icon: '📅', label: 'Slots' },
    { to: '/property/discounts', icon: '🏷️', label: 'Discounts & Combos' },
    { to: '/property/guests', icon: '👥', label: 'Guest List' },
    { to: '/property/whatsapp', icon: '💬', label: 'Promotions' },
    { to: '/property/settings', icon: '⚙️', label: 'Property Settings' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/admin/properties', icon: '🏢', label: 'Properties' },
    { to: '/admin/users', icon: '👥', label: 'Users' },
    { to: '/admin/bookings', icon: '🎟️', label: 'All Bookings' },
    { to: '/admin/reports', icon: '📈', label: 'Reports' },
  ],
  super_admin: [
    { to: '/superadmin/dashboard', icon: '🌐', label: 'Dashboard' },
    { to: '/admin/properties', icon: '🏢', label: 'Properties' },
    { to: '/admin/users', icon: '👥', label: 'Users' },
    { to: '/admin/bookings', icon: '🎟️', label: 'All Bookings' },
    { to: '/admin/reports', icon: '📈', label: 'Reports' },
    { to: '/superadmin/config', icon: '⚙️', label: 'System Config' },
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

  const roleLabel = { end_user: 'Guest', property: 'Property', admin: 'Admin', super_admin: 'Super Admin', guest: 'Visitor' }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎪</div>
        <div>
          <div className="sidebar-logo-name">{siteConfig.site_name}</div>
          <div className="sidebar-logo-tag">{siteConfig.site_tagline || 'Discover · Book · Celebrate'}</div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="avatar avatar-md">
          {user ? (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase() : 'G'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user ? (user?.first_name || user?.username) : 'Guest User'}</div>
          <span className="badge badge-primary" style={{ fontSize: '10px' }}>{roleLabel[user?.role || 'guest']}</span>
        </div>
      </div>

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
