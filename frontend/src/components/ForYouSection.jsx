import { Link } from 'react-router-dom'
import EmptyState from './EmptyState'
import { useGetProductsQuery } from '../features/api/apiSlice'
import { formatCurrency } from '../utils/currency'
import { getImageUrl } from '../utils/formatters'

const ProductTile = ({ item }) => (
  <Link
    to={`/products/${item.slug}`}
    className="group flex flex-col overflow-hidden rounded-lg border border-[#e8e8ed] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
  >
    <div className="img-group relative aspect-square w-full overflow-hidden">
      <img
        src={getImageUrl(item.images?.[0])}
        alt={item.name}
        className="h-full w-full"
        style={{ objectFit: 'cover', objectPosition: 'center 90%', backgroundColor: 'rgba(118, 118, 118, 0.08)' }}
        loading="lazy"
      />
    </div>

    <div className="flex flex-1 flex-col items-center justify-between bg-white p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#67656C]" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {item.vendorName || item.collection || 'Live catalog'}
      </p>

      <h3 className="mt-1.25 line-clamp-2 text-[14px] font-bold text-[#333333]">
        {item.name}
      </h3>

      <div className="my-2 w-full border-t border-[#e8e8ed]"></div>

      <div className="flex items-center justify-center gap-1.5">
        <span className="text-[15.7224px] font-bold text-[#561AFD]">
          {formatCurrency(item.salePrice ?? item.price)}
        </span>
        {item.salePrice ? (
          <span className="text-[10px] text-[#67656C] line-through" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {formatCurrency(item.price)}
          </span>
        ) : null}
      </div>
    </div>
  </Link>
)

const ForYouSection = () => {
  const { data, isLoading } = useGetProductsQuery({
    limit: 24,
    sortBy: 'new_arrivals',
    publicOnly: true,
  })

  const items = data?.products || []

  return (
    <section className="section-shell pt-3">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[2.5rem] font-extrabold leading-none text-[#2f3137]">For You</h2>
        <Link to="/products" className="text-sm font-semibold text-[#6236FF] hover:text-[#5235E8] flex items-center gap-1 transition">
          View All <span aria-hidden="true">→</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <ProductTile key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No products yet"
          description="When vendors upload products, they will appear here automatically."
          action={<Link to="/vendor/onboarding" className="gold-button">Become a seller</Link>}
        />
      )}
    </section>
  )
}

export default ForYouSection
