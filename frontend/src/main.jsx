import { ClerkProvider } from '@clerk/clerk-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import AppErrorBoundary from './components/AppErrorBoundary'
import ClerkSessionBootstrap from './components/ClerkSessionBootstrap'
import './index.css'
import { store } from './store'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {CLERK_PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        signInForceRedirectUrl="/"
        signInFallbackRedirectUrl="/"
        signUpForceRedirectUrl="/account/profile-setup"
        signUpFallbackRedirectUrl="/account/profile-setup"
      >
        <Provider store={store}>
          <AppErrorBoundary>
            <BrowserRouter>
              <ClerkSessionBootstrap />
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  className: 'text-sm',
                  duration: 4500,
                  removeDelay: 800,
                  style: {
                    borderRadius: '20px',
                    padding: '14px 16px',
                  },
                }}
              />
            </BrowserRouter>
          </AppErrorBoundary>
        </Provider>
      </ClerkProvider>
    ) : (
      <div className="min-h-screen bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-6 text-red-700 shadow-sm">
          <h1 className="text-xl font-semibold">Auth setup required</h1>
          <p className="mt-2 text-sm">
            Set <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> in <strong>frontend/.env</strong>, then restart frontend server.
          </p>
        </div>
      </div>
    )}
  </StrictMode>,
)
