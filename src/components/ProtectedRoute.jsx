import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../hooks/useCompany'
import { FullPageSpinner } from './LoadingSpinner'

export default function ProtectedRoute({ children, requireCompany = true }) {
  const { user, loading: authLoading } = useAuth()
  const { company, loading: companyLoading } = useCompany(user?.id)

  if (authLoading || (user && requireCompany && companyLoading)) {
    return <FullPageSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireCompany && company === null) {
    return <Navigate to="/setup" replace />
  }

  return children
}
