import { useState } from 'react'
import toast from 'react-hot-toast'
import Seo from '../components/Seo'
import { useSendContactMutation } from '../features/api/apiSlice'
import { contactDetails } from '../utils/storeContent'

const ContactPage = () => {
  const [sendContact, { isLoading }] = useSendContactMutation()
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await sendContact(form).unwrap()
      toast.success('Message sent successfully')
      setForm({
        name: '',
        email: '',
        message: '',
      })
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to send your message')
    }
  }

  return (
    <div className="container-shell py-12">
      <Seo title="Contact" description="Reach the Ribelle team for customer support, sizing, or order help." />
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2.25rem] border border-stone-200 bg-white p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Contact Us</p>
          <h1 className="font-serif-display mt-2 text-5xl text-stone-950">We would love to hear from you</h1>
          <div className="mt-8 space-y-5 text-sm text-stone-600">
            <p>Phone: {contactDetails.phone}</p>
            <p>Email: {contactDetails.email}</p>
            <p>Address: {contactDetails.address}</p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-[2.25rem] border border-stone-200 bg-white p-6 sm:p-8">
          <div className="grid gap-4">
            <input className="field-input" placeholder="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            <input className="field-input" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            <textarea className="field-input min-h-40 rounded-3xl" placeholder="Message" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required />
            <button type="submit" className="gold-button justify-center" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContactPage
