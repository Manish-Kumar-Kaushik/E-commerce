import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Seo from '../components/Seo'
import InvoicePreview from '../components/invoice/InvoicePreview_clean'
import { AdminEmptyState, AdminMetricCard, AdminStatusPill, AdminSurface, AdminTopbar } from '../components/admin/AdminChrome'
import VendorProfileSettings from '../components/vendor/VendorProfileSettings'
import VendorAccountSettings from '../components/vendor/VendorAccountSettings'
import {
  useCreateVendorProfileMutation,
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetProductQuery,
  useGetProductsQuery,
  useGetVendorAnalyticsQuery,
  useGetNotificationsQuery,
  useGetNotificationCountQuery,
  useGetVendorOrdersQuery,
  useGetVendorProfileQuery,
  useGetVendorWalletQuery,
  useMarkNotificationAsReadMutation,
  useGenerateProductContentMutation,
  useUpdateProductMutation,
  useUpdateVendorOrderStatusMutation,
  useUploadProductImagesMutation,
} from '../features/api/apiSlice'
import { getApiErrorMessage } from '../utils/api'
import { getImageUrl } from '../utils/formatters'
import { buildProductPricingFormValues, calculatePricingPreview, getProductPricing } from '../utils/pricing'
import { CATEGORIES, COLORS, GST_SLAB_OPTIONS, SIZES, createInitialProductForm, getProductSpecTemplate } from '../utils/productOptions'
import { readStoredUser } from '../utils/storage'

const useLocalUser = () => {
  const storedUser = readStoredUser()

  if (storedUser) {
    return {
      user: {
        id: storedUser._id || storedUser.id,
        fullName: storedUser.name || storedUser.fullName || 'Vendor',
        imageUrl: storedUser.imageUrl || null,
        publicMetadata: { role: storedUser.role || 'vendor' },
      },
      isLoaded: true,
    }
  }

  return {
    user: null,
    isLoaded: true,
  }
}

const tabMeta = {
  overview: { title: 'Dashboard', subtitle: 'Track sales, alerts, products, and operations', primaryActionLabel: 'Add Product' },
  products: { title: 'Products', subtitle: 'Manage your catalog items', primaryActionLabel: 'Add Product' },
  orders: { title: 'Orders', subtitle: 'Track and fulfill customer orders', primaryActionLabel: 'Refresh' },
  analytics: { title: 'Analytics', subtitle: 'View sales performance and best sellers', primaryActionLabel: 'Overview' },
  wallet: { title: 'Wallet', subtitle: 'Review earnings and payouts', primaryActionLabel: 'Withdraw' },
  settings: { title: 'Settings', subtitle: 'Manage your profile and bank details', primaryActionLabel: 'Overview' },
}

const vendorTabs = [
  { key: 'overview', label: 'Dashboard', path: '/vendor' },
  { key: 'products', label: 'Products', path: '/vendor/products' },
  { key: 'orders', label: 'Orders', path: '/vendor/orders' },
  { key: 'analytics', label: 'Analytics', path: '/vendor/analytics' },
  { key: 'wallet', label: 'Wallet', path: '/vendor/wallet' },
  { key: 'settings', label: 'Settings', path: '/vendor/settings' },
]

const PRODUCT_FORM_STEPS = [
  'Basic Info',
  'Images',
  'Variants',
  'Pricing',
  'Shipping',
  'Publish',
]

const vendorSidebarTabs = [
  { key: 'overview', label: 'Dashboard' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'settings', label: 'Settings' },
]

const Sidebar = ({ activeTab, onSelectTab, isCollapsed, onToggleCollapse }) => (
  <aside
    className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-linear-to-b from-slate-900 to-slate-950 z-30 transition-all duration-300 ${isCollapsed ? 'w-20 items-center' : 'w-64 px-4'}`}
  >
    <div className={`flex items-center ${isCollapsed ? 'justify-center py-6' : 'justify-between py-5 px-2'} border-b border-white/10`}>
      <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">V</div>
        {!isCollapsed && (
          <div>
            <span className="block text-lg font-bold text-white">Vendor Hub</span>
            <span className="block text-xs text-slate-400">Shop Dashboard</span>
          </div>
        )}
      </div>
      {!isCollapsed && (
        <button type="button" onClick={onToggleCollapse} className="rounded-lg bg-white/10 p-2 text-slate-400 transition-colors hover:bg-white/20 hover:text-white" aria-label="Collapse sidebar">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}
    </div>

    <nav className="flex-1 overflow-y-auto py-4 px-2">
      <p className={`px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 ${isCollapsed ? 'text-center' : ''}`}>Menu</p>
      <div className="space-y-1">
        {vendorSidebarTabs.map((item) => {
          const isActive = activeTab === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-300 hover:bg-slate-800 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
            >
              {!isCollapsed ? <span>{item.label}</span> : <span>{item.label.slice(0, 1)}</span>}
            </button>
          )
        })}
      </div>
    </nav>

    <div className={`border-t border-white/10 p-4 ${isCollapsed ? 'text-center' : ''}`}>
      <span className="text-xs text-slate-500">Vendor Console</span>
    </div>
  </aside>
)

const ContainImage = ({ src, alt, className = '' }) => (
  <div className={`flex items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 ${className}`}>
    <img src={getImageUrl(src)} alt={alt} className="h-full w-full object-contain p-2" />
  </div>
)

const formatAddress = (address) => {
  if (!address) return ''
  if (typeof address === 'string') return address

  return [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ')
}

const formatCurrency = (value = 0) => `₹${Number(value || 0).toFixed(2)}`
const buildEditableProductForm = (product = {}) => {
  const pricingFields = buildProductPricingFormValues(product)
  const existingAttributes = Array.isArray(product.attributes)
    ? product.attributes
      .map((attribute) => {
        if (!attribute || typeof attribute !== 'object') return null

        const section = typeof attribute.section === 'string' && attribute.section.trim() ? attribute.section.trim() : 'Specifications'
        const label = typeof attribute.label === 'string' ? attribute.label.trim() : ''
        const value = typeof attribute.value === 'string' ? attribute.value.trim() : ''
        const key = typeof attribute.key === 'string' && attribute.key.trim()
          ? attribute.key.trim()
          : label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

        if (!label && !value) return null
        return { section, key, label, value }
      })
      .filter(Boolean)
    : []
  const templateAttributes = getProductSpecTemplate(product.category).map((field) => ({
    key: field.key,
    section: field.section,
    label: field.label,
    value: '',
  }))

  return {
    ...createInitialProductForm(),
    ...pricingFields,
    category: product.category || 'fashion',
    collection: product.collection || '',
    colors: Array.isArray(product.colors) ? product.colors : [],
    colorImages: normalizeColorImagesMap(product.colorImages),
    description: product.description || '',
    images: product.images?.map((image) => ({ url: image.url || image, publicId: image.publicId })) || [],
    attributes: existingAttributes.length > 0 ? existingAttributes : templateAttributes,
    name: product.name || '',
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    stock: product.stock?.toString() || '',
    tags: product.tags?.join(',') || '',
  }
}

const normalizeColorKey = (value = '') => String(value || '').trim().toLowerCase()

const normalizeColorImagesMap = (source = {}) => {
  if (!source || typeof source !== 'object') return {}

  const entries = source instanceof Map ? Array.from(source.entries()) : Object.entries(source)
  return entries.reduce((acc, [color, images]) => {
    const key = normalizeColorKey(color)
    if (!key) return acc

    const normalizedImages = (Array.isArray(images) ? images : [])
      .map((image) => ({ url: image?.url || image, publicId: image?.publicId || '' }))
      .filter((image) => image.url)

    if (normalizedImages.length) {
      acc[key] = normalizedImages
    }

    return acc
  }, {})
}

const INVOICE_DRAFT_STORAGE_KEY = 'vendor_invoice_drafts_v1'

const toInvoiceDateTime = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

const buildInvoiceDraft = (order, vendorSplit, vendorItems) => {
  const billingAddress = order.billingAddress || order.billingDetails || order.billToAddress || order.shippingAddress || {}
  const shippingAddress = order.shippingAddress || order.shipToAddress || order.shippingDetails || billingAddress || {}
  const customerName = shippingAddress?.fullName || shippingAddress?.name || billingAddress?.fullName || billingAddress?.name || order.user?.name || order.user?.fullName || 'Customer'
  const customerPhone = shippingAddress?.phone || billingAddress?.phone || order.user?.phone || ''
  const customerBillingAddress = formatAddress(billingAddress)
  const customerShippingAddress = formatAddress(shippingAddress)
  const sellerName = vendorSplit.vendorBusinessName || vendorSplit.vendorName || 'Seller'
  const sellerAddress = formatAddress(vendorSplit.vendorBusinessAddress)
  const paymentDetails = order.paymentDetails || {}
  const paymentMethod = String(order.paymentMethod || '').toLowerCase() === 'cod' ? 'Cash on Delivery' : 'Online Payment'
  const transactionId = paymentDetails.stripePaymentIntentId || paymentDetails.stripeCheckoutSessionId || paymentDetails.razorpayPaymentId || 'N/A'

  return {
    customerName,
    customerPhone,
    billToAddress: customerBillingAddress,
    shipToName: shippingAddress?.fullName || shippingAddress?.name || customerName,
    shipToPhone: shippingAddress?.phone || customerPhone,
    shipToAddress: customerShippingAddress,
    billingAddress: {
      name: billingAddress?.fullName || billingAddress?.name || customerName,
      phone: billingAddress?.phone || customerPhone,
      street: billingAddress?.line1 || billingAddress?.addressLine1 || billingAddress?.street || '',
      city: billingAddress?.city || '',
      state: billingAddress?.state || '',
      zip: billingAddress?.postalCode || billingAddress?.postal_code || billingAddress?.pincode || billingAddress?.zip || '',
      country: billingAddress?.country || '',
    },
    shippingAddress: {
      name: shippingAddress?.fullName || shippingAddress?.name || customerName,
      phone: shippingAddress?.phone || customerPhone,
      street: shippingAddress?.line1 || shippingAddress?.addressLine1 || shippingAddress?.street || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
      zip: shippingAddress?.postalCode || shippingAddress?.postal_code || shippingAddress?.pincode || shippingAddress?.zip || '',
      country: shippingAddress?.country || '',
    },
    placeOfSupply: order.shippingAddress?.state || '—',
    sellerName,
    sellerAddress,
    sellerGstin: vendorSplit.vendorGstin || vendorSplit.vendorGSTIN || vendorSplit.vendorGstNumber || '—',
    orderNumber: order.orderNumber || order._id,
    invoiceNumber: vendorSplit.invoiceNumber || '',
    orderDate: toInvoiceDateTime(order.createdAt),
    invoiceDate: toInvoiceDateTime(vendorSplit.invoiceGeneratedAt || order.createdAt),
    deliveryDate: toInvoiceDateTime(vendorSplit.estimatedDeliveryDate || order.deliveredAt || order.updatedAt || order.createdAt),
    orderStatus: order.orderStatus || vendorSplit.status || '—',
    paymentStatus: order.paymentStatus || '—',
    paymentMethod,
    paymentGateway: paymentDetails.gateway || paymentDetails.provider || paymentMethod,
    transactionId,
    paidAt: toInvoiceDateTime(order.paidAt || paymentDetails.paidAt),
    refundStatus: order.refundStatus || '—',
    trackingId: vendorSplit.trackingId || '',
    placeOfSupply: order.shippingAddress?.state || '—',
    couponDiscount: Number(order.couponDiscount || order.discountAmount || 0),
    platformDiscount: Number(order.platformDiscount || 0),
    shippingCharges: Number(order.shippingCharges || 0),
    handlingCharges: Number(order.handlingCharges || 0),
    totalAmount: Number(order.totalAmount || 0),
    items: (vendorItems || []).map((item, index) => ({
      id: item._id || `${item.product}-${index}`,
      name: item.name || 'Product',
      size: item.size || '',
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      sku: item.sku || item.hsn || '—',
      vendorName: item.vendorName || sellerName,
      image: item.image || item.thumbnail || item.productImage || '',
      color: item.color || '',
      hsn: item.hsn || '330499',
      discountType: String(item.discountType || '').toLowerCase() === 'percent' ? 'percent' : 'amount',
      discountValue: Number(item.discountValue ?? item.discount ?? 0),
      discount: Number(item.discount || 0),
      taxRate: Number(item.taxRate || 18),
    })),
    terms: [
      `Sold by: ${sellerName}`,
      sellerAddress || '',
      'Tax is not payable on reverse charge basis',
      'This is a computer generated invoice and does not require signature',
      'Includes discounts for your city, limited returns and/or for online payments (as applicable)',
    ].filter(Boolean),
  }
}

const InvoiceModal = ({
  order,
  vendorSplit,
  vendorItems,
  savedDraft,
  onSave,
  onClose,
  onPrint,
  onPrev,
  onNext,
  canPrev,
  canNext,
}) => {
  if (!order || !vendorSplit) return null

  const [isEditing, setIsEditing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [draft, setDraft] = useState(buildInvoiceDraft(order, vendorSplit, vendorItems))
  const invoiceContentRef = useRef(null)
  const activeInvoiceKey = `${order?._id || ''}:${vendorSplit?.invoiceNumber || vendorSplit?._id || ''}`
  const lastInvoiceKeyRef = useRef(activeInvoiceKey)

  useEffect(() => {
    const nextDraft = savedDraft || buildInvoiceDraft(order, vendorSplit, vendorItems)

    if (lastInvoiceKeyRef.current !== activeInvoiceKey) {
      lastInvoiceKeyRef.current = activeInvoiceKey
      setDraft(nextDraft)
      setIsEditing(false)
      return
    }

    if (!isEditing && savedDraft) {
      setDraft(savedDraft)
    }
  }, [activeInvoiceKey, savedDraft, isEditing])

  const items = (draft.items || []).map((item, index) => {
    const gross = Number(item.price || 0) * Number(item.quantity || 0)
    const discountType = String(item.discountType || '').toLowerCase() === 'percent' ? 'percent' : 'amount'
    const discountValue = Number(item.discountValue ?? item.discount ?? 0)
    const discount = discountType === 'percent'
      ? (gross * Math.max(0, Math.min(100, discountValue))) / 100
      : Math.max(0, discountValue)
    const taxable = Math.max(0, gross - discount)
    const taxRate = Number(item.taxRate || 18)
    const taxes = taxable * (taxRate / 100)
    const total = taxable + taxes

    return {
      ...item,
      sn: index + 1,
      gross,
      discount,
      taxable,
      taxes,
      total,
      hsn: item.hsn || '—',
      taxRate,
      discountType,
      discountValue,
    }
  })

  const taxableTotal = items.reduce((sum, item) => sum + item.taxable, 0)
  const taxTotal = items.reduce((sum, item) => sum + item.taxes, 0)
  const couponDiscount = Number(draft.couponDiscount || 0)
  const platformDiscount = Number(draft.platformDiscount || 0)
  const shippingCharges = Number(draft.shippingCharges || 0)
  const handlingCharges = Number(draft.handlingCharges || 0)
  const grandTotal = Number((taxableTotal + taxTotal - couponDiscount - platformDiscount + shippingCharges + handlingCharges).toFixed(2))
  const vendorSplits = order.subOrders?.length ? order.subOrders : order.vendors || []
  const normalizeAddressText = (value = '') => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
  const sameAddress = normalizeAddressText(draft.billToAddress) === normalizeAddressText(draft.shipToAddress)
  const invoiceId = draft.invoiceNumber || draft.orderNumber || order._id

  const updateDraftField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const updateDraftItem = (itemId, key, value) => {
    setDraft((prev) => ({
      ...prev,
      items: (prev.items || []).map((item) => (item.id === itemId ? { ...item, [key]: value } : item)),
    }))
  }

  const handleSave = () => {
    onSave?.(draft)
    setIsEditing(false)
    toast.success('Invoice saved successfully')
  }

  const handleDownloadPdf = async () => {
    if (!invoiceContentRef.current) {
      toast.error('Invoice content is not ready')
      return
    }

    try {
      setIsExporting(true)
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve()))
      const html2pdfModule = await import('html2pdf.js')
      const html2pdf = html2pdfModule.default || html2pdfModule
      const fileSafeInvoice = (draft.invoiceNumber || draft.orderNumber || 'invoice').replace(/[^a-zA-Z0-9-_]/g, '_')

      await html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: `${fileSafeInvoice}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(invoiceContentRef.current)
        .save()
    } catch (error) {
      toast.error('Unable to download PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    onPrint?.()
  }

  const handleShare = async () => {
    const shareText = `Shopzy invoice ${invoiceId} for order ${draft.orderNumber || order._id}. Total: ${formatCurrency(grandTotal)}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Invoice ${invoiceId}`,
          text: shareText,
        })
        return
      }

      await navigator.clipboard.writeText(shareText)
      toast.success('Invoice details copied to clipboard')
    } catch (error) {
      toast.error('Unable to share invoice')
    }
  }

  const handleCopyInvoiceId = async () => {
    try {
      await navigator.clipboard.writeText(invoiceId)
      toast.success('Invoice ID copied')
    } catch (error) {
      toast.error('Unable to copy invoice ID')
    }
  }

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/55 backdrop-blur-sm">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-shell, .invoice-shell * { visibility: visible !important; }
          .invoice-shell { position: absolute !important; inset: 0 !important; background: #fff !important; }
          .invoice-printable { width: 100% !important; max-width: 100% !important; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; }
          .invoice-no-print { display: none !important; }
          .invoice-row { page-break-inside: avoid !important; }
        }
      `}</style>

      <div className="invoice-shell min-h-full w-full p-4 sm:p-6">
        <div className="invoice-printable mx-auto w-full max-w-280 rounded-2xl bg-white shadow-2xl">
          <div className="invoice-no-print flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-stone-900">Invoice Preview</p>
              <p className="text-xs text-stone-500">Review, print, edit and save the bill</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onClose} className="admin-inline-button">Back</button>
              <button type="button" onClick={onPrev} disabled={!canPrev} className="admin-inline-button">Previous</button>
              <button type="button" onClick={onNext} disabled={!canNext} className="admin-inline-button">Next</button>
              {!isEditing ? <button type="button" onClick={() => setIsEditing(true)} className="admin-inline-button">Edit Bill</button> : null}
              {isEditing ? <button type="button" onClick={handleSave} className="admin-inline-button">Save</button> : null}
              <button type="button" onClick={onClose} className="admin-inline-button admin-inline-button-danger">Close</button>
            </div>
          </div>

          <InvoicePreview
            draft={draft}
            isEditing={isEditing}
            onUpdateField={updateDraftField}
            onUpdateItem={updateDraftItem}
            onDownloadPdf={handleDownloadPdf}
            onPrint={handlePrint}
            onShare={handleShare}
            onCopyInvoiceId={handleCopyInvoiceId}
            contentRef={invoiceContentRef}
            items={items}
            vendorSplits={vendorSplits}
            subtotal={taxableTotal}
            gstTotal={taxTotal}
            totalAmount={grandTotal}
            sameAddress={sameAddress}
            hideActions={isExporting}
          />
        </div>
      </div>
    </div>
  )
}

const VendorDashboardCleanPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { productId } = useParams()
  const { user, isLoaded } = useLocalUser()
  const vendorUserId = user?.id
  const isEditRoute = Boolean(productId)
  const isNewProductRoute = location.pathname === '/vendor/products/new'
  const isProductFormRoute = isEditRoute || isNewProductRoute

  const resolveTabFromPath = (pathname) => {
    if (pathname.startsWith('/vendor/products')) return 'products'
    if (pathname.startsWith('/vendor/orders')) return 'orders'
    if (pathname.startsWith('/vendor/analytics')) return 'analytics'
    if (pathname.startsWith('/vendor/wallet')) return 'wallet'
    if (pathname.startsWith('/vendor/settings')) return 'settings'
    return 'overview'
  }

  const [activeTab, setActiveTab] = useState(resolveTabFromPath(location.pathname))
  const [analyticsRange, setAnalyticsRange] = useState('7d')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productFormStep, setProductFormStep] = useState(1)
  const [shippingDaysDraft, setShippingDaysDraft] = useState('5')
  const [shippingNotesDraft, setShippingNotesDraft] = useState('Standard delivery across India')
  const [ordersFilter, setOrdersFilter] = useState('all')
  const [productStatusById, setProductStatusById] = useState({})
  const [productForm, setProductForm] = useState(createInitialProductForm)
  const [uploading, setUploading] = useState(false)
  const [imageInputMode, setImageInputMode] = useState('upload')
  const [imageUrlDraft, setImageUrlDraft] = useState('')
  const [colorImageInputMode, setColorImageInputMode] = useState('upload')
  const [colorImageUrlDraft, setColorImageUrlDraft] = useState('')
  const [activeColorForImages, setActiveColorForImages] = useState('')
  const [settingsTab, setSettingsTab] = useState('profile')
  const [deliveryMetaByOrder, setDeliveryMetaByOrder] = useState({})
  const [trackingDraftByOrder, setTrackingDraftByOrder] = useState({})
  const [billPreviewOrderId, setBillPreviewOrderId] = useState(null)
  const [selectedOrderDetailsId, setSelectedOrderDetailsId] = useState(null)
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('')
  const [savedInvoiceDrafts, setSavedInvoiceDrafts] = useState(() => {
    try {
      const raw = localStorage.getItem(INVOICE_DRAFT_STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [vendorProfileForm, setVendorProfileForm] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: { line1: '', city: '', state: '', postalCode: '', country: 'India' },
  })

  const fileInputRef = useRef(null)
  const imageUrlInputRef = useRef(null)
  const colorFileInputRef = useRef(null)
  const colorImageUrlInputRef = useRef(null)

  const [uploadImages] = useUploadProductImagesMutation()
  const [createVendorProfile, { isLoading: creatingVendorProfile }] = useCreateVendorProfileMutation()
  const [createProduct, createProductState] = useCreateProductMutation()
  const [updateProduct, updateProductState] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const [updateOrderStatus] = useUpdateVendorOrderStatusMutation()
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation()
  const [generateProductContent, { isLoading: isGeneratingAI }] = useGenerateProductContentMutation()
  const {
    data: editProductData,
    isLoading: editProductLoading,
    error: editProductError,
  } = useGetProductQuery(productId, { skip: !isEditRoute })

  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery(
    { limit: 100, vendorId: vendorUserId },
    {
      skip: !vendorUserId,
      pollingInterval: 5000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    },
  )
  const { data: analyticsData } = useGetVendorAnalyticsQuery(null, { skip: !vendorUserId })
  const { data: walletData } = useGetVendorWalletQuery(null, { skip: !vendorUserId })
  const { data: vendorOrdersData } = useGetVendorOrdersQuery({ limit: 50 }, { skip: !vendorUserId })
  const { data: notificationsData } = useGetNotificationsQuery(undefined, { skip: !vendorUserId, pollingInterval: 15000 })
  const { data: notificationCountData } = useGetNotificationCountQuery(undefined, { skip: !vendorUserId, pollingInterval: 15000 })
  const { data: vendorProfileData, error: vendorProfileError, isFetching: vendorProfileLoading } = useGetVendorProfileQuery(null, { skip: !vendorUserId })

  const vendorProducts = useMemo(
    () => (productsData?.products || []).filter((product) => (typeof product.createdBy === 'string' ? product.createdBy : product.createdBy?._id) === vendorUserId),
    [productsData?.products, vendorUserId],
  )

  const filteredVendorProducts = useMemo(() => {
    const search = dashboardSearchQuery.trim().toLowerCase()

    if (!search) {
      return vendorProducts
    }

    return vendorProducts.filter((product) => {
      const haystack = [
        product._id,
        product.name,
        product.category,
        product.description,
        product.collection,
        Array.isArray(product.tags) ? product.tags.join(' ') : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(search)
    })
  }, [dashboardSearchQuery, vendorProducts])

  const filteredVendorOrders = useMemo(() => {
    const allOrders = vendorOrdersData?.orders || []
    const search = dashboardSearchQuery.trim().toLowerCase()

    if (!search) {
      return allOrders
    }

    return allOrders.filter((order) => {
      const orderNumber = order.orderNumber || order._id || ''
      const customerName = order.shippingAddress?.fullName || order.user?.name || order.user?.fullName || ''
      const customerPhone = order.shippingAddress?.phone || order.user?.phone || ''
      const status = getVendorOrderStatus(order)
      const itemsText = (order.items || []).map((item) => item.name || '').join(' ')

      const haystack = `${orderNumber} ${customerName} ${customerPhone} ${status} ${itemsText}`.toLowerCase()
      return haystack.includes(search)
    })
  }, [dashboardSearchQuery, vendorOrdersData?.orders])

  const vendorProfile = vendorProfileData?.vendor || null
  const vendorRecordId = vendorProfile?._id || null
  const vendorStatus = vendorProfile?.status || null
  const isVendor = user?.publicMetadata?.role === 'vendor'
  const canUseVendorFeatures = vendorStatus === 'approved'
  const currentTabMeta = tabMeta[activeTab] || tabMeta.overview
  const pricingPreview = useMemo(
    () => calculatePricingPreview({
      basePrice: productForm.basePrice,
      gstRate: productForm.gstRate,
      discountAmount: productForm.discountAmount,
    }),
    [productForm.basePrice, productForm.discountAmount, productForm.gstRate],
  )

  const handleTabNavigation = (tabKey) => {
    const tab = vendorTabs.find((item) => item.key === tabKey)
    if (!tab) return
    setActiveTab(tabKey)
    navigate(tab.path)
  }

  useEffect(() => {
    setActiveTab(resolveTabFromPath(location.pathname))
  }, [location.pathname])

  useEffect(() => {
    if (!isEditRoute || !editProductData?.product) return

    const productToEdit = editProductData.product
    setEditingProduct(productToEdit)
    setProductForm(buildEditableProductForm(productToEdit))
    setImageInputMode('upload')
    setImageUrlDraft('')
    setColorImageInputMode('upload')
    setColorImageUrlDraft('')
    setActiveColorForImages(Array.isArray(productToEdit.colors) ? productToEdit.colors[0] || '' : '')
    setProductFormStep(1)
  }, [editProductData, isEditRoute])

  useEffect(() => {
    if (isEditRoute) return
    if (!productId || !vendorProducts.length) return
    const productToEdit = vendorProducts.find((product) => product._id === productId)
    if (!productToEdit) return

    setEditingProduct(productToEdit)
    setProductForm(buildEditableProductForm(productToEdit))
    setImageInputMode('upload')
    setImageUrlDraft('')
    setColorImageInputMode('upload')
    setColorImageUrlDraft('')
    setActiveColorForImages(Array.isArray(productToEdit.colors) ? productToEdit.colors[0] || '' : '')
    setProductFormStep(1)
  }, [productId, vendorProducts, isEditRoute])

  useEffect(() => {
    if (!Array.isArray(productForm.colors) || productForm.colors.length === 0) {
      setActiveColorForImages((current) => (current ? '' : current))
      return
    }

    setActiveColorForImages((current) => (
      productForm.colors.includes(current) ? current : productForm.colors[0]
    ))
  }, [productForm.colors])

  const getColorLabel = (colorKey) => {
    const normalizedKey = normalizeColorKey(colorKey)
    return productForm.colors.find((color) => normalizeColorKey(color) === normalizedKey) || colorKey
  }

  const currentColorImageGroups = useMemo(
    () => Object.entries(productForm.colorImages || {}).sort(([leftColor], [rightColor]) => leftColor.localeCompare(rightColor)),
    [productForm.colorImages],
  )

  useEffect(() => {
    if (!isNewProductRoute) return
    setEditingProduct(null)
    setProductForm(createInitialProductForm())
    setProductFormStep(1)
    setImageInputMode('upload')
    setImageUrlDraft('')
    setColorImageInputMode('upload')
    setColorImageUrlDraft('')
    setActiveColorForImages('')
  }, [isNewProductRoute])

  const getCurrentImageUrlDraft = () => (imageUrlInputRef.current?.value ?? imageUrlDraft).trim()
  const getCurrentColorImageUrlDraft = () => (colorImageUrlInputRef.current?.value ?? colorImageUrlDraft).trim()
  const normalizePhone = (value = '') => String(value || '').replace(/\D+/g, '')
  const SMART_SPEC_CATEGORIES = new Set(['electronics', 'laptops', 'mobile', 'tv'])

  const normalizeAttributeRows = (attributes = []) => {
    if (!Array.isArray(attributes)) return []

    return attributes
      .map((attribute) => {
        if (!attribute || typeof attribute !== 'object') return null

        const section = typeof attribute.section === 'string' && attribute.section.trim() ? attribute.section.trim() : 'Specifications'
        const label = typeof attribute.label === 'string' ? attribute.label.trim() : ''
        const value = typeof attribute.value === 'string' ? attribute.value.trim() : ''
        const key = typeof attribute.key === 'string' && attribute.key.trim() ? attribute.key.trim() : label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

        if (!label && !value) return null

        return { section, label, value, key }
      })
      .filter(Boolean)
  }

  const getDefaultAttributeRows = (category) => {
    const templateRows = getProductSpecTemplate(category).map((field) => ({
      key: field.key,
      section: field.section,
      label: field.label,
      value: '',
    }))

    return templateRows.length > 0 ? templateRows : [{ key: 'custom-detail-1', section: 'Additional Details', label: '', value: '' }]
  }

  const mergeInsightsIntoAttributes = (currentAttributes = [], insights = {}) => {
    const nextAttributes = [...currentAttributes]
    const lookup = new Map(nextAttributes.map((attribute, index) => [attribute.key || attribute.label?.toLowerCase(), { attribute, index }]))

    const incomingRows = Array.isArray(insights.attributes) ? insights.attributes : []
    incomingRows.forEach((row) => {
      const targetKey = row?.key || row?.label?.toLowerCase()
      if (!targetKey) return

      const existingEntry = lookup.get(targetKey)
      if (existingEntry) {
        nextAttributes[existingEntry.index] = {
          ...existingEntry.attribute,
          section: row.section || existingEntry.attribute.section,
          label: row.label || existingEntry.attribute.label,
          value: row.value || existingEntry.attribute.value,
          key: row.key || existingEntry.attribute.key || targetKey,
        }
        return
      }

      nextAttributes.push({
        section: row.section || 'Specifications',
        label: row.label || '',
        value: row.value || '',
        key: row.key || targetKey,
      })
    })

    return nextAttributes
  }

  const sanitizeProductAttributes = (attributes = []) =>
    normalizeAttributeRows(attributes)
      .filter((attribute) => attribute.label && attribute.value)
      .map((attribute) => ({
        section: attribute.section,
        key: attribute.key,
        label: attribute.label,
        value: attribute.value,
      }))

  const getVendorSplit = (order) =>
    (order?.vendors || []).find((split) => {
      const splitVendorId = typeof split.vendor === 'string' ? split.vendor : split.vendor?._id
      return splitVendorId?.toString() === (vendorRecordId || vendorUserId)?.toString()
    })

  const formatEtaLabel = (split) => {
    if (!split) return ''
    if (split.estimatedDeliveryDate) {
      return `Expected by ${new Date(split.estimatedDeliveryDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`
    }
    if (split.estimatedDeliveryMinDays && split.estimatedDeliveryMaxDays) {
      return `Estimated ${split.estimatedDeliveryMinDays}-${split.estimatedDeliveryMaxDays} days`
    }

    return ''
  }

  const handleOrderDeliveryMetaChange = (orderId, key, value) => {
    setDeliveryMetaByOrder((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || { deliveryInDays: 5, deliveryPartner: 'Vendor Delivery' }),
        [key]: value,
      },
    }))
  }

  const updateVendorOrder = async (orderId, status, successMessage, extraPayload = {}) => {
    try {
      await updateOrderStatus({ id: orderId, status, ...extraPayload }).unwrap()
      toast.success(successMessage)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update order'))
    }
  }

  const getVendorOrderStatus = (order) => String(order?.vendorOrderStatus || order?.vendorSubOrder?.status || order?.orderStatus || '').toLowerCase()

  const normalizeVendorOrderStage = (orderStatus, paymentStatus) => {
    const status = String(orderStatus || '').toLowerCase()
    const payment = String(paymentStatus || '').toLowerCase()

    if (['cancelled', 'returned', 'refunded'].includes(status)) return 'cancelled'
    if (status === 'delivered') return 'delivered'
    if (status === 'shipped') return 'shipped'
    if (status === 'packed' || status === 'processing') return 'packed'
    if (status === 'confirmed') return 'confirmed'
    if (['created', 'payment_pending', 'paid', 'pending'].includes(status) || payment === 'pending') return 'pending'
    return status || 'pending'
  }

  const getVendorPaymentMeta = (order) => {
    const paymentStatus = String(order?.paymentStatus || '').toLowerCase()
    const paymentMethod = String(order?.paymentMethod || '').toLowerCase()

    if (paymentStatus === 'paid') return { label: 'PAID', tone: 'success' }
    if (paymentStatus === 'failed') return { label: 'FAILED', tone: 'error' }
    if (paymentMethod === 'cod') return { label: 'COD', tone: 'warning' }
    return { label: (order?.paymentStatus || 'PENDING').toUpperCase(), tone: 'warning' }
  }

  const getVendorStatusActionConfig = (order) => {
    const stage = normalizeVendorOrderStage(getVendorOrderStatus(order), order?.paymentStatus)
    if (stage === 'pending') {
      const currentStatus = getVendorOrderStatus(order)
      const paymentMethod = String(order?.paymentMethod || '').toLowerCase()
      const paymentStatus = String(order?.paymentStatus || '').toLowerCase()
      const canAccept = currentStatus === 'created'
        || currentStatus === 'paid'
        || currentStatus === 'pending'
        || (paymentMethod === 'cod' && currentStatus === 'payment_pending')
        || paymentStatus === 'paid'

      if (!canAccept) {
        return { key: 'await_payment', label: 'Awaiting Payment' }
      }

      return { key: 'accept', label: 'Accept Order' }
    }
    if (stage === 'confirmed') return { key: 'pack', label: 'Mark as Packed' }
    if (stage === 'packed') return { key: 'ship', label: 'Ship Order' }
    if (stage === 'shipped') return { key: 'deliver', label: 'Mark as Delivered' }
    return null
  }

  const handleVendorStatusAction = (order, actionKey, deliveryMeta = {}, trackingId = '') => {
    if (!order?._id || !actionKey) return

    if (actionKey === 'accept') {
      updateVendorOrder(order._id, 'confirmed', 'Order accepted and marked as confirmed')
      return
    }

    if (actionKey === 'reject') {
      updateVendorOrder(order._id, 'cancelled', 'Order rejected')
      return
    }

    if (actionKey === 'pack') {
      updateVendorOrder(order._id, 'packed', 'Order marked as packed')
      return
    }

    if (actionKey === 'ship') {
      const normalizedTrackingId = trackingId.trim()
      updateVendorOrder(order._id, 'shipped', 'Shipment created with tracking details', {
        deliveryInDays: Number(deliveryMeta.deliveryInDays) || 5,
        deliveryPartner: deliveryMeta.deliveryPartner || 'Vendor Delivery',
        ...(normalizedTrackingId ? { trackingId: normalizedTrackingId } : {}),
      })
      return
    }

    if (actionKey === 'deliver') {
      updateVendorOrder(order._id, 'delivered', 'Order marked as delivered. Bill will generate after payment validation')
    }
  }

  const handleVendorSelectionAction = (order, selection, deliveryMeta = {}, trackingId = '') => {
    if (selection === 'accept') {
      handleVendorStatusAction(order, 'accept', deliveryMeta, trackingId)
    }

    if (selection === 'reject') {
      handleVendorStatusAction(order, 'reject', deliveryMeta, trackingId)
    }
  }

  const shouldShowTrackingId = (order) => getVendorOrderStatus(order) === 'shipped'

  const getOrderTimeline = (order) => {
    const stage = normalizeVendorOrderStage(getVendorOrderStatus(order), order?.paymentStatus)
    const orderByStage = {
      pending: 1,
      confirmed: 2,
      packed: 3,
      shipped: 4,
      delivered: 5,
      cancelled: 0,
    }
    const activeStep = orderByStage[stage] ?? 1

    return [
      { key: 'placed', label: 'Order Placed', done: activeStep >= 1 },
      { key: 'confirmed', label: 'Confirmed', done: activeStep >= 2 },
      { key: 'packed', label: 'Packed', done: activeStep >= 3 },
      { key: 'shipped', label: 'Shipped', done: activeStep >= 4, active: activeStep === 4 },
      { key: 'delivered', label: 'Delivered', done: activeStep >= 5 },
    ]
  }

  const getOrderSpecialFlags = (order, amount = 0) => {
    const flags = []
    const normalizedStatus = String(order?.orderStatus || '').toLowerCase()
    const hasReturnRequested = normalizedStatus === 'return_requested'
      || (order?.returns || []).some((entry) => String(entry?.status || '').toLowerCase() === 'requested')

    if (String(order?.paymentMethod || '').toLowerCase() === 'cod') {
      flags.push('COD Order')
    }
    if (Number(amount || 0) >= 5000) {
      flags.push('High Value Order')
    }
    if (hasReturnRequested) {
      flags.push('Return Requested')
    }

    return flags
  }

  const handleImageUpload = async (event) => {
    const files = event.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i += 1) formData.append('images', files[i])
      const response = await uploadImages(formData).unwrap()
      const newImages = response.images.map((img) => ({ url: img.url, publicId: img.publicId }))
      const nextImages = [...productForm.images, ...newImages]
      setProductForm((prev) => ({ ...prev, images: nextImages }))
      toast.success('Images uploaded successfully!')
      void detectProductInsightsFromImages(nextImages)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload images'))
    } finally {
      event.target.value = ''
      setUploading(false)
    }
  }

  const handleRemoveImage = (index) => {
    setProductForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleAddImageUrl = () => {
    const trimmedUrl = getCurrentImageUrlDraft()
    if (!trimmedUrl) return toast.error('Please paste an image address')

    try {
      const parsedUrl = new URL(trimmedUrl)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) return toast.error('Image address must start with http:// or https://')
    } catch {
      return toast.error('Please enter a valid image address')
    }

    if (productForm.images.some((image) => image.url === trimmedUrl)) return toast.error('This image address is already added')

    const nextImages = [...productForm.images, { url: trimmedUrl, publicId: '' }]
    setProductForm((prev) => ({ ...prev, images: nextImages }))
    setImageUrlDraft('')
    toast.success('Image address added')
    void detectProductInsightsFromImages(nextImages)
  }

  const toggleProductColor = (color) => {
    const normalizedColor = normalizeColorKey(color)
    setProductForm((current) => {
      const hasColor = current.colors.includes(color)
      const nextColors = hasColor
        ? current.colors.filter((entry) => entry !== color)
        : [...current.colors, color]

      const nextColorImages = { ...(current.colorImages || {}) }
      if (hasColor) {
        delete nextColorImages[normalizedColor]
      }

      return {
        ...current,
        colors: nextColors,
        colorImages: nextColorImages,
      }
    })
  }

  const handleColorImageUpload = async (event) => {
    const files = event.target.files
    const normalizedColor = normalizeColorKey(activeColorForImages)
    if (!files?.length || !normalizedColor) return

    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i += 1) formData.append('images', files[i])
      const response = await uploadImages(formData).unwrap()
      const newImages = response.images.map((img) => ({ url: img.url, publicId: img.publicId }))
      setProductForm((prev) => ({
        ...prev,
        colorImages: {
          ...(prev.colorImages || {}),
          [normalizedColor]: [...(prev.colorImages?.[normalizedColor] || []), ...newImages],
        },
      }))
      toast.success(`Images uploaded for ${normalizedColor}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload color images'))
    } finally {
      event.target.value = ''
      setUploading(false)
    }
  }

  const handleRemoveColorImage = (color, index) => {
    const normalizedColor = normalizeColorKey(color)
    setProductForm((prev) => ({
      ...prev,
      colorImages: {
        ...(prev.colorImages || {}),
        [normalizedColor]: (prev.colorImages?.[normalizedColor] || []).filter((_, i) => i !== index),
      },
    }))
  }

  const handleAddColorImageUrl = () => {
    const normalizedColor = normalizeColorKey(activeColorForImages)
    if (!normalizedColor) return toast.error('Select a color first')
    const trimmedUrl = getCurrentColorImageUrlDraft()
    if (!trimmedUrl) return toast.error('Please paste a color image address')

    try {
      const parsedUrl = new URL(trimmedUrl)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) return toast.error('Image address must start with http:// or https://')
    } catch {
      return toast.error('Please enter a valid image address')
    }

    const existing = productForm.colorImages?.[normalizedColor] || []
    if (existing.some((image) => image.url === trimmedUrl)) return toast.error('This image address is already added for this color')

    setProductForm((prev) => ({
      ...prev,
      colorImages: {
        ...(prev.colorImages || {}),
        [normalizedColor]: [...(prev.colorImages?.[normalizedColor] || []), { url: trimmedUrl, publicId: '' }],
      },
    }))
    setColorImageUrlDraft('')
    toast.success(`Image address added for ${normalizedColor}`)
  }

  const getImagesWithPendingDraft = () => {
    const trimmedUrl = getCurrentImageUrlDraft()
    if (imageInputMode !== 'url' || !trimmedUrl) return productForm.images

    try {
      const parsedUrl = new URL(trimmedUrl)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        toast.error('Image address must start with http:// or https://')
        return null
      }
    } catch {
      toast.error('Please enter a valid image address')
      return null
    }

    if (productForm.images.some((image) => image.url === trimmedUrl)) return productForm.images
    return [...productForm.images, { url: trimmedUrl, publicId: '' }]
  }

  const handleVendorProfileCreate = async (event) => {
    event.preventDefault()
    if (!vendorProfileForm.businessName.trim()) return toast.error('Business name is required')
    if (!vendorProfileForm.businessEmail.trim()) return toast.error('Business email is required')
    const normalizedPhone = normalizePhone(vendorProfileForm.businessPhone)
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) return toast.error('Enter valid business phone number')

    try {
      await createVendorProfile({
        ...vendorProfileForm,
        businessName: vendorProfileForm.businessName.trim(),
        businessEmail: vendorProfileForm.businessEmail.trim(),
        businessPhone: normalizedPhone,
      }).unwrap()
      toast.success('Vendor profile submitted. Waiting for admin approval.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create vendor profile'))
    }
  }

  const applyAiProductInsights = (aiContent) => {
    const insights = aiContent?.insights || {}

    setProductForm((current) => ({
      ...current,
      name: aiContent?.title || current.name,
      description: aiContent?.description || current.description,
      tags: Array.isArray(aiContent?.tags) ? aiContent.tags.join(', ') : current.tags,
      basePrice: current.basePrice || insights.suggestedBasePrice || current.basePrice,
      attributes: mergeInsightsIntoAttributes(current.attributes, insights),
    }))
  }

  const detectProductInsightsFromImages = async (nextImages = productForm.images) => {
    if (!SMART_SPEC_CATEGORIES.has(String(productForm.category || '').toLowerCase())) {
      return
    }

    if (!productForm.name.trim() || !Array.isArray(nextImages) || nextImages.length === 0) {
      return
    }

    try {
      const result = await generateProductContent({
        name: productForm.name,
        category: productForm.category,
        images: nextImages.map((image) => image.url).filter(Boolean),
      }).unwrap()

      applyAiProductInsights(result?.data ?? result)
    } catch (error) {
      console.warn('Product insight detection failed', error)
    }
  }

  const handleProductCategoryChange = (category) => {
    setProductForm((current) => ({
      ...current,
      category,
      attributes: getDefaultAttributeRows(category),
    }))
  }

  const handleAIGenerateContent = async () => {
    if (!productForm.name.trim()) {
      return toast.error('Please enter a basic product name first so AI can optimize it.')
    }

    try {
      const result = await generateProductContent({
        name: productForm.name,
        category: productForm.category,
        images: productForm.images.map((image) => image.url).filter(Boolean),
      }).unwrap()

      const aiContent = result?.data ?? result

      applyAiProductInsights(aiContent)
      toast.success('AI has optimized your product details!')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'AI generation failed'))
    }
  }

  const handleCreateProduct = async (event) => {
    event.preventDefault()
    const nextImages = getImagesWithPendingDraft()
    if (!nextImages) return
    if (!productForm.name) return toast.error('Product name is required')
    if (!productForm.basePrice) return toast.error('Base price is required')
    if (nextImages.length === 0) return toast.error('At least one image is required')
    if (Number(productForm.discountAmount || 0) > pricingPreview.finalPrice) return toast.error('Discount cannot exceed final selling price')

    try {
      const normalizedColorImages = normalizeColorImagesMap(productForm.colorImages)
      await createProduct({
        ...productForm,
        basePrice: Number(productForm.basePrice),
        colorImages: normalizedColorImages,
        discountAmount: Number(productForm.discountAmount || 0),
        gstRate: Number(productForm.gstRate || 0),
        images: nextImages,
        isFeatured: true,
        attributes: sanitizeProductAttributes(productForm.attributes),
        stock: Number(productForm.stock),
        tags: productForm.tags ? productForm.tags.split(',').map((item) => item.trim()).filter(Boolean) : [],
      }).unwrap()
      toast.success('Product created successfully')
      setProductForm(createInitialProductForm())
      setImageInputMode('upload')
      setImageUrlDraft('')
      setColorImageInputMode('upload')
      setColorImageUrlDraft('')
      setActiveColorForImages('')
      setProductFormStep(1)
      setActiveTab('products')
      navigate('/vendor/products', { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create product'))
    }
  }

  const handleUpdateProduct = async (event) => {
    event.preventDefault()
    const nextImages = getImagesWithPendingDraft()
    if (!nextImages) return
    if (!productForm.name) return toast.error('Product name is required')
    if (!productForm.basePrice) return toast.error('Base price is required')
    if (nextImages.length === 0) return toast.error('At least one image is required')
    if (Number(productForm.discountAmount || 0) > pricingPreview.finalPrice) return toast.error('Discount cannot exceed final selling price')

    try {
      const normalizedColorImages = normalizeColorImagesMap(productForm.colorImages)
      await updateProduct({
        id: editingProduct._id,
        ...productForm,
        basePrice: Number(productForm.basePrice),
        colorImages: normalizedColorImages,
        discountAmount: Number(productForm.discountAmount || 0),
        gstRate: Number(productForm.gstRate || 0),
        images: nextImages,
        attributes: sanitizeProductAttributes(productForm.attributes),
        stock: Number(productForm.stock),
        tags: productForm.tags ? productForm.tags.split(',').map((item) => item.trim()).filter(Boolean) : [],
      }).unwrap()
      toast.success('Product updated successfully')
      setEditingProduct(null)
      setProductForm(createInitialProductForm())
      setImageInputMode('upload')
      setImageUrlDraft('')
      setColorImageInputMode('upload')
      setColorImageUrlDraft('')
      setActiveColorForImages('')
      setProductFormStep(1)
      setActiveTab('products')
      navigate('/vendor/products', { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update product'))
    }
  }

  const handleEditProduct = (product) => {
    navigate(`/vendor/products/${product._id}/edit`)
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setProductForm(createInitialProductForm())
    setImageInputMode('upload')
    setImageUrlDraft('')
    setColorImageInputMode('upload')
    setColorImageUrlDraft('')
    setActiveColorForImages('')
    setProductFormStep(1)
    navigate('/vendor/products', { replace: true })
  }

  const handleDeleteProduct = async (productIdToDelete) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await deleteProduct(productIdToDelete).unwrap()
      toast.success('Product deleted')
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to delete product')
    }
  }

  const handleDuplicateProduct = async (product) => {
    try {
      const pricing = getProductPricing(product)
      const payload = {
        name: `${product.name} (Copy)`,
        basePrice: pricing.basePrice,
        description: product.description || '',
        category: product.category || 'fashion',
        collection: product.collection || '',
        colors: Array.isArray(product.colors) ? product.colors : [],
        colorImages: normalizeColorImagesMap(product.colorImages),
        discountAmount: pricing.discountAmount,
        gstRate: pricing.gstRate,
        sizes: Array.isArray(product.sizes) ? product.sizes : [],
        stock: Number(product.stock || 0),
        tags: Array.isArray(product.tags) ? product.tags : [],
        images: (product.images || []).map((img) => ({ url: img.url || img, publicId: img.publicId || '' })),
        isFeatured: true,
      }

      await createProduct(payload).unwrap()
      toast.success('Product duplicated')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to duplicate product'))
    }
  }

  const handleToggleProductStatus = async (product) => {
    const currentOverride = productStatusById[product._id]
    const isCurrentlyActive = typeof currentOverride === 'boolean' ? currentOverride : Boolean(product.isPublished)
    const nextActive = !isCurrentlyActive
    try {
      await updateProduct({ id: product._id, isPublished: nextActive }).unwrap()
      setProductStatusById((prev) => ({ ...prev, [product._id]: nextActive }))
      toast.success(nextActive ? 'Product enabled' : 'Product disabled')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update product status'))
    }
  }

  const handleViewProduct = (product) => {
    if (product.slug) {
      navigate(`/products/${product.slug}`)
      return
    }
    toast.error('Public product page is not available yet')
  }

  const totalOrders = analyticsData?.analytics?.totalOrders || 0
  const totalSales = analyticsData?.analytics?.totalSales || 0
  const pendingOrdersCount = analyticsData?.analytics?.pendingOrdersCount || 0
  const walletBalance = walletData?.wallet?.balance || 0
  const allVendorOrders = vendorOrdersData?.orders || []

  const salesByProductId = useMemo(() => {
    const soldMap = {}
    const orderItemsByProduct = {}
    const salesByDay = {}

    allVendorOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt)
      const dateKey = Number.isNaN(orderDate.getTime()) ? null : orderDate.toISOString().slice(0, 10)
      const orderItems = (order.items || []).filter((item) => {
        const vendorId = item.vendor?.toString?.() || item.vendor
        return vendorId?.toString() === (vendorRecordId || vendorUserId)?.toString()
      })

      orderItems.forEach((item) => {
        const productId = item.product?._id || item.product || item.sku || item.name
        const qty = Number(item.quantity || 0)
        const amount = Number(item.price || 0) * qty
        soldMap[productId] = (soldMap[productId] || 0) + qty
        if (!orderItemsByProduct[productId]) orderItemsByProduct[productId] = []
        orderItemsByProduct[productId].push(item)
        if (dateKey) {
          salesByDay[dateKey] = (salesByDay[dateKey] || 0) + amount
        }
      })
    })

    return { soldMap, orderItemsByProduct, salesByDay }
  }, [allVendorOrders, vendorRecordId, vendorUserId])

  const { soldMap, salesByDay } = salesByProductId

  const sevenDaySalesData = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const now = new Date()
    const rows = []
    for (let idx = 6; idx >= 0; idx -= 1) {
      const d = new Date(now)
      d.setDate(now.getDate() - idx)
      const key = d.toISOString().slice(0, 10)
      rows.push({
        day: labels[d.getDay()],
        dateKey: key,
        sales: Number((salesByDay[key] || 0).toFixed(2)),
      })
    }
    return rows
  }, [salesByDay])

  const analyticsSeriesFromApi = analyticsData?.analytics?.timeSeries || null

  const chartData = useMemo(() => {
    if (analyticsSeriesFromApi) {
      if (analyticsRange === '7d') {
        return analyticsSeriesFromApi.last7Days.map((d) => ({ day: d.date.slice(5), dateKey: d.date, sales: Number(d.total || 0) }))
      }
      if (analyticsRange === 'monthly') {
        return analyticsSeriesFromApi.monthly.map((m) => ({ day: m.month, sales: Number(m.total || 0) }))
      }
      if (analyticsRange === 'yearly') {
        return analyticsSeriesFromApi.yearly.map((y) => ({ day: y.year, sales: Number(y.total || 0) }))
      }
    }

    // fallback: for 7d use computed sevenDaySalesData, otherwise empty
    if (analyticsRange === '7d') return sevenDaySalesData

    // build monthly/yearly fallback from salesByDay
    const monthMap = {}
    const yearMap = {}
    Object.entries(salesByDay).forEach(([dateKey, amount]) => {
      const parts = dateKey.split('-')
      if (parts.length >= 3) {
        const year = parts[0]
        const month = parts[1]
        const monthKey = `${year}-${month}`
        monthMap[monthKey] = (monthMap[monthKey] || 0) + amount
        yearMap[year] = (yearMap[year] || 0) + amount
      }
    })

    if (analyticsRange === 'monthly') {
      const rows = []
      const now = new Date()
      for (let i = 11; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        rows.push({ day: key, sales: Number((monthMap[key] || 0).toFixed(2)) })
      }
      return rows
    }

    if (analyticsRange === 'yearly') {
      const rows = []
      const currentYear = new Date().getFullYear()
      for (let y = currentYear - 4; y <= currentYear; y += 1) {
        const key = String(y)
        rows.push({ day: key, sales: Number((yearMap[key] || 0).toFixed(2)) })
      }
      return rows
    }

    return []
  }, [analyticsSeriesFromApi, analyticsRange, sevenDaySalesData])

  const salesTrend = useMemo(() => {
    const now = new Date()
    const rangeTotals = { current: 0, previous: 0 }

    Object.entries(salesByDay).forEach(([day, amount]) => {
      const d = new Date(day)
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays <= 6) rangeTotals.current += amount
      if (diffDays >= 7 && diffDays <= 13) rangeTotals.previous += amount
    })

    const percent = rangeTotals.previous > 0
      ? ((rangeTotals.current - rangeTotals.previous) / rangeTotals.previous) * 100
      : (rangeTotals.current > 0 ? 100 : 0)

    return {
      current: rangeTotals.current,
      previous: rangeTotals.previous,
      percent: Number(percent.toFixed(1)),
    }
  }, [salesByDay])

  const orderTrendPercent = useMemo(() => {
    const now = new Date()
    let current = 0
    let previous = 0
    allVendorOrders.forEach((order) => {
      const d = new Date(order.createdAt)
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays <= 6) current += 1
      if (diffDays >= 7 && diffDays <= 13) previous += 1
    })
    if (!previous) return current > 0 ? 100 : 0
    return Number((((current - previous) / previous) * 100).toFixed(1))
  }, [allVendorOrders])

  const activeProductsCount = useMemo(
    () => vendorProducts.filter((product) => Boolean(productStatusById[product._id] ?? product.isPublished)).length,
    [vendorProducts, productStatusById],
  )

  const outOfStockCount = useMemo(
    () => vendorProducts.filter((product) => Number(product.stock || 0) <= 0).length,
    [vendorProducts],
  )

  const lowStockProducts = useMemo(
    () => vendorProducts.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 3).slice(0, 4),
    [vendorProducts],
  )

  const topSellingProducts = useMemo(() => {
    return [...vendorProducts]
      .map((product) => ({
        ...product,
        sold: soldMap[product._id] || 0,
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3)
  }, [vendorProducts, soldMap])

  const recentVendorOrders = useMemo(() => {
    return [...allVendorOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
  }, [allVendorOrders])

  const pendingVendorOrders = useMemo(
    () => allVendorOrders.filter((order) => normalizeVendorOrderStage(getVendorOrderStatus(order), order.paymentStatus) === 'pending').slice(0, 4),
    [allVendorOrders],
  )

  const pendingAcceptanceCount = useMemo(
    () => allVendorOrders.filter((order) => normalizeVendorOrderStage(getVendorOrderStatus(order), order.paymentStatus) === 'pending').length,
    [allVendorOrders],
  )

  const needsShippingCount = useMemo(
    () => allVendorOrders.filter((order) => normalizeVendorOrderStage(getVendorOrderStatus(order), order.paymentStatus) === 'packed').length,
    [allVendorOrders],
  )

  const ordersForTable = useMemo(() => {
    if (ordersFilter === 'all') return filteredVendorOrders
    return filteredVendorOrders.filter((order) => normalizeVendorOrderStage(getVendorOrderStatus(order), order.paymentStatus) === ordersFilter)
  }, [filteredVendorOrders, ordersFilter])

  const selectedOrderDetails = useMemo(
    () => (vendorOrdersData?.orders || []).find((order) => order._id === selectedOrderDetailsId) || null,
    [vendorOrdersData?.orders, selectedOrderDetailsId],
  )

  const getStockStatus = (stock) => {
    const value = Number(stock || 0)
    if (value <= 0) return { label: 'Out of stock', tone: 'text-red-700 bg-red-50 border-red-200' }
    if (value <= 5) return { label: 'Low stock', tone: 'text-amber-700 bg-amber-50 border-amber-200' }
    return { label: 'In stock', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  }

  const getProductRating = (product) => Number(product.reviewSummary?.averageRating ?? product.averageRating ?? product.rating ?? 0).toFixed(1)

  const notifications = notificationsData?.notifications || []
  const unreadNotificationsCount = notificationCountData?.unreadCount || 0
  const selectedInvoiceOrder = useMemo(
    () => (vendorOrdersData?.orders || []).find((order) => order._id === billPreviewOrderId) || null,
    [vendorOrdersData?.orders, billPreviewOrderId],
  )
  const invoiceOrders = useMemo(
    () => (vendorOrdersData?.orders || []).filter((order) => Boolean(getVendorSplit(order)?.invoiceNumber)),
    [vendorOrdersData?.orders, vendorRecordId, vendorUserId],
  )
  const selectedInvoiceIndex = invoiceOrders.findIndex((order) => order._id === billPreviewOrderId)
  const selectedInvoiceVendorSplit = selectedInvoiceOrder ? getVendorSplit(selectedInvoiceOrder) : null
  const selectedInvoiceVendorItems = selectedInvoiceOrder
    ? (selectedInvoiceOrder.items || []).filter((item) => item.vendor?.toString() === (vendorRecordId || vendorUserId)?.toString() || item.vendor === (vendorRecordId || vendorUserId))
    : []
  const selectedSavedInvoiceDraft = billPreviewOrderId ? savedInvoiceDrafts[billPreviewOrderId] : null

  useEffect(() => {
    try {
      localStorage.setItem(INVOICE_DRAFT_STORAGE_KEY, JSON.stringify(savedInvoiceDrafts))
    } catch {
      // no-op
    }
  }, [savedInvoiceDrafts])

  const handleSaveInvoiceDraft = (draft) => {
    if (!billPreviewOrderId) return
    setSavedInvoiceDrafts((prev) => ({
      ...prev,
      [billPreviewOrderId]: draft,
    }))
    ;(async () => {
      try {
        // try to persist vendor invoice draft to backend if endpoint exists
        if (!billPreviewOrderId) return
        await updateOrderInvoice?.({ id: billPreviewOrderId, invoiceDraft: draft }).unwrap()
        toast.success('Invoice saved on server')
      } catch (err) {
        // ignore - backend may not support this endpoint yet
      }
    })()
  }

  const handlePreviousInvoice = () => {
    if (selectedInvoiceIndex <= 0) return
    setBillPreviewOrderId(invoiceOrders[selectedInvoiceIndex - 1]?._id || null)
  }

  const handleNextInvoice = () => {
    if (selectedInvoiceIndex < 0 || selectedInvoiceIndex >= invoiceOrders.length - 1) return
    setBillPreviewOrderId(invoiceOrders[selectedInvoiceIndex + 1]?._id || null)
  }

  const handleNotificationClick = async (notification) => {
    if (!notification) return

    try {
      if (!notification.isRead && notification._id) {
        await markNotificationAsRead(notification._id).unwrap()
      }

      if (notification?.data?.orderId) {
        setActiveTab('orders')
        navigate('/vendor/orders')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update notification'))
    }
  }

  if (!isLoaded) {
    return <div className="container-shell py-16"><div className="flex flex-col items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" /><p className="mt-4 text-sm text-stone-600">Loading vendor dashboard...</p></div></div>
  }

  if (!isVendor) {
    return <div className="container-shell py-16"><div className="mx-auto max-w-lg rounded-[2.25rem] border border-stone-200 bg-white p-8 text-center"><h1 className="font-serif-display text-3xl text-stone-950">Vendor Access Required</h1><p className="mt-4 text-stone-600">You need vendor permissions to access this page. Please contact the administrator.</p></div></div>
  }

  const profileNotFound = vendorProfileError?.status === 404
  if (vendorProfileLoading) {
    return <div className="container-shell py-16"><div className="flex flex-col items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" /><p className="mt-4 text-sm text-stone-600">Loading vendor profile...</p></div></div>
  }

  if (isEditRoute && editProductLoading) {
    return <div className="container-shell py-16"><div className="flex flex-col items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" /><p className="mt-4 text-sm text-stone-600">Loading product editor...</p></div></div>
  }

  if (isEditRoute && editProductError?.status === 404) {
    return <div className="container-shell py-16"><div className="mx-auto max-w-lg rounded-[2.25rem] border border-stone-200 bg-white p-8 text-center"><h1 className="font-serif-display text-3xl text-stone-950">Product Not Found</h1><p className="mt-4 text-stone-600">The selected product could not be found. Please go back to your products list and try again.</p><button type="button" onClick={() => navigate('/vendor', { replace: true })} className="mt-6 gold-button w-full justify-center">Back to Vendor Dashboard</button></div></div>
  }

  if (profileNotFound) {
    return (
      <div className="container-shell py-12">
        <Seo title="Create Vendor Profile" description="Set up your vendor account to start selling." />
        <div className="mx-auto max-w-2xl rounded-[2.25rem] border border-stone-200 bg-white p-6 sm:p-8">
          <h1 className="font-serif-display text-3xl text-stone-950">Create Vendor Profile</h1>
          <p className="mt-2 text-stone-600">Submit your shop details. Admin approval is required before listing products.</p>
          <form onSubmit={handleVendorProfileCreate} className="mt-6 space-y-4">
            <input className="field-input" placeholder="Business name" value={vendorProfileForm.businessName} onChange={(event) => setVendorProfileForm((prev) => ({ ...prev, businessName: event.target.value }))} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="field-input" placeholder="Business email" type="email" value={vendorProfileForm.businessEmail} onChange={(event) => setVendorProfileForm((prev) => ({ ...prev, businessEmail: event.target.value }))} required />
              <input className="field-input" placeholder="Business phone" value={vendorProfileForm.businessPhone} onChange={(event) => setVendorProfileForm((prev) => ({ ...prev, businessPhone: event.target.value }))} />
            </div>
            <input className="field-input" placeholder="Address line 1" value={vendorProfileForm.businessAddress.line1} onChange={(event) => setVendorProfileForm((prev) => ({ ...prev, businessAddress: { ...prev.businessAddress, line1: event.target.value } }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="field-input" placeholder="City" value={vendorProfileForm.businessAddress.city} onChange={(event) => setVendorProfileForm((prev) => ({ ...prev, businessAddress: { ...prev.businessAddress, city: event.target.value } }))} />
              <input className="field-input" placeholder="State" value={vendorProfileForm.businessAddress.state} onChange={(event) => setVendorProfileForm((prev) => ({ ...prev, businessAddress: { ...prev.businessAddress, state: event.target.value } }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="field-input" placeholder="Postal code" value={vendorProfileForm.businessAddress.postalCode} onChange={(event) => setVendorProfileForm((prev) => ({ ...prev, businessAddress: { ...prev.businessAddress, postalCode: event.target.value } }))} />
              <input className="field-input" placeholder="Country" value={vendorProfileForm.businessAddress.country} onChange={(event) => setVendorProfileForm((prev) => ({ ...prev, businessAddress: { ...prev.businessAddress, country: event.target.value } }))} />
            </div>
            <button type="submit" className="gold-button w-full justify-center" disabled={creatingVendorProfile}>{creatingVendorProfile ? 'Submitting...' : 'Submit for Approval'}</button>
          </form>
        </div>
      </div>
    )
  }

  if (!canUseVendorFeatures) {
    return <div className="container-shell py-16"><div className="mx-auto max-w-lg rounded-[2.25rem] border border-stone-200 bg-white p-8 text-center"><h1 className="font-serif-display text-3xl text-stone-950">Vendor Approval Pending</h1><p className="mt-4 text-stone-600">Your vendor profile is currently <span className="font-semibold">{vendorStatus || 'pending'}</span>. Product listing and order management will unlock after admin approval.</p></div></div>
  }

  const currentAction = () => {
    if (activeTab === 'wallet') return () => toast.success('Withdrawal request submitted')
    if (activeTab === 'products') return () => navigate('/vendor/products/new')
    if (activeTab === 'orders') return () => window.location.reload()
    return () => navigate('/vendor/products/new')
  }

  return (
    <div className="min-h-screen bg-[#F7F7FA]">
      <Seo title="Vendor Dashboard" description="Manage your products and orders." />
      <Sidebar activeTab={activeTab} onSelectTab={handleTabNavigation} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)} />

      <main className={`transition-all duration-300 pt-4 pb-8 px-4 lg:px-8 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="mx-auto max-w-7xl">
          <AdminTopbar
            title={currentTabMeta.title}
            subtitle={currentTabMeta.subtitle}
            userName={user?.fullName || 'Vendor'}
            primaryActionLabel={currentTabMeta.primaryActionLabel}
            onPrimaryAction={currentAction()}
            searchQuery={dashboardSearchQuery}
            onSearchChange={setDashboardSearchQuery}
            searchPlaceholder={activeTab === 'orders' ? 'Search orders, customer, status...' : 'Search products, category...'}
            notifications={notifications}
            unreadCount={unreadNotificationsCount}
            onNotificationClick={handleNotificationClick}
          />

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <button type="button" onClick={() => navigate('/vendor/analytics')} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">₹{Math.round(totalSales)}</p>
                  <p className={`mt-2 text-sm font-medium ${salesTrend.percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {salesTrend.percent >= 0 ? '↑' : '↓'} {salesTrend.percent >= 0 ? '+' : ''}{salesTrend.percent}%
                  </p>
                </button>
                <button type="button" onClick={() => navigate('/vendor/orders')} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <p className="text-sm text-gray-500">Orders</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{totalOrders}</p>
                  <p className={`mt-2 text-sm font-medium ${orderTrendPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {orderTrendPercent >= 0 ? '↑' : '↓'} {orderTrendPercent >= 0 ? '+' : ''}{orderTrendPercent}%
                  </p>
                </button>
                <button type="button" onClick={() => navigate('/vendor/products')} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <p className="text-sm text-gray-500">Products</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{vendorProducts.length}</p>
                  <p className="mt-2 text-sm text-gray-500">Active: {activeProductsCount} | Out of stock: {outOfStockCount}</p>
                </button>
                <button type="button" onClick={() => navigate('/vendor/wallet')} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <p className="text-sm text-gray-500">Wallet</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">₹{Math.round(walletBalance)}</p>
                  <p className="mt-2 text-sm text-gray-500">Available for payout</p>
                </button>
              </div>

              <AdminSurface className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Sales Snapshot</h2>
                    <p className="text-sm text-gray-500">Quick 7-day summary. Open Analytics for range selector.</p>
                  </div>
                  <button type="button" onClick={() => navigate('/vendor/analytics')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Open Analytics</button>
                </div>
                <div className="mt-6 flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Last 7 days revenue</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">₹{Math.round(salesTrend.current || 0)}</p>
                    <p className={`mt-1 text-sm font-medium ${salesTrend.percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {salesTrend.percent >= 0 ? '↑' : '↓'} {salesTrend.percent}% vs previous
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">View detailed charts and switch ranges in the Analytics tab.</div>
                </div>
              </AdminSurface>

              <div className="grid gap-6 xl:grid-cols-2">
                <AdminSurface className="p-6">
                  <h3 className="text-xl font-semibold text-slate-950">⚠️ Alerts</h3>
                  <div className="mt-4 space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Low Stock Alerts</p>
                      <div className="mt-2 space-y-2">
                        {lowStockProducts.length ? lowStockProducts.map((product) => (
                          <div key={product._id} className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            {product.name} → {product.stock} left
                          </div>
                        )) : <p className="text-sm text-gray-500">No low stock items right now.</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Pending Orders</p>
                      <div className="mt-2 space-y-2">
                        {pendingVendorOrders.length ? pendingVendorOrders.map((order) => (
                          <div key={order._id} className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                            Order #{order.orderNumber || order._id?.slice(-6)} → {getVendorOrderStatus(order) === 'processing' ? 'Not shipped' : 'Payment done'}
                          </div>
                        )) : <p className="text-sm text-gray-500">No pending orders.</p>}
                      </div>
                    </div>
                  </div>
                </AdminSurface>

                <AdminSurface className="p-6">
                  <h3 className="text-xl font-semibold text-slate-950">🏆 Top Selling Products</h3>
                  <div className="mt-4 space-y-2">
                    {topSellingProducts.length ? topSellingProducts.map((product, index) => (
                      <div key={product._id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                        <p className="font-medium text-slate-800">{index + 1}. {product.name}</p>
                        <p className="font-semibold text-violet-700">{product.sold} sold</p>
                      </div>
                    )) : <p className="text-sm text-gray-500">Sales data will appear once orders are completed.</p>}
                  </div>
                </AdminSurface>
              </div>

              <AdminSurface className="p-6">
                <h3 className="text-xl font-semibold text-slate-950">Recent Orders</h3>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentVendorOrders.slice(0, 2).map((order) => {
                        const firstItem = (order.items || [])[0]
                        const amount = (order.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
                        return (
                          <tr key={order._id} className="border-t border-slate-100">
                            <td className="px-4 py-3">#{order.orderNumber || order._id?.slice(-6)}</td>
                            <td className="px-4 py-3">{firstItem?.name || '—'}</td>
                            <td className="px-4 py-3">{getVendorOrderStatus(order) || 'pending'}</td>
                            <td className="px-4 py-3 font-semibold">₹{Math.round(amount)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </AdminSurface>
            </div>
          )}

          {activeTab === 'products' && (
            <AdminSurface className="p-6 sm:p-8">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="admin-section-label">Catalog</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Your Products</h2>
                </div>
                <button type="button" onClick={() => navigate('/vendor/products/new')} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">Add Product</button>
              </div>

              {!isProductFormRoute && productsLoading ? (
                <div className="mt-6 flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" /></div>
              ) : !isProductFormRoute && filteredVendorProducts.length > 0 ? (
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-315 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                        <th className="px-5 py-4 font-semibold">Product Name</th>
                        <th className="px-5 py-4 font-semibold">Image</th>
                        <th className="px-5 py-4 font-semibold">Category</th>
                        <th className="px-5 py-4 font-semibold">Price</th>
                        <th className="px-5 py-4 font-semibold">Stock Status</th>
                        <th className="px-5 py-4 font-semibold">Variants</th>
                        <th className="px-5 py-4 font-semibold">Sales Count</th>
                        <th className="px-5 py-4 font-semibold">Rating ⭐</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                        <th className="w-90 px-5 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVendorProducts.map((product) => {
                        const imageUrl = product.images?.[0]?.url || product.images?.[0] || ''
                        const colors = Array.isArray(product.colors) ? product.colors.length : 0
                        const sizes = Array.isArray(product.sizes) ? product.sizes.length : 0
                        const pricing = getProductPricing(product)
                        const stockMeta = getStockStatus(product.stock)
                        const isActive = Boolean(productStatusById[product._id] ?? product.isPublished)

                        return (
                          <tr key={product._id} className="border-b border-slate-100 last:border-b-0 align-middle transition-colors hover:bg-slate-50/60">
                            <td className="px-5 py-4">
                              <p className="max-w-56 truncate text-sm font-semibold text-slate-900">{product.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{product.collection || 'No collection'}</p>
                            </td>
                            <td className="px-5 py-4">
                              {imageUrl ? (
                                <ContainImage src={imageUrl} alt={product.name} className="h-16 w-16 rounded-xl" />
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                                  No image
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">{product.category || '—'}</td>
                            <td className="px-5 py-4 text-sm text-slate-900">
                              <p className="font-semibold">{formatCurrency(pricing.discountedPrice)}</p>
                              <p className="mt-1 text-xs text-slate-500">Incl. GST {pricing.gstRate}%</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${stockMeta.tone}`}>{stockMeta.label}</span>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">{colors} colors, {sizes} sizes</td>
                            <td className="px-5 py-4 text-sm font-semibold text-slate-900">{soldMap[product._id] || 0}</td>
                            <td className="px-5 py-4 text-sm text-slate-700">{getProductRating(product)} / 5</td>
                            <td className="px-5 py-4 text-sm">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                                {isActive ? 'Active' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                <button type="button" onClick={() => handleEditProduct(product)} className="inline-flex h-8 items-center rounded-lg bg-violet-600 px-2.5 text-[11px] font-semibold text-white transition hover:bg-violet-700">Edit</button>
                                <button type="button" onClick={() => handleViewProduct(product)} className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50">View</button>
                                <button type="button" onClick={() => handleDuplicateProduct(product)} className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50">Duplicate</button>
                                <button type="button" onClick={() => handleToggleProductStatus(product)} className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50">{isActive ? 'Disable' : 'Enable'}</button>
                                <button type="button" onClick={() => handleDeleteProduct(product._id)} className="inline-flex h-8 items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100">Delete</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : !isProductFormRoute ? (
                <div className="mt-6"><AdminEmptyState title="No products yet" description="Create your first product to start listing items in your vendor catalog." /></div>
              ) : null}
            </AdminSurface>
          )}

          {activeTab === 'products' && isProductFormRoute && (
            <AdminSurface className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <p className="admin-section-label">Product Management</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Step {productFormStep} of {PRODUCT_FORM_STEPS.length} · {PRODUCT_FORM_STEPS[productFormStep - 1]}</p>
                </div>
                <button type="button" onClick={handleCancelEdit} className="admin-inline-button">{editingProduct ? 'Cancel Edit' : 'Back'}</button>
              </div>

              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-violet-600 transition-all" style={{ width: `${(productFormStep / PRODUCT_FORM_STEPS.length) * 100}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PRODUCT_FORM_STEPS.map((step, index) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setProductFormStep(index + 1)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${productFormStep === index + 1 ? 'bg-violet-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {index + 1}. {step}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="mt-6 space-y-4">
                {productFormStep === 1 ? (
                  <>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="admin-field-label">Product Name</label>
                          <button
                            type="button"
                            onClick={handleAIGenerateContent}
                            disabled={isGeneratingAI}
                            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-violet-600 transition hover:text-violet-700 disabled:opacity-50"
                          >
                            {isGeneratingAI ? (
                              <span className="flex items-center gap-1"><div className="h-2 w-2 animate-ping rounded-full bg-violet-400" /> AI Thinking...</span>
                            ) : (
                              '✨ Magic AI Fill'
                            )}
                          </button>
                        </div>
                        <input className="field-input mt-2" placeholder="e.g. Blue Cotton Kurti" value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} required />
                      </div>
                      <div>
                        <label className="admin-field-label">Category</label>
                        <select className="field-input mt-2" value={productForm.category} onChange={(event) => handleProductCategoryChange(event.target.value)} required>
                          <option value="">Select a category</option>
                          {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label className="admin-field-label">Description</label><textarea className="field-input mt-2 min-h-24 rounded-3xl" value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} required /></div>
                  </>
                ) : null}

                {productFormStep === 2 ? (
                  <div>
                    <p className="admin-field-label">Product Images</p>
                    <div className="mt-2 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setImageInputMode('upload')} className={`admin-select-chip ${imageInputMode === 'upload' ? 'admin-select-chip-active' : ''}`}>Upload image</button>
                        <button type="button" onClick={() => setImageInputMode('url')} className={`admin-select-chip ${imageInputMode === 'url' ? 'admin-select-chip-active' : ''}`}>Image address</button>
                      </div>
                      {imageInputMode === 'upload' ? (
                        <>
                          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="admin-primary-button w-full justify-center">{uploading ? 'Uploading...' : 'Upload Images'}</button>
                        </>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <input ref={imageUrlInputRef} className="field-input" type="text" placeholder="https://example.com/product-image.jpg" value={imageUrlDraft} onChange={(event) => setImageUrlDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleAddImageUrl() } }} />
                          <button type="button" onClick={handleAddImageUrl} className="admin-primary-button justify-center">Add Image</button>
                        </div>
                      )}
                      {productForm.images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {productForm.images.map((img, index) => (
                            <div key={index} className="relative group">
                              <ContainImage src={img.url} alt={`Product ${index + 1}`} className="h-24 w-full rounded-lg" />
                              {index === 0 ? (
                                <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow">
                                  Main
                                </span>
                              ) : null}
                              <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100">×</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-sm text-stone-500">No images uploaded yet</p>
                      )}
                    </div>
                  </div>
                ) : null}

                {productFormStep === 3 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="admin-field-label">Sizes Available</label>
                        <div className="mt-2 flex flex-wrap gap-2">{SIZES.map((size) => <button key={size} type="button" onClick={() => setProductForm((current) => ({ ...current, sizes: current.sizes.includes(size) ? current.sizes.filter((s) => s !== size) : [...current.sizes, size] }))} className={`admin-select-chip ${productForm.sizes.includes(size) ? 'admin-select-chip-active' : ''}`}>{size}</button>)}</div>
                      </div>
                      <div>
                        <label className="admin-field-label">Colors Available</label>
                        <div className="mt-2 flex flex-wrap gap-2">{COLORS.map((color) => <button key={color} type="button" onClick={() => toggleProductColor(color)} className={`admin-select-chip ${productForm.colors.includes(color) ? 'admin-select-chip-active' : ''}`}>{color}</button>)}</div>
                      </div>
                    </div>

                    <div>
                      <p className="admin-field-label">Color-wise Images (optional)</p>
                      {productForm.colors.length === 0 ? (
                        <p className="mt-2 text-sm text-stone-500">Select colors first to add variant-specific images.</p>
                      ) : (
                        <div className="mt-2 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <select
                              className="field-input"
                              value={activeColorForImages}
                              onChange={(event) => setActiveColorForImages(event.target.value)}
                            >
                              {productForm.colors.map((color) => (
                                <option key={color} value={color}>{color}</option>
                              ))}
                            </select>
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => setColorImageInputMode('upload')} className={`admin-select-chip ${colorImageInputMode === 'upload' ? 'admin-select-chip-active' : ''}`}>Upload image</button>
                              <button type="button" onClick={() => setColorImageInputMode('url')} className={`admin-select-chip ${colorImageInputMode === 'url' ? 'admin-select-chip-active' : ''}`}>Image address</button>
                            </div>
                          </div>

                          {colorImageInputMode === 'upload' ? (
                            <>
                              <input ref={colorFileInputRef} type="file" accept="image/*" multiple onChange={handleColorImageUpload} className="hidden" />
                              <button type="button" onClick={() => colorFileInputRef.current?.click()} disabled={uploading || !activeColorForImages} className="admin-primary-button w-full justify-center">{uploading ? 'Uploading...' : `Upload ${activeColorForImages || 'Color'} Images`}</button>
                            </>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                              <input ref={colorImageUrlInputRef} className="field-input" type="text" placeholder="https://example.com/color-image.jpg" value={colorImageUrlDraft} onChange={(event) => setColorImageUrlDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); handleAddColorImageUrl() } }} />
                              <button type="button" onClick={handleAddColorImageUrl} className="admin-primary-button justify-center">Add Color Image</button>
                            </div>
                          )}

                          <div className="space-y-3">
                            {currentColorImageGroups.length > 0 ? (
                              currentColorImageGroups.map(([colorKey, images]) => {
                                const colorLabel = getColorLabel(colorKey)
                                const isActiveColor = normalizeColorKey(activeColorForImages) === colorKey

                                return (
                                  <div key={colorKey} className={`rounded-2xl border p-4 ${isActiveColor ? 'border-violet-300 bg-violet-50/60' : 'border-stone-200 bg-white'}`}>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-semibold text-stone-900">{colorLabel}</p>
                                        <p className="text-xs text-stone-500">{images.length} image{images.length === 1 ? '' : 's'} uploaded</p>
                                      </div>
                                      {isActiveColor ? <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Selected</span> : null}
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                      {images.map((image, index) => (
                                        <div key={`${colorKey}-${image.publicId || image.url || index}`} className="relative group">
                                          <ContainImage src={image.url} alt={`${colorLabel} image ${index + 1}`} className="h-24 w-full rounded-lg" />
                                          <span className="absolute left-2 top-2 rounded-full bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow">
                                            {index === 0 ? 'Main' : `Image ${index + 1}`}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveColorImage(colorKey, index)}
                                            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <p className="text-sm text-stone-500">No color-wise images uploaded yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="admin-field-label">Product Specifications</p>
                          <p className="mt-1 text-sm text-slate-500">Add the default fields for electronics, mobiles, laptops, and TVs, or create your own custom sections.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProductForm((current) => ({
                            ...current,
                            attributes: [...(current.attributes || []), { key: `custom-detail-${(current.attributes || []).length + 1}`, section: 'Additional Details', label: '', value: '' }],
                          }))}
                          className="admin-primary-button px-4 py-2 text-xs"
                        >
                          + Add Custom Field
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {productForm.attributes.length === 0 ? (
                          <p className="text-sm text-slate-500">No specification rows yet. Add one or choose a supported category to auto-load fields.</p>
                        ) : (
                          productForm.attributes.map((attribute, index) => (
                            <div key={`${attribute.key || attribute.label || 'spec'}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
                              <input
                                className="field-input"
                                placeholder="Section"
                                value={attribute.section}
                                onChange={(event) => setProductForm((current) => ({
                                  ...current,
                                  attributes: current.attributes.map((row, rowIndex) => (rowIndex === index ? { ...row, section: event.target.value } : row)),
                                }))}
                              />
                              <input
                                className="field-input"
                                placeholder="Label"
                                value={attribute.label}
                                onChange={(event) => setProductForm((current) => ({
                                  ...current,
                                  attributes: current.attributes.map((row, rowIndex) => (rowIndex === index ? { ...row, label: event.target.value } : row)),
                                }))}
                              />
                              <input
                                className="field-input"
                                placeholder="Value"
                                value={attribute.value}
                                onChange={(event) => setProductForm((current) => ({
                                  ...current,
                                  attributes: current.attributes.map((row, rowIndex) => (rowIndex === index ? { ...row, value: event.target.value } : row)),
                                }))}
                              />
                              <button
                                type="button"
                                onClick={() => setProductForm((current) => ({
                                  ...current,
                                  attributes: current.attributes.filter((_, rowIndex) => rowIndex !== index),
                                }))}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : null}

                {productFormStep === 4 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div><label className="admin-field-label">Base Price (Rs.)</label><input className="field-input mt-2" type="number" min="0" step="0.01" value={productForm.basePrice} onChange={(event) => setProductForm((current) => ({ ...current, basePrice: event.target.value }))} required /></div>
                      <div><label className="admin-field-label">GST Slab</label><select className="field-input mt-2" value={productForm.gstRate} onChange={(event) => setProductForm((current) => ({ ...current, gstRate: event.target.value }))}>{GST_SLAB_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                      <div><label className="admin-field-label">Customer Discount (Rs.)</label><input className="field-input mt-2" type="number" min="0" step="0.01" value={productForm.discountAmount} onChange={(event) => setProductForm((current) => ({ ...current, discountAmount: event.target.value }))} /></div>
                    </div>
                    <p className="text-sm text-slate-500">Enter the exact rupee amount you want to discount for customers after GST is added.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><label className="admin-field-label">Stock Quantity</label><input className="field-input mt-2" type="number" value={productForm.stock} onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))} required /></div>
                      <div><label className="admin-field-label">Collection</label><input className="field-input mt-2" value={productForm.collection} onChange={(event) => setProductForm((current) => ({ ...current, collection: event.target.value }))} /></div>
                    </div>
                    <div><label className="admin-field-label">Tags</label><input className="field-input mt-2" value={productForm.tags} onChange={(event) => setProductForm((current) => ({ ...current, tags: event.target.value }))} /></div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                      <p>Tax Amount = {formatCurrency(pricingPreview.gstAmount)}</p>
                      <p>Final Selling Price = {formatCurrency(pricingPreview.finalPrice)}</p>
                      <p>Discounted Price = {formatCurrency(pricingPreview.discountedPrice)}</p>
                    </div>
                  </>
                ) : null}

                {productFormStep === 5 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Set expected shipping defaults for this product.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="admin-field-label">Estimated delivery (days)</label>
                        <input className="field-input mt-2" type="number" min="1" value={shippingDaysDraft} onChange={(event) => setShippingDaysDraft(event.target.value)} />
                      </div>
                      <div>
                        <label className="admin-field-label">Shipping note</label>
                        <input className="field-input mt-2" value={shippingNotesDraft} onChange={(event) => setShippingNotesDraft(event.target.value)} />
                      </div>
                    </div>
                  </div>
                ) : null}

                {productFormStep === 6 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-lg font-semibold text-slate-900">Ready to publish</h3>
                    <p className="mt-2 text-sm text-slate-600">Review your details and publish this product.</p>
                    <ul className="mt-3 space-y-1 text-sm text-slate-700">
                      <li>Name: {productForm.name || '—'}</li>
                      <li>Category: {productForm.category || '—'}</li>
                      <li>Base Price: {formatCurrency(pricingPreview.basePrice)}</li>
                      <li>GST: {pricingPreview.gstRate}% ({formatCurrency(pricingPreview.gstAmount)})</li>
                      <li>Final Selling Price: {formatCurrency(pricingPreview.finalPrice)}</li>
                      <li>Customer Discount: {formatCurrency(pricingPreview.discountAmount)}</li>
                      <li>Discounted Price: {formatCurrency(pricingPreview.discountedPrice)}</li>
                      <li>Images: {productForm.images.length}</li>
                      <li>Stock: {productForm.stock || 0}</li>
                    </ul>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setProductFormStep((prev) => Math.max(1, prev - 1))}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    disabled={productFormStep === 1}
                  >
                    Previous
                  </button>

                  {productFormStep < PRODUCT_FORM_STEPS.length ? (
                    <button
                      type="button"
                      onClick={() => setProductFormStep((prev) => Math.min(PRODUCT_FORM_STEPS.length, prev + 1))}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700" disabled={createProductState.isLoading || updateProductState.isLoading}>{createProductState.isLoading || updateProductState.isLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}</button>
                  )}
                </div>
              </form>
            </AdminSurface>
          )}

          {activeTab === 'orders' && (
            <AdminSurface className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-950">Orders</h2>
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((filterKey) => (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => setOrdersFilter(filterKey)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${ordersFilter === filterKey ? 'bg-violet-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      {filterKey[0].toUpperCase() + filterKey.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-800">Pending Acceptance</p>
                  <p className="mt-1 text-sm text-amber-700">⚠ {pendingAcceptanceCount} orders pending acceptance</p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-800">Needs Shipping</p>
                  <p className="mt-1 text-sm text-violet-700">⚠ {needsShippingCount} orders need shipping</p>
                </div>
              </div>

              {ordersForTable.length > 0 ? (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-315 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Payment Status</th>
                        <th className="px-4 py-3">Order Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Actions</th>
                        <th className="px-4 py-3 text-right">Bill</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersForTable.map((order) => {
                        const vendorSplit = getVendorSplit(order)
                        const firstItem = (order.items || [])[0]
                        const deliveryMeta = deliveryMetaByOrder[order._id] || { deliveryInDays: 5, deliveryPartner: 'Vendor Delivery' }
                        const vendorIdRef = (vendorRecordId || vendorUserId)?.toString()
                        const vendorItems = (order.items || []).filter((item) => item.vendor?.toString?.() === vendorIdRef || item.vendor === vendorIdRef)
                        const vendorItemsTotal = vendorItems.reduce(
                          (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
                          0,
                        )
                        const paymentMeta = getVendorPaymentMeta(order)
                        const normalizedStatus = normalizeVendorOrderStage(getVendorOrderStatus(order), order.paymentStatus)
                        const actionConfig = getVendorStatusActionConfig(order)
                        const trackingDraft = trackingDraftByOrder[order._id] || ''
                        return (
                          <tr key={order._id} className="border-t border-slate-100">
                            <td className="px-4 py-3">#{order.orderNumber || order._id?.slice(-6)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {firstItem?.image ? <ContainImage src={firstItem.image} alt={firstItem?.name || 'Product'} className="h-10 w-10 rounded-xl" /> : null}
                                <div>
                                  <p className="font-medium text-slate-900">{firstItem?.name || '—'}</p>
                                  <p className="text-xs text-slate-500">Qty {(vendorItems || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900">{order.shippingAddress?.fullName || order.user?.name || '—'}</p>
                              <p className="text-xs text-slate-500">📞 {order.shippingAddress?.phone || order.user?.phone || 'N/A'}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(vendorItemsTotal)}</td>
                            <td className="px-4 py-3"><AdminStatusPill tone={paymentMeta.tone}>{paymentMeta.label}</AdminStatusPill></td>
                            <td className="px-4 py-3"><AdminStatusPill tone={normalizedStatus === 'delivered' ? 'success' : normalizedStatus === 'shipped' ? 'info' : normalizedStatus === 'packed' ? 'warning' : 'neutral'}>{normalizedStatus}</AdminStatusPill></td>
                            <td className="px-4 py-3 text-xs text-slate-600">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3">
                              <div className="flex min-w-72 flex-col gap-2">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderDetailsId((current) => (current === order._id ? null : order._id))}
                                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    {selectedOrderDetailsId === order._id ? 'Hide Details' : 'View Details'}
                                  </button>

                                  {actionConfig?.key === 'accept' ? (
                                    <select
                                      defaultValue=""
                                      onChange={(event) => {
                                        handleVendorSelectionAction(order, event.target.value, deliveryMeta, trackingDraft)
                                        event.target.value = ''
                                      }}
                                      className="w-44 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                                    >
                                      <option value="" disabled>Select action</option>
                                      <option value="accept">Accept Order</option>
                                      <option value="reject">Reject Order</option>
                                    </select>
                                  ) : actionConfig?.key === 'await_payment' ? (
                                    <span className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Awaiting Payment</span>
                                  ) : actionConfig ? (
                                    <button
                                      type="button"
                                      onClick={() => handleVendorStatusAction(order, actionConfig.key, deliveryMeta, trackingDraft)}
                                      className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700"
                                    >
                                      {actionConfig.label}
                                    </button>
                                  ) : (
                                    <span className="text-xs font-medium text-slate-400">No action</span>
                                  )}
                                </div>

                                {actionConfig?.key === 'ship' ? (
                                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                                    <input
                                      type="text"
                                      value={trackingDraft}
                                      onChange={(event) => setTrackingDraftByOrder((prev) => ({ ...prev, [order._id]: event.target.value }))}
                                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                                      placeholder="Tracking ID"
                                    />
                                    <input
                                      type="text"
                                      value={deliveryMeta.deliveryPartner || 'Vendor Delivery'}
                                      onChange={(event) => handleOrderDeliveryMetaChange(order._id, 'deliveryPartner', event.target.value)}
                                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                                      placeholder="Courier Name"
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setBillPreviewOrderId((current) => (current === order._id ? null : order._id))}
                                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  {vendorSplit?.invoiceNumber ? 'View Bill' : 'Generate Bill'}
                                </button>
                                <span className="text-[11px] font-medium text-slate-500">{vendorSplit?.invoiceNumber || 'Draft bill'}</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <div className="mt-6"><AdminEmptyState title="No orders found" description="Try switching filters or clearing search." /></div>}

              {selectedOrderDetails ? (() => {
                const vendorSplit = getVendorSplit(selectedOrderDetails)
                const vendorIdRef = (vendorRecordId || vendorUserId)?.toString()
                const vendorItems = (selectedOrderDetails.items || []).filter((item) => item.vendor?.toString?.() === vendorIdRef || item.vendor === vendorIdRef)
                const subtotal = vendorItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
                const gst = Number((subtotal * 0.18).toFixed(2))
                const shipping = 0
                const total = subtotal + gst + shipping
                const paymentMeta = getVendorPaymentMeta(selectedOrderDetails)
                const normalizedStatus = normalizeVendorOrderStage(getVendorOrderStatus(selectedOrderDetails), selectedOrderDetails.paymentStatus)
                const timeline = getOrderTimeline(selectedOrderDetails)
                const flags = getOrderSpecialFlags(selectedOrderDetails, total)
                const transactionId = selectedOrderDetails.paymentDetails?.stripePaymentIntentId || selectedOrderDetails.paymentDetails?.stripeCheckoutSessionId || 'N/A'
                const detailAction = getVendorStatusActionConfig(selectedOrderDetails)
                const deliveryMeta = deliveryMetaByOrder[selectedOrderDetails._id] || { deliveryInDays: 5, deliveryPartner: 'Vendor Delivery' }
                const trackingDraft = trackingDraftByOrder[selectedOrderDetails._id] || ''

                return (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setSelectedOrderDetailsId(null)} />
                    <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Order Operations</p>
                          <h3 className="mt-1 text-xl font-semibold text-slate-950">#{selectedOrderDetails.orderNumber || selectedOrderDetails._id?.slice(-6)}</h3>
                        </div>
                        <button type="button" onClick={() => setSelectedOrderDetailsId(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Close</button>
                      </div>

                      {flags.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {flags.map((flag) => (
                            <span key={flag} className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">⚠ {flag}</span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-5 rounded-2xl bg-slate-50 p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer Details</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{selectedOrderDetails.shippingAddress?.fullName || selectedOrderDetails.user?.name || 'Customer'}</p>
                        <p className="mt-1 text-sm text-slate-700">Phone: {selectedOrderDetails.shippingAddress?.phone || selectedOrderDetails.user?.phone || 'N/A'}</p>
                        <p className="mt-1 text-sm text-slate-700">Email: {selectedOrderDetails.user?.email || 'N/A'}</p>
                        <p className="mt-2 text-sm text-slate-700">Delivery Address:</p>
                        <p className="text-sm text-slate-700">{selectedOrderDetails.shippingAddress?.line1 || ''}{selectedOrderDetails.shippingAddress?.line2 ? `, ${selectedOrderDetails.shippingAddress.line2}` : ''}</p>
                        <p className="text-sm text-slate-700">{selectedOrderDetails.shippingAddress?.city || ''}, {selectedOrderDetails.shippingAddress?.state || ''} - {selectedOrderDetails.shippingAddress?.postalCode || ''}</p>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order Items</p>
                        <div className="mt-3 space-y-2">
                          {vendorItems.map((item, index) => (
                            <div key={item._id || `${item.product}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
                              <div className="flex items-center gap-3">
                                {item.image ? <ContainImage src={item.image} alt={item.name || 'Product'} className="h-14 w-14 rounded-xl" /> : null}
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{item.name || 'Product'}</p>
                                  <p className="text-xs text-slate-500">Variant: {(item.color || 'N/A').toUpperCase()} / Size {item.size || 'N/A'}</p>
                                  <p className="text-xs text-slate-500">Qty: {item.quantity || 0}</p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-slate-900">{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-900">Items Total: {formatCurrency(subtotal)}</p>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payment Info</p>
                          <p className="mt-2 text-sm text-slate-700">Payment Method: {String(selectedOrderDetails.paymentMethod || '').toLowerCase() === 'cod' ? 'COD' : 'UPI / Online'}</p>
                          <p className="mt-1 text-sm text-slate-700">Payment Status: {paymentMeta.label}</p>
                          <p className="mt-1 text-sm text-slate-700 break-all">Transaction ID: {transactionId}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Price Breakdown</p>
                          <div className="mt-2 space-y-1 text-sm text-slate-700">
                            <p className="flex items-center justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></p>
                            <p className="flex items-center justify-between"><span>GST (18%)</span><span>{formatCurrency(gst)}</span></p>
                            <p className="flex items-center justify-between"><span>Shipping</span><span>{formatCurrency(shipping)}</span></p>
                            <p className="flex items-center justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900"><span>Total</span><span>{formatCurrency(total)}</span></p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Shipping Section</p>
                        <p className="mt-2 text-sm text-slate-700">Courier: {vendorSplit?.deliveryPartner || deliveryMeta.deliveryPartner || 'N/A'}</p>
                        {shouldShowTrackingId(selectedOrderDetails) ? (
                          <p className="mt-1 text-sm text-slate-700 break-all">Tracking ID: {vendorSplit?.trackingId || trackingDraft || 'Auto-generate on ship'}</p>
                        ) : null}
                        <p className="mt-1 text-sm text-slate-700">Estimated Delivery: {formatEtaLabel(vendorSplit) || 'Not available'}</p>

                        {normalizedStatus === 'packed' ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                            <input
                              type="text"
                              value={trackingDraft}
                              onChange={(event) => setTrackingDraftByOrder((prev) => ({ ...prev, [selectedOrderDetails._id]: event.target.value }))}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              placeholder="Enter Tracking ID (optional)"
                            />
                            <button
                              type="button"
                              onClick={() => handleVendorStatusAction(selectedOrderDetails, 'ship', deliveryMeta, trackingDraft)}
                              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                            >
                              Ship Order
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order Status Timeline</p>
                        <div className="mt-3 space-y-2">
                          {timeline.map((step) => (
                            <div key={step.key} className="flex items-center gap-2 text-sm">
                              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${step.done ? 'bg-emerald-100 text-emerald-700' : step.active ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'}`}>
                                {step.done ? '✓' : step.active ? '→' : '○'}
                              </span>
                              <span className={`${step.done ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {detailAction?.key === 'accept' ? (
                            <select
                              defaultValue=""
                              onChange={(event) => {
                                handleVendorSelectionAction(selectedOrderDetails, event.target.value, deliveryMeta, trackingDraft)
                                event.target.value = ''
                              }}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                            >
                              <option value="" disabled>Select action</option>
                              <option value="accept">Accept Order</option>
                              <option value="reject">Reject Order</option>
                            </select>
                          ) : detailAction?.key === 'await_payment' ? (
                            <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">Awaiting customer payment</span>
                          ) : detailAction?.key === 'pack' ? (
                            <button type="button" onClick={() => handleVendorStatusAction(selectedOrderDetails, 'pack', deliveryMeta)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700">Mark as Packed</button>
                          ) : detailAction?.key === 'deliver' ? (
                            <button type="button" onClick={() => handleVendorStatusAction(selectedOrderDetails, 'deliver', deliveryMeta)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700">Mark as Delivered</button>
                          ) : (
                            <span className="text-xs text-slate-500">No further actions available</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bill / Invoice</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setBillPreviewOrderId(selectedOrderDetails._id)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            disabled={!vendorSplit?.invoiceNumber}
                          >
                            Download Invoice
                          </button>
                          {!vendorSplit?.invoiceNumber ? <span className="text-xs text-slate-500">Invoice will be available after delivery & payment validation.</span> : null}
                        </div>
                      </div>
                    </aside>
                  </>
                )
              })() : null}
            </AdminSurface>
          )}

          {activeTab === 'wallet' && (
            <AdminSurface className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-slate-950">Wallet</h2>
              {walletData?.wallet ? (
                <div className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-sm text-slate-500">Available Balance</p>
                    <p className="mt-1 text-3xl font-semibold text-slate-950">₹{Math.round(walletData.wallet.balance || 0)}</p>
                    <button type="button" onClick={() => toast.success('Withdrawal request submitted')} className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">Withdraw</button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
                    {walletData.wallet.transactions?.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {walletData.wallet.transactions.slice(0, 10).map((txn, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg border border-stone-200 p-3">
                            <div>
                              <p className="text-sm font-medium text-emerald-700">+ ₹{Math.round(txn.netAmount || 0)}</p>
                              <p className="text-xs text-stone-500">{txn.description || txn.type || `Order #${txn.order || idx + 1}`}</p>
                            </div>
                            <AdminStatusPill tone={txn.status === 'completed' ? 'success' : txn.status === 'pending' ? 'warning' : 'error'}>{txn.status}</AdminStatusPill>
                          </div>
                        ))}
                      </div>
                    ) : <p className="mt-4 text-sm text-stone-500">No transactions yet.</p>}
                  </div>
                </div>
              ) : <div className="mt-6"><p className="text-sm text-stone-500">Wallet data is not available right now.</p></div>}
            </AdminSurface>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AdminSurface className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Sales Insights</h2>
                    <p className="mt-1 text-sm text-slate-500">Revenue overview for selected range.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAnalyticsRange('7d')} className={`px-3 py-1 rounded-lg text-sm ${analyticsRange === '7d' ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200'}`}>7D</button>
                    <button type="button" onClick={() => setAnalyticsRange('monthly')} className={`px-3 py-1 rounded-lg text-sm ${analyticsRange === 'monthly' ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200'}`}>Monthly</button>
                    <button type="button" onClick={() => setAnalyticsRange('yearly')} className={`px-3 py-1 rounded-lg text-sm ${analyticsRange === 'yearly' ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200'}`}>Yearly</button>
                  </div>
                </div>
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                      <Bar dataKey="sales" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </AdminSurface>

              <AdminSurface className="p-6">
                <h3 className="text-lg font-semibold text-slate-900">Top Performing Products</h3>
                <div className="mt-4 space-y-2">
                  {topSellingProducts.map((product, index) => (
                    <div key={product._id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                      <p className="text-sm font-medium text-slate-800">{index + 1}. {product.name}</p>
                      <p className="text-sm font-semibold text-violet-700">{product.sold} sold</p>
                    </div>
                  ))}
                </div>
              </AdminSurface>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="tabs-nav mb-6">
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setSettingsTab('profile')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      settingsTab === 'profile'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => setSettingsTab('account')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      settingsTab === 'account'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Account & Wallet
                  </button>
                </div>
              </div>

              {settingsTab === 'profile' && <VendorProfileSettings />}
              {settingsTab === 'account' && <VendorAccountSettings />}
            </div>
          )}
        </div>
      </main>

      {billPreviewOrderId && selectedInvoiceOrder && selectedInvoiceVendorSplit ? (
        <InvoiceModal
          order={selectedInvoiceOrder}
          vendorSplit={selectedInvoiceVendorSplit}
          vendorItems={selectedInvoiceVendorItems}
          savedDraft={selectedSavedInvoiceDraft}
          onSave={handleSaveInvoiceDraft}
          onClose={() => setBillPreviewOrderId(null)}
          onPrint={() => window.print()}
          onPrev={handlePreviousInvoice}
          onNext={handleNextInvoice}
          canPrev={selectedInvoiceIndex > 0}
          canNext={selectedInvoiceIndex >= 0 && selectedInvoiceIndex < invoiceOrders.length - 1}
        />
      ) : null}
    </div>
  )
}

export default VendorDashboardCleanPage
