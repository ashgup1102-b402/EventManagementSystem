import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// End User Pages
import SearchPage from './pages/enduser/SearchPage'
import PropertyDetail from './pages/enduser/PropertyDetail'
import MyBookings from './pages/enduser/MyBookings'

// Property Pages
import PropertyDashboard from './pages/property/PropertyDashboard'
import EventsManager from './pages/property/EventsManager'
import MenuManager from './pages/property/MenuManager'
import SlotManager from './pages/property/SlotManager'
import DiscountManager from './pages/property/DiscountManager'
import WhatsappPromo from './pages/property/WhatsappPromo'

// Admin & Super Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import SystemConfig from './pages/superadmin/SystemConfig'
import Placeholder from './pages/Placeholder'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/property/:id" element={<PropertyDetail />} />

          {/* End User Protected */}
          <Route path="/bookings" element={<ProtectedRoute roles={['end_user', 'admin', 'super_admin']}><MyBookings /></ProtectedRoute>} />

          {/* Property Routes */}
          <Route path="/property/dashboard" element={<ProtectedRoute roles={['property']}><PropertyDashboard /></ProtectedRoute>} />
          <Route path="/property/events" element={<ProtectedRoute roles={['property']}><EventsManager /></ProtectedRoute>} />
          <Route path="/property/menu" element={<ProtectedRoute roles={['property']}><MenuManager /></ProtectedRoute>} />
          <Route path="/property/slots" element={<ProtectedRoute roles={['property']}><SlotManager /></ProtectedRoute>} />
          <Route path="/property/discounts" element={<ProtectedRoute roles={['property']}><DiscountManager /></ProtectedRoute>} />
          <Route path="/property/whatsapp" element={<ProtectedRoute roles={['property']}><WhatsappPromo /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/properties" element={<ProtectedRoute roles={['admin', 'super_admin']}><Placeholder title="Properties Management" /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin', 'super_admin']}><Placeholder title="Users Management" /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin', 'super_admin']}><Placeholder title="All Bookings" /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['admin', 'super_admin']}><Placeholder title="Reports & Analytics" /></ProtectedRoute>} />

          {/* Super Admin Routes */}
          <Route path="/superadmin/dashboard" element={<ProtectedRoute roles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/config" element={<ProtectedRoute roles={['super_admin']}><SystemConfig /></ProtectedRoute>} />
          <Route path="/superadmin/audit" element={<ProtectedRoute roles={['super_admin']}><Placeholder title="Audit Logs" /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="/unauthorized" element={<div style={{ textAlign: 'center', padding: '100px 20px' }}><h2>403 - Unauthorized</h2><p>You do not have permission to view this page.</p><a href="/search" style={{ color: 'var(--brand-primary)' }}>Return Home</a></div>} />
          <Route path="*" element={<div style={{ textAlign: 'center', padding: '100px 20px' }}><h2>404 - Not Found</h2><p>The page you are looking for does not exist.</p><a href="/search" style={{ color: 'var(--brand-primary)' }}>Return Home</a></div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
