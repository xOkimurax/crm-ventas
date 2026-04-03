import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const EVO_URL = import.meta.env.VITE_EVO_URL || 'https://evo.matias-automatization.online'
const EVO_APIKEY = import.meta.env.VITE_EVO_APIKEY || 'kiridev-evo-secret-2026'
const EVO_INSTANCE = import.meta.env.VITE_EVO_INSTANCE || 'MatiasBot'

const EVO_HEADERS = { apikey: EVO_APIKEY, 'Content-Type': 'application/json' }

export default function WhatsApp() {
  const [status, setStatus] = useState('loading') // loading | connected | disconnected | error
  const [phone, setPhone] = useState('')
  const [qrBase64, setQrBase64] = useState('')
  const [loadingQr, setLoadingQr] = useState(false)
  const [lastCheck, setLastCheck] = useState(null)

  const checkStatus = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`${EVO_URL}/instance/fetchInstances`, { headers: EVO_HEADERS })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const instances = Array.isArray(data) ? data : (data.instance ? [data] : [])
      const instance = instances.find(i => i.instance?.instanceName === EVO_INSTANCE || i.name === EVO_INSTANCE)

      if (!instance) { setStatus('disconnected'); return }
      const connStatus = instance.instance?.status || instance.connectionStatus || instance.state || ''

      if (connStatus === 'open' || connStatus === 'connected') {
        setStatus('connected')
        setPhone(instance.instance?.wuid?.replace('@s.whatsapp.net', '') || instance.phone || '')
        setQrBase64('')
      } else {
        setStatus('disconnected')
        if (!silent) fetchQr()
      }
      setLastCheck(new Date())
    } catch (e) {
      setStatus('error')
      console.error('Error checking WA status:', e)
    }
  }, [])

  const fetchQr = async () => {
    setLoadingQr(true)
    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${EVO_INSTANCE}`, { headers: EVO_HEADERS })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const base64 = data.base64 || data.qrcode?.base64 || data.qr || ''
      if (base64) {
        setQrBase64(base64.replace(/^data:image\/png;base64,/, ''))
        toast.success('QR generado, escanealo desde WhatsApp')
      } else {
        toast.error('No se pudo obtener el QR')
      }
    } catch (e) {
      toast.error('Error al obtener QR: ' + e.message)
    } finally {
      setLoadingQr(false)
    }
  }

  const handleReconnect = async () => {
    await fetchQr()
    setTimeout(() => checkStatus(true), 3000)
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(() => checkStatus(true), 10000)
    return () => clearInterval(interval)
  }, [checkStatus])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
        <p className="text-gray-400 text-sm mt-1">Conexión a Evolution API — instancia: {EVO_INSTANCE}</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {/* Status card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${status === 'connected' ? 'bg-green-500/20' : status === 'loading' ? 'bg-gray-700' : 'bg-red-500/20'}`}>
              {status === 'connected'
                ? <Wifi className="w-6 h-6 text-green-400" />
                : status === 'loading'
                ? <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                : <WifiOff className="w-6 h-6 text-red-400" />}
            </div>
            <div className="flex-1">
              <h2 className="text-white font-semibold">
                {status === 'connected' ? 'Conectado' : status === 'loading' ? 'Verificando...' : status === 'error' ? 'Error de conexión' : 'Desconectado'}
              </h2>
              {phone && <p className="text-gray-400 text-sm">+{phone}</p>}
              {lastCheck && <p className="text-gray-600 text-xs mt-1">Última verificación: {lastCheck.toLocaleTimeString('es-PY')}</p>}
            </div>
            <span className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-400 animate-pulse' : status === 'loading' ? 'bg-gray-500' : 'bg-red-400'}`} />
          </div>

          {status === 'connected' && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-green-400 text-sm">WhatsApp conectado y listo para recibir mensajes</p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button onClick={() => checkStatus()} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
            {status !== 'connected' && (
              <button onClick={handleReconnect} disabled={loadingQr} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                <MessageCircle className="w-4 h-4" /> {loadingQr ? 'Generando QR...' : 'Reconectar'}
              </button>
            )}
          </div>
        </div>

        {/* QR Code */}
        {qrBase64 && status !== 'connected' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <h3 className="text-white font-semibold mb-2">Escaneá el QR con WhatsApp</h3>
            <p className="text-gray-400 text-sm mb-4">Abrí WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
            <div className="bg-white p-3 rounded-xl inline-block">
              <img src={`data:image/png;base64,${qrBase64}`} alt="WhatsApp QR" className="w-56 h-56 object-contain" />
            </div>
            <p className="text-gray-600 text-xs mt-3">El QR se actualiza cada 30 segundos</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Configuración</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Instancia</span>
              <span className="text-gray-300 font-mono">{EVO_INSTANCE}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Servidor Evolution</span>
              <span className="text-gray-300 font-mono text-xs">{EVO_URL.replace('https://', '')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Auto-refresh</span>
              <span className="text-green-400">Cada 10 segundos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
