import { Link } from 'react-router-dom'

const BagIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9h12l-1 11H7L6 9Z" />
    <path d="M9 9a3 3 0 1 1 6 0" />
  </svg>
)

const BrandMarks = () => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-2 text-[#2f3137]">
      <span className="text-xl font-extrabold leading-none tracking-wide">SH</span>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#4c2cff] text-white">
        <BagIcon />
      </span>
      <span className="text-xl font-extrabold leading-none tracking-wide">PZY</span>
    </div>

    <span className="text-lg text-[#8b8d96]">|</span>

    <div className="flex items-center gap-2 text-[#2f3137]">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2f3137] text-white">
        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
          <path d="M4 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM7 10a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" />
        </svg>
      </span>
      <span className="text-lg font-semibold leading-none">logoipsum</span>
    </div>
  </div>
)

// Super Brand Week Banner Component
const SuperBrandWeekBanner = () => {
  return (
    <section className="section-shell pt-2">
      <div className="relative overflow-hidden rounded-3xl bg-[#e9dde2]">
        <div className="grid min-h-80 items-center lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
            <BrandMarks />

            <h2 className="mt-7 text-2xl font-extrabold leading-[1.06] tracking-tight text-[#2f3137] sm:text-3xl lg:text-4xl">
              Super Brand Week
            </h2>

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="max-w-2xl text-base font-medium text-[#4c4d54] sm:text-lg">
                Exclusive drops from your favorite brands – now live!
              </p>
              
              <div className="flex-none">
                <Link
                  to="/products"
                  className="inline-flex min-w-32 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-lg font-bold transition hover:bg-blue-700"
                >
                  <span style={{ color: 'white' }}>Shop Now</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="relative h-40 sm:h-48 lg:h-56">
            <img
              src="https://pngimg.com/uploads/sofa/sofa_PNG6961.png"
              alt="Pink sofa"
              className="absolute -right-8 bottom-0 h-[120%] w-auto max-w-none object-contain sm:-right-12 lg:-right-20"
              style={{ filter: 'hue-rotate(280deg) saturate(150%) brightness(1.1)' }}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default SuperBrandWeekBanner
