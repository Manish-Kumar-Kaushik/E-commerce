const STORAGE_KEY = 'shopzy-store'
const STORAGE_VERSION = 2

const isObject = (value) => typeof value === 'object' && value !== null

export const readStoredJson = (key, fallback = null) => {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      return fallback
    }

    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const readStoredUser = () => {
  const user = readStoredJson('user', null)
  return isObject(user) ? user : null
}

export const readStoredToken = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const token = window.localStorage.getItem('token')
  return typeof token === 'string' && token ? token : null
}

const sanitizeAuth = (auth) => ({
  token: typeof auth?.token === 'string' ? auth.token : null,
  user: isObject(auth?.user) ? auth.user : null,
})

const sanitizeCart = (cart) => ({
  checkoutDraft:
    isObject(cart?.checkoutDraft) && isObject(cart.checkoutDraft.data) && typeof cart.checkoutDraft.userKey === 'string'
      ? {
          userKey: cart.checkoutDraft.userKey,
          data: cart.checkoutDraft.data,
        }
      : null,
  couponCode: typeof cart?.couponCode === 'string' ? cart.couponCode : '',
  guestItems: Array.isArray(cart?.guestItems) ? cart.guestItems : [],
})

const sanitizeUi = (ui) => ({
  country: typeof ui?.country === 'string' ? ui.country : 'IN',
})

export const clearStoredAppState = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

export const loadState = () => {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return undefined
    }

    const parsed = JSON.parse(raw)

    if (!isObject(parsed) || parsed.__version !== STORAGE_VERSION) {
      window.localStorage.removeItem(STORAGE_KEY)
      return undefined
    }

    return {
      auth: sanitizeAuth(parsed.auth),
      cart: {
        ...sanitizeCart(parsed.cart),
        guestItems: [],
        checkoutDraft: null,
      },
      ui: sanitizeUi(parsed.ui),
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return undefined
  }
}

export const saveState = (state) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        __version: STORAGE_VERSION,
      }),
    )
  } catch {
    // Ignore persistence errors in private browsing contexts.
  }
}
