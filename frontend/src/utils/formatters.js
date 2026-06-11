export const getImageUrl = (image) => {
  const rawUrl = typeof image === 'string'
    ? image
    : image?.url || image?.secure_url || image?.path || ''

  if (!rawUrl) {
    return ''
  }

  if (rawUrl.startsWith('data:')) {
    return rawUrl
  }

  const isAbsoluteUrl = /^(https?:)?\/\//i.test(rawUrl)

  try {
    const parsedUrl = isAbsoluteUrl ? new URL(rawUrl) : new URL(rawUrl, window.location.origin)
    const mediaMatch = parsedUrl.pathname.match(/\/(media\/products\/.*)$/)

    if (mediaMatch) {
      return `/${mediaMatch[1]}${parsedUrl.search}`
    }

    if (isAbsoluteUrl) {
      return rawUrl
    }

    return `${parsedUrl.pathname}${parsedUrl.search}`
  } catch {
    if (rawUrl.startsWith('media/')) {
      return `/${rawUrl}`
    }

    return rawUrl
  }
}

export const getDiscountPercentage = (price, salePrice) => {
  if (!salePrice || salePrice >= price) {
    return 0
  }

  return Math.round(((price - salePrice) / price) * 100)
}

export const formatDate = (value) => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

export const toTitleCase = (value = '') =>
  String(value || '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(' ')
