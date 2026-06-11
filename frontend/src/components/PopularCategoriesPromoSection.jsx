import { Link } from 'react-router-dom'

const categories = [
  {
    title: 'Women Fashion',
    description: 'Trendy outfits, shirts, dresses, and daily-wear picks.',
    offer: 'Up To 60% OFF',
    image: 'https://picsum.photos/seed/popular-women-fashion/420/360',
    to: '/products?category=fashion',
  },
  {
    title: 'Mobiles',
    description: 'Explore latest phones, accessories, and smart gadgets.',
    offer: 'Up To 40% OFF',
    image: 'https://picsum.photos/seed/popular-mobiles/420/360',
    to: '/products?category=mobile',
  },
  {
    title: 'Furniture',
    description: 'Style your space with cozy furniture and décor accents.',
    offer: 'Up To 35% OFF',
    image: 'https://picsum.photos/seed/popular-furniture/420/360',
    to: '/products?category=furniture',
  },
  {
    title: 'Men Grooming',
    description: 'Skincare, haircare, and grooming kits for everyday use.',
    offer: 'Up To 50% OFF',
    image: 'https://picsum.photos/seed/popular-grooming/420/360',
    to: '/products?category=mens-grooming',
  },
  {
    title: 'Baby & Kids',
    description: 'Baby gear, toys, and must-haves for every stage.',
    offer: 'Up To 30% OFF',
    image: 'https://picsum.photos/seed/popular-baby-kids/420/360',
    to: '/products?category=baby-kids',
  },
  {
    title: 'Beauty',
    description: 'Top-rated skincare, wellness products, and beauty picks.',
    offer: 'Up To 50% OFF',
    image: 'https://picsum.photos/seed/popular-beauty/420/360',
    to: '/products?category=beauty',
  },
  {
    title: 'Gaming',
    description: 'Latest consoles, headsets, and gamer-ready accessories.',
    offer: 'Up To 40% OFF',
    image: 'https://picsum.photos/seed/popular-gaming/420/360',
    to: '/products?category=gaming',
  },
  {
    title: 'Travel',
    description: 'Durable luggage, travel bags, and journey accessories.',
    offer: 'Up To 40% OFF',
    image: 'https://picsum.photos/seed/popular-travel/420/360',
    to: '/products?category=travel',
  },
]

const CategoryCard = ({ item }) => (
  <Link
    to={item.to}
    className="group rounded-2xl bg-[#f5f5f7] p-3 transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.1)]"
  >
    <div className="overflow-hidden rounded-xl bg-[#ececf1]">
      <img
        src={item.image}
        alt={item.title}
        className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
        loading="lazy"
      />
    </div>

    <div className="px-1 pb-1 pt-3">
      <h3 className="text-[1.02rem] font-bold text-[#2f3137]">{item.title}</h3>
      <p className="mt-1 min-h-12 text-sm leading-5 text-[#666873]">{item.description}</p>
      <div className="mt-3 rounded-lg bg-[#ece9ff] px-3 py-2 text-center text-[1.1rem] font-bold text-[#4c2cff]">
        {item.offer}
      </div>
    </div>
  </Link>
)

const PopularCategoriesPromoSection = () => {
  return (
    <section className="section-shell pt-3">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="rounded-3xl bg-[#f3f3f5] p-5 sm:p-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#2f3137] sm:text-[2.05rem]">
            Popular Categories
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((item) => (
              <CategoryCard key={item.title} item={item} />
            ))}
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-3xl bg-[#d9e6cd] p-6 sm:p-8">
          <div className="absolute -left-6 top-8 h-12 w-12 rounded-full bg-[#ffd54d]/70 blur-[1px]" />
          <div className="absolute right-4 top-5 h-8 w-8 rounded-full bg-[#ffca28]/70" />
          <div className="absolute bottom-32 right-7 h-10 w-10 rounded-full bg-[#ffca28]/65" />

          <div className="relative z-10 text-center">
            <h3 className="text-5xl font-extrabold leading-none tracking-tight text-[#2f3137]">Payday</h3>
            <h4 className="mt-1 text-5xl font-extrabold leading-none tracking-tight text-[#4c2cff]">Rewards</h4>
            <p className="mt-5 text-lg text-[#2f3137]">
              <span className="font-extrabold text-[#4c2cff]">Up to 20%</span> cashback on selected items.
            </p>

            <Link
              to="/collections/new-arrivals?tag=payday-rewards"
              className="mt-6 inline-flex min-w-44 items-center justify-center rounded-lg bg-[#6236FF] px-6 py-3 text-base font-bold text-white"
            >
              Claim Rewards
            </Link>

            <img
              src="https://shopzy.madrasthemes.com/wp-content/uploads/2026/01/Photo-16-600x517.webp"
              alt="Payday reward products"
              className="mx-auto mt-8 h-96 w-auto rounded-2xl object-cover"
              loading="lazy"
            />

            <div className="mx-auto mt-5 inline-flex rounded-full border border-[#2f3137]/40 px-5 py-2 text-sm font-semibold text-[#2f3137]">
              Promo: 20 - 30 JULY 2035
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default PopularCategoriesPromoSection
