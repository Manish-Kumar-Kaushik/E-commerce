const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '')

const getDefaultApiBaseUrl = () => {
  // Use same-origin API path by default so forwarded/tunneled URLs work on mobile.
  // Local dev requests are proxied to backend via Vite config.
  return '/api'
}

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || getDefaultApiBaseUrl(),
)

export const getApiErrorMessage = (error, fallbackMessage) =>
  error?.data?.message
  || (typeof error?.error === 'string' && error.error.toLowerCase().includes('failed to fetch')
    ? 'Backend server se connection nahi ho raha. Backend start karein (backend folder se npm run dev) aur phir retry karein.'
    : error?.error)
  || error?.message
  || fallbackMessage
