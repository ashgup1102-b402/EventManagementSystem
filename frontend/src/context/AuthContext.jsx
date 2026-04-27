import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ep_user')
    const token = localStorage.getItem('ep_token')
    if (stored && token) {
      try { setUser(JSON.parse(stored)) } catch { logout() }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    localStorage.setItem('ep_token', data.data.token)
    localStorage.setItem('ep_user', JSON.stringify(data.data.user))
    setUser(data.data.user)
    return data.data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ep_token')
    localStorage.removeItem('ep_user')
    setUser(null)
  }, [])

  const updateUser = useCallback((updated) => {
    const merged = { ...user, ...updated }
    localStorage.setItem('ep_user', JSON.stringify(merged))
    setUser(merged)
  }, [user])

  const isRole = (...roles) => user && roles.includes(user.role)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
