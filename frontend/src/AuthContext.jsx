import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '')
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || '')
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || '')
  const [rol, setRol] = useState(() => localStorage.getItem('rol') || '')

  const isAuthenticated = accessToken !== ''

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (email) localStorage.setItem('email', email)
    else localStorage.removeItem('email')
  }, [email])

  useEffect(() => {
    if (accessToken) localStorage.setItem('accessToken', accessToken)
    else localStorage.removeItem('accessToken')
  }, [accessToken])

  useEffect(() => {
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    else localStorage.removeItem('refreshToken')
  }, [refreshToken])

  useEffect(() => {
    if (rol) localStorage.setItem('rol', rol)
    else localStorage.removeItem('rol')
  }, [rol])

  const login = async (userEmail, userPassword) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword })
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()
    setEmail(data.email)
    setAccessToken(data.accessToken)
    setRefreshToken(data.refreshToken)
    setRol(data.rol)
  }

  const logout = () => {
    setEmail('')
    setAccessToken('')
    setRefreshToken('')
    setRol('')
  }

  const getAuthHeader = () => {
    if (!isAuthenticated) return null
    return 'Bearer ' + accessToken
  }

  const hasRole = (roleName) => {
    return rol === roleName
  }

  return (
    <AuthContext.Provider value={{ email, rol, isAuthenticated, login, logout, getAuthHeader, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
