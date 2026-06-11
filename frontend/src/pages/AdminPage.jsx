import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { AdminSidebar, AdminStatusPill, AdminSurface, AdminTopbar, AdminMetricCard, AdminEmptyState } from '../components/admin/AdminChrome'
import { AdminProductList } from '../components/admin/AdminProductList'
import { AdminAccountSettings } from '../components/admin/AdminAccountSettings'
import { AdminProfileSettings } from '../components/admin/AdminProfileSettings'
import Seo from '../components/Seo'
import {
  useCreateCollectionMutation,
  useCreateProductMutation,
  useDeleteCollectionMutation,
  useDeleteProductMutation,
  useGetAdminAnalyticsQuery,
  useGetAdminOrdersQuery,
  useGetAdminProfileQuery,
  useGetCollectionsQuery,
  useGetProductsQuery,
  useGetUsersQuery,
  useUpdateCollectionMutation,
  useUpdateOrderStatusMutation,
  useUpdateProductMutation,
  useUploadProductImagesMutation,
  useApproveVendorMutation,
  useRejectVendorMutation,
  useSuspendVendorMutation,
  useGetAdminVendorsQuery,
  useGetNotificationsQuery,
  useGetNotificationCountQuery,
  useMarkNotificationAsReadMutation,
} from '../features/api/apiSlice'
import { getApiErrorMessage } from '../utils/api'
import { formatCurrency, formatDate, toTitleCase } from '../utils/formatters'
import { readStoredUser } from '../utils/storage'
import {
  CATEGORIES,
  CATEGORIES_WITH_SIZE,
  COLORS,
  GST_SLAB_OPTIONS,
  SIZES,
  createInitialCollectionForm,
  createInitialProductForm,
} from '../utils/productOptions'
import { buildProductPricingFormValues, calculatePricingPreview } from '../utils/pricing'

const buildEditableProductForm = (product = {}) => {
  const pricingFields = buildProductPricingFormValues(product)

  return {
    ...createInitialProductForm(),
    ...pricingFields,
    category: product.category || 'fashion',
    collection: product.collection || '',
    colors: Array.isArray(product.colors) ? product.colors : [],
    description: product.description || '',
    images: product.images?.map((image) => ({ url: image.url || image, publicId: image.publicId })) || [],
    name: product.name || '',
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    stock: product.stock?.toString() || '',
    tags: product.tags?.join(', ') || '',
  }
}

const getStoredUser = () => {
  return readStoredUser()
}

const isDemoCatalogProduct = (product) =>
  product?.images?.some((image) => {
    const imageUrl = typeof image === 'string' ? image : image?.url || ''
    const publicId = typeof image === 'string' ? '' : image?.publicId || ''

    return (
      imageUrl.includes('picsum.photos/') ||
      publicId.startsWith('demo-')
    )
  })

const ProductEditor = ({
  collectionNames,
  createProductState,
  editingProduct,
  fileInputRef,
  imageInputMode,
  imageUrlInputRef,
  imageUrlDraft,
  onAddImageUrl,
  onImageUpload,
  onRemoveImage,
  onSubmit,
  productForm,
  setImageInputMode,
  setImageUrlDraft,
  setEditingProduct,
  setProductForm,
  updateProductState,
  uploading,
}) => {
  const pricingPreview = useMemo(
    () => calculatePricingPreview({
      basePrice: productForm.basePrice,
      gstRate: productForm.gstRate,
      discountAmount: productForm.discountAmount,
    }),
    [productForm.basePrice, productForm.discountAmount, productForm.gstRate],
  )

  useEffect(() => {
    setImageInputMode('upload')
    setImageUrlDraft('')
  }, [editingProduct, setImageInputMode, setImageUrlDraft])

  return (
    <AdminSurface className="sticky top-6">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="admin-section-label">Product editor</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {editingProduct ? 'Update product' : 'Add new product'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Build complete product cards with inventory, media, sizes, colors, and campaign pricing.
            </p>
          </div>
          {editingProduct ? (
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null)
                setProductForm(createInitialProductForm())
                setImageInputMode('upload')
                setImageUrlDraft('')
              }}
              className="admin-inline-button"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
        <div className="grid gap-4">
        <div>
          <label className="admin-field-label" htmlFor="product-name">
            Product name
          </label>
          <input
            id="product-name"
            className="field-input"
            placeholder="Premium cotton shirt"
            value={productForm.name}
            onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </div>

        <div>
          <label className="admin-field-label" htmlFor="product-description">
            Description
          </label>
          <textarea
            id="product-description"
            className="field-input min-h-28 rounded-3xl"
            placeholder="Describe fit, fabric, and highlights"
            value={productForm.description}
            onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="admin-field-label" htmlFor="product-price">
              Base price
            </label>
            <input
              id="product-price"
              className="field-input"
              placeholder="1999"
              type="number"
              min="0"
              step="0.01"
              value={productForm.basePrice}
              onChange={(event) => setProductForm((current) => ({ ...current, basePrice: event.target.value }))}
              required
            />
          </div>

          <div>
            <label className="admin-field-label" htmlFor="product-gst-rate">
              GST slab
            </label>
            <select
              id="product-gst-rate"
              className="field-input"
              value={productForm.gstRate}
              onChange={(event) => setProductForm((current) => ({ ...current, gstRate: event.target.value }))}
            >
              {GST_SLAB_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-field-label" htmlFor="product-sale-price">
              Discount amount
            </label>
            <input
              id="product-sale-price"
              className="field-input"
              placeholder="250"
              type="number"
              min="0"
              step="0.01"
              value={productForm.discountAmount}
              onChange={(event) => setProductForm((current) => ({ ...current, discountAmount: event.target.value }))}
            />
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Customer discount is a rupee amount subtracted after GST is added to the base price.
        </p>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p>Tax Amount = {formatCurrency(pricingPreview.gstAmount)}</p>
          <p>Final Selling Price = {formatCurrency(pricingPreview.finalPrice)}</p>
          <p>Customer Discount = {formatCurrency(pricingPreview.discountAmount)}</p>
          <p>Discounted Price = {formatCurrency(pricingPreview.discountedPrice)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="admin-field-label" htmlFor="product-category">
              Category
            </label>
            <select
              id="product-category"
              className="field-input"
              value={productForm.category}
              onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
              required
            >
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-field-label" htmlFor="product-stock">
              Stock
            </label>
            <input
              id="product-stock"
              className="field-input"
              placeholder="48"
              type="number"
              value={productForm.stock}
              onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <label className="admin-field-label" htmlFor="product-collection">
            Collection
          </label>
          <input
            id="product-collection"
            list="admin-collections-list"
            className="field-input"
            placeholder="Summer launch"
            value={productForm.collection}
            onChange={(event) => setProductForm((current) => ({ ...current, collection: event.target.value }))}
          />
          <datalist id="admin-collections-list">
            {collectionNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="admin-field-label" htmlFor="product-tags">
            Tags
          </label>
          <input
            id="product-tags"
            className="field-input"
            placeholder="summer, bestseller, cotton"
            value={productForm.tags}
            onChange={(event) => setProductForm((current) => ({ ...current, tags: event.target.value }))}
          />
        </div>

        <SelectionGroup
          title="Sizes"
          helper={
            CATEGORIES_WITH_SIZE.includes(productForm.category)
              ? 'Choose all sizes customers can buy for this category.'
              : 'Optional for this category. Use only when the product has size variants.'
          }
          options={SIZES}
          selected={productForm.sizes}
          onToggle={(size) =>
            setProductForm((current) => ({
              ...current,
              sizes: current.sizes.includes(size)
                ? current.sizes.filter((item) => item !== size)
                : [...current.sizes, size],
            }))
          }
        />

        <SelectionGroup
          title="Colors"
          helper="Use color swatches that match the actual product options."
          options={COLORS}
          selected={productForm.colors}
          onToggle={(color) =>
            setProductForm((current) => ({
              ...current,
              colors: current.colors.includes(color)
                ? current.colors.filter((item) => item !== color)
                : [...current.colors, color],
            }))
          }
        />

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="admin-field-label">Product images</p>
                <p className="text-xs text-slate-500">
                  Choose whether you want to upload image files or paste image URLs. Up to 6 images allowed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`admin-select-chip ${imageInputMode === 'upload' ? 'admin-select-chip-active' : ''}`}
                >
                  Upload image
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`admin-select-chip ${imageInputMode === 'url' ? 'admin-select-chip-active' : ''}`}
                >
                  Image address
                </button>
              </div>
            </div>

            {imageInputMode === 'upload' ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">Upload from your device in portrait or square format.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="admin-primary-button"
                    disabled={uploading || productForm.images.length >= 6}
                  >
                    {uploading ? 'Uploading...' : productForm.images.length >= 6 ? 'Limit reached' : 'Upload images'}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    ref={imageUrlInputRef}
                    type="text"
                    className="field-input"
                    placeholder="https://example.com/product-image.jpg"
                    value={imageUrlDraft}
                    onChange={(event) => setImageUrlDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        onAddImageUrl()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={onAddImageUrl}
                    className="admin-primary-button"
                    disabled={productForm.images.length >= 6}
                  >
                    Add image
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Paste a full image address starting with `http://` or `https://`.
                </p>
              </div>
            )}

            {productForm.images.length ? (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {productForm.images.map((image, index) => (
                  <div key={`${image.publicId || image.url}-${index}`} className="group relative overflow-hidden rounded-[1.4rem] border border-slate-200 bg-slate-50">
                    <img src={image.url} alt={`Product preview ${index + 1}`} className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onRemoveImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white opacity-0 transition group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title="No product images yet"
                description="Choose upload or image address above, then add at least one image for the product card."
              />
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            className="admin-primary-button justify-center"
            disabled={createProductState.isLoading || updateProductState.isLoading}
          >
            {createProductState.isLoading || updateProductState.isLoading
              ? 'Saving...'
              : editingProduct
                ? 'Update product'
                : 'Create product'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null)
              setProductForm(createInitialProductForm())
              setImageInputMode('upload')
              setImageUrlDraft('')
            }}
            className="admin-secondary-button"
          >
            Clear form
          </button>
        </div>
      </form>
    </AdminSurface>
  )
}

const SelectionGroup = ({ helper, onToggle, options, selected, title }) => (
  <div>
    <div className="mb-2">
      <p className="admin-field-label">{title}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(option)}
          className={`admin-select-chip ${selected.includes(option) ? 'admin-select-chip-active' : ''}`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
)

const OverviewSection = ({ analytics, collections, products, recentOrders }) => {
  const lowStockCount = products.filter((product) => product.stock < 10).length
  const featuredCount = products.filter((product) => product.isFeatured).length
  const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0)

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Metrics Grid - 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <AdminMetricCard label="Total Orders" value={analytics?.orders || 0} hint="All orders placed" />
        <AdminMetricCard label="Total Products" value={analytics?.products || 0} hint="In catalog" />
        <AdminMetricCard label="Total Stock" value={totalStock} hint={`${lowStockCount} low stock`} />
        <AdminMetricCard label="Users" value={analytics?.users || 0} hint="Registered users" />
      </div>

      {/* Dashboard Grid - Revenue card + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Revenue Card - Takes 1 column on desktop, full on mobile */}
        <div className="lg:col-span-1 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-6 lg:p-8 text-white min-h-50 flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 mb-3">
              Revenue
            </span>
            <h3 className="text-base font-medium text-white/60 mb-1">Total Earnings</h3>
          </div>
          <div>
            <p className="text-3xl lg:text-4xl font-bold">{formatCurrency(analytics?.revenue)}</p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>+12.5% from last month</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - 4 cards */}
        <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <AdminSurface className="p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">{featuredCount}</p>
                <p className="text-xs lg:text-sm text-slate-500">Featured</p>
              </div>
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">{collections.length}</p>
                <p className="text-xs lg:text-sm text-slate-500">Collections</p>
              </div>
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">{recentOrders.length}</p>
                <p className="text-xs lg:text-sm text-slate-500">Recent Orders</p>
              </div>
            </div>
          </AdminSurface>

          <AdminSurface className="p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-bold text-amber-600">{lowStockCount}</p>
                <p className="text-xs lg:text-sm text-slate-500">Low Stock</p>
              </div>
            </div>
          </AdminSurface>
        </div>
      </div>
    </div>
  )
}

const CollectionsSection = ({
  bannerInputRef,
  collectionForm,
  collections,
  createCollectionState,
  editingCollection,
  onDeleteCollection,
  onEditCollection,
  onUploadBanner,
  onSubmit,
  productCountByCollection,
  setCollectionForm,
  setEditingCollection,
  uploadingBanner,
  updateCollectionState,
}) => (
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_400px]">
    <AdminSurface>
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="admin-section-label">Collections board</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Launch themes and campaign pages</h2>
      </div>
      <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
        {collections.length ? (
          collections.map((collection) => (
            <div key={collection._id} className="overflow-hidden rounded-[1.8rem] border border-slate-100 bg-white">
              {collection.bannerImage ? (
                <img src={collection.bannerImage} alt={collection.name} className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-400">
                  Banner needed
                </div>
              )}
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{collection.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {productCountByCollection[collection.name] || 0} products assigned
                    </p>
                  </div>
                  <AdminStatusPill tone={collection.bannerImage ? 'success' : 'warning'}>
                    {collection.bannerImage ? 'Published' : 'Incomplete'}
                  </AdminStatusPill>
                </div>
                <p className="text-sm leading-6 text-slate-500">{collection.description || 'No description added yet.'}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onEditCollection(collection)} className="admin-inline-button">
                    Edit
                  </button>
                  <button type="button" onClick={() => onDeleteCollection(collection._id)} className="admin-inline-button admin-inline-button-danger">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2">
            <AdminEmptyState
              title="No collections available"
              description="Use the editor to create your first seasonal, brand, or campaign collection."
            />
          </div>
        )}
      </div>
    </AdminSurface>

    <AdminSurface className="sticky top-6">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="admin-section-label">Collection editor</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {editingCollection ? 'Update collection' : 'Create collection'}
            </h2>
          </div>
          {editingCollection ? (
            <button
              type="button"
              onClick={() => {
                setEditingCollection(null)
                setCollectionForm(createInitialCollectionForm())
              }}
              className="admin-inline-button"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
        <div>
          <label className="admin-field-label" htmlFor="collection-name">
            Collection name
          </label>
          <input
            id="collection-name"
            className="field-input"
            placeholder="Monsoon edit"
            value={collectionForm.name}
            onChange={(event) => setCollectionForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <label className="admin-field-label" htmlFor="collection-banner">
                Banner image
              </label>
              <p className="text-xs text-slate-500">Upload a strong promotional banner for homepage and collection pages.</p>
            </div>
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="admin-primary-button"
              disabled={uploadingBanner}
            >
              {uploadingBanner ? 'Uploading...' : 'Upload banner'}
            </button>
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={onUploadBanner} className="hidden" />
          <input
            id="collection-banner"
            className="field-input"
            placeholder="https://..."
            value={collectionForm.bannerImage}
            onChange={(event) => setCollectionForm((current) => ({ ...current, bannerImage: event.target.value }))}
            required
          />
          {collectionForm.bannerImage ? (
            <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              <img src={collectionForm.bannerImage} alt="Collection banner preview" className="h-40 w-full object-cover" />
            </div>
          ) : null}
        </div>

        <div>
          <label className="admin-field-label" htmlFor="collection-description">
            Description
          </label>
          <textarea
            id="collection-description"
            className="field-input min-h-28 rounded-3xl"
            placeholder="Explain the curation, mood, and products inside this collection"
            value={collectionForm.description}
            onChange={(event) => setCollectionForm((current) => ({ ...current, description: event.target.value }))}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            className="admin-primary-button justify-center"
            disabled={createCollectionState.isLoading || updateCollectionState.isLoading}
          >
            {createCollectionState.isLoading || updateCollectionState.isLoading
              ? 'Saving...'
              : editingCollection
                ? 'Update collection'
                : 'Create collection'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCollection(null)
              setCollectionForm(createInitialCollectionForm())
            }}
            className="admin-secondary-button"
          >
            Clear form
          </button>
        </div>
      </form>
    </AdminSurface>
  </div>
)

const OrdersSection = ({ isLoading, onUpdateOrderStatus, orders }) => (
  <AdminSurface>
    <div className="border-b border-slate-100 px-6 py-5">
      <p className="admin-section-label">Order operations</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Track fulfillment and payment health</h2>
    </div>
    <div className="px-6 py-6">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[1.8rem] border border-slate-100 bg-slate-50/70 p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-32 rounded-lg bg-slate-200" />
                  <div className="h-4 w-48 rounded-lg bg-slate-200" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-6 w-16 rounded-full bg-slate-200" />
                    <div className="h-6 w-20 rounded-full bg-slate-200" />
                    <div className="h-6 w-16 rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-7 w-24 rounded-lg bg-slate-200" />
                  <div className="h-10 w-32 rounded-xl bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="group rounded-[1.8rem] border border-slate-100 bg-slate-50/70 p-5 transition-all duration-300 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900 transition-colors group-hover:text-slate-800">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.user?.name || 'Customer'} • {order.items?.length || 0} items • {formatDate(order.createdAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AdminStatusPill tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {toTitleCase(order.paymentStatus)}
                    </AdminStatusPill>
                    <AdminStatusPill tone="neutral">{toTitleCase(order.paymentMethod)}</AdminStatusPill>
                    <AdminStatusPill tone="info">{toTitleCase(order.orderStatus)}</AdminStatusPill>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p className="text-lg font-semibold text-slate-950 transition-transform group-hover:scale-[1.02]">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <select
                    defaultValue={order.orderStatus}
                    onChange={(event) => onUpdateOrderStatus(order._id, event.target.value)}
                    className="field-input min-w-52.5 cursor-pointer rounded-xl border-slate-200 py-3 transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  >
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <option key={status} value={status}>
                        {toTitleCase(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="No orders to manage"
          description="Incoming orders will appear here with payment and fulfillment controls."
        />
      )}
    </div>
  </AdminSurface>
)

const VendorsSection = ({
  isLoading,
  vendors,
  onApproveVendor,
  onRejectVendor,
  onSuspendVendor,
}) => (
    <AdminSurface>
      <div className="border-b border-slate-100 px-6 py-5">
        <p className="admin-section-label">Vendor profiles</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Verify and manage seller accounts</h2>
        <p className="mt-1 text-sm text-slate-500">Vendor KYC, status, and business profile moderation.</p>
      </div>

      <div className="px-6 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-[1.8rem] border border-slate-100 bg-slate-50/70 p-5">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1.5fr_0.9fr_1fr]">
                  <div className="h-5 w-40 rounded-lg bg-slate-200" />
                  <div className="h-5 w-56 rounded-lg bg-slate-200" />
                  <div className="h-5 w-24 rounded-lg bg-slate-200" />
                  <div className="h-9 w-48 rounded-lg bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : vendors.length ? (
            <>
              <div className="space-y-3 md:hidden">
                {vendors.map((vendor) => (
                  <div key={vendor._id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{vendor.user?.name || 'Vendor User'}</p>
                        <p className="mt-1 text-sm text-slate-500 break-all">{vendor.user?.email || 'No email'}</p>
                      </div>
                      <AdminStatusPill
                        tone={
                          vendor.status === 'approved'
                            ? 'success'
                            : vendor.status === 'pending'
                              ? 'warning'
                              : vendor.status === 'suspended'
                                ? 'error'
                                : 'neutral'
                        }
                      >
                        {toTitleCase(vendor.status || 'pending')}
                      </AdminStatusPill>
                    </div>

                    <div className="mt-3 text-sm text-slate-600">
                      <p className="font-medium">{vendor.businessName || 'Business name pending'}</p>
                      <p className="mt-1 text-slate-500 break-all">{vendor.businessPhone || vendor.businessEmail || 'No contact details'}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button type="button" className="admin-inline-button justify-center" onClick={() => onApproveVendor(vendor._id)}>
                        Approve
                      </button>
                      <button type="button" className="admin-inline-button justify-center" onClick={() => onRejectVendor(vendor._id)}>
                        Reject
                      </button>
                      <button
                        type="button"
                        className="admin-inline-button admin-inline-button-danger justify-center"
                        onClick={() => onSuspendVendor(vendor._id)}
                      >
                        Suspend
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-4xl border border-slate-100 bg-white shadow-sm md:block">
                <div className="min-w-225">
                  <div className="grid gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 lg:grid-cols-[1.2fr_1.5fr_0.9fr_1fr]">
                    <span>Vendor</span>
                    <span>Business</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {vendors.map((vendor) => (
                      <div key={vendor._id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_1.5fr_0.9fr_1fr] lg:items-center">
                        <div>
                          <p className="font-semibold text-slate-950">{vendor.user?.name || 'Vendor User'}</p>
                          <p className="mt-1 text-sm text-slate-500 break-all">{vendor.user?.email || 'No email'}</p>
                        </div>
                        <div className="text-sm text-slate-600">
                          <p>{vendor.businessName || 'Business name pending'}</p>
                          <p className="mt-1 text-slate-500 break-all">{vendor.businessPhone || vendor.businessEmail || 'No contact details'}</p>
                        </div>
                        <div>
                          <AdminStatusPill
                            tone={
                              vendor.status === 'approved'
                                ? 'success'
                                : vendor.status === 'pending'
                                  ? 'warning'
                                  : vendor.status === 'suspended'
                                    ? 'error'
                                    : 'neutral'
                            }
                          >
                            {toTitleCase(vendor.status || 'pending')}
                          </AdminStatusPill>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="admin-inline-button" onClick={() => onApproveVendor(vendor._id)}>
                            Approve
                          </button>
                          <button type="button" className="admin-inline-button" onClick={() => onRejectVendor(vendor._id)}>
                            Reject
                          </button>
                          <button
                            type="button"
                            className="admin-inline-button admin-inline-button-danger"
                            onClick={() => onSuspendVendor(vendor._id)}
                          >
                            Suspend
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
        ) : (
          <AdminEmptyState
            title="No vendor applications"
            description="When sellers create vendor profiles, they will appear here for approval."
          />
        )}
      </div>
    </AdminSurface>
)

const UsersSection = ({ isLoading, users }) => (
  <AdminSurface>
    <div className="border-b border-slate-100 px-6 py-5">
      <p className="admin-section-label">Customer accounts</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Customers only</h2>
      <p className="mt-1 text-sm text-slate-500">
        This panel shows customer logins only. Vendor applications and approved sellers appear in the Vendors tab.
      </p>
    </div>

    <div className="px-6 py-6">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[1.8rem] border border-slate-100 bg-slate-50/70 p-5">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1.2fr_0.9fr_0.8fr]">
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded-lg bg-slate-200" />
                  <div className="h-4 w-32 rounded-lg bg-slate-200" />
                </div>
                <div className="h-5 w-52 rounded-lg bg-slate-200" />
                <div className="h-5 w-28 rounded-lg bg-slate-200" />
                <div className="h-5 w-24 rounded-lg bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length ? (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <div key={user._id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{user.name || 'Unnamed user'}</p>
                    <p className="mt-1 text-sm text-slate-500">customer</p>
                  </div>
                  {user.profileCompleted ? (
                    <AdminStatusPill tone="success">Profile complete</AdminStatusPill>
                  ) : (
                    <AdminStatusPill tone="warning">Needs profile</AdminStatusPill>
                  )}
                </div>

                <div className="mt-3 text-sm text-slate-600 space-y-1">
                  <p className="break-all">{user.email || 'No email yet'}</p>
                  <p className="text-slate-500">{user.phone || user.alternatePhone || 'No phone saved'}</p>
                </div>

                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex flex-wrap gap-2">
                    <AdminStatusPill tone="info">{toTitleCase(user.authProvider || 'email')}</AdminStatusPill>
                    {user.clerkId ? <AdminStatusPill tone="neutral">Clerk linked</AdminStatusPill> : null}
                    {user.authIdentityKey ? <AdminStatusPill tone="neutral">Identity saved</AdminStatusPill> : null}
                  </div>
                  <p className="text-xs text-slate-500">
                    {user.loginIdentities?.length
                      ? user.loginIdentities.map((identity) => identity.provider || identity.source || 'auth').join(' • ')
                      : 'No login history yet'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.lastLoginAt ? `Last login: ${formatDate(user.lastLoginAt)}` : 'Last login not available'}
                  </p>
                  <p className="text-xs text-slate-500">Joined: {formatDate(user.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-4xl border border-slate-100 bg-white shadow-sm md:block">
            <div className="min-w-260">
              <div className="grid gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 lg:grid-cols-[1.2fr_1.2fr_1.2fr_0.9fr_0.8fr]">
                <span>User</span>
                <span>Contact</span>
                <span>Login identity</span>
                <span>Status</span>
                <span>Joined</span>
              </div>
              <div className="divide-y divide-slate-100">
                {users.map((user) => (
                  <div key={user._id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_1.2fr_1.2fr_0.9fr_0.8fr] lg:items-center">
                    <div>
                      <p className="font-semibold text-slate-950">{user.name || 'Unnamed user'}</p>
                      <p className="mt-1 text-sm text-slate-500">customer</p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p className="break-all">{user.email || 'No email yet'}</p>
                      <p className="mt-1 text-slate-500">{user.phone || user.alternatePhone || 'No phone saved'}</p>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex flex-wrap gap-2">
                        <AdminStatusPill tone="info">{toTitleCase(user.authProvider || 'email')}</AdminStatusPill>
                        {user.clerkId ? <AdminStatusPill tone="neutral">Clerk linked</AdminStatusPill> : null}
                        {user.authIdentityKey ? <AdminStatusPill tone="neutral">Identity saved</AdminStatusPill> : null}
                      </div>
                      <p className="text-xs text-slate-500">
                        {user.loginIdentities?.length
                          ? user.loginIdentities.map((identity) => identity.provider || identity.source || 'auth').join(' • ')
                          : 'No login history yet'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.lastLoginAt ? `Last login: ${formatDate(user.lastLoginAt)}` : 'Last login not available'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.profileCompleted ? (
                        <AdminStatusPill tone="success">Profile complete</AdminStatusPill>
                      ) : (
                        <AdminStatusPill tone="warning">Needs profile</AdminStatusPill>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">{formatDate(user.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <AdminEmptyState
          title="No users synced yet"
          description="When customers log in with email, phone, or social auth, they will appear here automatically."
        />
      )}
    </div>
  </AdminSurface>
)

const AdminPage = () => {
  const sessionUser = getStoredUser()
  const [uploadImages] = useUploadProductImagesMutation()
  const {
    data: analyticsData,
    isError: analyticsError,
    isLoading: analyticsLoading,
  } = useGetAdminAnalyticsQuery()
  const { data: adminOrdersData, isLoading: ordersLoading } = useGetAdminOrdersQuery()
  const { data: adminProfileData, refetch: refetchAdminProfile } = useGetAdminProfileQuery()
  const { data: collectionsData, isLoading: collectionsLoading } = useGetCollectionsQuery({ includeInactive: true })
  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({ limit: 100 })
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useGetUsersQuery({ limit: 100, role: 'customer' })
  const { data: vendorsData, isLoading: vendorsLoading, refetch: refetchVendors } = useGetAdminVendorsQuery({ limit: 100 })
  const { data: notificationsData } = useGetNotificationsQuery(undefined, { pollingInterval: 15000 })
  const { data: notificationCountData } = useGetNotificationCountQuery(undefined, { pollingInterval: 15000 })
  const [createProduct, createProductState] = useCreateProductMutation()
  const [updateProduct, updateProductState] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()
  const [createCollection, createCollectionState] = useCreateCollectionMutation()
  const [updateCollection, updateCollectionState] = useUpdateCollectionMutation()
  const [deleteCollection] = useDeleteCollectionMutation()
  const [updateOrderStatus] = useUpdateOrderStatusMutation()
  const [approveVendor] = useApproveVendorMutation()
  const [rejectVendor] = useRejectVendorMutation()
  const [suspendVendor] = useSuspendVendorMutation()
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation()
  const [activeTab, setActiveTab] = useState('overview')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingCollection, setEditingCollection] = useState(null)
  const [productForm, setProductForm] = useState(createInitialProductForm)
  const [collectionForm, setCollectionForm] = useState(createInitialCollectionForm)
  const [productFilter, setProductFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [imageInputMode, setImageInputMode] = useState('upload')
  const [imageUrlDraft, setImageUrlDraft] = useState('')
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const fileInputRef = useRef(null)
  const imageUrlInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  const analytics = analyticsData?.analytics?.totals || {}
  const recentOrders = analyticsData?.analytics?.recentOrders || []
  const orders = adminOrdersData?.orders || recentOrders
  const collections = useMemo(() => collectionsData?.collections || [], [collectionsData])
  const products = useMemo(() => productsData?.products || [], [productsData])
  const users = useMemo(
    () => (usersData?.users || []).filter((user) => (user.role || 'customer') === 'customer'),
    [usersData],
  )
  const vendors = useMemo(() => vendorsData?.vendors || [], [vendorsData])
  const visibleProducts = useMemo(
    () => products.filter((product) => !isDemoCatalogProduct(product)),
    [products],
  )
  const collectionNames = collections.map((collection) => collection.name)
  const productCountByCollection = useMemo(
    () =>
      visibleProducts.reduce((accumulator, product) => {
        if (!product.collection) {
          return accumulator
        }

        accumulator[product.collection] = (accumulator[product.collection] || 0) + 1
        return accumulator
      }, {}),
    [visibleProducts],
  )

  const userName = sessionUser?.name || sessionUser?.fullName || 'Admin'
  const topbarSubtitle =
    activeTab === 'overview'
      ? 'Monitor store health, recent orders, and collection readiness from a focused command center.'
      : activeTab === 'vendors'
        ? 'Review vendor business profiles and approve, reject, or suspend seller access.'
      : activeTab === 'collections'
          ? 'Curate themed drops, campaigns, and landing pages with strong collection storytelling.'
          : activeTab === 'users'
            ? 'Review customer accounts separately from vendor profiles.'
            : activeTab === 'settings'
              ? 'Manage your account information, security settings, and profile details.'
              : 'Move orders through fulfillment with cleaner visibility into payment and order status.'

  const primaryActionLabel =
    activeTab === 'vendors'
      ? 'Refresh vendors'
      : activeTab === 'collections'
        ? 'New collection'
        : activeTab === 'users'
          ? 'Refresh users'
          : activeTab === 'settings'
            ? ''
            : 'Open collections'

  const uploadAssets = async (files, appendToProduct = true) => {
    if (!files || files.length === 0) {
      return []
    }

    const formData = new FormData()
    for (let index = 0; index < files.length; index += 1) {
      formData.append('images', files[index])
    }

    const response = await uploadImages(formData).unwrap()
    const nextImages = response.images.map((image) => ({ url: image.url, publicId: image.publicId }))

    if (appendToProduct) {
      setProductForm((current) => ({
        ...current,
        images: [...current.images, ...nextImages],
      }))
    }

    return nextImages
  }

  const handleImageUpload = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (productForm.images.length >= 6) {
      toast.error('You can upload up to 6 images per product')
      event.target.value = ''
      return
    }

    if (productForm.images.length + files.length > 6) {
      toast.error(`Only ${6 - productForm.images.length} image slots remaining`)
      event.target.value = ''
      return
    }

    setUploading(true)
    try {
      await uploadAssets(files, true)
      toast.success('Images uploaded successfully')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload images'))
    } finally {
      event.target.value = ''
      setUploading(false)
    }
  }

  const handleBannerUpload = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingBanner(true)
    try {
      const [banner] = await uploadAssets(files, false)
      if (banner?.url) {
        setCollectionForm((current) => ({
          ...current,
          bannerImage: banner.url,
        }))
      }
      toast.success('Banner uploaded successfully')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload banner'))
    } finally {
      event.target.value = ''
      setUploadingBanner(false)
    }
  }

  const handleRemoveImage = (index) => {
    setProductForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }))
  }

  const getCurrentImageUrlDraft = () => (imageUrlInputRef.current?.value ?? imageUrlDraft).trim()

  const handleAddImageUrl = () => {
    const trimmedUrl = getCurrentImageUrlDraft()

    if (!trimmedUrl) {
      toast.error('Please paste an image address')
      return
    }

    if (productForm.images.length >= 6) {
      toast.error('You can add up to 6 images per product')
      return
    }

    try {
      const parsedUrl = new URL(trimmedUrl)

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        toast.error('Image address must start with http:// or https://')
        return
      }
    } catch {
      toast.error('Please enter a valid image address')
      return
    }

    if (productForm.images.some((image) => image.url === trimmedUrl)) {
      toast.error('This image address is already added')
      return
    }

    setProductForm((current) => ({
      ...current,
      images: [...current.images, { url: trimmedUrl, publicId: '' }],
    }))
    setImageUrlDraft('')
    toast.success('Image address added')
  }

  const getImagesWithPendingDraft = () => {
    const trimmedUrl = getCurrentImageUrlDraft()

    if (imageInputMode !== 'url' || !trimmedUrl) {
      return productForm.images
    }

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

    if (productForm.images.some((image) => image.url === trimmedUrl)) {
      return productForm.images
    }

    if (productForm.images.length >= 6) {
      toast.error('You can add up to 6 images per product')
      return null
    }

    return [...productForm.images, { url: trimmedUrl, publicId: '' }]
  }

  const normalizeProductPayload = () => ({
    ...productForm,
    basePrice: Number(productForm.basePrice),
    name: productForm.name.trim(),
    description: productForm.description.trim(),
    collection: productForm.collection.trim(),
    discountAmount: Number(productForm.discountAmount || 0),
    gstRate: Number(productForm.gstRate || 0),
    stock: Number(productForm.stock),
    tags: productForm.tags
      ? productForm.tags
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  })

  const handleCreateProduct = async (event) => {
    event.preventDefault()
    const nextImages = getImagesWithPendingDraft()

    if (!nextImages) {
      return
    }

    if (!productForm.name.trim()) {
      toast.error('Product name is required')
      return
    }

    if (!productForm.description.trim()) {
      toast.error('Description is required')
      return
    }

    const pricingPreview = calculatePricingPreview({
      basePrice: productForm.basePrice,
      gstRate: productForm.gstRate,
      discountAmount: productForm.discountAmount,
    })

    if (!productForm.basePrice) {
      toast.error('Base price is required')
      return
    }

    if (!nextImages.length) {
      toast.error('At least one image is required')
      return
    }

    if (Number(productForm.stock) < 0) {
      toast.error('Stock cannot be negative')
      return
    }

    if (Number(productForm.discountAmount || 0) > pricingPreview.finalPrice) {
      toast.error('Discount cannot exceed final selling price')
      return
    }

    if (CATEGORIES_WITH_SIZE.includes(productForm.category) && !productForm.sizes.length) {
      toast.error('Please select at least one size for this category')
      return
    }

    try {
      await createProduct({
        ...normalizeProductPayload(),
        images: nextImages,
        isFeatured: true,
      }).unwrap()
      toast.success('Product created')
      setProductForm(createInitialProductForm())
      setImageInputMode('upload')
      setImageUrlDraft('')
      setActiveTab('products')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create product'))
    }
  }

  const handleUpdateProduct = async (event) => {
    event.preventDefault()
    const nextImages = getImagesWithPendingDraft()

    if (!nextImages) {
      return
    }

    if (!editingProduct) {
      return
    }

    if (!productForm.name.trim()) {
      toast.error('Product name is required')
      return
    }

    if (!productForm.description.trim()) {
      toast.error('Description is required')
      return
    }

    if (!nextImages.length) {
      toast.error('At least one image is required')
      return
    }

    const pricingPreview = calculatePricingPreview({
      basePrice: productForm.basePrice,
      gstRate: productForm.gstRate,
      discountAmount: productForm.discountAmount,
    })

    if (!productForm.basePrice) {
      toast.error('Base price is required')
      return
    }

    if (Number(productForm.discountAmount || 0) > pricingPreview.finalPrice) {
      toast.error('Discount cannot exceed final selling price')
      return
    }

    if (CATEGORIES_WITH_SIZE.includes(productForm.category) && !productForm.sizes.length) {
      toast.error('Please select at least one size for this category')
      return
    }

    try {
      await updateProduct({
        id: editingProduct._id,
        ...normalizeProductPayload(),
        images: nextImages,
      }).unwrap()
      toast.success('Product updated')
      setEditingProduct(null)
      setProductForm(createInitialProductForm())
      setImageInputMode('upload')
      setImageUrlDraft('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update product'))
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setActiveTab('products')
    setProductForm(buildEditableProductForm(product))
    setImageInputMode('upload')
    setImageUrlDraft('')
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product from the catalog?')) {
      return
    }

    try {
      await deleteProduct(productId).unwrap()
      toast.success('Product deleted')
      if (editingProduct?._id === productId) {
        setEditingProduct(null)
        setProductForm(createInitialProductForm())
        setImageInputMode('upload')
        setImageUrlDraft('')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete product'))
    }
  }

  const handleCreateCollection = async (event) => {
    event.preventDefault()

    if (!collectionForm.name.trim()) {
      toast.error('Collection name is required')
      return
    }

    if (!collectionForm.bannerImage) {
      toast.error('Please upload or paste a banner image')
      return
    }

    try {
      await createCollection({
        ...collectionForm,
        bannerImage: collectionForm.bannerImage.trim(),
        description: collectionForm.description.trim(),
        name: collectionForm.name.trim(),
      }).unwrap()
      toast.success('Collection created')
      setCollectionForm(createInitialCollectionForm())
      setActiveTab('collections')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create collection'))
    }
  }

  const handleUpdateCollection = async (event) => {
    event.preventDefault()

    if (!editingCollection) {
      return
    }

    if (!collectionForm.name.trim()) {
      toast.error('Collection name is required')
      return
    }

    if (!collectionForm.bannerImage) {
      toast.error('Please upload or paste a banner image')
      return
    }

    try {
      await updateCollection({
        id: editingCollection._id,
        ...collectionForm,
        bannerImage: collectionForm.bannerImage.trim(),
        description: collectionForm.description.trim(),
        name: collectionForm.name.trim(),
      }).unwrap()
      toast.success('Collection updated')
      setEditingCollection(null)
      setCollectionForm(createInitialCollectionForm())
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update collection'))
    }
  }

  const handleEditCollection = (collection) => {
    setEditingCollection(collection)
    setActiveTab('collections')
    setCollectionForm({
      bannerImage: collection.bannerImage || '',
      description: collection.description || '',
      name: collection.name || '',
    })
  }

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('Delete this collection?')) {
      return
    }

    try {
      await deleteCollection(collectionId).unwrap()
      toast.success('Collection deleted')
      if (editingCollection?._id === collectionId) {
        setEditingCollection(null)
        setCollectionForm(createInitialCollectionForm())
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete collection'))
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateOrderStatus({ id: orderId, status }).unwrap()
      toast.success('Order updated')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update order'))
    }
  }

  const handleApproveVendor = async (vendorId) => {
    try {
      await approveVendor({ id: vendorId }).unwrap()
      toast.success('Vendor approved successfully')
      refetchVendors()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to approve vendor'))
    }
  }

  const handleRejectVendor = async (vendorId) => {
    const reason = window.prompt('Rejection reason (optional):', '') || ''

    try {
      await rejectVendor({ id: vendorId, reason }).unwrap()
      toast.success('Vendor rejected')
      refetchVendors()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to reject vendor'))
    }
  }

  const handleSuspendVendor = async (vendorId) => {
    if (!window.confirm('Suspend this vendor account?')) {
      return
    }

    try {
      await suspendVendor(vendorId).unwrap()
      toast.success('Vendor suspended')
      refetchVendors()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to suspend vendor'))
    }
  }

  const notifications = notificationsData?.notifications || []
  const unreadNotificationsCount = notificationCountData?.unreadCount || 0

  const handleNotificationClick = async (notification) => {
    if (!notification) return

    try {
      if (!notification.isRead && notification._id) {
        await markNotificationAsRead(notification._id).unwrap()
      }

      if (notification?.data?.orderId) {
        setActiveTab('orders')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update notification'))
    }
  }

  return (
    <>
      <Seo title="Admin Dashboard" description="Manage catalog, collections, and orders from the Shopzy admin dashboard." />

      <div className="min-h-screen bg-[#F7F7FA]">
        <AdminSidebar 
          activeTab={activeTab} 
          onSelectTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className={`transition-all duration-300 pt-4 pb-8 px-4 lg:px-8 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <div className="max-w-350 mx-auto">
              <AdminTopbar
                title={activeTab === 'overview' ? 'Dashboard Overview' : toTitleCase(activeTab)}
                subtitle={topbarSubtitle}
                userName={userName}
                notifications={notifications}
                unreadCount={unreadNotificationsCount}
                onNotificationClick={handleNotificationClick}
                primaryActionLabel={primaryActionLabel}
                onPrimaryAction={() => {
                  if (activeTab === 'collections') {
                    setEditingCollection(null)
                    setCollectionForm(createInitialCollectionForm())
                    return
                  }

                  if (activeTab === 'users') {
                    refetchUsers()
                    return
                  }

                  if (activeTab === 'vendors') {
                    refetchVendors()
                    return
                  }

                  if (activeTab === 'settings') {
                    return
                  }

                  setActiveTab('collections')
                }}
              />

            {analyticsError ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 px-6 py-5 text-sm text-amber-800 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Unable to load analytics</p>
                    <p className="mt-1 text-amber-700">Catalog controls still work, but dashboard insights may look incomplete. Your products and orders are safe.</p>
                  </div>
                </div>
              </div>
            ) : null}

            {(analyticsLoading && !analyticsData) || (productsLoading && !productsData) || (collectionsLoading && !collectionsData) || (ordersLoading && !adminOrdersData) ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-40 animate-pulse rounded-4xl border border-slate-200/60 bg-white/60 p-5 backdrop-blur-sm"
                  >
                    <div className="h-3 w-20 rounded-lg bg-slate-200" />
                    <div className="mt-4 h-9 w-24 rounded-lg bg-slate-200" />
                    <div className="mt-3 h-4 w-32 rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : activeTab === 'overview' ? (
              <OverviewSection
                analytics={analytics}
                collections={collections}
                productCountByCollection={productCountByCollection}
                products={visibleProducts}
                recentOrders={recentOrders}
              />
            ) : null}

            {activeTab === 'products' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <AdminMetricCard label="Catalog total" value={visibleProducts.length} hint="Products available in admin" />
                  <AdminMetricCard
                    label="Featured"
                    value={visibleProducts.filter((product) => product.isFeatured).length}
                    hint="Highlighted in the storefront"
                  />
                  <AdminMetricCard
                    label="Low stock"
                    value={visibleProducts.filter((product) => product.stock < 10).length}
                    hint="Needs inventory review"
                  />
                  <AdminMetricCard
                    label="Collections linked"
                    value={Object.keys(productCountByCollection).length}
                    hint="Products connected to merchandising"
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <AdminProductList
                    products={visibleProducts}
                    onDelete={handleDeleteProduct}
                    onEdit={handleEditProduct}
                    active={productFilter}
                    onChangeActive={setProductFilter}
                  />
                  <ProductEditor
                    collectionNames={collectionNames}
                    createProductState={createProductState}
                    editingProduct={editingProduct}
                    fileInputRef={fileInputRef}
                    imageInputMode={imageInputMode}
                    imageUrlInputRef={imageUrlInputRef}
                    imageUrlDraft={imageUrlDraft}
                    onAddImageUrl={handleAddImageUrl}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={handleRemoveImage}
                    onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                    productForm={productForm}
                    setImageInputMode={setImageInputMode}
                    setImageUrlDraft={setImageUrlDraft}
                    setEditingProduct={setEditingProduct}
                    setProductForm={setProductForm}
                    updateProductState={updateProductState}
                    uploading={uploading}
                  />
                </div>
              </div>
            ) : null}

            {activeTab === 'collections' ? (
                <CollectionsSection
                  bannerInputRef={bannerInputRef}
                  collectionForm={collectionForm}
                  collections={collections}
                  createCollectionState={createCollectionState}
                  editingCollection={editingCollection}
                  onDeleteCollection={handleDeleteCollection}
                  onEditCollection={handleEditCollection}
                  onUploadBanner={handleBannerUpload}
                  onSubmit={editingCollection ? handleUpdateCollection : handleCreateCollection}
                  productCountByCollection={productCountByCollection}
                  setCollectionForm={setCollectionForm}
                  setEditingCollection={setEditingCollection}
                  uploadingBanner={uploadingBanner}
                  updateCollectionState={updateCollectionState}
                />
            ) : null}

            {activeTab === 'orders' ? (
              <OrdersSection isLoading={ordersLoading} orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} />
            ) : null}

            {activeTab === 'vendors' ? (
              <VendorsSection
                isLoading={vendorsLoading}
                vendors={vendors}
                onApproveVendor={handleApproveVendor}
                onRejectVendor={handleRejectVendor}
                onSuspendVendor={handleSuspendVendor}
              />
            ) : null}

            {activeTab === 'users' ? <UsersSection isLoading={usersLoading} users={users} /> : null}

            {activeTab === 'settings' ? (
              <div className="space-y-6">
                <AdminProfileSettings
                  admin={adminProfileData?.admin}
                  onProfileUpdate={() => refetchAdminProfile()}
                />
                <AdminAccountSettings admin={adminProfileData?.admin} />
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </>
  )
}

export default AdminPage
