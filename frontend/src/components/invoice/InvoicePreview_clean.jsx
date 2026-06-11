import {
  BadgeCheck,
  Banknote,
  Building2,
  CalendarClock,
  Copy,
  CreditCard,
  FileText,
  Globe,
  Link,
  MapPin,
  Package,
  Printer,
  ReceiptText,
  Share2,
  Store,
  Truck,
  Download,
} from 'lucide-react'
import { getImageUrl } from '../../utils/formatters'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0))

const parseInvoiceDate = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const directDate = new Date(value)
  if (!Number.isNaN(directDate.getTime())) {
    return directDate
  }

  if (typeof value === 'string') {
    const match = value.trim().match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)?)?$/i,
    )

    if (match) {
      const [, day, month, year, hour = '0', minute = '0', second = '0', meridiem] = match
      let parsedHour = Number(hour)
      const parsedMinute = Number(minute)
      const parsedSecond = Number(second)

      if (meridiem) {
        const normalizedMeridiem = meridiem.toLowerCase()
        if (normalizedMeridiem === 'pm' && parsedHour < 12) parsedHour += 12
        if (normalizedMeridiem === 'am' && parsedHour === 12) parsedHour = 0
      }

      const parsed = new Date(Number(year), Number(month) - 1, Number(day), parsedHour, parsedMinute, parsedSecond)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }
  }

  return null
}

const formatDateLabel = (value) => {
  if (!value) return '—'
  const parsed = parseInvoiceDate(value)
  if (!parsed) return '—'
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()

const getStatusTone = (value, fallback = 'slate') => {
  const status = normalizeText(value)
  if (['paid', 'delivered', 'success', 'completed'].includes(status)) return 'emerald'
  if (['pending', 'processing', 'packed', 'shipped'].includes(status)) return 'amber'
  if (['cancelled', 'failed', 'refunded', 'returned'].includes(status)) return 'rose'
  if (fallback === 'blue') return 'blue'
  return 'slate'
}

const badgeClassMap = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  blue: 'border-sky-200 bg-sky-50 text-sky-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
}

const defaultProductSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23f8fafc" width="100%" height="100%"/><g fill="%239ca3af"><rect x="14" y="22" width="52" height="36" rx="4"/><circle cx="40" cy="40" r="8"/></g></svg>'

const getImageSrc = (item) => {
  if (!item) return null
  const candidates = [
    item.image,
    item.imageUrl,
    item.thumbnail,
    item.product?.images?.[0]?.url,
    item.product?.image,
    item.product?.thumbnail,
  ]
  for (const c of candidates) {
    if (!c) continue
    try {
      const resolved = getImageUrl(c)
      if (resolved) return resolved
    } catch (e) {
      continue
    }
  }
  return null
}

const Panel = ({ className = '', children }) => (
  <section 
    className={`rounded-lg border border-slate-300 bg-white shadow-sm ${className}`}
    style={{ pageBreakInside: 'avoid' }}
  >
    {children}
  </section>
)

const SectionHeading = ({ icon: Icon, title, subtitle, trailing }) => (
  <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
    <div>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 text-violet-600" /> : null}
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">{title}</h3>
      </div>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </div>
    {trailing}
  </div>
)

const Badge = ({ tone = 'slate', children, className = '' }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${badgeClassMap[tone] || badgeClassMap.slate} ${className}`}>
    {children}
  </span>
)

const CompactInput = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100 ${className}`}
  />
)

const CompactTextarea = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100 ${className}`}
  />
)

export const InvoiceHeader = ({
  draft,
  hideActions,
  onDownloadPdf,
  onPrint,
  onShare,
  onCopyInvoiceId,
}) => {
  const companyAddress = draft.sellerAddress || 'Shopzy Marketplace, India'

  return (
    <div className="space-y-4">
      {!hideActions ? (
        <div className="invoice-no-print grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={onDownloadPdf}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-violet-300"
          >
            <Download className="h-5 w-5 text-violet-600" />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-blue-300"
          >
            <Printer className="h-5 w-5 text-blue-600" />
            <span>Print Invoice</span>
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-emerald-300"
          >
            <Share2 className="h-5 w-5 text-emerald-600" />
            <span>Share Invoice</span>
          </button>
          <button
            type="button"
            onClick={onCopyInvoiceId}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-amber-300"
          >
            <Copy className="h-5 w-5 text-amber-600" />
            <span>Copy Invoice</span>
          </button>
        </div>
      ) : null}

      <Panel>
        <div className="grid gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-start lg:gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-violet-700 shadow-lg">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tracking-tight text-slate-950">Shopzy</p>
              <p className="mt-0.5 text-sm text-slate-600">Happy Shopping</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="blue">Tax Invoice</Badge>
                {draft.invoiceNumber ? <Badge tone="emerald">#{draft.invoiceNumber}</Badge> : <Badge tone="slate">Draft</Badge>}
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Document Type</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tighter text-slate-950">TAX INVOICE</h1>
            <p className="mt-1 text-xs text-slate-600">Original for Recipient</p>
          </div>

          <div className="space-y-2 lg:text-right">
            <div className="space-y-1">
              <div className="flex items-start gap-2 lg:justify-end">
                <Building2 className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <p className="text-sm font-semibold text-slate-900">{draft.sellerName || 'Shopzy Seller'}</p>
              </div>
              <div className="flex items-start gap-2 lg:justify-end">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">{companyAddress}</p>
              </div>
              <div className="flex items-start gap-2 lg:justify-end pt-1 border-t border-slate-200 mt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">GSTIN:</span>
                <span className="text-sm font-bold text-slate-900">{draft.sellerGstin || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}

export const OrderInfoCard = ({ draft, isEditing, onUpdateField }) => {
  const fields = [
    { label: 'Invoice Number', value: 'invoiceNumber', editable: true, render: draft.invoiceNumber || '—' },
    { label: 'Order ID', value: 'orderNumber', editable: true, render: draft.orderNumber || '—' },
    { label: 'Order Date', value: 'orderDate', editable: true, render: formatDateLabel(draft.orderDate) },
    { label: 'Delivery Date', value: 'deliveryDate', editable: true, render: formatDateLabel(draft.deliveryDate) },
    { label: 'Order Status', value: 'orderStatus', badge: true, render: draft.orderStatus || '—' },
    { label: 'Payment Status', value: 'paymentStatus', badge: true, render: (String(draft.paymentStatus || '').toLowerCase() === 'pending') ? '—' : (draft.paymentStatus || '—') },
    { label: 'Payment Method', value: 'paymentMethod', editable: true, render: draft.paymentMethod || '—' },
    { label: 'Place of Supply', value: 'placeOfSupply', editable: true, render: draft.placeOfSupply || '—' },
  ]

  return (
    <Panel>
      <SectionHeading icon={ReceiptText} title="Order Information" subtitle="Compact order, payment, and delivery overview" />
      <div className="grid gap-3 px-4 py-5 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => (
          <div key={field.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{field.label}</p>
            {isEditing && field.editable ? (
              <CompactInput className="mt-2 h-9 text-sm" value={draft[field.value] || ''} onChange={(event) => onUpdateField?.(field.value, event.target.value)} />
            ) : field.badge ? (
              <div className="mt-2"><Badge tone={getStatusTone(field.render)} className="justify-center">{field.render}</Badge></div>
            ) : (
              <p className="mt-2 break-all text-sm text-slate-950">{field.render}</p>
            )}
          </div>
        ))}
      </div>
    </Panel>
  )
}

export const AddressCard = ({ title, icon: Icon, name, phone, address, isEditing, onUpdate }) => (
  <Panel className="h-full">
    <SectionHeading icon={Icon} title={title} subtitle="Customer address details" />
    <div className="space-y-3 px-4 py-4 sm:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Name</p>
        {isEditing ? (
          <CompactInput className="mt-2 h-9 text-sm" value={name || ''} onChange={(event) => onUpdate?.('name', event.target.value)} />
        ) : (
          <p className="mt-2 text-sm text-slate-950">{name || '—'}</p>
        )}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Phone</p>
        {isEditing ? (
          <CompactInput className="mt-2 h-9 text-sm" value={phone || ''} onChange={(event) => onUpdate?.('phone', event.target.value)} />
        ) : (
          <p className="mt-2 text-sm text-slate-700">{phone || '—'}</p>
        )}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Address</p>
        {isEditing ? (
          <CompactTextarea className="mt-2 min-h-24 text-sm" value={address || ''} onChange={(event) => onUpdate?.('address', event.target.value)} />
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{address || '—'}</p>
        )}
      </div>
    </div>
  </Panel>
)

export const ItemsTable = ({ items = [], isEditing, onUpdateItem }) => (
  <Panel>
    <SectionHeading icon={Package} title="Order Items" subtitle="Compact line items with product and tax details" />
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
            <tr key={`${item.id}-${item.sn}`} className="border-b border-slate-200 align-top hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {(() => {
                      const src = getImageSrc(item)
                      if (!src) return <Package className="h-5 w-5 text-slate-400" />
                      return (
                        <img
                          src={src}
                          alt={item.name || 'Product'}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultProductSvg }}
                          className="h-full w-full object-contain"
                        />
                      )
                    })()}
                  </div>
                  <div className="min-w-0">
                    {isEditing ? (
                      <CompactInput className="h-9 text-sm" value={item.name || ''} onChange={(event) => onUpdateItem?.(item.id, 'name', event.target.value)} />
                    ) : (
                      <p className="text-slate-950 text-sm">{item.name || 'Product'}</p>
                    )}
                      <p className="mt-1 text-xs text-slate-500">Color: {item.variant?.color || item.color || '—'} | Size: {item.variant?.size || item.size || '—'}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm">{isEditing ? <CompactInput className="h-9 text-sm" value={item.sku || ''} onChange={(event) => onUpdateItem?.(item.id, 'sku', event.target.value)} /> : <span className="text-slate-700">{item.sku || '—'}</span>}</td>
              <td className="px-4 py-3 text-sm">{isEditing ? <CompactInput className="h-9 text-sm" value={item.vendorName || ''} onChange={(event) => onUpdateItem?.(item.id, 'vendorName', event.target.value)} /> : <span className="text-slate-700">{item.vendorName || '—'}</span>}</td>
              <td className="px-4 py-3 text-right text-sm">{isEditing ? <CompactInput type="number" min="1" className="h-9 w-20 min-w-20 text-right text-sm" value={item.quantity} onChange={(event) => onUpdateItem?.(item.id, 'quantity', Number(event.target.value || 0))} /> : <span className="text-slate-900">{item.quantity}</span>}</td>
              <td className="px-4 py-3 text-right text-sm">{isEditing ? <CompactInput type="number" min="0" className="h-9 w-28 min-w-28 text-right text-sm" value={item.price} onChange={(event) => onUpdateItem?.(item.id, 'price', Number(event.target.value || 0))} /> : <span className="text-slate-900">{formatCurrency(item.price)}</span>}</td>
              <td className="px-4 py-3 text-right text-sm">{isEditing ? <CompactInput type="number" min="0" step="0.1" className="h-9 w-20 min-w-20 text-right text-sm" value={item.taxRate} onChange={(event) => onUpdateItem?.(item.id, 'taxRate', Number(event.target.value || 0))} /> : <span className="text-slate-700">{item.gstAmount ? formatCurrency(item.gstAmount) : `${Number(item.taxRate || 0)}%`}</span>}</td>
              <td className="px-4 py-3 text-right text-sm">
                {isEditing ? (
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    <CompactInput
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9 w-24 min-w-24 text-right text-sm"
                      value={item.discountValue ?? item.discount ?? 0}
                      onChange={(event) => onUpdateItem?.(item.id, 'discountValue', Number(event.target.value || 0))}
                    />
                    <select
                      className="h-9 w-14 min-w-14 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      value={item.discountType || 'amount'}
                      onChange={(event) => onUpdateItem?.(item.id, 'discountType', event.target.value)}
                    >
                      <option value="amount">₹</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                ) : (
                  <span className="text-slate-700">
                    {item.discountType === 'percent'
                      ? `${Number(item.discountValue || 0)}% (${formatCurrency(item.discount)})`
                      : formatCurrency(item.discount)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-950 text-sm">{formatCurrency(item.total)}</td>
            </tr>
          )) : (
            <tr><td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={8}>No items available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </Panel>
)

export const PriceSummary = ({ subtotal, gstTotal, couponDiscount, platformDiscount, shippingCharges, handlingCharges, totalAmount, isEditing, onUpdateField }) => {
  const rows = [
    ['Subtotal', subtotal, 'subtotal', false],
    ['GST Total', gstTotal, 'gstTotal', false],
    ['Coupon Discount', -Math.abs(couponDiscount || 0), 'couponDiscount', true],
    ['Platform Discount', -Math.abs(platformDiscount || 0), 'platformDiscount', true],
    ['Shipping Charges', shippingCharges, 'shippingCharges', true],
    ['Handling Charges', handlingCharges, 'handlingCharges', true],
  ]

  return (
    <Panel className="h-full">
      <SectionHeading icon={Banknote} title="Price Summary" subtitle="Totals and charges" />
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <tbody>
            {rows.map(([label, value, key, editable]) => (
              <tr key={label} className="border-b border-slate-200">
                <td className="px-4 py-3 text-sm text-slate-600">{label}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  {isEditing && editable ? (
                    <CompactInput
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9 w-32 min-w-32 text-right text-sm"
                      value={Math.abs(value || 0)}
                      onChange={(event) => onUpdateField?.(key, Number(event.target.value || 0))}
                    />
                  ) : (
                    <>
                      {value < 0 ? <span className="text-rose-600">-{formatCurrency(Math.abs(value))}</span> : formatCurrency(value)}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t-2 border-slate-300 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-900">Total Amount</span>
          <span className="text-2xl font-bold text-violet-600">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </Panel>
  )
}

export const PaymentSummary = ({ draft }) => (
  <Panel>
    <SectionHeading icon={CreditCard} title="Payment Summary" subtitle="Transaction and payment breakdown" />
    <div className="grid gap-3 px-4 py-4 sm:px-6 sm:grid-cols-2 lg:grid-cols-5">
      <InfoTile label="Transaction ID" value={draft.transactionId || 'N/A'} icon={FileText} />
      <InfoTile label="Payment Gateway" value={draft.paymentGateway || '—'} icon={Globe} />
      <InfoTile label="Payment Type" value={draft.paymentMethod || '—'} icon={CreditCard} />
      <InfoTile label="Paid At" value={formatDateLabel(draft.paidAt)} icon={CalendarClock} />
      <InfoTile label="Refund Status" value={draft.refundStatus || '—'} icon={BadgeCheck} />
    </div>
  </Panel>
)

const VendorSubOrders = ({ vendorSplits = [] }) => {
  if (!vendorSplits.length) return null

  const normalizedSplits = vendorSplits.map((split, index) => ({
    vendor: split.vendorBusinessName || split.vendorName || split.vendor || 'Vendor',
    suborderId: split.invoiceNumber || split.suborderId || split.orderNumber || split.id || `SUB-${index + 1}`,
    status: split.status || split.orderStatus || '—',
    amount: Number(split.amount || split.orderAmount || split.totalAmount || 0),
    commission: Number(split.commission || split.commissionDeducted || split.commissionAmount || 0),
    vendorEarnings: Number(split.vendorEarnings || split.earnings || split.payoutAmount || 0),
  }))

  return (
    <Panel>
      <SectionHeading icon={BadgeCheck} title="Vendor Sub-Orders" subtitle="Vendor-wise payment and earning details" />
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
            <tr>
              <th className="px-4 py-3 border-b border-slate-300">Vendor</th>
              <th className="px-4 py-3 border-b border-slate-300">Suborder ID</th>
              <th className="px-4 py-3 border-b border-slate-300">Status</th>
              <th className="px-4 py-3 text-right border-b border-slate-300">Order Amount</th>
              <th className="px-4 py-3 text-right border-b border-slate-300">Commission (Deducted)</th>
              <th className="px-4 py-3 text-right border-b border-slate-300">Vendor Earnings</th>
            </tr>
          </thead>
          <tbody>
            {normalizedSplits.map((split) => (
              <tr key={split.suborderId} className="border-b border-slate-200 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{split.vendor}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-600">{split.suborderId}</td>
                <td className="px-4 py-3 text-sm"><Badge tone={getStatusTone(split.status)}>{split.status}</Badge></td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(split.amount)}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(split.commission)}</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">{formatCurrency(split.vendorEarnings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

const InfoTile = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-center gap-2">
      {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : null}
      <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</p>
    </div>
    <p className="mt-2 break-all text-sm text-slate-950">{value}</p>
  </div>
)

export const InvoiceFooter = ({ returnPolicy, helpEmail, supportNumber, companyInfo }) => (
  <Panel>
    <SectionHeading icon={ReceiptText} title="Footer" subtitle="Policies and support information" />
    <div className="grid gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoTile label="Return Policy" value={returnPolicy || 'Eligible products can be returned or exchanged as per policy.'} icon={Package} />
        <InfoTile label="Help Email" value={helpEmail || 'support@shopzy.com'} icon={FileText} />
        <InfoTile label="Support Number" value={supportNumber || '+91 80000 00000'} icon={Truck} />
        <InfoTile label="Company Info" value={companyInfo || 'Shopzy Marketplace Pvt. Ltd.'} icon={Building2} />
      </div>
    </div>
    <div className="border-t border-slate-200 px-4 py-3 text-center text-xs font-semibold text-slate-700 sm:px-6">
      Thank you for shopping with Shopzy! 🙏
    </div>
  </Panel>
)

const InvoicePreview = ({
  draft,
  isEditing,
  onUpdateField,
  onUpdateItem,
  onDownloadPdf,
  onPrint,
  onShare,
  onCopyInvoiceId,
  contentRef,
  items = [],
  vendorSplits = [],
  subtotal = 0,
  gstTotal = 0,
  totalAmount = 0,
  sameAddress = false,
  hideActions = false,
  isVendor = false,
  showAboutShopzy = true,
}) => {
  return (
    <div
      ref={contentRef}
      className="w-full bg-white text-slate-950"
      style={{
        maxWidth: '8.5in',
        margin: '0 auto',
        padding: '12px',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
      }}
    >
      <style>{`
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .invoice-no-print { display: none !important; }
          @page { size: A4; margin: 8mm; orphans: 3; widows: 3; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
          table { border-collapse: collapse; width: 100%; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
      <div className="space-y-3">
        <InvoiceHeader draft={draft} hideActions={hideActions} onDownloadPdf={onDownloadPdf} onPrint={onPrint} onShare={onShare} onCopyInvoiceId={onCopyInvoiceId} />
        <OrderInfoCard draft={draft} isEditing={isEditing} onUpdateField={onUpdateField} />
        <div className="flex items-center justify-center">{sameAddress ? <Badge tone="emerald">Billing & Shipping Same</Badge> : null}</div>
        <div className="grid gap-3 lg:grid-cols-2">
          <AddressCard title="Billing Address" icon={Building2} name={draft.customerName} phone={draft.customerPhone} address={draft.billToAddress} isEditing={isEditing} onUpdate={(field, value) => { if (field === 'name') onUpdateField?.('customerName', value); if (field === 'phone') onUpdateField?.('customerPhone', value); if (field === 'address') onUpdateField?.('billToAddress', value) }} />
          <AddressCard title="Shipping Address" icon={Truck} name={draft.shipToName} phone={draft.shipToPhone} address={draft.shipToAddress} isEditing={isEditing} onUpdate={(field, value) => { if (field === 'name') onUpdateField?.('shipToName', value); if (field === 'phone') onUpdateField?.('shipToPhone', value); if (field === 'address') onUpdateField?.('shipToAddress', value) }} />
        </div>
        <ItemsTable items={items} isEditing={isEditing} onUpdateItem={onUpdateItem} />
        <PriceSummary subtotal={subtotal} gstTotal={gstTotal} couponDiscount={draft.couponDiscount} platformDiscount={draft.platformDiscount} shippingCharges={draft.shippingCharges} handlingCharges={draft.handlingCharges} totalAmount={totalAmount} isEditing={isEditing} onUpdateField={onUpdateField} />
        {isVendor ? <VendorSubOrders vendorSplits={vendorSplits || draft.vendorSplits || []} /> : null}
        <PaymentSummary draft={draft} />
        <InvoiceFooter returnPolicy="Eligible items can be returned as per policy within the return window mentioned on the site." helpEmail="support@shopzy.com" supportNumber="+91 80000 00000" companyInfo="Shopzy Marketplace Pvt. Ltd." showAboutShopzy={showAboutShopzy} />
      </div>
    </div>
  )
}

export default InvoicePreview
