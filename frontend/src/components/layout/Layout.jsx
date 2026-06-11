import { Outlet, useLocation } from 'react-router-dom'
import { useSyncGuestCart } from '../../hooks/useSyncGuestCart'
import AnnouncementBar from './AnnouncementBar'
import Navbar from './Navbar'
import CustomerAiAssistant from '../CustomerAiAssistant'

const Layout = () => {
  useSyncGuestCart()
  const location = useLocation()
  const redirectTarget = new URLSearchParams(location.search).get('redirect') || ''
  const hideNavbarForSellerLogin =
    location.pathname === '/account/login' && redirectTarget.includes('/vendor/status')

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#333333]">
      <AnnouncementBar />
      {!hideNavbarForSellerLogin ? <Navbar /> : null}
      <main>
        <Outlet />
      </main>
      <CustomerAiAssistant />
    </div>
  )
}

export default Layout
