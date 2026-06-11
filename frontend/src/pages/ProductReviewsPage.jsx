import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Seo from '../components/Seo'
import {
  useCreateProductReviewMutation,
  useGetProductQuery,
  useGetProductReviewsQuery,
  useGetReviewEligibilityQuery,
  useUpdateProductReviewMutation,
  useUploadProductImagesMutation,
} from '../features/api/apiSlice'
import { getImageUrl } from '../utils/formatters'
import { readStoredUser } from '../utils/storage'

const reviewAvatarGradients = [
  'linear-gradient(135deg, #f97316 0%, #fb7185 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)',
]

const compactNumberFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const formatReviewDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const getHelpfulScore = (review, index) => {
  const ratingBoost = Number(review.rating || 0) * 12
  const commentBoost = Math.min((review.comment || '').length, 200) * 0.12
  const freshnessBoost = Math.max(0, 20 - index)
  return Math.max(1, Math.round(ratingBoost + commentBoost + freshnessBoost))
}

const renderStars = (rating = 0, className = 'text-amber-400') => (
  <div className={`flex items-center gap-0.5 ${className}`} aria-label={`Rating ${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((point) => (
      <span key={point} className="text-sm leading-none sm:text-base">{point <= rating ? '★' : '☆'}</span>
    ))}
  </div>
)

const getReviewInitials = (name = 'Customer') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  return (parts.slice(0, 2).map((part) => part[0]).join('') || 'C').toUpperCase()
}

const inferReviewTopics = (review = {}) => {
  const text = `${review.title || ''} ${review.comment || ''}`.toLowerCase()
  const topics = []

  if (/(quality|fabric|build|material|durable|stitch|product)/.test(text)) topics.push('Product Quality')
  if (/(seller|service|support|response|refund|return)/.test(text)) topics.push('Seller Services')
  if (/(price|cost|value|worth|expensive|cheap)/.test(text)) topics.push('Product Price')
  if (/(ship|delivery|dispatch|packing|courier|arrival)/.test(text)) topics.push('Shipment')
  if (/(description|as shown|same as|match|expected|accurate)/.test(text)) topics.push('Match with Description')

  if (!topics.length && (review.images?.length || review.isVerifiedPurchase)) {
    topics.push('Product Quality')
  }

  return topics.slice(0, 2)
}

const formatCompactCount = (value) => compactNumberFormatter.format(Number(value || 0))

const ProductReviewsPage = () => {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const token = useSelector((state) => state.auth?.token) || localStorage.getItem('token') || ''
  const authUser = useSelector((state) => state.auth?.user)
  const storedUser = readStoredUser()
  const authUserId = authUser?._id || authUser?.id || storedUser?._id || storedUser?.id || null
  const [ratingDraft, setRatingDraft] = useState(5)
  const [titleDraft, setTitleDraft] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [reviewImages, setReviewImages] = useState([])
  const [createReview, createReviewState] = useCreateProductReviewMutation()
  const [updateReview, updateReviewState] = useUpdateProductReviewMutation()
  const [uploadProductImages, uploadProductImagesState] = useUploadProductImagesMutation()
  const reviewImageInputRef = useRef(null)

  const { data: productData, isLoading: isProductLoading } = useGetProductQuery({ slug, publicOnly: true })
  const product = productData?.product

  const identifier = product?._id || slug
  const { data: reviewsData, isLoading: isReviewsLoading } = useGetProductReviewsQuery(
    { identifier, limit: 50 },
    { skip: !identifier },
  )
  const { data: eligibilityData } = useGetReviewEligibilityQuery(identifier, {
    skip: !token || !identifier,
  })

  const reviews = reviewsData?.reviews || []
  const summary = reviewsData?.summary || {
    averageRating: Number(product?.averageRating || product?.rating || 0),
    totalReviews: Number(product?.reviewsCount || product?.numReviews || 0),
  }

  const reviewRows = useMemo(() => {
    return reviews.map((review, index) => ({
      ...review,
      helpfulScore: getHelpfulScore(review, index),
      topics: inferReviewTopics(review),
      displayName: review.user?.name || 'Verified Customer',
      hasMedia: Array.isArray(review.images) && review.images.length > 0,
    }))
  }, [reviews])

  const ratingBreakdown = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach((review) => {
      const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating || 0))))
      counts[rating] += 1
    })
    return counts
  }, [reviews])

  const alreadyReviewedByCurrentUser = useMemo(() => {
    if (!authUserId) return false
    return reviews.some((review) => {
      const reviewUserId = review.user?._id || review.user?.id || review.user
      return reviewUserId?.toString?.() === authUserId?.toString?.()
    })
  }, [reviews, authUserId])

  const currentUserReview = useMemo(() => {
    if (!authUserId) return null
    return reviews.find((review) => {
      const reviewUserId = review.user?._id || review.user?.id || review.user
      return reviewUserId?.toString?.() === authUserId?.toString?.()
    }) || null
  }, [reviews, authUserId])

  const eligibility = eligibilityData?.eligibility || {
    canReview: false,
    alreadyReviewed: false,
    orderId: null,
    itemId: null,
  }

  const hasEligiblePurchase = Boolean(eligibility.hasPurchased && eligibility.isDelivered)
  const hasSubmittedReview = Boolean(currentUserReview || alreadyReviewedByCurrentUser || eligibility.alreadyReviewed)
  const canWriteReview = Boolean(token) && !hasSubmittedReview && (Boolean(eligibility.canReview) || hasEligiblePurchase)
  const canEditReview = Boolean(token) && Boolean(currentUserReview)
  const shouldOpenWriteBox = searchParams.get('write') === '1'
  const shouldShowReviewForm = Boolean(token) && shouldOpenWriteBox
  const isEditMode = Boolean(currentUserReview)

  useEffect(() => {
    if (!shouldOpenWriteBox || !currentUserReview) return

    setRatingDraft(Number(currentUserReview.rating || 5))
    setTitleDraft(currentUserReview.title || '')
    setCommentDraft(currentUserReview.comment || '')
    setReviewImages(Array.isArray(currentUserReview.images) ? currentUserReview.images : [])
  }, [shouldOpenWriteBox, currentUserReview])

  const handleReviewImageUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''

    if (!files.length) return

    const remainingSlots = 5 - reviewImages.length
    if (remainingSlots <= 0) {
      toast.error('You can upload up to 5 images')
      return
    }

    const filesToUpload = files.slice(0, remainingSlots)
    const formData = new FormData()
    filesToUpload.forEach((file) => formData.append('images', file))

    try {
      const response = await uploadProductImages(formData).unwrap()
      const newImages = (response.images || [])
        .map((image) => ({ url: image.url, publicId: image.publicId || '' }))
        .filter((image) => image.url)

      setReviewImages((prev) => {
        const existingUrls = new Set(prev.map((image) => image.url))
        const merged = [...prev]
        newImages.forEach((image) => {
          if (!existingUrls.has(image.url)) {
            merged.push(image)
            existingUrls.add(image.url)
          }
        })
        return merged.slice(0, 5)
      })

      toast.success('Images uploaded successfully')
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to upload images')
    }
  }

  const handleRemoveImage = (index) => {
    setReviewImages((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSubmitReview = async (event) => {
    event.preventDefault()

    if (!ratingDraft) {
      toast.error('Please select rating')
      return
    }

    try {
      if (isEditMode && currentUserReview?._id) {
        await updateReview({
          id: currentUserReview._id,
          identifier,
          rating: ratingDraft,
          title: titleDraft,
          comment: commentDraft,
          images: reviewImages,
        }).unwrap()
      } else {
        await createReview({
          identifier,
          rating: ratingDraft,
          title: titleDraft,
          comment: commentDraft,
          images: reviewImages,
          orderId: eligibility.orderId || undefined,
          itemId: eligibility.itemId || undefined,
        }).unwrap()
      }

      toast.success(isEditMode ? 'Review updated successfully' : 'Review submitted successfully')
      setRatingDraft(5)
      setTitleDraft('')
      setCommentDraft('')
      setReviewImages([])
      if (reviewImageInputRef.current) {
        reviewImageInputRef.current.value = ''
      }
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to submit review')
    }
  }

  if (isProductLoading) {
    return (
      <div className="container-shell py-10">
        <div className="h-52 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-shell py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Product not found</h1>
          <p className="mt-2 text-slate-500">Unable to load reviews for this product.</p>
          <Link to="/products" className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Back to products</Link>
        </div>
      </div>
    )
  }

  const averageRating = Number(summary.averageRating || 0)
  const totalReviewCount = Number(summary.totalReviews || reviewsData?.pagination?.total || reviews.length || 0)

  return (
    <div className="container-shell py-6 sm:py-8">
      <Seo title={`${product.name} reviews`} description={`Customer reviews and ratings for ${product.name}`} />
      <Breadcrumbs items={[{ label: 'Products', to: '/products' }, { label: product.name, to: `/products/${product.slug || slug}` }, { label: 'Customer Reviews' }]} />

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="text-sm font-semibold text-slate-700">Customer Reviews</p>
            <div className="mt-3 flex items-end gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-amber-400 text-2xl font-semibold text-slate-900">
                {averageRating.toFixed(1)}
              </div>
              <div>
                {renderStars(Math.round(averageRating), 'text-amber-400')}
                <p className="mt-1 text-xs text-slate-500">from {formatCompactCount(totalReviewCount)} reviews</p>
                <p className="mt-1 text-xs font-medium text-slate-700">{totalReviewCount.toLocaleString('en-IN')} customers reviewed this product</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown[star] || 0
              const width = totalReviewCount > 0 ? (count / Math.max(totalReviewCount, 1)) * 100 : 0
              return (
                <div key={star} className="grid grid-cols-[36px_1fr_56px] items-center gap-3 text-sm">
                  <p className="flex items-center gap-1 font-semibold text-slate-700">{star}.0 <span className="text-amber-400">★</span></p>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-slate-900" style={{ width: `${width}%` }} />
                  </div>
                  <p className="text-right text-slate-500">{count.toLocaleString('en-IN')}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {!shouldOpenWriteBox ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Want to write a review?</h2>
          {canEditReview ? (
            <Link
              to={`/products/${product.slug || product._id}/reviews?write=1`}
              className="mt-3 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm hover:bg-violet-700"
              style={{ color: '#fff' }}
            >
              Edit Your Review
            </Link>
          ) : canWriteReview ? (
            <Link
              to={`/products/${product.slug || product._id}/reviews?write=1`}
              className="mt-3 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm hover:bg-violet-700"
              style={{ color: '#fff' }}
            >
              Write a Review
            </Link>
          ) : (
            <p className="mt-2 text-sm text-slate-600">You can review after purchasing this product and once delivery is completed.</p>
          )}
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">{isEditMode ? 'Edit your review' : 'Write a review'}</h2>

          {!token ? (
            <p className="mt-2 text-sm text-slate-600">Please log in and purchase this product to write a review.</p>
          ) : shouldShowReviewForm ? (
            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              {!canWriteReview ? <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Please share your honest feedback below.</p> : null}

              <div>
                <p className="text-sm font-semibold text-slate-800">Rating</p>
                <div className="mt-2 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((point) => (
                    <button
                      key={point}
                      type="button"
                      onClick={() => setRatingDraft(point)}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-xl leading-none transition ${point <= ratingDraft ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300 hover:border-amber-200 hover:text-amber-400'}`}
                      aria-label={`Set rating ${point} stars`}
                    >
                      {point <= ratingDraft ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800">Review Title</label>
                <input type="text" value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Good quality product" />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800">Description</label>
                <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Fabric is nice and comfortable" />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800">Upload Images (optional)</label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    ref={reviewImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReviewImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => reviewImageInputRef.current?.click()}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
                    disabled={uploadProductImagesState.isLoading}
                    style={{ color: '#fff' }}
                  >
                    {uploadProductImagesState.isLoading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <p className="text-xs text-slate-500">You can upload up to 5 photos.</p>
                </div>

                {reviewImages.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reviewImages.map((image, index) => (
                      <div key={`${image.url}-${index}`} className="relative">
                        <img src={getImageUrl(image.url)} alt={`Review ${index + 1}`} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                        <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs text-white">×</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <button type="submit" disabled={createReviewState.isLoading || updateReviewState.isLoading} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60" style={{ color: '#fff' }}>
                {createReviewState.isLoading || updateReviewState.isLoading
                  ? (isEditMode ? 'Updating...' : 'Submitting...')
                  : (isEditMode ? 'Update Review' : 'Submit Review')}
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              {alreadyReviewedByCurrentUser || eligibility.alreadyReviewed
                ? 'You already reviewed this product.'
                : 'Write review is available only for delivered purchases.'}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export default ProductReviewsPage