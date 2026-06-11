import { Link } from 'react-router-dom'

const ShopzyInfoFooterSection = () => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-[#f8f8f8]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left Column - Brand, Payment, Social */}
          <div className="space-y-8">
            {/* Brand Section */}
            <div>
              <Link to="/" className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5629f7] text-lg font-black text-white">
                  S
                </span>
                <span className="text-2xl font-extrabold uppercase tracking-[0.12em] text-[#1a1a1a]">
                  Shopzy
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-600">
                Shopzy is your one-stop destination for electronics, fashion, home, beauty, and more. We deliver quality products at great prices across India.
              </p>
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="mb-3 font-semibold text-[#1a1a1a]">Payment Method</h4>
              <div className="flex flex-wrap gap-3">
                {['Visa', 'Mastercard', 'UPI', 'Paytm'].map((item) => (
                  <span key={item} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Social Media Icons */}
            <div>
              <div className="flex gap-3">
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5629f7] text-white transition hover:bg-[#4518d9]">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
                </a>
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1da1f2] text-white transition hover:opacity-80">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1306c] text-white transition hover:opacity-80">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0077b5] text-white transition hover:opacity-80">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff0000] text-white transition hover:opacity-80">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .622 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - 2 columns with 5 rows */}
          <div className="grid gap-8 sm:grid-cols-2">
            {/* Column 1: Delivery Service & Contact */}
            <div className="space-y-8">
              {/* Delivery Service */}
              <div>
                <h4 className="mb-3 font-semibold text-[#1a1a1a]">Delivery Service</h4>
                <p className="mb-3 text-sm text-gray-600">
                  We partner with trusted logistics providers for local and international delivery
                </p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                  {['J&T Express', 'SiCepat', 'JNE', 'TIKI', 'Aramax Logistics', 'NinjaVan', 'Pos Indonesia', 'DHL Express', 'FedEx', 'UPS', 'GoExpress', 'BlueBird Parcel'].map((item) => (
                    <li key={item} className="flex items-center gap-1">
                      <span className="text-[#5629f7]">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="mb-3 font-semibold text-[#1a1a1a]">Contact Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-[#1a1a1a]">Email:</span> business@shopzy.com
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1a1a]">Phone:</span> +62 812 3456 7890
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1a1a]">Address:</span> Shopzy HQ – Jl. Merdeka No. 88, Jakarta 10350, Indonesia
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: Orders, Quick Links, Security */}
            <div className="space-y-8">
              {/* Orders & Returns */}
              <div>
                <h4 className="mb-3 font-semibold text-[#1a1a1a]">Orders & Returns</h4>
                <ul className="space-y-2">
                  {['Track Order', 'Shipping & Delivery', 'Return & Exchange', 'Promo & Voucher'].map((item) => (
                    <li key={item}>
                      <Link to="/contact" className="text-sm text-gray-600 transition hover:text-[#5629f7]">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="mb-3 font-semibold text-[#1a1a1a]">Quick Links</h4>
                <ul className="space-y-2">
                  {['About Us', 'Shop', 'Blog', 'Contact Us'].map((item) => (
                    <li key={item}>
                      <Link to={item === 'Contact Us' ? '/contact' : item === 'About Us' ? '/about' : '/products'} className="text-sm text-gray-600 transition hover:text-[#5629f7]">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security & Privacy */}
              <div>
                <h4 className="mb-3 font-semibold text-[#1a1a1a]">Security & Privacy</h4>
                <div className="flex flex-wrap gap-2">
                  {['100% Secure', 'SSL Secure', 'Secure Payment', 'Buyer Protection'].map((item) => (
                    <span key={item} className="rounded-md border border-[#a4cf9c] bg-[#e7f7e4] px-2 py-1 text-xs font-medium text-[#2c7a3c]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 md:flex-row">
          <p className="text-sm text-gray-500">
            © {currentYear} Shopzy. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <Link key={item} to="/policies/privacy" className="text-sm text-gray-500 transition hover:text-[#5629f7]">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default ShopzyInfoFooterSection
