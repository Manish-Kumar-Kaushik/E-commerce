import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from './EmptyState'
import { useGetProductsQuery } from '../features/api/apiSlice'
import { formatCurrency } from '../utils/currency'
import { getImageUrl } from '../utils/formatters'
import { getProductPricing } from '../utils/pricing'

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7">
    <path d="M4 5h2l2.2 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L21 8H8" />
    <circle cx="10" cy="19" r="1.2" />
    <circle cx="18" cy="19" r="1.2" />
  </svg>
)

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 19, minutes: 23 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes } = prev
        minutes -= 1

        if (minutes < 0) {
          minutes = 59
          hours -= 1

          if (hours < 0) {
            hours = 23
            days -= 1

            if (days < 0) {
              days = 0
              hours = 0
              minutes = 0
            }
          }
        }

        return { days, hours, minutes }
      })
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const formatNumber = (value) => value.toString().padStart(2, '0')

  return (
    <div className="flex items-center justify-center gap-2" role="generic">
      {['days', 'hours', 'minutes'].map((key, index) => (
        <div key={key} className="flex items-center gap-2">
          <div style={{ backgroundColor: '#4614c3', padding: '6px 12px', borderRadius: '4px' }}>
            <span className="font-poppins text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', color: '#FFFFFF' }}>
              {formatNumber(timeLeft[key])}
            </span>
          </div>
          {index < 2 ? (
            <span className="font-poppins text-lg font-bold" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', color: '#4614c3' }}>
              :
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

const HorizontalProductCard = ({ product }) => {
  const pricing = getProductPricing(product)
  const displayPrice = pricing.discountedPrice || pricing.finalPrice
  
  return (
  <Link
    to={`/products/${product.slug}`}
    className="product-card deal-product-horizontal flex gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5"
  >
    <div className="img-group relative aspect-4/3 shrink-0 overflow-hidden rounded-md" style={{ width: '45%', height: '100%', padding: '12px', backgroundColor: 'rgba(118, 118, 118, 0.08)' }}>
      <img src={getImageUrl(product.images?.[0])} alt={product.name} className="h-full w-full object-contain" />
    </div>

    <div className="deals-product flex flex-1 flex-col justify-center" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
      <p className="text-xs uppercase tracking-wider text-gray-400" style={{ marginBottom: '24px' }}>
        {product.vendorName || product.collection || 'Live catalog'}
      </p>

      <h3 className="text-lg font-semibold text-gray-900" style={{ marginBottom: '24px' }}>
        {product.name}
      </h3>

      <div className="flex items-center gap-2" style={{ marginBottom: '24px' }}>
        <span className="text-[15.7224px] font-bold text-[#561AFD]">{formatCurrency(displayPrice)}</span>
        {product.salePrice ? <span className="text-sm text-gray-400 line-through">{formatCurrency(pricing.finalPrice)}</span> : null}
        <span className="text-xs text-gray-500">incl. {pricing.gstRate}% GST</span>
      </div>

      <div className="btn-group flex gap-[1.26rem]">
        <span className="rounded-md border border-(--color-primary) px-4 py-2 text-sm font-medium text-(--color-primary) transition hover:bg-gray-50">
          View product
        </span>
        <span className="rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90" style={{ backgroundColor: '#4614c3' }}>
          Shop now
        </span>
      </div>
    </div>
  </Link>
  )
}

const SmallProductCard = ({ product }) => {
  const pricing = getProductPricing(product)
  const displayPrice = pricing.discountedPrice || pricing.finalPrice
  
  return (
  <Link
    to={`/products/${product.slug}`}
    className="product-card min-h-full flex flex-col rounded-lg border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="img-group relative aspect-square w-full overflow-hidden">
      <img
        src={getImageUrl(product.images?.[0])}
        alt={product.name}
        className="h-full w-full"
        style={{ objectFit: 'cover', objectPosition: 'center 90%', backgroundColor: 'rgba(118, 118, 118, 0.08)' }}
      />
    </div>

    <div className="flex flex-1 flex-col bg-white p-3">
      <h3 className="mb-2 line-clamp-2 text-sm font-medium text-gray-700">{product.name}</h3>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[15.7224px] font-bold text-[#561AFD]">{formatCurrency(displayPrice)}</span>
          <span className="text-[10px] text-gray-500">+{pricing.gstRate}% GST</span>
          {product.salePrice ? <span className="text-xs text-gray-400 line-through">{formatCurrency(pricing.finalPrice)}</span> : null}
        </div>
        <span className="rounded-md bg-(--color-primary-light) px-2 py-1 text-xs text-(--color-primary) transition">
          <CartIcon />
        </span>
      </div>
    </div>
  </Link>
  )
}

const DealsSection = () => {
  const { data, isLoading } = useGetProductsQuery({
    limit: 8,
    sortBy: 'featured',
    publicOnly: true,
  })

  const products = data?.products || []
  const todaysDealsProducts = useMemo(() => products.slice(0, 2), [products])
  const bestSellingProducts = useMemo(() => products.slice(2, 8), [products])

  return (
    <section className="section-shell bg-white">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold text-gray-900">Today's Deals</h2>
              <CountdownTimer />
            </div>
            <Link to="/products" className="flex items-center gap-1 text-sm font-semibold text-[#6236FF] transition hover:text-[#5235E8]">
              View All <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-36 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-36 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ) : todaysDealsProducts.length ? (
            <div className="flex flex-col gap-4">
              {todaysDealsProducts.map((product) => (
                <HorizontalProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No live deals yet"
              description="When vendors publish products, they will appear here automatically."
              action={<Link to="/products" className="gold-button">Browse catalog</Link>}
            />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900">Best Selling</h2>
            <Link to="/products" className="flex items-center gap-1 text-sm font-semibold text-[#6236FF] transition hover:text-[#5235E8]">
              View All <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : bestSellingProducts.length ? (
            <div className="grid grid-cols-3 gap-3">
              {bestSellingProducts.map((product) => (
                <SmallProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No featured products yet"
              description="Featured products will show here as soon as vendors upload them."
              action={<Link to="/vendor/onboarding" className="gold-button">Become a seller</Link>}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default DealsSection
