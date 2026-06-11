import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/currency'
import { getDiscountPercentage, getImageUrl } from '../utils/formatters'
import { getProductPricing } from '../utils/pricing'

const ProductCard = ({ product }) => {
  const imageOne = getImageUrl(product.images?.[0])
  const imageTwo = getImageUrl(product.images?.[1] || product.images?.[0])
  const pricing = getProductPricing(product)
  const displayPrice = pricing.discountedPrice || pricing.finalPrice
  const discountPercentage = getDiscountPercentage(product.price, product.salePrice)

  return (
    <Link
      to={`/products/${product.slug}`}
      state={{ product }}
      className="group flex h-full w-full flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-[#F6F6F8] p-4 sm:p-5">
        <img
          src={imageOne}
          alt={product.name}
          className="h-full w-full object-contain transition duration-300 group-hover:opacity-0"
        />
        {imageTwo && (
          <img
            src={imageTwo}
            alt={product.name}
            className="absolute inset-[15%] h-[70%] w-[70%] object-contain opacity-0 transition duration-300 group-hover:opacity-100"
          />
        )}
        
        {/* Pill-shaped tag in top-right corner */}
        {product.category && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase text-gray-700 shadow-sm">
            {product.category}
          </span>
        )}
        
        {/* Sale badge */}
        {discountPercentage ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-medium uppercase text-white">
            {discountPercentage}% Off
          </span>
        ) : null}
        
        {/* Sold out badge */}
        {product.stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-medium uppercase text-gray-800">
              Sold Out
            </span>
          </span>
        )}
      </div>

      {/* Text Content */}
      <div className="mt-3 flex-1 px-1 sm:mt-4">
        {/* Header Row: Product Name + Price (GST-inclusive) */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-sans text-sm font-bold uppercase text-[#333333] sm:text-base">
            {product.name}
          </h3>
          <span className="whitespace-nowrap font-sans text-xs font-semibold text-[#333333] sm:text-sm">
            {formatCurrency(displayPrice)}
          </span>
        </div>

        {/* GST info and original price if applicable */}
        <div className="mt-0.5 flex items-center justify-between text-[10px] text-gray-500">
          <span>incl. {pricing.gstRate}% GST</span>
          {product.salePrice && (
            <span className="line-through">{formatCurrency(pricing.finalPrice)}</span>
          )}
        </div>

        {/* Description - 2 lines truncated */}
        {product.description && (
          <p className="mt-2 line-clamp-2 font-sans text-[11px] leading-5 text-[#6B7280] sm:text-xs">
            {product.description}
          </p>
        )}
      </div>
    </Link>
  )
}

export default ProductCard
