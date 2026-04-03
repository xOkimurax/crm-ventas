import { useState, useEffect } from 'react'
import insforge from '../lib/insforge'

export function useAuth() {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await insforge.auth.getCurrentUser()
        setUser(currentUser || null)
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
