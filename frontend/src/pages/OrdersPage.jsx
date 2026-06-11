import { useEffect, useRef, useState } from 'react'
import Seo from '../components/Seo'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCancelOrderMutation, useDownloadOrderInvoiceMutation, useGetOrdersQuery } from '../features/api/apiSlice'
import { formatDate } from '../utils/formatters'
import OrderTrackingStepper from '../components/OrderTrackingStepper'
import InvoicePreview from '../components/invoice/InvoicePreview'
import { X, Download } from 'lucide-react'

const formatAddress = (address) => {
  if (!address) return ''

  if (typeof address === 'string') {
    return address
  }

  return [
    address.fullName,
    address.name,
    address.line1,
    address.line2,
    address.addressLine1,
    address.addressLine2,
    address.street,
    address.street1,
    address.street2,
    address.city,
    address.state,
    address.postalCode,
    address.postal_code,
    address.pincode,
    address.zip,
    address.country,
  ]
    .filter(Boolean)
    .join(', ')
}

const ORDER_STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const normalizeOrderStatus = (order) => {
  const orderStatus = String(order?.orderStatus || '').toLowerCase()
  const splitStatus = String((order?.vendors || []).find((split) => String(split?.status || '').trim())?.status || '').toLowerCase()
  const status = orderStatus || splitStatus

  if (['delivered', 'returned', 'refunded'].includes(status)) return 'delivered'
  if (['shipped'].includes(status)) return 'shipped'
  if (['processing', 'packed'].includes(status)) return 'processing'
  if (['confirmed'].includes(status)) return 'confirmed'
  if (['cancelled'].includes(status)) return 'cancelled'
  if (['created', 'payment_pending', 'paid', 'pending'].includes(status)) return 'pending'
  if (['returned', 'refunded'].includes(status)) return 'delivered'

  return 'pending'
}

const formatStatusLabel = (status) => String(status || 'pending').replace(/_/g, ' ')

const getStatusTone = (status) => {
  if (['delivered', 'returned', 'refunded'].includes(status)) return 'bg-emerald-50 text-emerald-700'
  if (status === 'shipped') return 'bg-sky-50 text-sky-700'
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700'
  return 'bg-stone-100 text-stone-700'
}

const getEstimatedDays = (split) => {
  const minDays = Number(split?.estimatedDeliveryMinDays)
  const maxDays = Number(split?.estimatedDeliveryMaxDays)
  const deliveryDays = Number(split?.deliveryInDays)

  if (Number.isFinite(minDays) && minDays > 0) return minDays
  if (Number.isFinite(maxDays) && maxDays > 0) return maxDays
  if (Number.isFinite(deliveryDays) && deliveryDays > 0) return deliveryDays
  return null
}

const getOrderStatusTone = (status) => {
  if (status === 'delivered') return 'border-emerald-300 bg-emerald-50 text-emerald-700'
  if (status === 'shipped') return 'border-sky-300 bg-sky-50 text-sky-700'
  if (status === 'processing') return 'border-violet-300 bg-violet-50 text-violet-700'
  if (status === 'confirmed') return 'border-blue-300 bg-blue-50 text-blue-700'
  if (status === 'cancelled') return 'border-rose-300 bg-rose-50 text-rose-700'
  return 'border-stone-300 bg-stone-100 text-stone-700'
}

const toInvoiceDateTime = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

const buildCustomerInvoiceDraft = (order = {}) => {
  const vendorSplits = order.vendors || order.subOrders || []
  const vendorSplit = vendorSplits[0] || {}
  const paymentDetails = order.paymentDetails || {}
  const billingAddress = order.billingAddress || order.billingDetails || order.billToAddress || order.shippingAddress || {}
  const shippingAddress = order.shippingAddress || order.shipToAddress || order.shippingDetails || billingAddress || {}
  const customerName =
    billingAddress.fullName ||
    billingAddress.name ||
    shippingAddress.fullName ||
    shippingAddress.name ||
    order.user?.name ||
    order.user?.fullName ||
    'Customer'
  const customerPhone = billingAddress.phone || shippingAddress.phone || order.user?.phone || ''
  const billToAddress = formatAddress(billingAddress)
  const shipToAddress = formatAddress(shippingAddress)

  const billingAddressObj = {
    name: billingAddress.fullName || billingAddress.name || '',
    phone: billingAddress.phone || billingAddress.mobile || billingAddress.contact || '',
    street:
      billingAddress.line1 || billingAddress.addressLine1 || billingAddress.street || billingAddress.street1 || billingAddress.street2 || billingAddress.line2 || '',
    city: billingAddress.city || '',
    state: billingAddress.state || '',
    zip: billingAddress.postalCode || billingAddress.postal_code || billingAddress.pincode || billingAddress.zip || '',
    country: billingAddress.country || '',
  }

  const shippingAddressObj = {
    name: shippingAddress.fullName || shippingAddress.name || billingAddressObj.name || '',
    phone: shippingAddress.phone || shippingAddress.mobile || shippingAddress.contact || billingAddressObj.phone || '',
    street:
      shippingAddress.line1 || shippingAddress.addressLine1 || shippingAddress.street || shippingAddress.street1 || shippingAddress.street2 || shippingAddress.line2 || '',
    city: shippingAddress.city || '',
    state: shippingAddress.state || '',
    zip: shippingAddress.postalCode || shippingAddress.postal_code || shippingAddress.pincode || shippingAddress.zip || '',
    country: shippingAddress.country || '',
  }
  const sellerName = vendorSplit.vendorBusinessName || vendorSplit.vendorName || 'Shopzy Seller'
  const sellerAddress = formatAddress(vendorSplit.vendorBusinessAddress)
  const paymentMethod = String(order.paymentMethod || '').toLowerCase() === 'cod' ? 'Cash on Delivery' : 'Online Payment'
  const transactionId = paymentDetails.stripePaymentIntentId || paymentDetails.stripeCheckoutSessionId || paymentDetails.razorpayPaymentId || 'N/A'
  const paidAtValue = order.paidAt || order.deliveredAt || paymentDetails.paidAt || order.paymentDate || order.paymentCompletedAt

  return {
    customerName,
    customerPhone,
    billToAddress,
    shipToName: customerName,
    shipToPhone: customerPhone,
    shipToAddress,
    billingAddress: billingAddressObj,
    shippingAddress: shippingAddressObj,
    placeOfSupply: shippingAddress.state || billingAddress.state || '—',
    sellerName,
    sellerAddress,
    sellerGstin: vendorSplit.vendorGstin || vendorSplit.vendorGSTIN || vendorSplit.vendorGstNumber || '—',
    orderNumber: order.orderNumber || order._id,
    invoiceNumber: vendorSplit.invoiceNumber || order.invoiceNumber || '',
    orderDate: toInvoiceDateTime(order.createdAt),
    invoiceDate: toInvoiceDateTime(vendorSplit.invoiceGeneratedAt || order.createdAt),
    deliveryDate: toInvoiceDateTime(vendorSplit.estimatedDeliveryDate || order.deliveredAt || order.updatedAt || order.createdAt),
    orderStatus: order.orderStatus || vendorSplit.status || '—',
    paymentStatus: order.paymentStatus || '—',
    paymentMethod,
    paymentGateway: paymentDetails.gateway || paymentDetails.provider || paymentMethod,
    transactionId,
    paidAt: toInvoiceDateTime(paidAtValue),
    refundStatus: order.refundStatus || '—',
    trackingId: vendorSplit.trackingId || '',
    vendorSplits: vendorSplits,
    couponDiscount: Number(order.couponDiscount || order.discountAmount || 0),
    platformDiscount: Number(order.platformDiscount || 0),
    shippingCharges: Number(order.shippingCharges || 0),
    handlingCharges: Number(order.handlingCharges || 0),
    totalAmount: Number(order.totalAmount || 0),
      items: (order.items || []).map((item, index) => {
      const vendorItemOverride = (order.vendorInvoiceDraft?.items || []).find((it) => (it.id || it._id) === (item._id || `${item.product}-${index}`)) || null
      const resolved = vendorItemOverride || item
      const unitPrice = Number(resolved.price || resolved.unitPrice || item.price || 0)
      const qty = Number(resolved.quantity || item.quantity || 0)
      const discount = Number(resolved.discountValue ?? resolved.discount ?? 0)
      const taxRate = Number(resolved.taxRate ?? resolved.tax ?? 0)

      // compute taxable, tax amount and final line total (rounded to 2 decimals)
      const taxable = Number((unitPrice * qty) - (discount || 0))
      const gstAmount = Number(((taxable * (taxRate || 0)) / 100) || 0)
      const roundedTaxable = Number(taxable?.toFixed(2))
      const roundedGst = Number(gstAmount?.toFixed(2))
      const lineTotal = Number((roundedTaxable + roundedGst).toFixed(2))

      return {
        id: item._id || `${item.product}-${index}`,
        name: resolved.name || item.name || 'Product',
        size: resolved.size || item.size || '',
        quantity: qty,
        price: unitPrice,
        unitPrice: unitPrice,
        sku: resolved.sku || item.sku || item.hsn || '—',
        vendorName: resolved.vendorName || item.vendorName || vendorSplit.vendorBusinessName || vendorSplit.vendorName || 'Shopzy Seller',
        image: resolved.image || resolved.thumbnail || resolved.productImage || item.image || item.thumbnail || item.product?.images?.[0]?.url || '',
        imageUrl: resolved.imageUrl || item.imageUrl || item.product?.images?.[0]?.url || item.product?.image || '',
        thumbnail: resolved.thumbnail || item.thumbnail || item.product?.images?.[0]?.url || '',
        productImage: resolved.productImage || item.productImage || item.product?.images?.[0]?.url || '',
        color: resolved.variant?.color || resolved.color || item.color || '',
        hsn: resolved.hsn || item.hsn || '330499',
        discount: Number(resolved.discount ?? resolved.discountValue ?? 0),
        discountType: resolved.discountType || 'amount',
        discountValue: Number(resolved.discountValue ?? resolved.discount ?? 0),
        taxRate: taxRate,
        gst: Number(taxRate || 0),
        gstAmount: roundedGst,
        taxable: roundedTaxable,
        total: lineTotal,
        invoiceNumber: resolved.invoiceNumber || item.invoiceNumber || item.suborderId || vendorSplit.invoiceNumber || '',
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
    }),
    // compute totals for the overall draft
    subtotal: Number((order.items || []).reduce((s, it, idx) => {
      const v = (order.vendorInvoiceDraft?.items || []).find((x) => (x.id || x._id) === (it._id || `${it.product}-${idx}`)) || it
      const unit = Number(v.price || v.unitPrice || it.price || 0)
      const q = Number(v.quantity || it.quantity || 0)
      const disc = Number(v.discountValue ?? v.discount ?? 0)
      const taxableLine = Number((unit * q) - (disc || 0))
      return s + Number(taxableLine || 0)
    }, 0).toFixed(2)),
    gstTotal: Number((order.items || []).reduce((s, it, idx) => {
      const v = (order.vendorInvoiceDraft?.items || []).find((x) => (x.id || x._id) === (it._id || `${it.product}-${idx}`)) || it
      const unit = Number(v.price || v.unitPrice || it.price || 0)
      const q = Number(v.quantity || it.quantity || 0)
      const disc = Number(v.discountValue ?? v.discount ?? 0)
      const taxRateLine = Number(v.taxRate ?? v.tax ?? 0)
      const taxableLine = Number((unit * q) - (disc || 0))
      const tax = (taxableLine * (taxRateLine || 0)) / 100
      return s + Number(tax || 0)
    }, 0).toFixed(2)),
    totalAmount: Number((Number((order.items || []).reduce((s, it, idx) => {
      const v = (order.vendorInvoiceDraft?.items || []).find((x) => (x.id || x._id) === (it._id || `${it.product}-${idx}`)) || it
      const unit = Number(v.price || v.unitPrice || it.price || 0)
      const q = Number(v.quantity || it.quantity || 0)
      const disc = Number(v.discountValue ?? v.discount ?? 0)
      const taxRateLine = Number(v.taxRate ?? v.tax ?? 0)
      const taxableLine = Number((unit * q) - (disc || 0))
      const tax = (taxableLine * (taxRateLine || 0)) / 100
      return s + Number(taxableLine || 0) + Number(tax || 0)
    }, 0).toFixed(2)) - Number(order.couponDiscount || order.discountAmount || 0) - Number(order.platformDiscount || 0) + Number(order.shippingCharges || 0) + Number(order.handlingCharges || 0)).toFixed(2)),
  }
}

const OrdersPage = () => {
  const { data, isLoading, isError } = useGetOrdersQuery()
  const [cancelReasonByOrder, setCancelReasonByOrder] = useState({})
  const [cancelOrder, cancelOrderState] = useCancelOrderMutation()
  const [downloadOrderInvoice] = useDownloadOrderInvoiceMutation()
  const [previewOrder, setPreviewOrder] = useState(null)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
  const invoiceContentRef = useRef(null)
  const orders = data?.orders || []
  const isCancellableStatus = (order) => ['created', 'payment_pending', 'paid', 'confirmed', 'packed', 'pending', 'processing'].includes(String(order?.orderStatus || '').toLowerCase())
  const needsRefundProcessing = (order) =>
    String(order?.orderStatus || '').toLowerCase() === 'cancelled'
    && String(order?.paymentStatus || '').toLowerCase() === 'paid'
    && String(order?.refundStatus || '').toLowerCase() === 'pending'

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

  const handleDownloadInvoice = async (order) => {
    if (!order) return
    setPreviewOrder(order)
  }

  const downloadBackendInvoice = async (order) => {
    const blob = await downloadOrderInvoice(order._id).unwrap()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileSuffix = order._id?.slice(-6)?.toUpperCase?.() || 'ORDER'

    link.href = objectUrl
    link.download = `invoice-${fileSuffix}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  }

  const handleDownloadFromModal = async () => {
    if (!previewOrder) return
    setIsGeneratingInvoice(true)
  }

  useEffect(() => {
    const generateInvoice = async () => {
      if (!previewOrder || !isGeneratingInvoice) {
        return
      }

      try {
        let retries = 0
        // Wait for the invoice preview to mount. Increase retries and delay
        // so fonts/styles have time to load and the DOM becomes stable.
        while (!invoiceContentRef.current && retries < 40) {
          await new Promise((resolve) => window.setTimeout(resolve, 100))
          retries += 1
        }

        if (!invoiceContentRef.current) {
          throw new Error('Invoice preview not ready')
        }

        // Allow a short extra pause so fonts and images can settle.
        await new Promise((resolve) => window.setTimeout(resolve, 200))
        await new Promise((resolve) => window.requestAnimationFrame(() => resolve()))
        const html2pdfModule = await import('html2pdf.js')
        const html2pdf = html2pdfModule.default || html2pdfModule
        const fileSafeInvoice = (previewOrder.invoiceNumber || previewOrder.orderNumber || previewOrder._id || 'invoice').replace(/[^a-zA-Z0-9-_]/g, '_')

        await html2pdf()
          .set({
            margin: [8, 8, 8, 8],
            filename: `${fileSafeInvoice}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              allowTaint: false,
              backgroundColor: '#ffffff',
              logging: false,
              imageTimeout: 15000,
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] },
          })
          .from(invoiceContentRef.current)
          .save()

        toast.success('Invoice downloaded successfully')
        setPreviewOrder(null)
      } catch (error) {
        try {
          await downloadBackendInvoice(previewOrder)
          toast.error('Using fallback invoice download (backend PDF)')
          setPreviewOrder(null)
        } catch (fallbackError) {
          toast.error(fallbackError?.data?.message || 'Unable to download invoice')
        }
      } finally {
        setIsGeneratingInvoice(false)
      }
    }

    generateInvoice()
  }, [previewOrder, isGeneratingInvoice, downloadOrderInvoice])

  const handleCancelOrder = async (order) => {
    try {
      await cancelOrder({
        id: order._id,
        reason: cancelReasonByOrder[order._id]?.trim() || undefined,
      }).unwrap()
      setCancelReasonByOrder((prev) => ({ ...prev, [order._id]: '' }))
      toast.success('Order cancelled. If payment was already captured, refund will be processed within 1-7 working days.')
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to cancel order')
    }
  }

  return (
    <div className="container-shell py-12">
      <Seo title="My Orders" description="Review your recent orders." />

      <div className="mb-8">
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 font-serif-display text-4xl text-stone-950">My Orders</h1>
          <p className="mt-2 text-stone-600">You can view your placed orders and their status here.</p>
      </div>

      {isLoading ? (
        <div className="rounded-4xl border border-stone-200 bg-white p-8 text-center text-stone-600">
          Loading your orders...
        </div>
      ) : null}

      {!isLoading && isError ? (
        <div className="rounded-4xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">
          We could not load your orders right now. Please try again in a moment.
        </div>
      ) : null}

      {!isLoading && !isError && !orders.length ? (
        <div className="rounded-4xl border border-stone-200 bg-white p-8 text-center">
          <h2 className="text-2xl font-semibold text-stone-950">No orders yet</h2>
            <p className="mt-3 text-stone-600">Once you place your first order, it will appear here.</p>
        </div>
      ) : null}

      {!isLoading && !isError && orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order._id} className="rounded-4xl border border-stone-200 bg-white p-6 shadow-sm">
              <>
                {(() => {
                  const orderStatus = normalizeOrderStatus(order)
                  const refundPending = needsRefundProcessing(order)

                  return (
                    <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">Order ID: {order._id}</p>
                  <p className="mt-2 text-sm text-stone-600">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusTone(orderStatus)}`}>
                    {formatStatusLabel(orderStatus)}
                  </span>
                  {(() => {
                    const paymentFailed = String(order.paymentStatus || '').toLowerCase() === 'failed'
                    const orderFailed = String(order.orderStatus || '').toLowerCase() === 'failed'
                    if (paymentFailed || orderFailed) return null
                    return (
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(order)}
                        className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-violet-700"
                        style={{ color: '#fff' }}
                        disabled={isGeneratingInvoice}
                      >
                        {isGeneratingInvoice ? 'Downloading Bill...' : 'Download Bill'}
                      </button>
                    )
                  })()}
                </div>
              </div>

              <div className="mt-4 rounded-[1.4rem] border border-stone-200 bg-stone-50 px-4 py-3">
                <OrderTrackingStepper order={order} onDownloadBill={handleDownloadInvoice} />
              </div>

              {refundPending ? (
                <div className="mt-4 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Refund pending. Vendor and admin have been notified. Your amount will be refunded within 1-7 working days.
                </div>
              ) : null}

              {String(order.orderStatus || '').toLowerCase() === 'cancelled' && order.cancelReason ? (
                <div className="mt-4 rounded-[1.2rem] bg-stone-50 px-4 py-3 text-sm text-stone-700">
                  Cancellation reason: {order.cancelReason}
                </div>
              ) : null}

              {isCancellableStatus(order) ? (
                <div className="mt-4 rounded-[1.4rem] border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-sm font-semibold text-stone-900">Need to cancel this order?</p>
                  <p className="mt-1 text-sm text-stone-600">You can request cancellation before shipment. For prepaid orders, refunds are processed within 1-7 working days.</p>
                  <textarea
                    className="mt-3 min-h-24 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    placeholder="Optional: tell us why you want to cancel"
                    value={cancelReasonByOrder[order._id] || ''}
                    onChange={(event) => setCancelReasonByOrder((prev) => ({ ...prev, [order._id]: event.target.value }))}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(order)}
                      className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={cancelOrderState.isLoading}
                    >
                      {cancelOrderState.isLoading ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  </div>
                </div>
              ) : null}
                    </>
                  )
                })()}
              </>
            </article>
          ))}
        </div>
      ) : null}

      {previewOrder ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-screen w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header with Close button */}
            <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-stone-950">Invoice Preview</h2>
              <button
                type="button"
                onClick={() => {
                  setPreviewOrder(null)
                  setIsGeneratingInvoice(false)
                }}
                className="rounded-lg p-2 text-stone-600 transition hover:bg-stone-100"
                disabled={isGeneratingInvoice}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Invoice Content */}
            <div className="p-6">
              <InvoicePreview
                draft={buildCustomerInvoiceDraft(previewOrder)}
                isVendor={false}
                showAboutShopzy={false}
                isEditing={false}
                onUpdateField={() => {}}
                onUpdateItem={() => {}}
                onDownloadPdf={() => {}}
                onPrint={() => {}}
                onShare={() => {}}
                onCopyInvoiceId={() => {}}
                contentRef={invoiceContentRef}
                items={buildCustomerInvoiceDraft(previewOrder).items}
                vendorSplits={previewOrder.subOrders?.length ? previewOrder.subOrders : previewOrder.vendors || []}
                subtotal={buildCustomerInvoiceDraft(previewOrder).subtotal}
                gstTotal={buildCustomerInvoiceDraft(previewOrder).gstTotal}
                totalAmount={(() => {
                  const draft = buildCustomerInvoiceDraft(previewOrder)
                  const coupon = Number(previewOrder.couponDiscount || previewOrder.discountAmount || 0)
                  const platform = Number(previewOrder.platformDiscount || 0)
                  const shipping = Number(previewOrder.shippingCharges || 0)
                  const handling = Number(previewOrder.handlingCharges || 0)
                  const total = Number(draft.subtotal || 0) + Number(draft.gstTotal || 0) - coupon - platform + shipping + handling
                  return Number(Number(total || 0).toFixed(2))
                })()}
                sameAddress={
                  formatAddress(previewOrder.billingAddress || previewOrder.billToAddress) ===
                  formatAddress(previewOrder.shippingAddress || previewOrder.shipToAddress)
                }
                hideActions={isGeneratingInvoice}
              />
            </div>

            {/* Footer with Close button only */}
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-stone-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setPreviewOrder(null)
                  setIsGeneratingInvoice(false)
                }}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isGeneratingInvoice}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Offscreen render for html2pdf export (kept hidden) */}
      {previewOrder && isGeneratingInvoice ? (
        <div className="fixed inset-0 flex items-start justify-center pointer-events-none opacity-0 z-50">
            <InvoicePreview
                draft={buildCustomerInvoiceDraft(previewOrder)}
                isVendor={false}
                showAboutShopzy={false}
                isEditing={false}
                onUpdateField={() => {}}
                onUpdateItem={() => {}}
                onDownloadPdf={() => {}}
                onPrint={() => {}}
                onShare={() => {}}
                onCopyInvoiceId={() => {}}
                contentRef={invoiceContentRef}
                items={buildCustomerInvoiceDraft(previewOrder).items}
                vendorSplits={previewOrder.subOrders?.length ? previewOrder.subOrders : previewOrder.vendors || []}
                subtotal={buildCustomerInvoiceDraft(previewOrder).subtotal}
                gstTotal={buildCustomerInvoiceDraft(previewOrder).gstTotal}
                totalAmount={(() => {
                  const draft = buildCustomerInvoiceDraft(previewOrder)
                  const coupon = Number(previewOrder.couponDiscount || previewOrder.discountAmount || 0)
                  const platform = Number(previewOrder.platformDiscount || 0)
                  const shipping = Number(previewOrder.shippingCharges || 0)
                  const handling = Number(previewOrder.handlingCharges || 0)
                  const total = Number(draft.subtotal || 0) + Number(draft.gstTotal || 0) - coupon - platform + shipping + handling
                  return Number(Number(total || 0).toFixed(2))
                })()}
                sameAddress={
                  formatAddress(previewOrder.billingAddress || previewOrder.billToAddress) ===
                  formatAddress(previewOrder.shippingAddress || previewOrder.shipToAddress)
                }
                hideActions={isGeneratingInvoice}
              />
        </div>
      ) : null}
    </div>
  )
}

export default OrdersPage
