import { createContext, useContext, useState, useEffect } from 'react'
import * as authApi from '../api/auth'


const AuthContext = createContext(null)
export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authApi.getCurrentUser()
        setUser(userData)
      } catch (error) {

        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])


  const login = async (identifier, password, rememberMe) => {
    await authApi.login(identifier, password, rememberMe)

    const userData = await authApi.getCurrentUser()
    setUser(userData)
    return userData
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)

  }

  const value = {
    user,
    loading,
    isAuthenticated: user !== null,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}