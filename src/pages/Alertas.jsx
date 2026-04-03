import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'
import insforge from '../lib/insforge'
import { useCompany } from '../hooks/useCompany'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Alertas() {
  const { company } = useCompany()
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)
  const { register, handleSubmit, reset } = useForm()

  const { data: alertas = [], isLoading } = useQuery({
    queryKey: ['stock_alerts', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data: alerts, error } = await insforge.database
        .from('stock_alerts')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      if (!alerts || alerts.length === 0) return []

      // traer productos para cada alerta
      const productIds = [...new Set(alerts.map(a => a.product_id))]
      const { data: products } = await insforge.database
        .from('crm_products')
        .select('id, name, stock, min_stock')
        .in('id', productIds)
      const prodMap = Object.fromEntries((products || []).map(p => [p.id, p]))
      return alerts.map(a => ({ ...a, product: prodMap[a.product_id] || null }))
    },
    refetchInterval: 30000
  })

  const resolveMutation = useMutation({
    mutationFn: async ({ alert, qty }) => {
      const quantity = parseInt(qty)
      if (!quantity || quantity < 1) throw new Error('Cantidad inválida')
      const newStock = (alert.product?.stock || 0) + quantity
      const { error: e1 } = await insforge.database
        .from('crm_products')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', alert.product_id)
      if (e1) throw e1
      const { error: e2 } = await insforge.database
        .from('stock_movements')
        .insert([{ product_id: alert.product_id, type: 'entrada', quantity, notes: 'Reposición desde alerta' }])
      if (e2) throw e2
      const { error: e3 } = await insforge.database
        .from('stock_alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alert.id)
      if (e3) throw e3
    },
    onSuccess: () => {
      toast.success('Stock repuesto y alerta resuelta ✅')
      qc.invalidateQueries(['stock_alerts'])
      qc.invalidateQueries(['crm_products'])
      setSelected(null)
    },
    onError: (e) => toast.error(e.message)
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Alertas de Stock</h1>
        <p className="text-gray-400 text-sm mt-1">{alertas.length} alertas pendientes</p>
      </div>

      {alertas.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-medium">No hay alertas pendientes ✅</p>
          <p className="text-gray-500 text-sm mt-1">Todo el stock está en orden</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alertas.map(alerta => (
            <div key={alerta.id} className="bg-gray-900 border border-red-500/30 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{alerta.product?.name || 'Producto'}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(alerta.created_at).toLocaleDateString('es-PY')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-red-400 font-bold text-lg">{alerta.product?.stock ?? '-'}</p>
                  <p className="text-gray-500 text-xs">Stock actual</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-gray-300 font-bold text-lg">{alerta.product?.min_stock ?? '-'}</p>
                  <p className="text-gray-500 text-xs">Mínimo</p>
                </div>
              </div>
              <button
                onClick={() => { setSelected(alerta); reset({ qty: '' }) }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm transition-colors"
              >
                Reponer Stock
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={`Reponer — ${selected.product?.name}`} onClose={() => setSelected(null)}>
          <div className="mb-4 p-3 bg-gray-800 rounded-lg grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-red-400 font-bold">{selected.product?.stock}</p>
              <p className="text-gray-500 text-xs">Actual</p>
            </div>
            <div className="text-center">
              <p className="text-gray-300 font-bold">{selected.product?.min_stock}</p>
              <p className="text-gray-500 text-xs">Mínimo</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(v => resolveMutation.mutate({ alert: selected, qty: v.qty }))} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cantidad a agregar *</label>
              <input type="number" min="1" {...register('qty', { required: true })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setSelected(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" disabled={resolveMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50">
                {resolveMutation.isPending ? 'Reponiendo...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
