import { useState, useEffect } from 'react'
import insforge from '../lib/insforge'

export function useCompany(userId) {
  const [company, setCompany] = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setCompany(null)
      setLoading(false)
      return
    }
    const fetchCompany = async () => {
      try {
        const { data } = await insforge.db
          .from('companies')
          .select('*')
          .eq('owner_id', userId)
          .limit(1)
        setCompany(data?.[0] || null)
      } catch {
        setCompany(null)
      } finally {
        setLoading(false)
      }
    }
    fetchCompany()
  }, [userId])

  return { company, loading, setCompany }
}
