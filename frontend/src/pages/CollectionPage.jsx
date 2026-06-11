import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'
import ProductCard from '../components/ProductCard'
import ProductSkeleton from '../components/ProductSkeleton'
import Seo from '../components/Seo'
import { useGetCollectionQuery, useGetProductsQuery } from '../features/api/apiSlice'
import { getImageUrl } from '../utils/formatters'
import { CATEGORIES } from '../utils/productOptions'

const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price Low to High', value: 'price_asc' },
  { label: 'Price High to Low', value: 'price_desc' },
  { label: 'New Arrivals', value: 'new_arrivals' },
]

const categoryFilters = CATEGORIES.map((category) => ({
  label: category.label,
  value: category.value,
}))

const CollectionPage = () => {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const params = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams],
  )
  
  // If there's a slug, fetch collection; otherwise fetch all products
  const { data: collectionData, isLoading: isCollectionLoading } = useGetCollectionQuery(
    slug ? { slug, params } : { slug: 'all', params },
    { skip: !slug }
  )
  
  // Use products query to get all products when no specific collection
  const { data: productsData, isLoading: isProductsLoading } = useGetProductsQuery({
    limit: 12,
    ...params,
    publicOnly: true,
  }, { skip: !!slug })

  // Determine which data to use based on whether we have a slug
  const data = slug ? collectionData : productsData
  const isLoading = slug ? isCollectionLoading : isProductsLoading
  const displayProducts = data?.products || []

  const activeFilters = [
    params.category,
  ].filter(Boolean)

  const setParam = (nextValues, resetPage = true) => {
    const updated = new URLSearchParams(searchParams)

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        updated.delete(key)
        return
      }

      updated.set(key, value)
    })

    if (resetPage) {
      updated.set('page', '1')
    }
    setSearchParams(updated)
  }

  const handlePage = (direction) => {
    const page = Number(searchParams.get('page') || '1')
    setParam({ page: String(Math.max(1, page + direction)) }, false)
  }

  const handlePageClick = (pageNum) => {
    setParam({ page: String(pageNum) }, false)
  }

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const currentPage = Number(params.page || '1')
    const totalPages = data?.pagination?.totalPages || 1
    const pages = []
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5)
      } else if (currentPage >= totalPages - 2) {
        pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2)
      }
    }
    
    return pages
  }

  return (
    <>
      <Seo
        title={data?.collection?.name || 'All Products'}
        description={data?.collection?.description || 'Browse all products from Shopzy.'}
      />

      <section className={`pb-8 pt-6 ${data?.collection?.bannerImage ? 'bg-slate-950 text-white' : 'bg-white'}`}>
        <div className="container-shell">
          {data?.collection?.bannerImage ? (
            <div className="relative overflow-hidden rounded-4xl">
              <img
                src={getImageUrl(data.collection.bannerImage)}
                alt={data.collection.name}
                className="h-64 w-full object-cover sm:h-80"
              />
              <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-950/55 to-slate-950/20" />
              <div className="absolute inset-0 flex items-end p-6 sm:p-10">
                <div className="max-w-2xl">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/70 sm:text-xs sm:tracking-[0.35em]">Collection</p>
                  <h1 className="mt-3 font-sans text-2xl font-bold text-white sm:text-5xl">
                    {data.collection.name}
                  </h1>
                  {data.collection.description ? (
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                      {data.collection.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 sm:text-xs sm:tracking-[0.35em]">Collection</p>
              <h1 className="mt-2 font-sans text-2xl font-bold text-gray-900 sm:text-4xl">
                {data?.collection?.name || (slug ? 'Collection' : 'All Products')}
              </h1>
              {data?.collection?.description ? (
                <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
                  {data.collection.description}
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <div className="container-shell pb-16">
        <Breadcrumbs items={[{ label: data?.collection?.name || 'All Products' }]} />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar - 25% width */}
          <aside className="w-full lg:w-1/4 lg:shrink-0">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              {/* Sort Section */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">Sort By Price</label>
                <div className="relative">
                  <select
                    value={params.sortBy || 'featured'}
                    onChange={(event) => setParam({ sortBy: event.target.value })}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm outline-none"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Categories Filter */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Categories</h3>
                <div className="space-y-2">
                  {categoryFilters.map((category) => (
                    <label key={category.value} className="flex cursor-pointer items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        checked={params.category === category.value}
                        onChange={() =>
                          setParam({
                            category: params.category === category.value ? '' : category.value,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-400"
                      />
                      <span className="text-sm text-gray-600">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Filters & Reset */}
              {activeFilters.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter) => (
                      <span
                        key={filter}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700"
                      >
                        {filter}
                        <button
                          onClick={() => {
                            if (params.category === filter) setParam({ category: '' })
                          }}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Link
                    to={slug ? `/collections/${slug}` : '/products'}
                    className="mt-3 inline-block text-xs text-gray-500 underline hover:text-gray-700"
                  >
                    Clear all filters
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content - 75% width */}
          <section className="flex-1">
            {/* Results Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-sans text-xl font-semibold text-gray-900">Products</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {(data?.pagination?.total || displayProducts.length || 0)} product{(data?.pagination?.total || displayProducts.length || 0) === 1 ? '' : 's'} found
                </p>
              </div>
            </div>

            {/* Product Grid - 4 columns */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : displayProducts.length ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {data?.pagination?.totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => handlePage(-1)}
                      disabled={Number(params.page || '1') <= 1}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        Number(params.page || '1') <= 1
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {getPaginationNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageClick(pageNum)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          Number(params.page || '1') === pageNum
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => handlePage(1)}
                      disabled={(data.pagination?.page || 1) >= (data.pagination?.totalPages || 1)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        (data.pagination?.page || 1) >= (data.pagination?.totalPages || 1)
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters or search query."
                action={
                  <Link to={slug ? `/collections/${slug}` : '/products'} className="rounded-full bg-gray-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
                    Clear Filters
                  </Link>
                }
              />
            )}
          </section>
        </div>
      </div>
    </>
  )
}

export default CollectionPage
