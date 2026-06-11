import { Component } from 'react'
import { clearStoredAppState } from '../utils/storage'

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Something went wrong while rendering the app.',
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App render failed:', error, errorInfo)
  }

  handleReset = () => {
    clearStoredAppState()
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('user')
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f5ef] px-4 py-16 text-stone-900">
          <div className="mx-auto max-w-2xl rounded-4xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-stone-500">SHOPZY</p>
            <h1 className="font-serif-display mt-3 text-4xl text-stone-950">UI render error</h1>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              The app hit a browser-side error, so I showed this fallback instead of a blank screen.
            </p>
            <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
              {this.state.message}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={this.handleReset} className="gold-button">
                Reset App Cache
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full border border-stone-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-stone-700"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
