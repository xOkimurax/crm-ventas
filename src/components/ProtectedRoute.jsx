import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FullPageSpinner } from './LoadingSpinner'

// Simplified: no company check — go straight to dashboard after login
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />

  return children
}
