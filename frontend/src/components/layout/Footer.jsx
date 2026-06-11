import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCountry } from '../../features/ui/uiSlice'
import { countryCurrencyMap } from '../../utils/currency'
import { contactDetails, footerLinks } from '../../utils/storeContent'

const Footer = () => {
  const dispatch = useDispatch()
  const country = useSelector((state) => state.ui?.country || 'IN')

  return (
    <footer className="section-shell pt-6">
      <div className="surface-panel-dark container-shell rounded-4xl px-5 py-10 text-white sm:rounded-[2.4rem] sm:px-8 sm:py-12 lg:grid lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-10">
        <div>
          <p className="eyebrow text-[#d8c296]">Shopzy World</p>
          <Link to="/" className="font-serif-display mt-3 inline-block text-4xl uppercase tracking-[0.24em] text-white">
            Shopzy
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/72">
            Your one-stop destination for electronics, fashion, home, beauty, and more.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Electronics', 'Fashion', 'Free Shipping'].map((label) => (
              <span key={label} className="info-chip border-white/10 bg-white/10 text-white/75">
                {label}
              </span>
            ))}
          </div>
          <div className="mt-5 text-sm text-white/70">
            <p>{contactDetails.phone}</p>
            <p>{contactDetails.email}</p>
          </div>
        </div>

        <div className="mt-10 lg:mt-0">
          <p className="eyebrow text-[#d8c296]">Information</p>
          <div className="mt-4 grid gap-3">
            {footerLinks.information.map((item) => (
              <Link key={item.label} to={item.to} className="text-sm text-white/72 transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 lg:mt-0">
          <p className="eyebrow text-[#d8c296]">Social</p>
          <div className="mt-4 grid gap-3">
            {footerLinks.social.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="text-sm text-white/72 transition hover:text-white">
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 lg:mt-0">
          <p className="eyebrow text-[#d8c296]">Payments & Country</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Visa', 'Mastercard', 'Stripe', 'COD'].map((label) => (
              <span key={label} className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs text-white/72">
                {label}
              </span>
            ))}
          </div>
          <label className="mt-6 block text-sm text-white/70" htmlFor="country-selector">
            Country / Currency
          </label>
          <select
            id="country-selector"
            value={country}
            onChange={(event) => dispatch(setCountry(event.target.value))}
            className="mt-3 w-full rounded-[1.3rem] border border-white/12 bg-white/8 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8c296]"
          >
            {Object.entries(countryCurrencyMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label} ({value.code})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="py-6 text-center text-xs uppercase tracking-[0.3em] text-stone-500">
        Copyright {new Date().getFullYear()} Shopzy. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
