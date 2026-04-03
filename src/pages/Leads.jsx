import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Search, X, Phone, User, Calendar } from 'lucide-react'
import insforge from '../lib/insforge'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../hooks/useCompany'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  nuevo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  en_proceso: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  cerrado: 'bg-green-500/20 text-green-400 border-green-500/30',
  perdido: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const STATUS_LABELS = {
  nuevo: 'Nuevo',
  en_proceso: 'En proceso',
  cerrado: 'Cerrado',
  perdido: 'Perdido',
}

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function LeadModal({ lead, companyId, onClose, queryClient }) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      status: lead?.status || 'nuevo',
      notes: lead?.notes || '',
    }
  })
  const [saving, setSaving] = useState(false)

  const onSave = async (data) => {
    setSaving(true)
    try {
      const { error } = await insforge.db
        .from('leads')
        .update({ status: data.status, notes: data.notes, updated_at: new Date().toISOString() })
        .eq('id', lead.id)
      if (error) throw error
      toast.success('Lead actualizado')
      queryClient.invalidateQueries(['leads', companyId])
      onClose()
    } catch (err) {
      toast.error('Error: ' + (err.message || 'Intenta de nuevo'))
    } finally {
      setSaving(false)
    }
  }

  const currentStatus = watch('status')

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Detalle del Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Nombre</p>
              <p className="text-white font-medium">{lead.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Teléfono</p>
              <p className="text-white font-medium">{lead.phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Fuente</p>
              <p className="text-white">{lead.source || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Creado</p>
              <p className="text-white">{new Date(lead.created_at).toLocaleDateString('es')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSave)} className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <label key={value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${currentStatus === value ? STATUS_COLORS[value] + ' border-current' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    <input type="radio" value={value} {...register('status')} className="hidden" />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function CreateLeadModal({ companyId, onClose, queryClient }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      const { error } = await insforge.db.from('leads').insert({
        company_id: companyId,
        name: data.name,
        phone: data.phone || null,
        source: data.source || null,
        status: 'nuevo',
      })
      if (error) throw error
      toast.success('Lead creado')
      queryClient.invalidateQueries(['leads', companyId])
      onClose()
    } catch (err) {
      toast.error('Error: ' + (err.message || 'Intenta de nuevo'))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Nuevo Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
            <input
              {...register('name', { required: 'Obligatorio' })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
            <input
              {...register('phone')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Fuente</label>
            <input
              {...register('source')}
              placeholder="WhatsApp, web, referido..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl disabled:opacity-50">
              {isSubmitting ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Leads() {
  const { user } = useAuth()
  const { company } = useCompany(user?.id)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await insforge.db
        .from('leads')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
      return data || []
    },
  })

  const filtered = (leads || []).filter(l => {
    const matchSearch = !search ||
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search)
    const matchStatus = filterStatus === 'all' || l.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 text-sm mt-0.5">{leads?.length || 0} en total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'nuevo', 'en_proceso', 'cerrado', 'perdido'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterStatus === s ? 'bg-purple-600 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay leads</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Fuente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-white font-medium text-sm">{lead.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {lead.phone || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{lead.source || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.created_at).toLocaleDateString('es')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          companyId={company.id}
          onClose={() => setSelectedLead(null)}
          queryClient={queryClient}
        />
      )}
      {showCreate && (
        <CreateLeadModal
          companyId={company.id}
          onClose={() => setShowCreate(false)}
          queryClient={queryClient}
        />
      )}
    </div>
  )
}
