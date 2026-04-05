import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Setup no es necesario — redireccionar al dashboard directamente
export default function Setup() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/dashboard', { replace: true }) }, [navigate])
  return null
}
