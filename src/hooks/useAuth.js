import { useState, useEffect, useRef } from 'react'
import insforge from '../lib/insforge'

// Check if there's any stored session before hitting the API
function hasStoredSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('insforge') || key.includes('auth') || key.includes('session') || key.includes('token'))) {
        return true
      }
    }
  } catch { /* no localStorage */ }
  return false
}

export function useAuth() {
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

    // No stored session → skip API call, user is not logged in
    if (!hasStoredSession()) {
      setUser(null)
      setLoading(false)
      return
    }

    const checkUser = async () => {
      try {
        const result = await insforge.auth.getCurrentUser()
        const currentUser = result?.data?.user ?? result?.user ?? null
        setUser(currentUser?.id ? currentUser : null)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [])

  const signOut = async () => {
    await insforge.auth.signOut()
    setUser(null)
  }

  return { user, loading, setUser, signOut }
}
