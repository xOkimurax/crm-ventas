import { useState, useEffect, useRef } from 'react'
import insforge from '../lib/insforge'

export function useAuth() {
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

    const init = async () => {
      try {
        // Always wait for the SDK auth callback to complete first.
        // This handles the OAuth redirect case where insforge_code is in the URL.
        // The SDK processes it automatically in detectAuthCallback() on init.
        await insforge.auth.authCallbackHandled

        const result = await insforge.auth.getCurrentUser()
        const currentUser = result?.data?.user ?? result?.user ?? null
        setUser(currentUser?.id ? currentUser : null)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const signOut = async () => {
    await insforge.auth.signOut()
    setUser(null)
  }

  return { user, loading, setUser, signOut }
}
