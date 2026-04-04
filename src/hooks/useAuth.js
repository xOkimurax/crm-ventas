import { useState, useEffect } from 'react'
import insforge from '../lib/insforge'

export function useAuth() {
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const result = await insforge.auth.getCurrentUser()
        // SDK returns { data: { user }, error } or just user depending on version
        const currentUser = result?.data?.user ?? result?.user ?? (result && !result.data && !result.error ? result : null)
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
