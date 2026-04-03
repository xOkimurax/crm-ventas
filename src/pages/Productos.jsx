import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Edit2, Trash2, Package, AlertTriangle, X } from 'lucide-react'
import insforge from '../lib/insforge'
import { useCompany } from '../hooks/useCompany'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Productos() {
  const { company } = useCompany()
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'create' | 'edit' | 'restock'
  const [selected, setSelected] = useState(null)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['crm_products', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await insforge.database
        .from('crm_products')
        .select('*')
        .eq('company_id', company.id)
        .order('name')
      if (error) throw error
      return data || []
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const payload = { ...values, company_id: company.id, price: parseFloat(values.price) || 0, stock: parseInt(values.stock) || 0, min_stock: parseInt(values.min_stock) || 5 }
      if (selected) {
        const { error } = await insforge.database.from('crm_products').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', selected.id)
        if (error) throw error
      } else {
        const { error } = await insforge.database.from('crm_products').insert([payload])
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(selected ? 'Producto actualizado' : 'Producto creado')
      qc.invalidateQueries(['crm_products'])
      closeModal()
    },
    onError: (e) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await insforge.database.from('crm_products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Producto eliminado'); qc.invalidateQueries(['crm_products']) },
    onError: (e) => toast.error(e.message)
  })

  const restockMutation = useMutation({
    mutationFn: async ({ product, qty }) => {
      const newStock = product.stock + parseInt(qty)
      const { error: e1 } = await insforge.database.from('crm_products').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', product.id)
      if (e1) throw e1
      const { error: e2 } = await insforge.database.from('stock_movements').insert([{ product_id: product.id, type: 'entrada', quantity: parseInt(qty), notes: 'Reposición manual' }])
      if (e2) throw e2
      // resolver alerta si existe
      await insforge.database.from('stock_alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('product_id', product.id).eq('status', 'pending')
    },
    onSuccess: () => { toast.success('Stock repuesto'); qc.invalidateQueries(['crm_products']); qc.invalidateQueries(['stock_alerts']); closeModal() },
    onError: (e) => toast.error(e.message)
  })

  function openCreate() { reset({ name: '', description: '', price: '', stock: '', min_stock: '5', unit: 'unidad', active: true }); setSelected(null); setModal('create') }
  function openEdit(p) { setSelected(p); setValue('name', p.name); setValue('description', p.description || ''); setValue('price', p.price); setValue('stock', p.stock); setValue('min_stock', p.min_stock); setValue('unit', p.unit); setValue('active', p.active); setModal('edit') }
  function openRestock(p) { setSelected(p); reset({ qty: '' }); setModal('restock') }
  function closeModal() { setModal(null); setSelected(null) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Productos</h1>
          <p className="text-gray-400 text-sm mt-1">{productos.length} productos registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {['Producto', 'Precio', 'Stock', 'Mín.', 'Unidad', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {productos.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-12">No hay productos</td></tr>
            ) : productos.map(p => {
              const lowStock = p.stock <= p.min_stock
              return (
                <tr key={p.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-white text-sm font-medium">{p.name}</p>
                        {p.description && <p className="text-gray-500 text-xs">{p.description.slice(0, 40)}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">Gs. {Number(p.price).toLocaleString('es-PY')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${lowStock ? 'text-red-400' : 'text-green-400'}`}>{p.stock}</span>
                      {lowStock && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Stock bajo</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{p.min_stock}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{p.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${p.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-600'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openRestock(p)} className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 px-2 py-1 rounded transition-colors">Reponer</button>
                      <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if(confirm('¿Eliminar producto?')) deleteMutation.mutate(p.id) }} className="text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={selected ? 'Editar Producto' : 'Nuevo Producto'} onClose={closeModal}>
          <form onSubmit={handleSubmit(v => saveMutation.mutate(v))} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
              <input {...register('name', { required: true })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Descripción</label>
              <input {...register('description')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Precio (Gs.)</label>
                <input type="number" {...register('price')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Unidad</label>
                <input {...register('unit')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stock actual</label>
                <input type="number" {...register('stock')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stock mínimo</label>
                <input type="number" {...register('min_stock')} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('active')} id="active" className="accent-purple-500" />
              <label htmlFor="active" className="text-sm text-gray-400">Producto activo</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" disabled={saveMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50">
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'restock' && selected && (
        <Modal title={`Reponer stock — ${selected.name}`} onClose={closeModal}>
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-sm">Stock actual: <span className="text-white font-semibold">{selected.stock}</span></p>
          </div>
          <form onSubmit={handleSubmit(v => restockMutation.mutate({ product: selected, qty: v.qty }))} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cantidad a agregar *</label>
              <input type="number" min="1" {...register('qty', { required: true, min: 1 })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={closeModal} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" disabled={restockMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50">
                {restockMutation.isPending ? 'Reponiendo...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
