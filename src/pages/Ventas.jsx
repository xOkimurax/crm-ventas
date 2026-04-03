import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Download, X, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react'
import { jsPDF } from 'jspdf'
import insforge from '../lib/insforge'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../hooks/useCompany'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function NewSaleModal({ companyId, onClose, queryClient }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const { data: leads } = useQuery({
    queryKey: ['leads-all', companyId],
    queryFn: async () => {
      const { data } = await insforge.db.from('leads').select('id, name').eq('company_id', companyId)
      return data || []
    },
  })

  const { data: products } = useQuery({
    queryKey: ['products-all', companyId],
    queryFn: async () => {
      const { data } = await insforge.db.from('crm_products').select('id, name, price, stock').eq('company_id', companyId).eq('active', true)
      return data || []
    },
  })

  const onSubmit = async (data) => {
    try {
      const productId = data.product_id || null
      const leadId = data.lead_id || null

      const { error } = await insforge.db.from('crm_sales').insert({
        company_id: companyId,
        lead_id: leadId || null,
        product_name: data.product_name,
        amount: parseFloat(data.amount),
        status: data.status,
        notes: data.notes || null,
        sold_at: new Date().toISOString(),
      })
      if (error) throw error

      // Discount stock if product selected
      if (productId) {
        const product = products?.find(p => p.id == productId)
        if (product) {
          const newStock = (product.stock || 0) - 1
          await insforge.db.from('crm_products').update({ stock: newStock }).eq('id', productId)
          await insforge.db.from('stock_movements').insert({
            product_id: productId,
            type: 'salida',
            quantity: 1,
            notes: `Venta: ${data.product_name}`,
          })
          // Check if stock below min_stock
          const { data: prod } = await insforge.db.from('crm_products').select('min_stock').eq('id', productId).single()
          if (prod && newStock <= prod.min_stock) {
            await insforge.db.from('stock_alerts').insert({
              company_id: companyId,
              product_id: productId,
              status: 'pending',
            })
          }
        }
      }

      toast.success('Venta registrada')
      queryClient.invalidateQueries(['ventas', companyId])
      queryClient.invalidateQueries(['products', companyId])
      onClose()
    } catch (err) {
      toast.error('Error: ' + (err.message || 'Intenta de nuevo'))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-lg font-semibold text-white">Nueva Venta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Cliente (Lead)</label>
            <select {...register('lead_id')} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
              <option value="">Sin lead asociado</option>
              {leads?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Producto</label>
            <select {...register('product_id')} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
              <option value="">Sin producto (manual)</option>
              {products?.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del producto *</label>
            <input
              {...register('product_name', { required: 'Obligatorio' })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            {errors.product_name && <p className="text-red-400 text-xs mt-1">{errors.product_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Monto *</label>
            <input
              {...register('amount', { required: 'Obligatorio', min: { value: 0, message: 'Debe ser positivo' } })}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
            <select {...register('status')} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
            <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:outline-none focus:border-purple-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Registrar venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Ventas() {
  const { user } = useAuth()
  const { company } = useCompany(user?.id)
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchClient, setSearchClient] = useState('')

  const { data: ventas, isLoading } = useQuery({
    queryKey: ['ventas', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await insforge.db
        .from('crm_sales')
        .select('*, leads(name, phone)')
        .eq('company_id', company.id)
        .order('sold_at', { ascending: false })
      return data || []
    },
  })

  const filtered = (ventas || []).filter(v => {
    if (filterStatus !== 'all' && v.status !== filterStatus) return false
    if (dateFrom && v.sold_at < dateFrom) return false
    if (dateTo && v.sold_at > dateTo + 'T23:59:59') return false
    if (searchClient && !v.leads?.name?.toLowerCase().includes(searchClient.toLowerCase())) return false
    return true
  })

  const total = filtered.reduce((s, v) => s + Number(v.amount || 0), 0)
  const avgTicket = filtered.length > 0 ? total / filtered.length : 0

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Reporte de Ventas', 14, 15)
    doc.setFontSize(10)
    doc.text(`Empresa: ${company?.name}`, 14, 25)
    doc.text(`Total: $${total.toLocaleString()} | Cantidad: ${filtered.length}`, 14, 32)

    let y = 45
    doc.setFontSize(9)
    doc.text('Cliente', 14, y)
    doc.text('Producto', 70, y)
    doc.text('Monto', 130, y)
    doc.text('Estado', 155, y)
    doc.text('Fecha', 175, y)
    y += 5
    doc.line(14, y, 196, y)
    y += 5

    filtered.forEach(v => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(v.leads?.name || '-', 14, y)
      doc.text(v.product_name || '-', 70, y)
      doc.text(`$${Number(v.amount).toLocaleString()}`, 130, y)
      doc.text(v.status, 155, y)
      doc.text(new Date(v.sold_at).toLocaleDateString('es'), 175, y)
      y += 7
    })

    doc.save(`ventas-${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.success('PDF exportado')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ventas</h1>
          <p className="text-gray-400 text-sm mt-0.5">{filtered.length} registros</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-xl text-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva Venta
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total vendido" value={`$${total.toLocaleString()}`} icon={DollarSign} color="bg-green-600/20 text-green-400" />
        <SummaryCard label="Cantidad" value={filtered.length} icon={ShoppingBag} color="bg-purple-600/20 text-purple-400" />
        <SummaryCard label="Ticket promedio" value={`$${Math.round(avgTicket).toLocaleString()}`} icon={TrendingUp} color="bg-blue-600/20 text-blue-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={searchClient}
          onChange={e => setSearchClient(e.target.value)}
          placeholder="Buscar cliente..."
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
        />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500" />
        {['all', 'pendiente', 'pagado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterStatus === s ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}>
            {s === 'all' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay ventas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-white text-sm">{v.leads?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{v.product_name}</td>
                    <td className="px-4 py-3 text-green-400 font-medium text-sm">${Number(v.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${v.status === 'pagado' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{new Date(v.sold_at).toLocaleDateString('es')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <NewSaleModal companyId={company.id} onClose={() => setShowCreate(false)} queryClient={queryClient} />}
    </div>
  )
}
