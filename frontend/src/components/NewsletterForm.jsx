import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSubscribeNewsletterMutation } from '../features/api/apiSlice'

const NewsletterForm = () => {
  const [email, setEmail] = useState('')
  const [subscribeNewsletter, { isLoading }] = useSubscribeNewsletterMutation()

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await subscribeNewsletter({ email }).unwrap()
      toast.success('You are on the list')
      setEmail('')
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to subscribe right now')
    }
  }

  return (
    <section className="section-shell">
      <div className="surface-panel-dark overflow-hidden rounded-[2.5rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="eyebrow text-[#dcc598]">Newsletter</p>
            <h2 className="font-serif-display mt-4 text-4xl leading-none text-white sm:text-5xl">
              Stay close to the next drop
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
              Be the first to know about new collections, exclusive previews, and private offer windows.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {['New arrivals first', 'Private sale alerts', 'Editorial styling notes'].map((item) => (
                <span key={item} className="info-chip border-white/10 bg-white/10 text-white/80">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-5 sm:p-6">
            <p className="eyebrow">Subscribe</p>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
              />
              <button type="submit" className="gold-button w-full justify-center disabled:opacity-60" disabled={isLoading}>
                {isLoading ? 'Subscribing...' : 'Join the List'}
              </button>
            </form>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-stone-500">
              No spam. Just collection drops and exclusive offers.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NewsletterForm
