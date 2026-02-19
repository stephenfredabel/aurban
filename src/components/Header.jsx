import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, X, Menu, User, Heart, Bell, MessageSquare, ShoppingCart,
  LogOut, LayoutDashboard, ChevronDown,
  Settings, History, Sun, Moon,
} from 'lucide-react';
import { useAuth }     from '../context/AuthContext.jsx';
import { useProperty } from '../context/PropertyContext.jsx';
import { sanitize }    from '../utils/security.js';
import { useMessaging } from '../context/MessagingContext.jsx';
import { useCart }      from '../context/CartContext.jsx';
import AurbanLogo       from './AurbanLogo.jsx';
import LanguageSwitcher from './language/LanguageSwitcher.jsx';
import CurrencySwitcher from './CurrencySwitcher.jsx';
import CartDrawer       from './marketplace/CartDrawer.jsx';

/* ────────────────────────────────────────────────────────────
   HEADER — Top bar of Aurban

   Layout:
   ┌─────────────────────────────────────────────────────────┐
   │  [Logo]        [══ Search Bar ══]        [Actions]      │
   └─────────────────────────────────────────────────────────┘

   Changes from previous version:
   • Logo = icon only (no "Aurban" text — we have the logo)
   • Search = truly centered, max-w-xl
   • Mobile: user avatar replaces "My Account" text
   • More whitespace, breathing room
   • Login/SignUp = END-USERS ONLY
──────────────────────────────────────────────────────────── */

export default function Header() {
  const { t }                           = useTranslation();
  const { user, logout }                = useAuth();
  const { searchQuery, setSearchQuery } = useProperty();
  const { totalUnread }                 = useMessaging();
  const navigate                        = useNavigate();

  const { itemCount }                 = useCart();
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [_menuOpen,   setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cartOpen,    setCartOpen]    = useState(false);
  const [inputValue,  setInputValue]  = useState(searchQuery || '');

  const searchInputRef = useRef(null);
  const profileRef     = useRef(null);

  /* ── Theme toggle ───────────────────────────────────────── */
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { sessionStorage.setItem('aurban_theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
  };

  /* ── Close dropdowns on outside click ───────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Focus mobile search ────────────────────────────────── */
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 60);
  }, [searchOpen]);

  /* ── Search handler (XSS-safe) ──────────────────────────── */
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const q = sanitize(inputValue.trim());
    if (!q) return;
    setSearchQuery(q);
    setSearchOpen(false);
    setMenuOpen(false);
    navigate(`/properties?search=${encodeURIComponent(q)}`);
  }, [inputValue, navigate, setSearchQuery]);

  const handleInputChange = (e) => setInputValue(sanitize(e.target.value));

  /* ── Logout ─────────────────────────────────────────────── */
  const handleLogout = async () => {
    setProfileOpen(false);
    setMenuOpen(false);
    await logout();
    // Full page reload to cleanly clear all React state and avoid
    // race conditions with ProtectedRoute redirects
    window.location.href = '/';
  };

  const isProvider = ['provider', 'admin', 'host', 'agent', 'seller', 'service'].includes(user?.role);

  /* ── User initials for avatar ───────────────────────────── */
  const getInitials = () => {
    if (!user?.name) return 'U';
    const parts = user.name.split(' ').filter(Boolean);
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 dark:bg-gray-950 dark:border-white/5">
      <div className="flex items-center px-4 mx-auto sm:px-6 max-w-7xl h-14">

        {/* ═══ LEFT: Logo (icon only — no repeated "Aurban" text) ═══ */}
        <Link to="/" className="mr-3 sm:mr-4 shrink-0" aria-label="Aurban Home">
          <AurbanLogo size="sm" showName={false} />
        </Link>

        {/* ═══ CENTER: Search bar (well centralised) ═══════════════ */}
        <div className="flex justify-center flex-1 max-w-xl mx-auto">
          {/* Desktop search */}
          <form onSubmit={handleSearch} className="relative hidden w-full sm:flex">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="search"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={t('search.placeholder', 'Search properties, services...')}
              className="w-full h-10 pl-10 pr-4 text-sm text-gray-800 transition-all border border-gray-100 rounded-full bg-gray-50 dark:bg-white/5 dark:border-white/5 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold/30 focus:bg-white dark:focus:bg-white/10"
              autoComplete="off" maxLength={120}
            />
            {inputValue && (
              <button type="button" onClick={() => setInputValue('')}
                className="absolute text-gray-300 -translate-y-1/2 right-3.5 top-1/2 hover:text-gray-500">
                <X size={14} />
              </button>
            )}
          </form>

          {/* Mobile search pill */}
          <button onClick={() => { setSearchOpen(true); setMenuOpen(false); }}
            className="flex items-center flex-1 max-w-xs gap-2 px-4 border border-gray-100 rounded-full sm:hidden h-10 bg-gray-50 dark:bg-white/5 dark:border-white/5">
            <Search size={14} className="text-gray-300 shrink-0" />
            <span className="text-xs text-gray-300 truncate dark:text-gray-500">Search properties, services...</span>
          </button>
        </div>

        {/* ═══ RIGHT: Actions ══════════════════════════════════════ */}
        <div className="flex items-center gap-1 ml-3 sm:gap-1.5 sm:ml-4 shrink-0">

          {/* Currency — desktop */}
          <div className="hidden sm:block">
            <CurrencySwitcher compact />
          </div>

          {/* Theme toggle — desktop */}
          <button onClick={toggleTheme}
            className="items-center justify-center hidden w-8 h-8 text-gray-400 transition-colors rounded-lg sm:flex hover:bg-gray-50 dark:hover:bg-white/5"
            aria-label={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Language — desktop */}
          <div className="hidden sm:block">
            <LanguageSwitcher compact />
          </div>

          {user ? (
            <>
              {/* Wishlist — desktop */}
              <Link to="/dashboard/wishlist"
                className="items-center justify-center hidden w-8 h-8 text-gray-400 transition-colors rounded-lg sm:flex hover:bg-gray-50 dark:hover:bg-white/5"
                aria-label="Wishlist">
                <Heart size={16} />
              </Link>

              {/* Messages — desktop */}
              <Link to="/dashboard/messages"
                className="relative items-center justify-center hidden w-8 h-8 text-gray-400 transition-colors rounded-lg sm:flex hover:bg-gray-50 dark:hover:bg-white/5"
                aria-label="Messages">
                <MessageSquare size={16} />
                {totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </Link>

              {/* Notifications — desktop */}
              <button className="relative items-center justify-center hidden w-8 h-8 text-gray-400 transition-colors rounded-lg sm:flex hover:bg-gray-50 dark:hover:bg-white/5" aria-label="Notifications">
                <Bell size={16} />
              </button>

              {/* Cart */}
              <button onClick={() => setCartOpen(true)}
                className="relative flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                aria-label={`Cart${itemCount ? ` (${itemCount})` : ''}`}>
                <ShoppingCart size={16} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-brand-gold rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* ── User Avatar (mobile: replaces "My Account" text) ── */}
              <div ref={profileRef} className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 h-9 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors px-1 sm:px-2"
                  aria-expanded={profileOpen} aria-haspopup="true">
                  {/* Avatar — always visible on both mobile + desktop */}
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="object-cover w-8 h-8 rounded-full ring-2 ring-gray-100 dark:ring-white/10" />
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 ring-2 ring-gray-100 dark:ring-white/10">
                      <span className="text-xs font-bold uppercase text-brand-gold">{getInitials()}</span>
                    </div>
                  )}
                  {/* Name + chevron — desktop only */}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                    {user.name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown size={14} className={`hidden sm:block text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 z-50 w-56 py-1.5 mt-2 bg-white border border-gray-100 top-full dark:bg-gray-900 dark:border-white/10 rounded-2xl shadow-lg shadow-black/5">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                      <p className="text-sm font-semibold text-gray-800 truncate dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user.email || user.phone}</p>
                    </div>

                    <div className="py-1">
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <LayoutDashboard size={16} className="text-gray-400" /> Dashboard
                      </Link>
                      <Link to="/dashboard/wishlist" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <Heart size={16} className="text-gray-400" /> Wishlist
                      </Link>
                      <Link to="/dashboard/history" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <History size={16} className="text-gray-400" /> History
                      </Link>
                      <Link to="/dashboard/settings" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <Settings size={16} className="text-gray-400" /> Settings
                      </Link>

                      {isProvider && (
                        <>
                          <div className="my-1 border-t border-gray-100 dark:border-white/10" />
                          <Link to="/provider" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-gold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <LayoutDashboard size={16} /> Provider Dashboard
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Theme toggle — visible in dropdown on mobile */}
                    <div className="border-t border-gray-100 sm:hidden dark:border-white/10">
                      <button onClick={toggleTheme}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                        {dark ? <Sun size={16} className="text-gray-400" /> : <Moon size={16} className="text-gray-400" />}
                        {dark ? 'Light mode' : 'Dark mode'}
                      </button>
                    </div>

                    <div className="pt-1 border-t border-gray-100 dark:border-white/10">
                      <button onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── Guest: Cart + Login / Sign Up ──── */
            <div className="flex items-center gap-2">
              {/* Cart — always visible, even for guests */}
              <button onClick={() => setCartOpen(true)}
                className="relative flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                aria-label={`Cart${itemCount ? ` (${itemCount})` : ''}`}>
                <ShoppingCart size={16} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-brand-gold rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
              <Link to="/login"
                className="hidden px-3 py-1.5 text-sm font-medium transition-colors sm:block text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
                {t('nav.login', 'Log in')}
              </Link>
              <Link to="/signup"
                className="flex items-center justify-center px-4 text-sm font-medium text-white transition-all rounded-full h-9 bg-brand-gold hover:bg-brand-gold-dark active:scale-95">
                <span className="hidden sm:inline">{t('nav.register', 'Sign up')}</span>
                <span className="text-xs sm:hidden">Join</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Mobile search overlay ═══════════════════════════ */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-950 sm:hidden">
          <div className="flex items-center gap-3 px-4 border-b border-gray-100 h-14 dark:border-white/5">
            <button onClick={() => setSearchOpen(false)} className="p-1.5 -ml-1 rounded-lg text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search size={16} className="absolute text-gray-300 -translate-y-1/2 left-3 top-1/2" />
                <input ref={searchInputRef} type="search" value={inputValue}
                  onChange={handleInputChange}
                  placeholder={t('search.placeholder', 'Search properties, services, products...')}
                  className="w-full h-10 pl-10 pr-4 text-sm text-gray-800 border border-gray-100 rounded-full bg-gray-50 dark:bg-white/5 dark:border-white/5 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                  autoComplete="off" maxLength={120} />
              </div>
            </form>
          </div>
          <div className="px-4 py-6 space-y-3">
            {[
              { label: 'Properties', path: '/properties' },
              { label: 'Services',   path: '/pro' },
              { label: 'Marketplace', path: '/marketplace' },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => { setSearchOpen(false); navigate(path); }}
                className="w-full px-4 py-3 text-sm text-left text-gray-600 transition-colors bg-gray-50 dark:bg-white/5 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Cart drawer ═══ */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </header>
  );
}