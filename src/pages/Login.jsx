import { useState } from 'react'
import { Zap } from 'lucide-react'
import insforge from '../lib/insforge'
import toast from 'react-hot-toast'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{flexShrink:0}}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
)

const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{flexShrink:0, animation:'spin 1s linear infinite'}}>
    <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
    <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
)

export default function Login() {
  const [loading, setLoading] = useState(null)

  const handleOAuth = async (provider) => {
    if (loading) return
    setLoading(provider)
    try {
      const result = await insforge.auth.signInWithOAuth({
        provider,
        redirectTo: window.location.origin + '/dashboard',
      })
      const url = result?.data?.url
      if (url) {
        window.location.href = url
        return
      }
      if (result?.error) throw result.error
      // SDK redirects internally — keep loading state
    } catch (err) {
      console.error('OAuth error:', err)
      toast.error('Error al conectar con ' + provider)
      setLoading(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #0d0d14 0%, #120d24 50%, #0d1220 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Purple glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '360px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            boxShadow: '0 0 30px rgba(124,58,237,0.55), 0 0 60px rgba(124,58,237,0.2)',
            marginBottom: '16px',
          }}>
            <Zap size={32} color="white" fill="white" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' }}>CRM Pro</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Gestiona tus ventas con IA</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px',
          padding: '28px 24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', marginBottom: '20px' }}>
            Iniciá sesión para continuar
          </div>

          {/* Google */}
          <button
            onClick={() => handleOAuth('google')}
            disabled={!!loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', padding: '12px 16px', borderRadius: '12px', border: 'none',
              background: loading === 'google' ? 'rgba(255,255,255,0.75)' : '#fff',
              color: '#111', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && loading !== 'google' ? 0.45 : 1,
              marginBottom: '10px', transition: 'opacity 0.2s',
            }}
          >
            {loading === 'google' ? <Spinner /> : <GoogleIcon />}
            {loading === 'google' ? 'Redirigiendo...' : 'Continuar con Google'}
          </button>

          {/* GitHub */}
          <button
            onClick={() => handleOAuth('github')}
            disabled={!!loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', padding: '12px 16px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#e5e7eb', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading && loading !== 'github' ? 0.45 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading === 'github' ? <Spinner /> : <GithubIcon />}
            {loading === 'github' ? 'Redirigiendo...' : 'Continuar con GitHub'}
          </button>

          <div style={{ fontSize: '11px', color: '#4b5563', textAlign: 'center', marginTop: '20px' }}>
            Al continuar aceptás los términos de uso
          </div>
        </div>
      </div>
    </div>
  )
}
