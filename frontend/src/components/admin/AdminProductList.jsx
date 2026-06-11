import { useMemo, useState } from 'react'
import { AdminEmptyState, AdminStatusPill, AdminSurface } from './AdminChrome'
import { formatCurrency, formatDate, getImageUrl, toTitleCase } from '../../utils/formatters'

const PAGE_SIZE = 8

const getInventoryStatus = (product) => {
  if (!product.stock) {
    return { label: 'Sold out', tone: 'danger' }
  }

  if (product.stock < 10) {
    return { label: 'Low stock', tone: 'warning' }
  }

  if (product.salePrice) {
    return { label: 'On sale', tone: 'info' }
  }

  return { label: 'Active', tone: 'success' }
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-[1.8]" stroke="currentColor">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const AdminProductList = ({ products, onEdit, onDelete, active, onChangeActive }) => {
  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.category?.toLowerCase().includes(normalizedSearch) ||
        product.collection?.toLowerCase().includes(normalizedSearch)

      const matchesTab =
        active === 'all' ||
        (active === 'featured' && product.isFeatured) ||
        (active === 'low-stock' && product.stock < 10)

      return matchesSearch && matchesTab
    })
  }, [active, products, searchValue])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <AdminSurface className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="admin-section-label">Products list</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Catalog inventory</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2">
            <label className="admin-table-search">
              <SearchIcon />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value)
                  setPage(1)
                }}
                placeholder="Search by name, category..."
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              ['all', 'All'],
              ['featured', 'Featured'],
              ['low-stock', 'Low stock'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChangeActive(key)
                  setPage(1)
                }}
                className={`admin-filter-pill ${active === key ? 'admin-filter-pill-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {paginatedProducts.length ? (
        <>
          <div className="grid gap-4 px-6 py-5 md:hidden">
            {paginatedProducts.map((product) => {
              const status = getInventoryStatus(product)

              return (
                <article key={product._id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-3">
                    <img
                      src={getImageUrl(product.images?.[0]) || 'https://placehold.co/80x80?text=SKU'}
                      alt={product.name}
                      className="h-20 w-20 shrink-0 rounded-2xl border border-slate-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{product.collection || 'General catalog'}</p>
                        </div>
                        <AdminStatusPill tone={status.tone}>{status.label}</AdminStatusPill>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">{toTitleCase(product.category || 'other')}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">{formatCurrency(product.salePrice || product.price)}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">Stock {product.stock}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      {product.colors?.slice(0, 4).map((color, idx) => (
                        <div
                          key={idx}
                          className="h-4 w-4 rounded-full border border-slate-200"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onEdit(product)} className="admin-inline-button">
                        Edit
                      </button>
                      <button type="button" onClick={() => onDelete(product._id)} className="admin-inline-button admin-inline-button-danger">
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-[0.28em] text-slate-400">
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Colors</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => {
                  const status = getInventoryStatus(product)

                  return (
                    <tr key={product._id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(product.images?.[0]) || 'https://placehold.co/80x80?text=SKU'}
                            alt={product.name}
                            className="h-12 w-12 rounded-2xl border border-slate-100 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {product.collection || 'General catalog'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{toTitleCase(product.category || 'other')}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(product.salePrice || product.price)}
                      </td>
                      <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${product.stock < 10 ? 'text-amber-600' : 'text-slate-600'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {product.colors?.slice(0, 4).map((color, idx) => (
                              <div
                                key={idx}
                                className="h-5 w-5 rounded-full border border-slate-200"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                            {product.colors?.length > 4 && (
                              <span className="text-xs text-slate-400">+{product.colors.length - 4}</span>
                            )}
                            {!product.colors?.length && (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                        <AdminStatusPill tone={status.tone}>{status.label}</AdminStatusPill>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(product.updatedAt || product.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => onEdit(product)} className="admin-inline-button">
                            Edit
                          </button>
                          <button type="button" onClick={() => onDelete(product._id)} className="admin-inline-button admin-inline-button-danger">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredProducts.length)} of{' '}
              {filteredProducts.length} products
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, currentPage === current ? current - 1 : currentPage - 1))}
                className="admin-pagination-button"
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-500">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, currentPage === current ? current + 1 : currentPage + 1))}
                className="admin-pagination-button"
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="px-6 py-8">
          <AdminEmptyState
            title="No products found"
            description="Try clearing your search or publish a new product from the editor panel."
          />
        </div>
      )}
    </AdminSurface>
  )
}
