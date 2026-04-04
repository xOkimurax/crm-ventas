import { useState } from 'react'
import { Zap } from 'lucide-react'
import insforge from '../lib/insforge'
import toast from 'react-hot-toast'

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const GithubIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
)

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
)

export default function Login() {
  const [loadingProvider, setLoadingProvider] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleOAuth = async (provider) => {
    if (loadingProvider) return
    setLoadingProvider(provider)
    try {
      const { error } = await insforge.auth.signInWithOAuth({
        provider,
        redirectTo: window.location.origin + '/dashboard',
      })
      if (error) {
        toast.error('Error al iniciar sesión: ' + (error.message || 'Intenta de nuevo'))
        setLoadingProvider(null)
      }
      // If no error, browser is redirecting — keep loading state
    } catch (err) {
      toast.error('Error al iniciar sesión: ' + (err.message || 'Intenta de nuevo'))
      setLoadingProvider(null)
    }
  }

  const handleEmailLogin = (e) => {
    e.preventDefault()
    toast('Email/password próximamente disponible', { icon: '🔒' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0a1e 40%, #0a0f1e 100%)',
      }}
    >
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 0 40px rgba(124, 58, 237, 0.5), 0 0 80px rgba(124, 58, 237, 0.2)',
            }}
          >
            <Zap className="w-10 h-10 text-white" fill="white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">CRM Pro</h1>
          <p className="text-gray-400 text-base">Gestiona tus ventas y clientes con IA</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          }}
        >
          <h2 className="text-xl font-semibold text-white text-center mb-6">Iniciar sesión</h2>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!loadingProvider}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(255,255,255,0.95)',
                color: '#1a1a2e',
              }}
              onMouseEnter={e => { if (!loadingProvider) e.currentTarget.style.background = 'rgba(255,255,255,1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)' }}
            >
              {loadingProvider === 'google' ? <Spinner /> : <GoogleIcon />}
              {loadingProvider === 'google' ? 'Redirigiendo…' : 'Continuar con Google'}
            </button>

            <button
              onClick={() => handleOAuth('github')}
              disabled={!!loadingProvider}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e5e7eb',
              }}
              onMouseEnter={e => { if (!loadingProvider) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            >
              {loadingProvider === 'github' ? <Spinner /> : <GithubIcon />}
              {loadingProvider === 'github' ? 'Redirigiendo…' : 'Continuar con GitHub'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs text-gray-500 uppercase tracking-widest">o</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => { e.currentTarget.style.border = '1px solid rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => { e.currentTarget.style.border = '1px solid rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <button
              type="submit"
              disabled={!!loadingProvider}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
              }}
              onMouseEnter={e => { if (!loadingProvider) e.currentTarget.style.boxShadow = '0 4px 25px rgba(124,58,237,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(124,58,237,0.3)' }}
            >
              Iniciar sesión
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-6">
            Al continuar aceptas nuestros{' '}
            <span className="text-gray-500 cursor-pointer hover:text-gray-400 transition-colors">términos de uso</span>
          </p>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          CRM Pro &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
