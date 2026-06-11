import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { formatDate } from '../utils/formatters'
import { useDownloadOrderInvoiceMutation } from '../features/api/apiSlice'

const OrderTrackingStepper = ({ order = {}, onDownloadBill }) => {
  const [showDetails, setShowDetails] = useState(false)
  const [downloadOrderInvoice] = useDownloadOrderInvoiceMutation()

  const ORDER_STEPS = [
    { key: 'placed', label: 'Order Placed', icon: '📦', description: 'Order confirmed' },
    { key: 'confirmed', label: 'Confirmed', icon: '✓', description: 'Order confirmed by seller' },
    { key: 'processing', label: 'Processing', icon: '⚙️', description: 'Being packed' },
    { key: 'shipped', label: 'Shipped', icon: '🚚', description: 'On the way' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚗', description: 'Arriving today' },
    { key: 'delivered', label: 'Delivered', icon: '✓', description: 'Successfully delivered' },
  ]

  const normalizeOrderStatus = (status) => {
    const s = String(status || '').toLowerCase()
    if (['failed', 'cancelled'].includes(s)) return 'failed'
    if (['delivered', 'returned', 'refunded'].includes(s)) return 'delivered'
    if (s === 'shipped') return 'shipped'
    if (s === 'out_for_delivery') return 'out_for_delivery'
    if (['processing', 'packed'].includes(s)) return 'processing'
    if (s === 'confirmed') return 'confirmed'
    if (['created', 'payment_pending', 'paid', 'pending'].includes(s)) return 'placed'
    return 'placed'
  }

  const getStepTimestamp = (stepKey) => {
    const timestampMap = {
      placed: order.createdAt,
      confirmed: order.confirmedAt,
      processing: order.processingAt,
      shipped: order.shippedAt,
      out_for_delivery: order.outForDeliveryAt,
      delivered: order.deliveredAt,
    }
    return timestampMap[stepKey]
  }

  const getShippingInfo = () => {
    const vendors = order.vendors || []
    const subOrders = order.subOrders || []
    const splits = subOrders.length > 0 ? subOrders : vendors

    if (!splits.length) return null
    const primary = splits[0]

    return {
      trackingId: primary.trackingId || 'N/A',
      deliveryPartner: primary.deliveryPartner || 'Standard Delivery',
      estimatedDeliveryDate: primary.estimatedDeliveryDate,
      estimatedDeliveryMinDays: primary.estimatedDeliveryMinDays,
      estimatedDeliveryMaxDays: primary.estimatedDeliveryMaxDays,
    }
  }

  const isBillAvailable = (order) => {
    const paymentSettled = String(order?.paymentStatus || '').toLowerCase() === 'paid'
    const orderDelivered = ['delivered', 'returned', 'refunded'].includes(String(order?.orderStatus || '').toLowerCase())
    const splitDelivered = (order?.vendors || []).some((split) =>
      ['delivered', 'returned', 'refunded'].includes(String(split?.status || '').toLowerCase()),
    )
    const hasInvoice = (order?.vendors || []).some((split) => Boolean(split?.invoiceNumber))
      || (order?.subOrders || []).some((split) => Boolean(split?.invoiceNumber))

    return paymentSettled && (orderDelivered || splitDelivered) && hasInvoice
  }

  const handleDownloadInvoice = async (orderId) => {
    if (typeof onDownloadBill === 'function') {
      await onDownloadBill(order)
      return
    }

    try {
      const blob = await downloadOrderInvoice(orderId).unwrap()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const fileSuffix = orderId?.slice(-6)?.toUpperCase?.() || 'ORDER'

      link.href = objectUrl
      link.download = `invoice-${fileSuffix}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to download invoice')
    }
  }

  const getFirstItem = () => (order.items || [])[0]

  const normalizeItem = (item, index) => {
    const vendorItemOverride = (order.vendorInvoiceDraft?.items || []).find((it) => (it.id || it._id) === (item._id || `${item.product}-${index}`)) || null
    const resolved = vendorItemOverride || item
    const unitPrice = Number(resolved.price || resolved.unitPrice || item.price || 0)
    const qty = Number(resolved.quantity || item.quantity || 0)
    const discount = Number(resolved.discountValue ?? resolved.discount ?? 0)
    const discountType = String(resolved.discountType || '').toLowerCase() === 'percent' ? 'percent' : 'amount'
    const discountValue = Number(resolved.discountValue ?? resolved.discount ?? 0)
    const taxRate = Number(resolved.taxRate ?? resolved.tax ?? 0)
    const taxable = Number((unitPrice * qty) - (discount || 0))
    const gstAmount = Number(((taxable * (taxRate || 0)) / 100) || 0)

    return {
      ...item,
      id: item._id || `${item.product}-${index}`,
      name: resolved.name || item.name || 'Product',
      size: resolved.size || item.size || '',
      quantity: qty,
      unitPrice,
      price: unitPrice,
      sku: resolved.sku || item.sku || item.hsn || '—',
      vendorName: resolved.vendorName || item.vendorName || (order.vendors?.[0]?.vendorBusinessName || order.vendors?.[0]?.vendorName || 'Shopzy Seller'),
      image: resolved.image || resolved.thumbnail || resolved.productImage || item.image || item.thumbnail || item.product?.images?.[0]?.url || '',
      color: resolved.variant?.color || resolved.color || item.color || '',
      hsn: resolved.hsn || item.hsn || '330499',
      discount,
      discountType,
      discountValue,
      taxRate,
      gstAmount: Number(gstAmount?.toFixed(2)),
      taxable: Number(taxable?.toFixed(2)),
      total: Number((taxable + gstAmount)?.toFixed(2)),
      product: item.product
        ? {
            _id: item.product._id,
            name: item.product.name,
            slug: item.product.slug,
            images: item.product.images || [],
            category: item.product.category,
          }
        : null,
    }
  }

  const normalizedItems = useMemo(() => (order.items || []).map(normalizeItem), [order.items, order.vendorInvoiceDraft, order.vendors])

  const priceSummary = useMemo(() => {
    const subtotal = normalizedItems.reduce((s, item) => s + Number(item.taxable || 0), 0)
    const gstTotal = normalizedItems.reduce((s, item) => s + Number(item.gstAmount || 0), 0)
    const couponDiscount = Number(order.couponDiscount || order.discountAmount || 0)
    const platformDiscount = Number(order.platformDiscount || 0)
    const shippingCharges = Number(order.shippingCharges || 0)
    const handlingCharges = Number(order.handlingCharges || 0)
    const total = Number((subtotal + gstTotal - couponDiscount - platformDiscount + shippingCharges + handlingCharges).toFixed(2))
    return { subtotal: Number(subtotal.toFixed(2)), gstTotal: Number(gstTotal.toFixed(2)), couponDiscount, platformDiscount, shippingCharges, handlingCharges, total }
  }, [normalizedItems, order])

  const shippingInfo = getShippingInfo()
  const firstItem = getFirstItem()
  const currentStatus = normalizeOrderStatus(order.orderStatus)
  const isDelivered = currentStatus === 'delivered'
  const isFailed = currentStatus === 'failed'
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === currentStatus)

  const getStepState = (index) => {
    if (index < currentStepIndex) return 'completed'
    if (index === currentStepIndex) return 'active'
    return 'pending'
  }

  const formatCurrency = (value = 0) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // If status is failed, show only product and order ID
  if (isFailed) {
    return (
      <div className="p-6 bg-white border-b border-red-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1">
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 font-semibold">ORDER ID</p>
                <p className="text-lg font-bold text-gray-900">#{order._id?.slice(-6)?.toUpperCase?.() || 'XXXXX'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-3">PRODUCT</p>
                <div className="flex gap-4">
                  {firstItem?.image && (
                    <img src={firstItem.image} alt={firstItem.name} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{firstItem?.name}</p>
                    {firstItem?.size && <p className="text-xs text-gray-600 mt-1">Size {firstItem.size}</p>}
                    {firstItem?.color && <p className="text-xs text-gray-600">Color {firstItem.color}</p>}
                    <p className="text-xs text-gray-600 mt-2">Qty {firstItem?.quantity}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-red-100 rounded-lg px-4 py-2">
                <p className="text-xs text-gray-500 font-semibold">STATUS</p>
                <p className="text-lg font-bold text-red-600">Failed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If delivered, show summary with bill details
  if (isDelivered) {
    const paymentMethod = String(order.paymentMethod || '').toLowerCase() === 'cod' ? 'Cash on Delivery' : 'Online Payment'
    const paymentDetails = order.paymentDetails || {}
    const transactionId = paymentDetails.stripePaymentIntentId || paymentDetails.stripeCheckoutSessionId || paymentDetails.razorpayPaymentId || 'N/A'

    return (
      <div className="p-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start gap-8">
            <div className="flex-1">
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 font-semibold">ORDER PLACED ON</p>
                <p className="text-base font-bold text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-2">DELIVERED ON</p>
                <p className="text-base font-bold text-green-700">{formatDate(order.deliveredAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-3">PRODUCT</p>
                <div className="flex gap-4">
                  {firstItem?.image && (
                    <img src={firstItem.image} alt={firstItem.name} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{firstItem?.name}</p>
                    <p className="text-xs text-gray-600 mt-1">Size {firstItem?.size} · Color {firstItem?.color} · Qty {firstItem?.quantity}</p>
                    {firstItem?.sku && <p className="text-xs text-gray-500 mt-1">SKU: {firstItem.sku}</p>}
                    <p className="text-sm font-bold text-gray-900 mt-2">Rs. {firstItem?.price}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-80 space-y-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full py-2 px-4 rounded-lg border border-blue-300 text-blue-700 font-semibold hover:bg-blue-50 transition"
              >
                {showDetails ? 'Hide Details' : 'Details'}
              </button>

              {['delivered', 'returned', 'refunded'].includes(String(order.orderStatus || '').toLowerCase()) && (
                <button
                  className="w-full py-2 px-4 rounded-lg border border-blue-300 text-blue-700 font-semibold hover:bg-blue-50 transition"
                  onClick={() => window.location.href = `/products/${firstItem?.slug || firstItem?.product}/reviews?write=1`}
                >
                  Write a Review
                </button>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 font-semibold">DELIVERY ADDRESS</p>
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{order.shippingAddress?.fullName}</p>
                  <p>{order.shippingAddress?.line1}{order.shippingAddress?.line2 && `, ${order.shippingAddress.line2}`}</p>
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}</p>
                  {order.shippingAddress?.phone && <p className="pt-1">📞 {order.shippingAddress.phone}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 font-semibold">PAYMENT MODE</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{paymentMethod}</p>
                {transactionId !== 'N/A' && (
                  <p className="text-xs text-gray-500 mt-1">Txn: {transactionId}</p>
                )}
              </div>
            </div>
          </div>

          {/* ========== BILL SUMMARY SECTION (toggleable) ========== */}
          {showDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Bill Summary</h3>

              <div className="mb-6">
                <ItemsTable items={normalizedItems} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Price Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium text-slate-900">{formatCurrency(priceSummary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">GST</span>
                      <span className="font-medium text-slate-900">{formatCurrency(priceSummary.gstTotal)}</span>
                    </div>
                    {priceSummary.couponDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Coupon Discount</span>
                        <span className="font-medium text-green-600">-₹{formatCurrency(priceSummary.couponDiscount)}</span>
                      </div>
                    )}
                    {priceSummary.platformDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Platform Discount</span>
                        <span className="font-medium text-green-600">-₹{formatCurrency(priceSummary.platformDiscount)}</span>
                      </div>
                    )}
                    {priceSummary.shippingCharges > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Shipping</span>
                        <span className="font-medium text-slate-900">{formatCurrency(priceSummary.shippingCharges)}</span>
                      </div>
                    )}
                    {priceSummary.handlingCharges > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Handling</span>
                        <span className="font-medium text-slate-900">{formatCurrency(priceSummary.handlingCharges)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-slate-300">
                    <span className="text-sm font-bold text-slate-900">Total Amount</span>
                    <span className="text-lg font-bold text-violet-600">₹{formatCurrency(priceSummary.total)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Payment Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">Payment Method:</span>
                      <span className="text-sm font-semibold text-slate-900">{paymentMethod}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">Payment Status:</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.paymentStatus || '—'}
                      </span>
                    </div>
                    {transactionId !== 'N/A' && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">Transaction ID:</span>
                        <span className="text-sm font-mono text-slate-700">{transactionId}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">Gateway:</span>
                      <span className="text-sm text-slate-700">{paymentDetails.gateway || paymentDetails.provider || paymentMethod}</span>
                    </div>
                    {order.paidAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">Paid At:</span>
                        <span className="text-sm text-slate-700">{formatDate(order.paidAt)}</span>
                      </div>
                    )}
                    {order.couponDiscount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">Coupon Applied:</span>
                        <span className="text-sm text-emerald-600 font-semibold">-₹{formatCurrency(order.couponDiscount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`grid gap-6 ${showDetails ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Order Details</p>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p><span className="font-semibold">Status:</span> {order.orderStatus}</p>
                    <p><span className="font-semibold">Placed on:</span> {formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">Shipment Details</p>
                  <div className="text-sm text-gray-700 space-y-2">
                    {shippingInfo?.trackingId !== 'N/A' && <p><span className="font-semibold">Tracking:</span> {shippingInfo?.trackingId}</p>}
                    <p><span className="font-semibold">Partner:</span> {shippingInfo?.deliveryPartner}</p>
                    {order.vendors?.[0]?.invoiceNumber && <p><span className="font-semibold">Invoice:</span> {order.vendors[0].invoiceNumber}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show stepper for in-progress orders
  return (
    <div className="w-full bg-white">
      <div className="hidden lg:block p-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Delivery Status</h2>
            <div className="mt-3 flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="text-sm font-semibold text-gray-900">#{order._id?.slice(-6)?.toUpperCase?.() || 'XXXXX'}</p>
              </div>
              <span className="text-gray-300">•</span>
              <div>
                <p className="text-xs text-gray-500">Est. Delivery</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(shippingInfo?.estimatedDeliveryDate) || 'TBD'}</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{
                  background: 'linear-gradient(to right, #3b82f6, #1e40af)',
                  width: `${currentStepIndex > 0 ? (currentStepIndex / (ORDER_STEPS.length - 1)) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="relative flex justify-between">
              {ORDER_STEPS.map((step, index) => {
                const state = getStepState(index)
                const timestamp = getStepTimestamp(step.key)
                const shouldBlink = state === 'active'

                return (
                  <div key={step.key} className="flex flex-col items-center" style={{ flex: '1' }}>
                    <div className="flex items-center justify-center mb-3 relative z-10">
                      <input
                        type="checkbox"
                        checked={state === 'completed'}
                        readOnly
                        className="w-4 h-4 mr-2 cursor-pointer accent-green-600"
                      />
                      <div
                        className={`w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center transition-all duration-300 shadow-md ${
                          state === 'completed'
                            ? 'bg-green-500 text-white'
                            : state === 'active'
                              ? `bg-blue-600 text-white ring-4 ring-blue-200 ${shouldBlink ? 'animate-pulse' : ''}`
                              : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                        }`}
                      >
                        {state === 'completed' ? '✓' : step.icon}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className={`font-bold text-xs leading-tight ${
                        state === 'completed'
                          ? 'text-green-700'
                          : state === 'active'
                            ? 'text-blue-700'
                            : 'text-gray-500'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step.description}
                      </p>
                      {timestamp && (
                        <p className={`text-xs font-semibold mt-1 ${
                          state === 'completed' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {formatDate(timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden p-6 bg-white">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Delivery Status</h2>
          <div className="mt-2 text-xs text-gray-500">
            <p>Order: #{order._id?.slice(-6)?.toUpperCase?.() || 'XXXXX'}</p>
            <p>Est. {formatDate(shippingInfo?.estimatedDeliveryDate)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {ORDER_STEPS.map((step, index) => {
            const state = getStepState(index)
            const timestamp = getStepTimestamp(step.key)
            const shouldBlink = state === 'active'

            return (
              <div key={step.key} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <input type="checkbox" checked={state === 'completed'} readOnly className="w-4 h-4 absolute -left-6 top-1 accent-green-600" />
                  <div
                    className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shadow-md ${
                      state === 'completed'
                        ? 'bg-green-500 text-white'
                        : state === 'active'
                          ? `bg-blue-600 text-white ring-2 ring-blue-200 ${shouldBlink ? 'animate-pulse' : ''}`
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                    }`}
                  >
                    {state === 'completed' ? '✓' : step.icon}
                  </div>
                  {index < ORDER_STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${state === 'completed' ? 'bg-green-500' : state === 'active' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  )}
                </div>

                <div className="pb-4">
                  <p className={`font-bold text-sm ${
                    state === 'completed'
                      ? 'text-green-700'
                      : state === 'active'
                        ? 'text-blue-700'
                        : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  {timestamp && <p className="text-xs text-gray-600 mt-1">{formatDate(timestamp)}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const ItemsTable = ({ items = [] }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-275 border-collapse text-sm">
      <thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
        <tr>
          <th className="px-4 py-3 border-b border-slate-300">Product</th>
          <th className="px-4 py-3 border-b border-slate-300">SKU</th>
          <th className="px-4 py-3 border-b border-slate-300">Vendor</th>
          <th className="px-4 py-3 text-right border-b border-slate-300">Qty</th>
          <th className="px-4 py-3 text-right border-b border-slate-300">Unit Price</th>
          <th className="px-4 py-3 text-right border-b border-slate-300">GST</th>
          <th className="px-4 py-3 text-right border-b border-slate-300">Discount</th>
          <th className="px-4 py-3 text-right border-b border-slate-300">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.length ? items.map((item) => (
          <tr key={`${item.id}-${item.sn || ''}`} className="border-b border-slate-200 align-top hover:bg-slate-50">
            <td className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-slate-400 text-lg">📦</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-slate-950 text-sm font-medium">{item.name || 'Product'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Color: {item.color || '—'} | Size: {item.size || '—'}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">{item.sku || '—'}</td>
            <td className="px-4 py-3 text-sm text-slate-700">{item.vendorName || '—'}</td>
            <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
            <td className="px-4 py-3 text-right text-sm">₹{Number(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className="px-4 py-3 text-right text-sm">{item.gstAmount ? `₹${Number(item.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${Number(item.taxRate || 0)}%`}</td>
            <td className="px-4 py-3 text-right text-sm">
              {item.discountType === 'percent'
                ? `${Number(item.discountValue || 0)}% (₹${Number(item.discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                : `₹${Number(item.discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-slate-900 text-sm">₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        )) : (
          <tr><td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={8}>No items available</td></tr>
        )}
      </tbody>
    </table>
  </div>
)

export default OrderTrackingStepper