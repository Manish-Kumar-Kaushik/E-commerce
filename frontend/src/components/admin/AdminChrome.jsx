import { useState } from 'react'
import { Link } from 'react-router-dom'

const iconClassName = 'h-4 w-4 sm:h-5 sm:w-5 stroke-[1.8]'

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)

const ProductIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
  </svg>
)

const CollectionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
)

const OrderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <path d="M3 6h18M16 10a4 4 0 01-8 0" />
  </svg>
)

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
)

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
)

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 sm:h-5 sm:w-5" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className={iconClassName} stroke="currentColor">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)

const NAV_ITEMS = [
  { key: 'overview', label: 'Dashboard', icon: DashboardIcon, color: 'indigo' },
  { key: 'vendors', label: 'Vendors', icon: UsersIcon, color: 'blue' },
  { key: 'collections', label: 'Collections', icon: CollectionIcon, color: 'violet' },
  { key: 'orders', label: 'Orders', icon: OrderIcon, color: 'amber' },
  { key: 'users', label: 'Users', icon: UsersIcon, color: 'cyan' },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, color: 'slate' },
]

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', active: 'bg-indigo-600 text-white hover:bg-indigo-700', iconBg: 'bg-indigo-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', active: 'bg-emerald-600 text-white hover:bg-emerald-700', iconBg: 'bg-emerald-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', active: 'bg-violet-600 text-white hover:bg-violet-700', iconBg: 'bg-violet-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', active: 'bg-amber-600 text-white hover:bg-amber-700', iconBg: 'bg-amber-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', active: 'bg-cyan-600 text-white hover:bg-cyan-700', iconBg: 'bg-cyan-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', active: 'bg-blue-600 text-white hover:bg-blue-700', iconBg: 'bg-blue-100' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', active: 'bg-slate-700 text-white hover:bg-slate-800', iconBg: 'bg-slate-200' },
}

const SidebarItem = ({ item, isActive, isCollapsed, onClick }) => {
  const colors = colorMap[item.color]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-medium text-sm transition-all duration-200
        ${isActive 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' 
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : colors.iconBg} ${isActive ? 'text-white' : colors.text}`}>
        <item.icon />
      </span>
      {!isCollapsed && <span>{item.label}</span>}
    </button>
  )
}

const SidebarSection = ({ label, items, activeItem, onItemClick, isCollapsed }) => (
  <div className="mb-6">
    {!isCollapsed && (
      <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    )}
    <div className="space-y-1">
      {items.map((item) => (
        <SidebarItem
          key={item.key}
          item={item}
          isActive={activeItem === item.key}
          isCollapsed={isCollapsed}
          onClick={() => onItemClick(item.key)}
        />
      ))}
    </div>
  </div>
)

export const AdminSidebar = ({ activeTab, onSelectTab, isCollapsed, onToggleCollapse }) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavClick = (key) => {
    onSelectTab(key)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white shadow-lg lg:hidden"
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 text-lg font-bold text-white">
                S
              </div>
              <div>
                <span className="block text-lg font-bold text-white">Shopzy</span>
                <span className="block text-xs text-slate-400">Admin Panel</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <SidebarSection label="Menu" items={NAV_ITEMS} activeItem={activeTab} onItemClick={handleNavClick} isCollapsed={false} />
          </nav>

          <div className="p-4 border-t border-slate-700">
            <button
              type="button"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-slate-300 transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-linear-to-b from-slate-900 to-slate-950 z-30
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isCollapsed ? 'items-center' : 'px-4'}
      `}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center py-6' : 'justify-between py-5 px-2'} border-b border-white/10`}>
          <Link to="/" className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
              S
            </div>
            {!isCollapsed && (
              <div>
                <span className="block text-lg font-bold text-white">Shopzy</span>
                <span className="block text-xs text-slate-400">Admin Panel</span>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-lg bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? 'px-2' : 'px-2'}`}>
          <SidebarSection label="Menu" items={NAV_ITEMS} activeItem={activeTab} onItemClick={handleNavClick} isCollapsed={isCollapsed} />
        </nav>

        <div className={`p-4 border-t border-white/10 ${isCollapsed ? 'text-center' : ''}`}>
          <button
            type="button"
            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl font-medium text-sm text-slate-300 transition-all hover:bg-red-500/10 hover:text-red-400 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogoutIcon />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export const AdminTopbar = ({
  title,
  subtitle,
  userName,
  onPrimaryAction,
  primaryActionLabel,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search products, orders...',
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
}) => {
  const [searchOpen, setSearchOpen] = useState(false)
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)

  const resolvedSearchQuery = searchQuery ?? internalSearchQuery

  const handleSearchChange = (value) => {
    if (typeof onSearchChange === 'function') {
      onSearchChange(value)
      return
    }

    setInternalSearchQuery(value)
  }

  return (
    <header className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 md:px-6 py-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                Dashboard
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={resolvedSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <SearchIcon />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen((current) => !current)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              <BellIcon />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <span className="text-xs font-medium text-slate-500">{unreadCount} unread</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        type="button"
                        onClick={() => {
                          if (onNotificationClick) {
                            onNotificationClick(notification)
                          }
                          setNotificationOpen(false)
                        }}
                        className={`w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 ${notification.isRead ? 'bg-white' : 'bg-indigo-50/40'}`}
                      >
                        <p className="text-sm font-medium text-slate-900">{notification.title || 'Update'}</p>
                        <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
                        {notification.data?.customerName || notification.data?.customerPhone || notification.data?.productIds?.length ? (
                          <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                            {notification.data?.customerName ? <p>Customer: {notification.data.customerName}</p> : null}
                            {notification.data?.customerPhone ? <p>Phone: {notification.data.customerPhone}</p> : null}
                            {notification.data?.productIds?.length ? <p>Product IDs: {notification.data.productIds.join(', ')}</p> : null}
                          </div>
                        ) : null}
                        <p className="mt-1 text-[11px] text-slate-400">
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleString('en-IN') : ''}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-5 text-sm text-slate-500">No notifications yet.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                {(userName || 'A').slice(0, 1).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{userName || 'Admin'}</span>
              <ChevronDownIcon />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{userName || 'Admin'}</p>
                  <p className="text-sm text-slate-500">admin@shopzy.com</p>
                </div>
                <div className="p-2">
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                    Profile Settings
                  </button>
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                    Account Settings
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button type="button" className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <LogoutIcon />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {onPrimaryAction && (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-indigo-500 to-violet-600 text-white font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              <PlusIcon />
              <span className="hidden sm:inline">{primaryActionLabel}</span>
            </button>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden mt-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={resolvedSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}
    </header>
  )
}

export const AdminSurface = ({ children, className = '' }) => (
  <section className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </section>
)

export const AdminMetricCard = ({ label, value, hint, icon: Icon, trend }) => (
  <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200">
    <div className="flex items-start justify-between mb-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
          <Icon />
        </div>
      )}
    </div>
    <div className="flex flex-col">
      <p className="text-2xl md:text-3xl font-bold text-slate-900">{value}</p>
      {hint && <p className="text-sm text-slate-500 mt-1">{hint}</p>}
    </div>
    {trend && (
      <div className={`inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-full text-xs font-medium ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        <span>{trend > 0 ? '↑' : '↓'}</span>
        <span>{Math.abs(trend)}%</span>
      </div>
    )}
  </div>
)

export const AdminStatusPill = ({ tone = 'neutral', children }) => {
  const tones = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    neutral: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

export const AdminEmptyState = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <p className="text-base font-semibold text-slate-900">{title}</p>
    <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>
  </div>
)