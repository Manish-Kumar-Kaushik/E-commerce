import { Link, useLocation } from 'react-router-dom'

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
)

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)

const BottomNav = () => {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav className="bottom-nav lg:hidden">
      <Link 
        to="/" 
        className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}
      >
        <HomeIcon />
        <span>Home</span>
      </Link>
      
      <Link 
        to="/products?category=new-arrivals" 
        className={`bottom-nav-item ${isActive('/collections') ? 'active' : ''}`}
      >
        <GridIcon />
        <span>Categories</span>
      </Link>
      
      <Link 
        to="/cart" 
        className={`bottom-nav-item ${isActive('/cart') ? 'active' : ''}`}
      >
        <CartIcon />
        <span>Cart</span>
      </Link>
      
      <Link 
        to="/account/login" 
        className={`bottom-nav-item ${isActive('/account') ? 'active' : ''}`}
      >
        <UserIcon />
        <span>Profile</span>
      </Link>
    </nav>
  )
}

export default BottomNav