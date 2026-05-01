import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.map(r => r.toLowerCase()).includes(user.role?.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
