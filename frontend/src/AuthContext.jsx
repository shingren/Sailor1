import { createContext, useContext } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const email = 'admin@sailor.local'
  const rol = 'ADMIN'
  const isAuthenticated = true

  const login = async () => {
    // 不做任何事
  }

  const logout = () => {
    // 不做任何事
  }

  const getAuthHeader = () => {
    return 'Bearer dev-token'
  }

  const hasRole = (roleName) => {
    return true
  }

  return (
    <AuthContext.Provider value={{
      email,
      rol,
      isAuthenticated,
      login,
      logout,
      getAuthHeader,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}