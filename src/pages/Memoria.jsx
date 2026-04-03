import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Edit2, Trash2, Brain, X } from 'lucide-react'
import insforge from '../lib/insforge'
import { useCompany } from '../hooks/useCompany'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const TIPOS = ['todos', 'producto', 'servicio', 'horario', 'politica', 'faq', 'otro']
const TIPO_COLORS = {
  producto: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  servicio: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  horario: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  politica: 'bg-red-500/20 text-red-400 border-red-500/30',
  faq: 'bg-green-500/20 text-green-400 border-green-500/30',
  otro: 'bg-gray-500/20 text-gray-400 border-gray-600',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function Memoria() {
  const { company } = useCompany()
  const qc = useQueryClient()
  const [filtro, setFiltro] = useState('todos')
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const { register, handleSubmit, reset, setValue } = useForm()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['memory_items', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await insforge.database
        .from('memory_items')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    }
  })

  const filtered = filtro === 'todos' ? items : items.filter(i => i.type === filtro)

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const tags = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      const payload = { ...values, tags, company_id: company.id, active: values.active === true || values.active === 'true' }
      delete payload.tags_raw
      if (selected) {
        const { error } = await insforge.database.from('memory_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', selected.id)
        if (error) throw error
      } else {
        const { error } = await insforge.database.from('memory_items').insert([payload])
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(selected ? 'Ítem actualizado' : 'Ítem creado')
      qc.invalidateQueries(['memory_items'])
      closeModal()
    },
    onError: (e) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await insforge.database.from('memory_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Ítem eliminado'); qc.invalidateQueries(['memory_items']) },
    onError: (e) => toast.error(e.message)
  })

  function openCreate() {
    setSelected(null)
    reset({ type: 'producto', title: '', content: '', tags: '', active: true })
    setModal(true)
  }

  function openEdit(item) {
    setSelected(item)
    setValue('type', item.type)
    setValue('title', item.title)
    setValue('content', item.content)
    setValue('tags', Array.isArray(item.tags) ? item.tags.join(', ') : '')
    setValue('active', item.active)
    setModal(true)
  }

  function closeModal() { setModal(false); setSelected(null) }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Memoria del Asistente</h1>
          <p className="text-gray-400 text-sm mt-1">Base de conocimiento para el bot de WhatsApp</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Nuevo ítem
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TIPOS.map(t => (
          <button key={t} onClick={() => setFiltro(t)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize ${filtro === t ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No hay ítems de memoria. Agregá información para que el asistente pueda responder mejor.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${TIPO_COLORS[item.type] || TIPO_COLORS.otro}`}>{item.type}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-gray-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if(confirm('¿Eliminar este ítem?')) deleteMutation.mutate(item.id) }} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">{item.title}</h3>
                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.content}</p>
              </div>
              {Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}
              {!item.active && <span className="text-xs text-gray-600">Inactivo</span>}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={selected ? 'Editar ítem' : 'Nuevo ítem de memoria'} onClose={closeModal}>
          <form onSubmit={handleSubmit(v => saveMutation.mutate(v))} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo *</label>
              <select {...register('type', { required: true })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500">
                {TIPOS.filter(t => t !== 'todos').map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Título *</label>
              <input {...register('title', { required: true })} placeholder="Ej: Horario de atención" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contenido *</label>
              <textarea rows={5} {...register('content', { required: true })} placeholder="Ej: Lunes a viernes de 8:00 a 18:00, sábados de 8:00 a 12:00" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tags (separados por coma)</label>
              <input {...register('tags')} placeholder="horario, atención, contacto" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('active')} id="active" className="accent-purple-500" />
              <label htmlFor="active" className="text-sm text-gray-400">Activo (el bot lo usa)</label>
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
    </div>
  )
}
