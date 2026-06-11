import { Link } from 'react-router-dom'

const EmptyState = ({ action, description, title }) => (
  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
    {/* Demo Product Icon */}
    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F6F6F8]">
      <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    </div>
    
    <h3 className="font-sans text-xl font-bold text-gray-900">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
    
    {action ? (
      <div className="mt-6">
        {action}
      </div>
    ) : null}
  </div>
)

export default EmptyState
