import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import QuantitySelector from '../components/QuantitySelector'
import Seo from '../components/Seo'
import { setCouponCode } from '../features/cart/cartSlice'
import { useCartActions, useCartData } from '../hooks/useCart'

const CartPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [couponInput, setCouponInput] = useState('')
  const { items, subtotal, discountAmount, totalAmount, totalItems, shippingAmount, couponCode } = useCartData()
  const { removeItem, updateItem } = useCartActions()

  useEffect(() => {
    setCouponInput(couponCode)
  }, [couponCode])

  if (!items.length) {
    return (
      <div className="container-shell py-16">
        <Seo title="Cart" description="Review your Ribelle shopping bag." />
        <EmptyState
          title="Your cart is empty"
          description="Add something from the latest edit to start building your wardrobe."
          action={
            <Link to="/products" className="gold-button">
              Continue Shopping
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <>
      <Seo title="Cart" description="Review your Ribelle shopping bag and apply your tiered discount." />
      <div className="container-shell py-6 sm:py-10">
        <Breadcrumbs items={[{ label: 'Cart' }]} />
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="surface-panel rounded-[2.25rem] p-6 sm:p-8">
            <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div>
                <p className="eyebrow">Shopping Bag</p>
                <h1 className="font-serif-display mt-2 text-3xl text-stone-950 sm:text-4xl">Cart</h1>
                <p className="mt-2 text-sm text-stone-600">Review sizes, quantities, and exclusive savings before checkout.</p>
              </div>
              <span className="info-chip">{totalItems} item(s)</span>
            </div>

            <div className="space-y-6">
              {items.map((item) => {
                const productId = item.product?._id || item.productId
                const image = item.image || item.product?.images?.[0]?.url
                const slug = item.slug || item.product?.slug

                return (
                  <div key={`${productId}-${item.size}-${item.color || 'na'}`} className="selection-card grid gap-4 rounded-[1.75rem] p-4 sm:grid-cols-[132px_minmax(0,1fr)]">
                    <Link to={`/products/${slug}`} className="overflow-hidden rounded-3xl bg-stone-100">
                      <img src={image} alt={item.name} className="aspect-4/5 w-full object-cover" />
                    </Link>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="eyebrow text-[10px]">Size {item.size}{item.color ? ` · Color ${item.color}` : ''}</p>
                        <Link to={`/products/${slug}`} className="font-medium text-stone-900 transition hover:text-black">
                          {item.name}
                        </Link>
                        <p className="mt-3 text-sm font-semibold text-stone-950">Rs. {item.price}</p>
                      </div>
                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(value) => updateItem({ productId, quantity: value, size: item.size, color: item.color })}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem({ productId, size: item.size, color: item.color })}
                          className="text-xs uppercase tracking-[0.25em] text-stone-500 transition hover:text-black"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link to="/products" className="ghost-button mt-8">
              Continue Shopping
            </Link>
          </section>

          <aside className="surface-panel h-fit rounded-[2.25rem] p-6 sm:p-8 lg:sticky lg:top-32">
            <p className="eyebrow">Order Summary</p>
            <div className="mt-4 rounded-[1.7rem] bg-[#17120d] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-[#dcc598]">Offer unlocked</p>
              <p className="mt-2 text-sm leading-7 text-white/70">
                Apply <strong>RIBELLEDEAL</strong> for 10% off 1 item, 15% off 2 items, and 20% off 3+ items.
              </p>
            </div>
            <div className="mt-6 space-y-4 text-sm text-stone-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>Rs. {subtotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{shippingAmount === 0 ? 'Free' : `Rs. ${shippingAmount}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span className="text-emerald-700">- Rs. {discountAmount}</span>
              </div>
            </div>

            <div className="selection-card mt-6 rounded-[1.75rem] p-4">
              <label className="eyebrow" htmlFor="coupon-code">
                Coupon Code
              </label>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  id="coupon-code"
                  type="text"
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value)}
                  placeholder="RIBELLEDEAL"
                  className="flex-1 rounded-full border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900"
                />
                <button
                  type="button"
                  onClick={() => dispatch(setCouponCode(couponInput))}
                  className="ghost-button"
                >
                  Apply
                </button>
              </div>
              {couponCode ? (
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-emerald-700">Applied {couponCode}</p>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-6">
              <span className="text-xs uppercase tracking-[0.35em] text-stone-500">Total</span>
              <span className="font-serif-display text-2xl text-stone-950 sm:text-3xl">Rs. {totalAmount}</span>
            </div>

            <button type="button" onClick={() => navigate('/checkout')} className="gold-button mt-6 w-full justify-center">
              Proceed to Checkout
            </button>
          </aside>
        </div>
      </div>
    </>
  )
}

export default CartPage
