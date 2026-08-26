import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/auth';
import {
  LayoutDashboard,
  ShoppingBag,
  ListCollapse,
  Layers,
  BookOpen,
  Boxes,
  Menu,
  X,
  LogOut,
  User,
  Home,
  Star,
  Tag,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Homepage Config', path: '/homepage', icon: Home },
    { name: 'Products', path: '/products', icon: ShoppingBag },
    { name: 'Categories', path: '/categories', icon: Layers },
    { name: 'Orders', path: '/orders', icon: ListCollapse },
    { name: 'Discounts & Promos', path: '/discounts', icon: Tag },
    { name: 'Reviews', path: '/reviews', icon: Star },
    { name: 'Blog', path: '/blog', icon: BookOpen },
    { name: 'Inventory & Alerts', path: '/inventory', icon: Boxes },
  ];

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      {/* Brand Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="Haus of Hafsah Logo"
            className="h-8 w-8 object-contain shrink-0"
          />
          <div className="min-w-0">
            <span className="font-serif text-sm font-bold tracking-widest text-text-primary uppercase block truncate">
              Haus of Hafsah
            </span>
            <span className="text-[9px] uppercase tracking-wider text-text-secondary mt-0.5 block">
              Management Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${isActive
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile & Logout */}
      <div className="p-4 border-t border-border bg-background/50">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="h-8 w-8 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-primary truncate">
              {user?.fullName || 'Administrator'}
            </p>
            <p className="text-[10px] text-text-secondary truncate mt-0.5">
              {user?.email || 'admin@hausofhafsah.com'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 border border-border hover:bg-error/5 hover:border-error/25 hover:text-error text-text-secondary rounded text-[11px] font-semibold uppercase tracking-wider transition-all duration-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar (persistent) */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar (collapsible drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-text-primary/40 backdrop-blur-xs transition-opacity duration-300">
          <div className="relative w-64 max-w-xs flex flex-col h-full bg-surface shadow-xl animate-in slide-in-from-left duration-200">
            {/* Close Button overlay */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full border border-border bg-surface text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            {renderSidebarContent()}
          </div>
          {/* Backdrop dismiss */}
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header toolbar */}
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 sticky top-0 z-40 shadow-xs">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded text-text-secondary hover:text-text-primary focus:outline-none"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Current Page Title */}
          <span className="font-serif text-lg font-medium text-text-primary tracking-wide">
            {menuItems.find((item) => item.path === location.pathname)?.name || 'Control Panel'}
          </span>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-semibold text-text-secondary uppercase bg-border/40 px-2 py-0.5 rounded">
              Status: Live
            </span>
          </div>
        </header>

        {/* Content Route Router Outlet */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
