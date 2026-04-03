import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Building2 } from 'lucide-react'
import insforge from '../lib/insforge'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Setup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      const { error } = await insforge.db
        .from('companies')
        .insert({
          owner_id: user.id,
          name: data.name,
          description: data.description || null,
        })
      if (error) throw error
      toast.success('Empresa creada exitosamente')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Error al crear empresa: ' + (err.message || 'Intenta de nuevo'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Configura tu empresa</h1>
          <p className="text-gray-400">Último paso para comenzar</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nombre de la empresa *
              </label>
              <input
                {...register('name', { required: 'El nombre es obligatorio' })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Mi Empresa S.A."
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Describe brevemente tu empresa..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
            >
              {isSubmitting ? 'Creando...' : 'Crear empresa y continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
