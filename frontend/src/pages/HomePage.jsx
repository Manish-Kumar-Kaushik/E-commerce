import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import DealsSection from '../components/DealsSection'
import ForYouSection from '../components/ForYouSection'
import PopularCategoriesPromoSection from '../components/PopularCategoriesPromoSection'
import Seo from '../components/Seo'
import ShopzyInfoFooterSection from '../components/ShopzyInfoFooterSection'
import { useGetCollectionsQuery, useGetProductsQuery } from '../features/api/apiSlice'
import { getImageUrl } from '../utils/formatters'
import { shopzyCategories, shopzyHeroBanners } from '../utils/storeContent'

const MotionDiv = motion.div

const fallbackHeroBanner = {
  _id: 'hero-fallback',
  name: shopzyHeroBanners[0].title,
  slug: 'collections',
  description: shopzyHeroBanners[0].description,
  bannerImage: shopzyHeroBanners[0].image,
}

const getBannerImage = (banner, fallbackImage = shopzyHeroBanners[0].image) =>
  getImageUrl(banner?.bannerImage || banner?.image) || fallbackImage

const HeroBanner = ({ banner }) => {
  const heroImage = getBannerImage(banner, fallbackHeroBanner.bannerImage)

  return (
    <section className="section-shell pt-5 sm:pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 min-h-72 sm:min-h-80 lg:min-h-107.5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <img
          src={heroImage}
          alt={banner.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/35 to-transparent" />
        <div className="relative z-10 flex h-full min-h-72 flex-col justify-end p-4 sm:min-h-80 sm:p-8 lg:min-h-107.5 lg:p-12">
          <span className="inline-flex w-fit rounded-full bg-white/15 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-white/90 backdrop-blur-sm">
            Featured banner
          </span>
          <h1 className="mt-4 max-w-3xl text-2xl font-extrabold leading-tight text-white sm:mt-5 sm:text-5xl lg:text-6xl">
            {banner.name}
          </h1>
          <p className="mt-3 max-w-2xl text-xs leading-6 text-white/85 sm:mt-4 sm:text-base lg:text-lg">
            {banner.description || 'Fresh storefront banner managed from the admin dashboard.'}
          </p>
          <Link
            to={banner.slug && banner.slug !== 'collections' ? `/collections/${banner.slug}` : '/collections'}
            className="mt-5 inline-flex w-fit items-center rounded-xl bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-900 transition hover:bg-slate-100 sm:mt-6 sm:px-6 sm:py-3 sm:text-sm sm:tracking-[0.18em]"
          >
            Explore collection
          </Link>
        </div>
      </div>
    </section>
  )
}

const CategoryTile = ({ category, index }) => (
  <MotionDiv
    initial={{ opacity: 0, y: 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.25 }}
    transition={{ duration: 0.35, delay: index * 0.04 }}
    className="rounded-[20px] bg-white p-5 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
  >
    <Link to={`/products?category=${encodeURIComponent(category.category)}`} className="flex flex-col items-center">
      <div className="category-icon w-full" style={{ backgroundColor: 'rgba(118, 118, 118, 0.08)' }}>
        <span className="text-2xl">{category.icon}</span>
      </div>
      <span className="category-icon__label mt-6 font-inter text-[18px] font-medium text-[#333333]">{category.label}</span>
    </Link>
  </MotionDiv>
)

const CollectionTile = ({ collection, index }) => (
  <MotionDiv
    initial={{ opacity: 0, y: 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.25 }}
    transition={{ duration: 0.35, delay: index * 0.05 }}
  >
    <Link
      to={`/collections/${collection.slug}`}
      className="group block overflow-hidden rounded-4xl border border-[#ececf3] bg-white p-3 shadow-[0_18px_42px_rgba(15,23,42,0.05)]"
    >
      <div className="relative overflow-hidden rounded-[1.55rem]">
        <img
          src={getBannerImage(collection, fallbackHeroBanner.bannerImage)}
          alt={collection.name}
          className="h-68 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/72">Collection</p>
          <h3 className="mt-2 font-serif-display text-[2rem] leading-none">{collection.name}</h3>
        </div>
      </div>
    </Link>
  </MotionDiv>
)

const HomePage = () => {
  const { data: collectionsData } = useGetCollectionsQuery()

  const liveCollections = useMemo(() => collectionsData?.collections || [], [collectionsData])

  const heroBanner = useMemo(() => {
    const bannerCandidates = [...liveCollections]
      .filter((collection) => collection.bannerImage)
      .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0))

    return bannerCandidates[0] || fallbackHeroBanner
  }, [liveCollections])

  const spotlightCollections = useMemo(() => liveCollections.slice(0, 4), [liveCollections])

  return (
    <>
      <Seo
        title="SHOPZY - Your One-Stop Multi-Vendor E-Commerce"
        description="Shop the best deals on Electronics, Fashion, Groceries, Home, Beauty & more. Free shipping on orders above Rs. 500."
      />

      <HeroBanner banner={heroBanner} />

      <section className="section-shell pt-0">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-slate-500">Trending now</p>
            <h2 className="mt-2 text-2xl font-extrabold uppercase tracking-[0.12em] text-slate-800 sm:text-[3.3rem] sm:tracking-[0.22em]">
              Categories
            </h2>
          </div>
        </div>

        <div className="mb-6 px-0 py-6.25">
          <div className="category-grid gap-2 sm:gap-3">
            {shopzyCategories.map((category, index) => (
              <CategoryTile key={category.label} category={category} index={index} />
            ))}
          </div>
        </div>
      </section>

      {spotlightCollections.length ? (
        <section className="section-shell pt-2">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-slate-500">Live banners</p>
              <h2 className="mt-2 text-2xl font-extrabold uppercase tracking-[0.12em] text-slate-800 sm:text-[3rem] sm:tracking-[0.18em]">
                Featured Collections
              </h2>
            </div>
            <Link to="/collections" className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6236FF]">
              View all
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {spotlightCollections.map((collection, index) => (
              <CollectionTile key={collection._id} collection={collection} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      <PopularCategoriesPromoSection />

      <DealsSection />

      <ForYouSection />

      <ShopzyInfoFooterSection />
    </>
  )
}

export default HomePage
