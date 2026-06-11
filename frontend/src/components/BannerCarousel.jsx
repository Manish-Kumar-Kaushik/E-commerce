import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const MotionDiv = motion.div

const BannerCarousel = ({ compact = false, slides }) => {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [slides.length])

  const activeSlide = slides[current]

  return (
    <div className={`surface-panel relative overflow-hidden rounded-[2.5rem] p-3 ${compact ? 'h-[27rem]' : 'h-[70vh] min-h-[32rem]'}`}>
      <AnimatePresence mode="wait">
        <MotionDiv
          key={activeSlide.image}
          initial={{ opacity: 0.6, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.6, scale: 1.02 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-3"
        >
          <img src={activeSlide.image} alt={activeSlide.title} className="h-full w-full rounded-[2rem] object-cover" />
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
        </MotionDiv>
      </AnimatePresence>

      <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="surface-panel rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-stone-700">
            Premium Fashion Edit
          </div>
          <div className="surface-panel flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-stone-700">
            <span>{String(current + 1).padStart(2, '0')}</span>
            <span className="text-[#c8ab68]">/</span>
            <span>{String(slides.length).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="max-w-3xl">
          <p className="eyebrow text-white/72">Quiet luxury, sculpted silhouettes</p>
          <h2 className="font-serif-display mt-4 max-w-3xl text-5xl leading-[0.94] sm:text-7xl">{activeSlide.title}</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/82 sm:text-base">{activeSlide.subtitle}</p>
        </div>

        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="gold-button" to={activeSlide.cta}>
            Shop Now
          </Link>
          <div className="flex gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => setCurrent(index)}
                className={`h-2.5 rounded-full transition ${index === current ? 'w-12 bg-white' : 'w-2.5 bg-white/45'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BannerCarousel
