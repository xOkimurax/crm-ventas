import { useState, useEffect } from 'react'
import insforge from '../lib/insforge'

export function useCompany(userId) {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setCompany(null)
      setLoading(false)
      return
    }

    const loadCompany = async () => {
      try {
        // Try to get existing company for this user
        const { data, error } = await insforge.database
          .from('companies')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setCompany(data)
        } else {
          // Create company for user
          const { data: newCompany, error: createError } = await insforge.database
            .from('companies')
            .insert([{ user_id: userId, name: 'Mi Empresa' }])
            .select()
            .single()

          if (createError) throw createError
          setCompany(newCompany)
        }
      } catch (err) {
        console.error('Error loading company:', err)
        // Fallback: use a dummy company object so the app works
        setCompany({ id: userId, name: 'Mi Empresa' })
      } finally {
        setLoading(false)
      }
    }

    loadCompany()
  }, [userId])

  return { company, loading, setCompany }
}
