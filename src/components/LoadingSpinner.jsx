export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-purple-600 border-t-transparent rounded-full animate-spin`}
      />
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
