import { useState, useEffect, useRef } from 'react'
import insforge from '../lib/insforge'

export function useAuth() {
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

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
