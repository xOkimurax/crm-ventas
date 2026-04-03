import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, User } from 'lucide-react'
import insforge from '../lib/insforge'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../hooks/useCompany'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        <h2 className="text-white font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function Config() {
  const { user } = useAuth()
  const { company, loading } = useCompany()
  const qc = useQueryClient()

  const companyForm = useForm()
  const profileForm = useForm()

  useEffect(() => {
    if (company) {
      companyForm.setValue('name', company.name || '')
      companyForm.setValue('description', company.description || '')
    }
  }, [company])

  useEffect(() => {
    if (user) {
      profileForm.setValue('displayName', user.user_metadata?.name || user.name || '')
    }
  }, [user])

  const saveCompany = useMutation({
    mutationFn: async (values) => {
      const { error } = await insforge.database
        .from('companies')
        .update({ name: values.name, description: values.description, updated_at: new Date().toISOString() })
        .eq('id', company.id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Empresa actualizada ✅'); qc.invalidateQueries(['company']) },
    onError: (e) => toast.error(e.message)
  })

  const saveProfile = useMutation({
    mutationFn: async (values) => {
      const { error } = await insforge.auth.setProfile({ displayName: values.displayName })
      if (error) throw error
    },
    onSuccess: () => toast.success('Perfil actualizado ✅'),
    onError: (e) => toast.error(e.message)
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 text-sm mt-1">Ajustá tu empresa y perfil</p>
      </div>

      <div className="space-y-6">
        {/* Empresa */}
        <Section icon={Building2} title="Mi Empresa">
          <form onSubmit={companyForm.handleSubmit(v => saveCompany.mutate(v))} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre de la empresa *</label>
              <input {...companyForm.register('name', { required: true })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Descripción</label>
              <textarea rows={3} {...companyForm.register('description')}
                placeholder="Descripción de tu negocio..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none" />
            </div>
            <button type="submit" disabled={saveCompany.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm">
              {saveCompany.isPending ? 'Guardando...' : 'Guardar empresa'}
            </button>
          </form>
        </Section>

        {/* Cuenta */}
        <Section icon={User} title="Mi Cuenta">
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-xs mb-1">Email</p>
            <p className="text-white text-sm">{user?.email || '—'}</p>
          </div>
          <form onSubmit={profileForm.handleSubmit(v => saveProfile.mutate(v))} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre de usuario</label>
              <input {...profileForm.register('displayName')}
                placeholder="Tu nombre"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <button type="submit" disabled={saveProfile.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm">
              {saveProfile.isPending ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </form>
        </Section>
      </div>
    </div>
  )
}
