import { useState, useMemo } from 'react'
import { formatDate } from '../utils/formatters'

const OrderTrackingStepper = ({ order = {} }) => {
  const [showDetails, setShowDetails] = useState(false)

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

  const currentStatus = normalizeOrderStatus(order.orderStatus)
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === currentStatus)

  const getStepState = (index) => {
    if (index < currentStepIndex) return 'completed'
    if (index === currentStepIndex) return 'active'
    return 'pending'
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

  const getFirstItem = () => (order.items || [])[0]

  const shippingInfo = getShippingInfo()
  const firstItem = getFirstItem()

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Desktop Stepper */}
      <div className="hidden lg:block p-8 border-b border-blue-100">
        <div className="max-w-7xl mx-auto">
          {/* Stepper Title */}
          <div className="mb-10 pb-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Delivery Status</h2>
            <div className="mt-3 flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="text-base font-semibold text-gray-900">#{order._id?.slice(-6)?.toUpperCase?.() || 'XXXXX'}</p>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <p className="text-sm text-gray-500">Placed on</p>
                <p className="text-base font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Steps Container */}
          <div className="relative">
            {/* Background Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-700 ease-out rounded-full"
                style={{
                  background: 'linear-gradient(to right, rgb(2, 132, 199), rgb(3, 102, 214))',
                  width: `${currentStepIndex > 0 ? (currentStepIndex / (ORDER_STEPS.length - 1)) * 100 : 0}%`,
                  boxShadow: '0 0 12px rgba(2, 132, 199, 0.4)',
                }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {ORDER_STEPS.map((step, index) => {
                const state = getStepState(index)
                const timestamp = getStepTimestamp(step.key)

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center relative"
                    style={{ flex: '1' }}
                  >
                    {/* Circle with icon */}
                    <div
                      className={`relative mb-4 flex items-center justify-center w-14 h-14 rounded-full font-bold text-base transition-all duration-300 z-10 shadow-lg ${
                        state === 'completed'
                          ? 'bg-gradient-to-br from-green-400 to-green-500 text-white scale-110'
                          : state === 'active'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-4 ring-blue-200 animate-pulse'
                            : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                      }`}
                    >
                      {state === 'completed' ? '✓' : step.icon}
                    </div>

                    {/* Step Info */}
                    <div className="text-center w-full">
                      <p className={`font-bold text-sm leading-tight ${
                        state === 'completed'
                          ? 'text-green-700'
                          : state === 'active'
                            ? 'text-blue-700'
                            : 'text-gray-500'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 leading-tight">
                        {step.description}
                      </p>
                      {timestamp && (
                        <p className={`text-xs font-semibold mt-2 ${
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

        {/* Order Details Card */}
        <div className="hidden lg:block p-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-8 mb-8">
            {/* Product Info */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                📦 PRODUCT
              </h3>
              <div className="flex gap-4">
                {firstItem?.image && (
                  <img
                    src={firstItem.image}
                    alt={firstItem.name}
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200 shadow-sm"
                  />
                )}
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm leading-snug">{firstItem?.name || 'Product'}</p>
                  {(firstItem?.color || firstItem?.size) && (
                    <p className="text-xs text-gray-600 mt-2">
                      {firstItem.color && `🎨 ${firstItem.color}`}
                      {firstItem.color && firstItem.size && ' | '}
                      {firstItem.size && `📏 ${firstItem.size}`}
                    </p>
                  )}
                  {firstItem?.quantity && (
                    <p className="text-xs text-gray-600 mt-1">Qty: <span className="font-bold">{firstItem.quantity}</span></p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                🚚 DELIVERY
              </h3>
              <div className="space-y-2 text-sm">
                {shippingInfo?.trackingId !== 'N/A' && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Tracking ID</p>
                    <p className="font-mono text-xs text-blue-600 break-all font-bold">{shippingInfo?.trackingId}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Courier</p>
                  <p className="font-semibold text-gray-900 text-sm">{shippingInfo?.deliveryPartner}</p>
                </div>
                {shippingInfo?.estimatedDeliveryDate && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Est. Delivery</p>
                    <p className="font-semibold text-gray-900 text-sm">{formatDate(shippingInfo.estimatedDeliveryDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Address */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                💳 PAYMENT
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Method</p>
                  <p className="font-semibold text-gray-900">
                    {String(order.paymentMethod || '').toUpperCase() === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Status</p>
                  <p className={`font-bold text-sm ${
                    order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    ✓ {order.paymentStatus?.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                📍 DELIVERY ADDRESS
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-bold text-gray-900">{order.shippingAddress?.fullName}</p>
                <p className="text-gray-700">
                  {order.shippingAddress?.line1}
                  {order.shippingAddress?.line2 && `, ${order.shippingAddress.line2}`}
                </p>
                <p className="text-gray-700">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                </p>
                {order.shippingAddress?.country && (
                  <p className="text-gray-700">{order.shippingAddress.country}</p>
                )}
                {order.shippingAddress?.phone && (
                  <p className="text-gray-700 font-semibold">📞 {order.shippingAddress.phone}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Stepper - Vertical */}
      <div className="lg:hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="mb-8 pb-6 border-b border-blue-100">
          <h2 className="text-xl font-bold text-gray-900">Delivery Status</h2>
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <p className="text-xs text-gray-500">Order ID</p>
              <p className="font-semibold text-gray-900">#{order._id?.slice(-6)?.toUpperCase?.() || 'XXXXX'}</p>
            </div>
          </div>
        </div>

        {/* Vertical Steps */}
        <div className="space-y-4 mb-8">
          {ORDER_STEPS.map((step, index) => {
            const state = getStepState(index)
            const timestamp = getStepTimestamp(step.key)

            return (
              <div key={step.key} className="flex gap-4">
                {/* Left connector */}
                <div className="relative flex flex-col items-center">
                  {/* Circle */}
                  <div
                    className={`flex items-center justify-center rounded-full w-12 h-12 font-bold transition-all duration-300 z-10 shadow-md ${
                      state === 'completed'
                        ? 'bg-gradient-to-br from-green-400 to-green-500 text-white'
                        : state === 'active'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-2 ring-blue-300 animate-pulse'
                          : 'bg-gray-100 text-gray-400 border border-gray-300'
                    }`}
                  >
                    {state === 'completed' ? '✓' : step.icon}
                  </div>

                  {/* Line to next step */}
                  {index < ORDER_STEPS.length - 1 && (
                    <div
                      className={`w-1 h-12 mt-2 rounded-full transition-colors duration-300 ${
                        state === 'completed' || getStepState(index + 1) === 'completed'
                          ? 'bg-green-400'
                          : state === 'active'
                            ? 'bg-blue-400'
                            : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                {/* Step Content */}
                <div className="pb-4 pt-2 flex-1">
                  <p className={`font-bold text-base leading-tight ${
                    state === 'completed'
                      ? 'text-green-700'
                      : state === 'active'
                        ? 'text-blue-700'
                        : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                  {timestamp && (
                    <p className={`text-xs font-semibold mt-2 ${
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

        {/* Mobile Order Details */}
        <div className="space-y-4">
          {/* Product Card */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              📦 PRODUCT
            </h3>
            <div className="flex gap-3">
              {firstItem?.image && (
                <img
                  src={firstItem.image}
                  alt={firstItem.name}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              )}
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{firstItem?.name || 'Product'}</p>
                {(firstItem?.color || firstItem?.size) && (
                  <p className="text-xs text-gray-600 mt-1">
                    {firstItem.color && `🎨 ${firstItem.color}`}
                    {firstItem.color && firstItem.size && ' | '}
                    {firstItem.size && `📏 ${firstItem.size}`}
                  </p>
                )}
                {firstItem?.quantity && (
                  <p className="text-xs text-gray-600 mt-1">Qty: <span className="font-bold">{firstItem.quantity}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Info Card */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              🚚 DELIVERY
            </h3>
            <div className="space-y-3">
              {shippingInfo?.trackingId !== 'N/A' && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Tracking ID</p>
                  <p className="font-mono text-xs text-blue-600 break-all font-bold">{shippingInfo?.trackingId}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 font-semibold">Courier</p>
                <p className="font-semibold text-gray-900 text-sm">{shippingInfo?.deliveryPartner}</p>
              </div>
              {shippingInfo?.estimatedDeliveryDate && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Est. Delivery</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatDate(shippingInfo.estimatedDeliveryDate)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              💳 PAYMENT
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-semibold">Method</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {String(order.paymentMethod || '').toUpperCase() === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Status</p>
                <p className={`font-bold text-sm ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'
                }`}>
                  ✓ {order.paymentStatus?.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Address Card */}
          {order.shippingAddress && (
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                📍 ADDRESS
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-bold text-gray-900">{order.shippingAddress?.fullName}</p>
                <p className="text-gray-700">
                  {order.shippingAddress?.line1}
                  {order.shippingAddress?.line2 && `, ${order.shippingAddress.line2}`}
                </p>
                <p className="text-gray-700">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                </p>
                {order.shippingAddress?.country && (
                  <p className="text-gray-700">{order.shippingAddress.country}</p>
                )}
                {order.shippingAddress?.phone && (
                  <p className="text-gray-700 font-semibold mt-2">📞 {order.shippingAddress.phone}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderTrackingStepper
