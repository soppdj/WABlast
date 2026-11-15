import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Smartphone,
  Users,
  Send,
  ScrollText,
  LogOut,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Perangkat', to: '/devices', icon: Smartphone },
  { label: 'Donatur', to: '/donors', icon: Users },
  { label: 'Broadcast', to: '/campaigns', icon: Send },
  { label: 'Log & Pengaturan', to: '/logs', icon: ScrollText },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleMobile = () => setMobileOpen((o) => !o);
  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0F172A] text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <Radio className="h-7 w-7 text-[#059669] shrink-0" />
        <div>
          <span className="text-xl font-bold tracking-tight block leading-tight">WABlast Pro</span>
          <span className="text-[11px] text-emerald-400 font-medium block">
            Yayasan Khoirur Rooziqiin
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => {
          const isActive =
            location.pathname === to || location.pathname.startsWith(to + '/');

          return (
            <NavLink
              key={to}
              to={to}
              onClick={closeMobile}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-l-4 border-[#059669] bg-[#059669]/10 text-[#059669]'
                  : 'border-l-4 border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-2 truncate text-xs text-slate-400">
          {user?.email ?? 'Pengguna'}
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobile}
        className="fixed left-4 top-4 z-50 rounded-lg bg-[#0F172A] p-2 text-white shadow-lg md:hidden"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">{sidebarContent}</aside>
    </>
  );
}
