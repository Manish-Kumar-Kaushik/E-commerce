import { Link } from 'react-router-dom'

const Breadcrumbs = ({ items }) => (
  <nav className="surface-panel mb-7 inline-flex flex-wrap items-center gap-2 rounded-full px-4 py-3 text-[11px] uppercase tracking-[0.28em] text-stone-500">
    <Link to="/" className="transition hover:text-stone-900">
      Home
    </Link>
    {items.map((item) => (
      <span key={item.label} className="flex items-center gap-2">
        <span className="text-[#c8ab68]">/</span>
        {item.to ? (
          <Link to={item.to} className="transition hover:text-stone-900">
            {item.label}
          </Link>
        ) : (
          <span className="text-stone-900">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
)

export default Breadcrumbs
