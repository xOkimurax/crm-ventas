import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Users, ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import insforge from '../lib/insforge'
import { useCompany } from '../hooks/useCompany'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'

function KpiCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-300">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default function Dashboard() {
  const { user } = useAuth()
  const { company } = useCompany(user?.id)

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-active', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await insforge.db
        .from('leads')
        .select('*')
        .eq('company_id', company.id)
        .in('status', ['nuevo', 'en_proceso'])
      return data || []
    },
  })

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: salesMonth, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-month', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await insforge.db
        .from('crm_sales')
        .select('*')
        .eq('company_id', company.id)
        .gte('sold_at', firstOfMonth)
      return data || []
    },
  })

  const { data: allSales } = useQuery({
    queryKey: ['sales-all', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await insforge.db
        .from('crm_sales')
        .select('*')
        .eq('company_id', company.id)
      return data || []
    },
  })

  const { data: stockAlerts } = useQuery({
    queryKey: ['stock-alerts', company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data } = await insforge.db
        .from('stock_alerts')
        .select('*, crm_products(name, stock, min_stock)')
        .eq('company_id', company.id)
        .eq('status', 'pending')
      return data || []
    },
  })

  // Build chart data for last 7 days
  const days = getLast7Days()
  const chartData = days.map(day => {
    const daySales = (allSales || []).filter(s => s.sold_at?.slice(0, 10) === day)
    return {
      day: new Date(day + 'T00:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric' }),
      ventas: daySales.reduce((sum, s) => sum + Number(s.amount || 0), 0),
      cantidad: daySales.length,
    }
  })

  const totalMonth = (salesMonth || []).reduce((s, v) => s + Number(v.amount || 0), 0)
  const totalRecaudado = (allSales || []).filter(s => s.status === 'pagado').reduce((s, v) => s + Number(v.amount || 0), 0)
  const closedLeads = (allSales || []).length
  const totalLeadsAll = closedLeads + (leads?.length || 0)
  const closureRate = totalLeadsAll > 0 ? Math.round((closedLeads / totalLeadsAll) * 100) : 0

  if (leadsLoading || salesLoading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Bienvenido, {company?.name}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Leads activos"
          value={leads?.length || 0}
          subtitle="nuevo + en proceso"
          icon={Users}
          color="bg-blue-600/20 text-blue-400"
        />
        <KpiCard
          title="Ventas del mes"
          value={salesMonth?.length || 0}
          subtitle={`$${totalMonth.toLocaleString()}`}
          icon={ShoppingCart}
          color="bg-purple-600/20 text-purple-400"
        />
        <KpiCard
          title="Total recaudado"
          value={`$${totalRecaudado.toLocaleString()}`}
          subtitle="pagos confirmados"
          icon={DollarSign}
          color="bg-green-600/20 text-green-400"
        />
        <KpiCard
          title="Tasa de cierre"
          value={`${closureRate}%`}
          subtitle="leads convertidos"
          icon={TrendingUp}
          color="bg-orange-600/20 text-orange-400"
        />
      </div>

      {/* Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Ventas últimos 7 días</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#e5e7eb' }}
              itemStyle={{ color: '#a78bfa' }}
              formatter={(v) => [`$${v.toLocaleString()}`, 'Ventas']}
            />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#colorVentas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stock alerts */}
      {stockAlerts?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">
              Alertas de stock ({stockAlerts.length})
            </h2>
          </div>
          <div className="space-y-2">
            {stockAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-300 text-sm">{alert.crm_products?.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Stock: {alert.crm_products?.stock}</span>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Bajo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
