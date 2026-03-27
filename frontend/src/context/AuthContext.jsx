import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('locker_token'))
  const [user, setUser] = useState(() => {
    if (!localStorage.getItem('locker_token')) {
      return null
    }

    const rawUser = localStorage.getItem('locker_user')
    return rawUser ? JSON.parse(rawUser) : null
  })
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('locker_token')
      localStorage.removeItem('locker_user')
      setUser(null)
      return
    }

    localStorage.setItem('locker_token', token)
  }, [token])

  const value = useMemo(
    () => ({
      token,
      user,
      authLoading,
      async register(payload) {
        setAuthLoading(true)
        try {
          const { data } = await api.post('/register', payload)
          return data
        } finally {
          setAuthLoading(false)
        }
      },
      async login(payload) {
        setAuthLoading(true)
        try {
          const { data } = await api.post('/login', payload)
          setToken(data.token)
          setUser(data.user)
          localStorage.setItem('locker_user', JSON.stringify(data.user))
          return data
        } finally {
          setAuthLoading(false)
        }
      },
      logout() {
        setToken(null)
        setUser(null)
      },
    }),
    [token, user, authLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
