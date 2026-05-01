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
import Profile from './pages/enduser/Profile'

// Entity Pages
import EntityDashboard from './pages/property/PropertyDashboard'
import EventsManager from './pages/property/EventsManager'
import MenuManager from './pages/property/MenuManager'
import SlotManager from './pages/property/SlotManager'
import DiscountManager from './pages/property/DiscountManager'
import WhatsappPromo from './pages/property/WhatsappPromo'
import EntitySettings from './pages/property/EntitySettings'

// Admin & Super Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import EntityManager from './pages/admin/EntityManager'
import UsersManager from './pages/admin/UsersManager'
import AllBookings from './pages/admin/AllBookings'
import Reports from './pages/admin/Reports'
import SMTPSettings from './pages/admin/SMTPSettings'
import BusinessRules from './pages/admin/BusinessRules'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import RoleManagement from './pages/superadmin/RoleManagement'
import AuthorizationMatrix from './pages/superadmin/AuthorizationMatrix'
import CategoryManagement from './pages/superadmin/CategoryManagement'
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
          <Route path="/entity/:id" element={<PropertyDetail />} />

          {/* End User Protected */}
          <Route path="/dashboard" element={<Navigate to="/bookings" replace />} />
          <Route path="/profile" element={<ProtectedRoute roles={['End_User', 'Admin', 'Super Admin', 'Entity']}><Profile /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute roles={['End_User', 'Admin', 'Super Admin']}><MyBookings /></ProtectedRoute>} />

          {/* Entity Routes */}
          <Route path="/entity/dashboard" element={<ProtectedRoute roles={['Entity']}><EntityDashboard /></ProtectedRoute>} />
          <Route path="/entity/events" element={<ProtectedRoute roles={['Entity']}><EventsManager /></ProtectedRoute>} />
          <Route path="/entity/menu" element={<ProtectedRoute roles={['Entity']}><MenuManager /></ProtectedRoute>} />
          <Route path="/entity/slots" element={<ProtectedRoute roles={['Entity']}><SlotManager /></ProtectedRoute>} />
          <Route path="/entity/discounts" element={<ProtectedRoute roles={['Entity']}><DiscountManager /></ProtectedRoute>} />
          <Route path="/entity/guests" element={<ProtectedRoute roles={['Entity']}><Placeholder title="Guest List" /></ProtectedRoute>} />
          <Route path="/entity/whatsapp" element={<ProtectedRoute roles={['Entity']}><WhatsappPromo /></ProtectedRoute>} />
          <Route path="/entity/settings" element={<ProtectedRoute roles={['Entity']}><EntitySettings /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['Admin', 'Super Admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/entities" element={<ProtectedRoute roles={['Admin', 'Super Admin']}><EntityManager /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['Admin', 'Super Admin']}><UsersManager /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute roles={['Admin', 'Super Admin']}><AllBookings /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['Admin', 'Super Admin']}><Reports /></ProtectedRoute>} />
          <Route path="/admin/smtp" element={<ProtectedRoute roles={['Admin', 'Super Admin']}><SMTPSettings /></ProtectedRoute>} />
          <Route path="/admin/rules" element={<ProtectedRoute roles={['Admin', 'Super Admin']}><BusinessRules /></ProtectedRoute>} />

          {/* Super Admin Routes */}
          <Route path="/superadmin/dashboard" element={<ProtectedRoute roles={['Super Admin']}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/roles" element={<ProtectedRoute roles={['Super Admin']}><RoleManagement /></ProtectedRoute>} />
          <Route path="/superadmin/auth" element={<ProtectedRoute roles={['Super Admin']}><AuthorizationMatrix /></ProtectedRoute>} />
          <Route path="/superadmin/categories" element={<ProtectedRoute roles={['Super Admin']}><CategoryManagement /></ProtectedRoute>} />
          <Route path="/superadmin/config" element={<ProtectedRoute roles={['Super Admin']}><SystemConfig /></ProtectedRoute>} />
          <Route path="/superadmin/audit" element={<ProtectedRoute roles={['Super Admin']}><Placeholder title="Audit Logs" /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="/unauthorized" element={<div style={{ textAlign: 'center', padding: '100px 20px' }}><h2>403 - Unauthorized</h2><p>You do not have permission to view this page.</p><a href="/search" style={{ color: 'var(--brand-primary)' }}>Return Home</a></div>} />
          <Route path="*" element={<div style={{ textAlign: 'center', padding: '100px 20px' }}><h2>404 - Not Found</h2><p>The page you are looking for does not exist.</p><a href="/search" style={{ color: 'var(--brand-primary)' }}>Return Home</a></div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
