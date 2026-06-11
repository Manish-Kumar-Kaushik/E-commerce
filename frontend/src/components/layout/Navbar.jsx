import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useClerk } from '@clerk/clerk-react'
import { useGetCollectionsQuery, useGetProfileQuery } from '../../features/api/apiSlice'
import { logout } from '../../features/auth/authSlice'
import { useCartData } from '../../hooks/useCart'

const iconClassName = 'h-4 w-4 sm:h-5 sm:w-5 stroke-[1.7]'

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <circle cx="12" cy="8" r="3.25" />
    <path d="M5 19c1.8-3 4.3-4.5 7-4.5s5.2 1.5 7 4.5" />
  </svg>
)

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="M4 5h2l2.2 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L21 8H8" />
    <circle cx="10" cy="19" r="1.2" />
    <circle cx="18" cy="19" r="1.2" />
  </svg>
)

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="#6236FF" strokeWidth="1.5">
    <path d="M4.5 6.5h6v5h-6zM13.5 6.5h6v5h-6zM4.5 13.5h6v5h-6zM13.5 13.5h6v5h-6z" />
  </svg>
)

const MenuIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    {open ? <path d="M6 6 18 18M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
  </svg>
)

const ChevronIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const ChevronDownIcon = ({ open = false }) => (
  <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="M15 16.5 20 12l-5-4.5" />
    <path d="M20 12H9" />
    <path d="M10 5H6.75A1.75 1.75 0 0 0 5 6.75v10.5A1.75 1.75 0 0 0 6.75 19H10" />
  </svg>
)
const PackageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="m12 3 8 4.5v9L12 21 4 16.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5" />
    <path d="M12 12v9" />
  </svg>
)

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
)

const PhoneIcon = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h6" /></svg>
const DressIcon = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><path d="M20 4v4l-8 8-4-4-8 8v-4h24V4z" /></svg>
const HomeIcon = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const BeautyIcon = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><circle cx="12" cy="8" r="5" /><path d="M12 13v3" /><path d="M8 18h8" /></svg>
const BabyIcon = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><circle cx="12" cy="6" r="4" /><path d="M8 21h8" /><path d="M12 10v3" /></svg>
const SportsIcon = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><circle cx="12" cy="12" r="4" /><path d="M4 14c2.5-1 5.5-1 8-1s5.5 1 8 1" /><path d="M12 16v3" /></svg>
const CarIcon = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><path d="M5 17h14v-7H5z" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M7 10V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" /></svg>
const CartIcon2 = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
const PawIcon = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><circle cx="11" cy="4" r="2" /><circle cx="5" cy="8" r="2" /><circle cx="19" cy="8" r="2" /><circle cx="15" cy="17" r="2" /><circle cx="9" cy="17" r="2" /><path d="M11 6L13 4 15 6" /></svg>
const TabletIcon = () => <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="#6236FF" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M12 18h0" /></svg>

const CategoryLink = ({ to, icon, children }) => (
  <NavLink to={to} className="mega-link-item flex items-center justify-between py-3 px-4 hover:bg-[#F5F5FF] transition-colors">
    <span className="flex items-center gap-3">
      {icon}
      <span className="text-sm text-[#333333]">{children}</span>
    </span>
    <ChevronIcon />
  </NavLink>
)

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut } = useClerk()
  const { user: localUser } = useSelector((state) => state.auth || { user: null })
  const profileMenuRef = useRef(null)
  const menuTimeoutRef = useRef(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const hasBackendToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('token'))
  useGetCollectionsQuery()
  const { totalItems } = useCartData()
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !hasBackendToken })
  const profile = profileData?.user
  
  const isLoggedIn = !!localUser || !!profile
  const accountName = profile?.name || localUser?.name || 'Account'
  const avatarLetter = accountName.slice(0, 1).toUpperCase()
  const userEmail = profile?.email || localUser?.email || ''
  const userImage = profile?.profileImage || ''
  const currentSort = new URLSearchParams(location.search).get('sortBy') || ''
  const loggedInMenuItems = [
    { to: '/account/dashboard', label: 'My Profile', icon: <UserIcon /> },
    { to: '/account/wishlist', label: 'Wishlist', icon: <HeartIcon /> },
    { to: '/contact', label: '24x7 Customer Support', icon: <PhoneIcon /> },
    { to: '/account/orders', label: 'Orders', icon: <PackageIcon /> },
  ]
  const guestMenuItems = [
    { to: '/vendor/onboarding', label: 'Become a Seller', icon: <DressIcon /> },
    { to: '/account/login?redirect=%2F', label: 'Login', icon: <UserIcon /> },
    { to: '/contact', label: '24x7 Support', icon: <PhoneIcon /> },
  ]

  const sidebarCategories = [
      {
        name: 'New In',
        items: [
          { to: '/products?category=dresses', label: 'Dresses' },
          { to: '/products?category=co-ord-sets', label: 'Co-ord Sets' },
          { to: '/products?category=gowns', label: 'Gowns' },
          { to: '/products?category=fresh-drops', label: 'Fresh Drops' },
        ],
      },
      {
        name: 'Dresses',
        subcategories: [
          { to: '/products?category=mini-dresses', label: 'Mini Dresses' },
          { to: '/products?category=maxi-dresses', label: 'Maxi Dresses' },
          { to: '/products?category=occasion-dresses', label: 'Occasion Dresses' },
          { to: '/products?category=trending-dresses', label: 'Trending Dresses' },
        ],
      },
      {
        name: 'Co-Ords',
        subcategories: [
          { to: '/products?category=matching-sets', label: 'Matching Sets' },
          { to: '/products?category=boss-mode', label: 'Boss Mode' },
          { to: '/products?category=soft-glam-sets', label: 'Soft Glam Sets' },
          { to: '/products?category=travel-co-ords', label: 'Travel Co-Ords' },
        ],
      },
      {
        name: 'Occasion',
        subcategories: [
          { to: '/products?category=wedding-guest', label: 'Wedding Guest' },
          { to: '/products?category=evening-gowns', label: 'Evening Gowns' },
          { to: '/products?category=cocktail-looks', label: 'Cocktail Looks' },
          { to: '/products?category=celebrity-closet', label: 'Celebrity Closet' },
        ],
      },
      {
        name: 'Luxe',
        subcategories: [
          { to: '/products?category=shopzy-luxe', label: 'Shopzy Luxe' },
          { to: '/products?category=mon-cheri', label: 'Mon Cheri' },
          { to: '/products?category=amore', label: 'Amore' },
          { to: '/products?category=premium-picks', label: 'Premium Picks' },
        ],
      },
      {
        name: 'Studio',
        subcategories: [
          { to: '/products?price_min=0&price_max=5000', label: 'Under Rs. 5000' },
          { to: '/products?price_min=5000&price_max=8000', label: 'Rs. 5000 - 8000' },
          { to: '/products?price_min=8000', label: 'Above Rs. 8000' },
          { to: '/products', label: 'All Collections' },
        ],
      },
      {
        name: 'Collection',
        items: [
          { to: '/products', label: 'All Products' },
          { to: '/', label: 'Home' },
        ],
      },
    ]

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      clearTimeout(menuTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const isSearchRoute = location.pathname === '/products' || location.pathname.startsWith('/collections')

    if (!isSearchRoute) {
      return
    }

    const params = new URLSearchParams(location.search)
    setSearchValue(params.get('search') || '')
  }, [location.pathname, location.search])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setExpandedCategory(null)
    setSearchOpen(false)
  }, [location.pathname, location.search])

  const handleSearch = (event) => {
    event.preventDefault()
    setSearchOpen(false)
    const nextQuery = searchValue.trim()
    navigate(nextQuery ? `/products?search=${encodeURIComponent(nextQuery)}` : '/products')
  }

  const isDrawerLinkActive = (to) => {
    const targetUrl = new URL(to, 'https://shopzy.local')
    if (targetUrl.pathname !== location.pathname) {
      return false
    }

    const targetParams = targetUrl.searchParams
    const currentParams = new URLSearchParams(location.search)

    if (!targetParams.toString()) {
      return !currentParams.toString()
    }

    return targetParams.toString() === currentParams.toString()
  }

  const handleLogout = async () => {
    await signOut()
    dispatch(logout())
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
    
    // Force a full page reload to clear all state
    window.location.href = '/account/login?redirect=%2F'
  }

  return (
    <>
      <header
        className={`sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 transition duration-300 ${
          isScrolled ? 'shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-xl' : 'backdrop-blur-lg'
        }`}
      >
        <div className="container-shell">
          <div className="flex flex-nowrap items-center justify-between gap-1.5 py-2 max-[360px]:gap-1 max-[360px]:py-1.5 sm:gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-1.5 max-[360px]:gap-1 sm:gap-2.5">
              <span className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-[#6236FF] text-sm font-black text-white shadow-[0_4px_12px_rgba(98,54,255,0.3)] max-[360px]:h-8 max-[360px]:w-8 max-[360px]:text-[0.72rem] sm:h-10 sm:w-10 sm:text-lg">
                S
              </span>
              <span className="text-base font-extrabold tracking-[0.06em] text-[#6236FF] max-[360px]:text-[0.82rem] max-[360px]:tracking-[0.04em] sm:text-xl sm:tracking-[0.12em]">SHOPZY</span>
            </Link>

            <form onSubmit={handleSearch} className="market-search hidden lg:flex lg:w-full lg:max-w-2xl">
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search products, brands, categories..."
                aria-label="Search products"
                className="w-full"
              />
              <button type="submit" className="rounded-lg bg-[#6236FF] px-4 text-white transition hover:bg-[#5235E8] h-full" aria-label="Search">
                <SearchIcon />
              </button>
            </form>

            <div className="hidden items-center gap-4 lg:flex">
              <div
                ref={profileMenuRef}
                className="relative"
                onMouseEnter={() => {
                  clearTimeout(menuTimeoutRef.current)
                  setIsProfileMenuOpen(true)
                }}
                onMouseLeave={() => {
                  menuTimeoutRef.current = setTimeout(() => setIsProfileMenuOpen(false), 200)
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((value) => !value)}
                  className={`flex items-center gap-2 border text-sm font-semibold transition hover:border-[#cfc5ff] hover:text-[#6236FF] ${isLoggedIn ? 'h-11 rounded-full border-slate-200 bg-slate-50 pl-1 pr-3 text-[#333333]' : 'h-11 rounded-full border-slate-200 bg-white px-4 text-[#333333]'}`}
                  aria-label="Open account menu"
                >
                  {isLoggedIn ? (
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-[#333333]">
                      {userImage ? (
                        <img src={userImage} alt={accountName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-[#ede8ff] text-[#6236FF]">
                          {avatarLetter}
                        </span>
                      )}
                    </span>
                  ) : (
                    <UserIcon />
                  )}
                  <span>{isLoggedIn ? 'Account' : 'Login'}</span>
                  <ChevronDownIcon open={isProfileMenuOpen} />
                </button>

                <div
                  className={`absolute right-0 top-full w-72 rounded-[1.6rem] border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.12)] transition ${
                    isProfileMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
                  }`}
                >
                  <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{isLoggedIn ? accountName : 'Welcome to Shopzy'}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{isLoggedIn ? (userEmail || 'Signed in') : 'Choose an option'}</p>
                  </div>

                  <div className="mt-2 space-y-1">
                    {(isLoggedIn ? loggedInMenuItems : guestMenuItems).map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#6236FF]"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                    {isLoggedIn ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-[1.1rem] px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#6236FF]"
                      >
                        <LogoutIcon />
                        <span>Logout</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <Link to="/cart" className="relative flex items-center gap-2 text-sm font-semibold text-[#333333] transition hover:text-[#6236FF]">
                <CartIcon />
                <span>Cart</span>
                {totalItems ? (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6236FF] px-1 text-[10px] font-bold text-white">
                    {totalItems}
                  </span>
                ) : null}
              </Link>
            </div>

            <div className="flex shrink-0 items-center gap-1 max-[360px]:gap-0.5 sm:gap-2 lg:hidden">
              <button type="button" className="icon-button h-10! w-10! max-[360px]:h-9! max-[360px]:w-9! sm:h-11! sm:w-11!" onClick={() => setIsMobileMenuOpen((value) => !value)} aria-label="Toggle menu" aria-expanded={isMobileMenuOpen} aria-controls="mobile-drawer">
                <MenuIcon open={isMobileMenuOpen} />
              </button>
              <button type="button" onClick={() => setSearchOpen((value) => !value)} className="icon-button h-10! w-10! max-[360px]:h-9! max-[360px]:w-9! sm:h-11! sm:w-11!" aria-label="Open search">
                <SearchIcon />
              </button>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 py-2">
            <div className="group relative">
              <button type="button" onClick={() => setCatOpen(!catOpen)} onMouseEnter={() => setCatOpen(true)} className="text-xs font-medium text-[#666666] hover:text-[#6236FF] transition flex items-center gap-1 cursor-pointer">
                <GridIcon />
                Browse Categories
              </button>
              <div className={`mega-menu left-0 w-72 rounded-b-lg bg-white shadow-xl ${catOpen ? 'pointer-events-auto opacity-100' : ''}`}>
                <CategoryLink to="/products?category=electronics" icon={<PhoneIcon />}>Electronics</CategoryLink>
                <CategoryLink to="/products?category=fashion" icon={<DressIcon />}>Fashion</CategoryLink>
                <CategoryLink to="/products?category=home-living" icon={<HomeIcon />}>Home & Living</CategoryLink>
                <CategoryLink to="/products?category=beauty-health" icon={<BeautyIcon />}>Beauty & Health</CategoryLink>
                <CategoryLink to="/products?category=baby-kids" icon={<BabyIcon />}>Baby & Kids</CategoryLink>
                <CategoryLink to="/products?category=sports-outdoors" icon={<SportsIcon />}>Sports & Outdoors</CategoryLink>
                <CategoryLink to="/products?category=automotive" icon={<CarIcon />}>Automotive</CategoryLink>
                <CategoryLink to="/products?category=groceries" icon={<CartIcon2 />}>Groceries</CategoryLink>
                <CategoryLink to="/products?category=pet-supplies" icon={<PawIcon />}>Pet Supplies</CategoryLink>
                <CategoryLink to="/products?category=mobile-gadgets" icon={<TabletIcon />}>Mobile & Gadgets</CategoryLink>
              </div>
            </div>
            <Link to="/" className="text-xs font-medium text-[#666666] hover:text-[#6236FF] transition">
              Home
            </Link>
            <Link to="/products" className="text-xs font-medium text-[#666666] hover:text-[#6236FF] transition">
              Shop
            </Link>
            <Link to="/about" className="text-xs font-medium text-[#666666] hover:text-[#6236FF] transition">
              About
            </Link>
            <Link to="/contact" className="text-xs font-medium text-[#666666] hover:text-[#6236FF] transition">
              Contact
            </Link>
          </nav>
        </div>

        {searchOpen ? (
            <div className="container-shell pb-3 max-[360px]:pb-2 lg:hidden">
              <div className="surface-panel rounded-[1.1rem] px-3 py-3 max-[360px]:rounded-2xl max-[360px]:px-2.5 max-[360px]:py-2.5 sm:rounded-[1.6rem] sm:px-4 sm:py-4">
                <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search styles, collections, or keywords"
                  className="field-input flex-1 text-[0.84rem] sm:text-base"
                />
                <button type="submit" className="gold-button w-full justify-center sm:w-auto">
                  Search
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </header>

      <div
        className={`fixed inset-0 z-40 bg-slate-900/55 backdrop-blur-[2px] transition-[opacity,backdrop-filter] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <aside
        id="mobile-drawer"
        className={`fixed right-0 top-0 z-50 h-full w-[min(88vw,24rem)] max-[360px]:w-[92vw] max-[320px]:w-[94vw] max-w-95 overflow-hidden border-l border-slate-200/80 bg-white/98 shadow-[0_24px_70px_rgba(15,23,42,0.18)] transition-transform duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3.5 max-[360px]:px-3 max-[360px]:py-3 sm:px-5 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#6236FF] font-semibold text-white max-[360px]:h-9 max-[360px]:w-9">
                  {userImage ? (
                    <img src={userImage} alt={accountName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{isLoggedIn ? avatarLetter : 'G'}</span>
                  )}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D9CCFF] hover:bg-[#F7F2FF] hover:text-[#6236FF] active:translate-y-0 max-[360px]:h-9 max-[360px]:w-9"
                aria-label="Close menu"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-3 sm:mt-4">
              {isLoggedIn ? (
                <div>
                    <p className="text-[0.95rem] font-semibold text-gray-900 sm:text-base">{accountName}</p>
                    <p className="text-xs text-gray-500 sm:text-sm">{userEmail}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between max-[360px]:flex-col max-[360px]:items-start max-[360px]:gap-2.5">
                  <div>
                    <p className="text-[0.95rem] font-medium text-gray-900 sm:text-base">Welcome</p>
                    <p className="text-xs text-gray-500 sm:text-sm">Sign in to manage your orders</p>
                  </div>
                  <Link
                    to="/account/login?redirect=%2F"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-lg bg-[#6236FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5235E8] max-[360px]:w-full max-[360px]:text-center"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4 max-[360px]:space-y-3.5 max-[360px]:px-3 max-[360px]:py-3.5 sm:space-y-5 sm:px-5">
            <div className="rounded-[1.35rem] border border-slate-200/80 bg-white p-1.5 max-[360px]:rounded-[1.1rem] max-[360px]:p-1.25 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === 'quick' ? null : 'quick')}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-200 hover:bg-slate-50 ${expandedCategory === 'quick' ? 'bg-[#F7F2FF]' : ''}`}
              >
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-900">Quick Links</span>
                <svg 
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${expandedCategory === 'quick' ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedCategory === 'quick' && (
                <div className="mt-1 space-y-1 rounded-[1.05rem] border border-slate-200/70 bg-slate-50 p-2">
                  {isLoggedIn ? (
                    <>
                      <Link
                        to="/account/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-[0.95rem] border border-transparent px-3 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive('/account/dashboard') ? 'border-[#D9CCFF] bg-[#F4F0FF] text-[#6236FF] shadow-[0_8px_18px_rgba(98,54,255,0.08)]' : 'text-gray-700 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                      >
                        <UserIcon />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/account/wishlist"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-[0.95rem] border border-transparent px-3 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive('/account/wishlist') ? 'border-[#D9CCFF] bg-[#F4F0FF] text-[#6236FF] shadow-[0_8px_18px_rgba(98,54,255,0.08)]' : 'text-gray-700 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                      >
                        <HeartIcon />
                        <span>Wishlist</span>
                      </Link>
                      <Link
                        to="/contact"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-[0.95rem] border border-transparent px-3 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive('/contact') ? 'border-[#D9CCFF] bg-[#F4F0FF] text-[#6236FF] shadow-[0_8px_18px_rgba(98,54,255,0.08)]' : 'text-gray-700 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                      >
                        <PhoneIcon />
                        <span>24x7 Customer Support</span>
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-[0.95rem] border border-transparent px-3 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive('/account/orders') ? 'border-[#D9CCFF] bg-[#F4F0FF] text-[#6236FF] shadow-[0_8px_18px_rgba(98,54,255,0.08)]' : 'text-gray-700 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                      >
                        <PackageIcon />
                        <span>Orders</span>
                      </Link>
                      <Link
                        to="/vendor/onboarding"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-[0.95rem] border border-transparent px-3 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive('/vendor/onboarding') ? 'border-[#D9CCFF] bg-[#F4F0FF] text-[#6236FF] shadow-[0_8px_18px_rgba(98,54,255,0.08)]' : 'text-gray-700 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                      >
                        <DressIcon />
                        <span>Become a Seller</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-[0.95rem] border border-transparent px-3 py-2.5 text-left text-sm text-gray-700 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]"
                      >
                        <LogoutIcon />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/vendor/onboarding"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-[0.95rem] border border-transparent px-3 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive('/vendor/onboarding') ? 'border-[#D9CCFF] bg-[#F4F0FF] text-[#6236FF] shadow-[0_8px_18px_rgba(98,54,255,0.08)]' : 'text-gray-700 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                      >
                        <DressIcon />
                        <span>Become a Seller</span>
                      </Link>
                      <Link
                        to="/account/login?redirect=%2F"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-[0.95rem] border border-transparent px-3 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive('/account/login?redirect=%2F') ? 'border-[#D9CCFF] bg-[#F4F0FF] text-[#6236FF] shadow-[0_8px_18px_rgba(98,54,255,0.08)]' : 'text-gray-700 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                      >
                        <UserIcon />
                        <span>Login</span>
                      </Link>
                      <Link
                        to="/contact"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-[0.95rem] border border-transparent px-3 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive('/contact') ? 'border-[#D9CCFF] bg-[#F4F0FF] text-[#6236FF] shadow-[0_8px_18px_rgba(98,54,255,0.08)]' : 'text-gray-700 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                      >
                        <PhoneIcon />
                        <span>24x7 Support</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-[1.35rem] border border-slate-200/80 bg-white p-1.5 max-[360px]:rounded-[1.1rem] max-[360px]:p-1.25 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === 'categories' ? null : 'categories')}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-200 hover:bg-slate-50 ${expandedCategory === 'categories' ? 'bg-[#F7F2FF]' : ''}`}
              >
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-900">Categories</span>
                <svg 
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${expandedCategory === 'categories' ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedCategory === 'categories' && (
                <div className="mt-1 space-y-2 rounded-[1.05rem] border border-slate-200/70 bg-slate-50 p-2">
                  {sidebarCategories.map((category) => (
                    <div key={category.name} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(expandedCategory === category.name ? 'categories' : category.name)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-200 ${expandedCategory === category.name ? 'bg-[#F4F0FF] text-[#6236FF]' : 'bg-white text-gray-900 hover:bg-slate-50'}`}
                      >
                        <span>{category.name}</span>
                        <svg 
                          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${expandedCategory === category.name ? 'rotate-180' : ''}`} 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedCategory === category.name && (
                        <div className="border-t border-slate-200/80 bg-slate-50">
                          {category.subcategories ? (
                            category.subcategories.map((sub) => (
                              <Link
                                key={sub.label}
                                to={sub.to}
                                onClick={() => {
                                  setIsMobileMenuOpen(false)
                                  setExpandedCategory(null)
                                }}
                                className={`relative block px-6 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive(sub.to) ? 'border-l-4 border-[#6236FF] bg-[#F4F0FF] pl-[1.1rem] text-[#6236FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]' : 'border-l-4 border-transparent text-gray-600 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                              >
                                {sub.label}
                              </Link>
                            ))
                          ) : (
                            category.items?.map((item) => (
                              <Link
                                key={item.label}
                                to={item.to}
                                onClick={() => {
                                  setIsMobileMenuOpen(false)
                                  setExpandedCategory(null)
                                }}
                                className={`relative block px-6 py-2.5 text-sm transition-all duration-200 ${isDrawerLinkActive(item.to) ? 'border-l-4 border-[#6236FF] bg-[#F4F0FF] pl-[1.1rem] text-[#6236FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]' : 'border-l-4 border-transparent text-gray-600 hover:border-slate-200 hover:bg-white hover:text-[#6236FF]'}`}
                              >
                                {item.label}
                              </Link>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[1.35rem] border border-slate-200/80 bg-white p-1.5 max-[360px]:rounded-[1.1rem] max-[360px]:p-1.25 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === 'sort' ? null : 'sort')}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-200 hover:bg-slate-50 ${expandedCategory === 'sort' ? 'bg-[#F7F2FF]' : ''}`}
              >
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-900">Sort By</span>
                <svg 
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${expandedCategory === 'sort' ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedCategory === 'sort' && (
                <div className="mt-1 space-y-2 rounded-[1.05rem] border border-slate-200/70 bg-slate-50 p-2">
                  {[
                    { label: 'Featured', to: '/products?sortBy=featured' },
                    { label: 'Price Low to High', to: '/products?sortBy=price_asc' },
                    { label: 'Price High to Low', to: '/products?sortBy=price_desc' },
                    { label: 'New Arrivals', to: '/products?sortBy=new_arrivals' },
                  ].map((sortItem) => (
                    <Link
                      key={sortItem.label}
                      to={sortItem.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block rounded-[0.95rem] border px-4 py-3 text-sm transition-all duration-200 ${currentSort === new URL(sortItem.to, 'https://shopzy.local').searchParams.get('sortBy') ? 'border-[#CDBBFF] bg-[#F4F0FF] text-[#6236FF] shadow-[0_8px_24px_rgba(98,54,255,0.08)]' : 'border-slate-200 bg-white text-gray-700 hover:border-slate-300 hover:bg-slate-50 hover:text-[#6236FF]'}`}
                    >
                      {sortItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Navbar
