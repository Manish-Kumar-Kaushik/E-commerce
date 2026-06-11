import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'
import QuantitySelector from '../components/QuantitySelector'
import Seo from '../components/Seo'
import {
  useGetProductQuery,
  useGetProductReviewsQuery,
  useGetReviewEligibilityQuery,
  useGetProductsQuery,
  useGetWishlistQuery,
  useToggleWishlistItemMutation,
} from '../features/api/apiSlice'
import { useCartActions } from '../hooks/useCart'
import { getImageUrl } from '../utils/formatters'
import { getProductPricing } from '../utils/pricing'

const productPerks = [
  '✓ Authenticity You Can Trust',
  '✓ Enjoy Cash on Delivery for Your Convenience',
  '✓ Easy Returns and Exchanges Within 7 Days',
]

const deliveryInfo = '🚚 Free Delivery on orders over ₹500'

const ProductPage = () => {
  const { slug } = useParams()
  const location = useLocation()
  const { data, isLoading, isError } = useGetProductQuery({ slug, publicOnly: true })
  const fallbackProduct = location.state?.product
  const product = data?.product || (fallbackProduct?.slug === slug ? fallbackProduct : null)
  
  const { data: relatedData } = useGetProductsQuery(
    product
      ? {
          category: product.category,
          limit: 6,
          publicOnly: true,
        }
      : { limit: 4 },
  )

  const relatedProducts = useMemo(
    () => (relatedData?.products || []).filter((item) => item.slug !== slug).slice(0, 4),
    [relatedData?.products, slug],
  )

  if (isLoading && !product) {
    return (
      <div className="container-shell py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-gray-200" />
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded-full bg-gray-200" />
            <div className="h-6 w-32 animate-pulse rounded-full bg-gray-200" />
            <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  if (!product && isError) {
    return (
      <div className="container-shell py-20">
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <p className="mt-2 text-sm text-gray-600">This product is unavailable right now.</p>
          <Link to="/products" className="mt-5 inline-block rounded-full bg-gray-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700">
            Back to products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProductView key={product._id} product={product} relatedProducts={relatedProducts} />
  )
}

const ProductView = ({ product, relatedProducts }) => {
  const navigate = useNavigate()
  const token = useSelector((state) => state.auth?.token)
  const authUser = useSelector((state) => state.auth?.user)
  const authUserId = authUser?._id || authUser?.id || null
  const initialColor = product.colors?.[0] || ''
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(initialColor)
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '')
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const { addItem, isMutating } = useCartActions()
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !token })
  const [toggleWishlistItem, { isLoading: isWishlistUpdating }] = useToggleWishlistItemMutation()

  const colorImageMap = useMemo(() => {
    const source = product.colorImages
    if (!source) return {}

    if (source instanceof Map) {
      return Array.from(source.entries()).reduce((acc, [key, value]) => {
        acc[String(key || '').toLowerCase()] = Array.isArray(value) ? value : []
        return acc
      }, {})
    }

    return Object.entries(source).reduce((acc, [key, value]) => {
      acc[String(key || '').toLowerCase()] = Array.isArray(value) ? value : []
      return acc
    }, {})
  }, [product.colorImages])

  const getColorImages = (color) => colorImageMap[String(color || '').toLowerCase()] || []
  
  const activeColorImages = selectedColor ? getColorImages(selectedColor) : []
  const galleryImages = activeColorImages.length ? activeColorImages : (product.images || [])
  const activeImage = getImageUrl(galleryImages?.[selectedImage])
  const colorOptionsWithPreview = (product.colors || []).map((color) => {
    const colorImages = getColorImages(color)
    const preview = getImageUrl(colorImages?.[0] || product.images?.[0])
    return {
      color,
      preview,
      hasVariantImages: colorImages.length > 0,
    }
  })
  const formatColorLabel = (value = '') =>
    String(value || '')
      .split(/[\s-_]+/)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
  const reviewsCount = product.reviewsCount || product.numReviews || 222
  const vendorDetails = product.vendorDetails || null
  const vendorAddress = vendorDetails?.businessAddress?.display || ''
  const wishlistItems = wishlistData?.wishlist?.items || []
  const isWishlisted = wishlistItems.some((item) => (item.product?._id || item._id) === product._id)
  const reviewIdentifier = product?._id || product?.slug
  const { data: reviewsData } = useGetProductReviewsQuery(
    { identifier: reviewIdentifier, limit: 5 },
    { skip: !reviewIdentifier },
  )
  const { data: eligibilityData } = useGetReviewEligibilityQuery(reviewIdentifier, {
    skip: !token || !reviewIdentifier,
  })

  const reviewSummary = reviewsData?.summary || {
    averageRating: Number(product.averageRating || product.rating || 0),
    totalReviews: Number(product.reviewsCount || product.numReviews || 0),
  }
  const pricing = useMemo(() => getProductPricing(product), [product])
  const recentReviews = reviewsData?.reviews || []
  const alreadyReviewed = recentReviews.some((review) => {
    const reviewUserId = review.user?._id || review.user?.id || review.user
    return reviewUserId?.toString?.() === authUserId?.toString?.()
  })
  const canReview = Boolean(eligibilityData?.eligibility?.canReview) && !alreadyReviewed

  const handleAddToCart = async () => {
    if (!selectedSize && product.sizes?.length > 0) {
      toast.error('Please select a size')
      return false
    }

    if (!selectedColor && product.colors?.length > 0) {
      toast.error('Please select a color')
      return false
    }

    return addItem({
      product,
      productId: product._id,
      quantity,
      size: selectedSize,
      color: selectedColor,
    })
  }

  const handleBuyNow = async () => {
    const added = await handleAddToCart()
    if (added) {
      navigate('/checkout')
    }
  }

  const handleWishlistToggle = async () => {
    if (!token) {
      toast.error('Please sign in to save wishlist items')
      return
    }

    try {
      await toggleWishlistItem(product._id).unwrap()
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to update wishlist')
    }
  }

  return (
    <>
      <Seo title={product.name} description={product.description} />

      <div className="container-shell py-6 sm:py-8">
        <Breadcrumbs items={[{ label: product.collection || 'Products', to: '/products' }, { label: product.name }]} />

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left - Image Gallery */}
          <section>
            <div className="rounded-xl bg-gray-100 p-3 sm:p-4">
              <img 
                src={activeImage} 
                alt={product.name} 
                className="aspect-square w-full object-contain"
              />
            </div>
            {galleryImages?.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((image, index) => {
                  const url = getImageUrl(image)
                  return (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 rounded-lg border-2 p-1 ${selectedImage === index ? 'border-gray-700' : 'border-transparent'}`}
                    >
                      <img src={url} alt={`${product.name} view ${index + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Right - Product Info */}
          <section className="rounded-xl bg-gray-50 p-4 sm:p-6">
            <h1 className="font-sans text-2xl font-bold text-[#333333] sm:text-3xl">{product.name}</h1>
            
            {/* Rating */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((point) => (
                  <span key={point} className="text-sm">{point <= Math.round(Number(reviewSummary.averageRating || 0)) ? '★' : '☆'}</span>
                ))}
              </div>
            </div>

            {canReview ? (
              <Link
                to={`/products/${product.slug || product._id}/reviews?write=1`}
                className="mt-2 inline-flex rounded-lg bg-[#6236FF] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#5235E8]"
              >
                Write a Review
              </Link>
            ) : (
              <p className="mt-2 text-sm text-gray-500">You can review after purchasing this product</p>
            )}

            <Link
              to={`/products/${product.slug || product._id}/reviews`}
              className="mt-2 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900"
            >
              See all customer reviews
            </Link>

            {/* Price */}
            <div className="mt-4">
              <span className="text-2xl font-bold text-[#374151]">
                ₹{pricing.discountedPrice}
              </span>
              {pricing.hasDiscount && (
                <span className="ml-3 text-base text-gray-400 line-through">
                  ₹{pricing.finalPrice}
                </span>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Final tax-inclusive price. Includes ₹{pricing.gstAmount} GST @ {pricing.gstRate}%.
              </p>
              {/* Detailed pricing breakdown should not be shown to customers — only to vendor/admin users */}
              {(authUser?.publicMetadata?.role === 'vendor' || authUser?.publicMetadata?.role === 'admin') && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <p>Base Price: ₹{pricing.basePrice}</p>
                  <p>Tax Amount: ₹{pricing.gstAmount}</p>
                  <p>Final Selling Price: ₹{pricing.finalPrice}</p>
                  {pricing.hasDiscount ? <p>Customer Discount: ₹{pricing.discountAmount}</p> : null}
                  {pricing.hasDiscount ? <p>Discounted Price: ₹{pricing.discountedPrice}</p> : null}
                </div>
              )}
            </div>

            {/* Description */}
            <p className="mt-4 text-sm text-gray-600">{product.description}</p>

            {/* Vendor Info */}
            {(product.vendor || product.createdBy) && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Sold by</p>
                <p className="mt-1 font-medium text-gray-900">
                  {vendorDetails?.businessName || product.vendorName || 'Shopzy Seller'}
                </p>
                {product.vendorStatus && (
                  <span className={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full ${
                    product.vendorStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.vendorStatus === 'approved' ? 'Verified Seller' : 'Pending'}
                  </span>
                )}
                {vendorAddress && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Shop address:</span> {vendorAddress}
                  </p>
                )}
                {(authUser?.publicMetadata?.role === 'vendor' || authUser?.publicMetadata?.role === 'admin') && vendorDetails?.businessPhone && (
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Contact:</span> {vendorDetails.businessPhone}
                  </p>
                )}
              </div>
            )}

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div className="mt-6 rounded-3xl border border-gray-200 bg-[#f6f6f7] p-4 sm:p-5">
                <p className="text-2xl font-extrabold tracking-tight text-gray-800">
                  Selected Color: <span className="text-gray-700">{formatColorLabel(selectedColor || product.colors[0])}</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  {colorOptionsWithPreview.map(({ color, preview, hasVariantImages }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color)
                        setSelectedImage(0)
                      }}
                      className={`group rounded-[1.9rem] border-[3px] bg-white p-2.5 transition ${
                        selectedColor === color
                          ? 'border-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.08)]'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      title={formatColorLabel(color)}
                      aria-label={`Select ${formatColorLabel(color)} color`}
                    >
                      {preview ? (
                        <div className="rounded-[1.25rem] bg-[#efeff0] p-1.5">
                          <img src={preview} alt={`${product.name} ${color}`} className="h-24 w-18 rounded-[0.95rem] object-cover sm:h-28 sm:w-20" />
                        </div>
                      ) : (
                        <div className="flex h-24 w-18 items-center justify-center rounded-2xl bg-gray-100 text-[10px] font-medium text-gray-500 sm:h-28 sm:w-20">
                          {hasVariantImages ? 'Preview' : 'No image'}
                        </div>
                      )}
                      <p className="mt-1.5 text-xs font-semibold text-gray-700">{formatColorLabel(color)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-gray-700">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        selectedSize === size
                          ? 'bg-green-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-gray-700">Quantity</p>
              <div className="flex items-center gap-4">
                <QuantitySelector 
                  value={quantity} 
                  max={Math.max(product.stock || 1, 1)}
                  onChange={setQuantity} 
                />
                <span className="text-xs text-gray-500">
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Add to Cart & Wishlist */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isMutating}
                className="rounded-lg bg-[#374151] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4B5563] disabled:opacity-50"
              >
                Add To Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock === 0 || isMutating}
                className="rounded-lg bg-[#6236FF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5235E8] disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={handleWishlistToggle}
                disabled={isWishlistUpdating}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg border text-xl transition sm:mx-0 ${
                  isWishlisted
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-red-500'
                }`}
              >
                {isWishlisted ? '♥' : '♡'}
              </button>
            </div>

            {/* Delivery Info */}
            <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-600">
              <p>{deliveryInfo}</p>
            </div>

            {/* Trust Points */}
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              {productPerks.map((perk) => (
                <p key={perk}>• {perk}</p>
              ))}
            </div>
          </section>
        </div>

        {/* Tabs */}
        <section className="mt-8 rounded-xl bg-gray-50 p-4 sm:p-6">
          <div className="flex gap-4 overflow-x-auto border-b border-gray-200 sm:gap-6">
            {['Description', 'Color Guide', 'Size Guide'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                className={`shrink-0 whitespace-nowrap border-b-2 px-2 py-3 text-sm font-medium transition ${
                  activeTab === tab.toLowerCase().replace(' ', '-')
                    ? 'border-gray-800 text-gray-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detail</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                {/* Electronics: show technical specification fields only for electronics category */}
                {String(product.category || '').toLowerCase() === 'electronics' && Array.isArray(product.attributes) && product.attributes.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900">Specifications</h4>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {product.attributes.map((attr, idx) => {
                        // Only show common electronics spec labels
                        const label = (attr.label || attr.key || '').toString()
                        const lower = label.toLowerCase()
                        const allowed = new Set([
                          'brand',
                          'model name',
                          'screen size',
                          'colour',
                          'color',
                          'ram memory installed size',
                          'operating system',
                          'graphics card description',
                          'cpu speed',
                          'hard disk description',
                          'item weight',
                        ])

                        if (!allowed.has(lower)) return null

                        return (
                          <div key={`${attr.key || attr.label}-${idx}`} className="flex items-start gap-3">
                            <div style={{ minWidth: 120 }} className="text-sm font-medium text-gray-700">{label}</div>
                            <div className="text-sm text-gray-600">{attr.value}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                <h4 className="mt-6 text-lg font-semibold text-gray-900">Benefit</h4>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
                  <li>High-quality material and finish for long-lasting use.</li>
                  <li>Designed for comfort and everyday convenience.</li>
                  <li>Easy return and exchange support available.</li>
                  <li>Premium quality assured with each product.</li>
                </ul>
              </div>
            )}
            {activeTab === 'color-guide' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Color Guide</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  Product tones may appear slightly different depending on your screen settings and lighting. We recommend viewing the product in natural light for the most accurate color representation.
                </p>
              </div>
            )}
            {activeTab === 'size-guide' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Size Guide</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  Pick the option that best fits your requirement. For personalized help before checkout, contact our support team. Our team is here to help you find the perfect fit.
                </p>
                <Link to="/size-chart" className="mt-4 inline-block text-sm font-semibold text-gray-900 underline underline-offset-4">
                  Open detailed size chart
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-xl bg-gray-50 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Reviews</h2>
              <p className="mt-1 text-sm text-gray-600">See what verified buyers are saying.</p>
            </div>
            <Link
              to={`/products/${product.slug || product._id}/reviews`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              View all reviews
            </Link>
          </div>

          {recentReviews.length ? (
            <div className="mt-5 space-y-4">
              {recentReviews.slice(0, 2).map((review) => (
                <article key={review._id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-yellow-500">
                    {[1, 2, 3, 4, 5].map((point) => (
                      <span key={point}>{point <= Number(review.rating || 0) ? '★' : '☆'}</span>
                    ))}
                    <span className="text-sm font-semibold text-gray-700">{Number(review.rating || 0).toFixed(1)}</span>
                  </div>
                  {review.title ? <p className="mt-2 text-sm font-semibold text-gray-900">{review.title}</p> : null}
                  <p className="mt-1 text-sm text-gray-600">{review.comment || 'Great product and quality.'}</p>
                  <p className="mt-2 text-xs text-gray-500">{review.user?.name || 'Customer'} {review.isVerifiedPurchase ? '• Verified Purchase' : ''}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-500">No reviews yet.</p>
          )}
        </section>

        {/* Trust Panels */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-lg font-semibold text-gray-900">Easy Return</p>
            <p className="mt-2 text-sm text-gray-600">Hassle-free return support as per policy window.</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-lg font-semibold text-gray-900">Secure Payment</p>
            <p className="mt-2 text-sm text-gray-600">All orders are protected with secure checkout methods.</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-lg font-semibold text-gray-900">Fast Delivery</p>
            <p className="mt-2 text-sm text-gray-600">Quick dispatch and reliable shipping across locations.</p>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Related Products</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

export default ProductPage
