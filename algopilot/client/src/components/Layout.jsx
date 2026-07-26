import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PricingModal from './PricingModal'
import {
  LayoutDashboard, BookOpen, CheckSquare, RefreshCw,
  BarChart2, Sparkles, BookMarked, User, LogOut, Menu, X, Zap,
  Flame, Trophy, Shield, Star
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/focus',      icon: Flame,            label: 'Focus Mode' },
  { to: '/questions',  icon: BookOpen,         label: 'Questions' },
  { to: '/solved',     icon: CheckSquare,      label: 'My Progress' },
  { to: '/revision',   icon: RefreshCw,        label: 'Revision' },
  { to: '/leaderboard',icon: Trophy,           label: 'Leaderboard' },
  { to: '/statistics', icon: BarChart2,        label: 'Statistics' },
  { to: '/ai',         icon: Sparkles,         label: 'AI Tools', premium: true },
  { to: '/mistakes',   icon: BookMarked,       label: 'Mistake Book' },
  { to: '/admin',      icon: Shield,           label: 'Admin Panel' },
  { to: '/profile',    icon: User,             label: 'Profile' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold text-white">AlgoPilot</span>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">
              {user?.isPremium ? '⭐ PRO Member' : 'Free Plan'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, premium }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {premium && !user?.isPremium && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Pro Upgrade Banner */}
      {!user?.isPremium && (
        <div className="mx-3 mb-3 p-3 bg-gradient-to-r from-yellow-950/40 via-gray-900 to-amber-950/40 border border-yellow-500/30 rounded-xl text-center">
          <p className="text-xs text-yellow-400 font-bold flex items-center justify-center gap-1">
            <Star size={12} className="fill-yellow-400" /> Unlock PRO Plan
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">AI Mentor, Roadmap & Hints</p>
          <button
            onClick={() => setShowPricingModal(true)}
            className="mt-2 w-full py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold text-xs rounded-lg transition-all"
          >
            Upgrade for ₹499
          </button>
        </div>
      )}

      {/* Streak badge */}
      {user?.streak > 0 && (
        <div className="mx-3 mb-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <p className="text-xs text-orange-400 font-medium">🔥 {user.streak} Day Streak!</p>
          <p className="text-xs text-gray-500 mt-0.5">Keep it going today</p>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-150"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 border-r border-gray-800 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-white">AlgoPilot</span>
            </div>
          </div>
          {!user?.isPremium && (
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-3 py-1 bg-yellow-500 text-gray-950 font-bold text-xs rounded-lg"
            >
              PRO ⭐
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && (
        <PricingModal onClose={() => setShowPricingModal(false)} />
      )}
    </div>
  )
}
