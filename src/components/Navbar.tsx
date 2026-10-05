import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Store,
  Tag,
  MessageSquare,
  Heart,
  LayoutDashboard,
  User,
  LogOut,
  Settings,
  Package,
  Bell,
  Menu,
  X,
  ShieldCheck,
  Repeat,
  Sparkles,
  Leaf,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Logo } from './Logo';
import type { Notification } from '@/types';
import { timeAgo } from '@/utils/helpers';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNototOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!profile) return;

    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n) => !n.read_status).length);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setNototOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNototOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAllRead() {
    if (!profile) return;
    await supabase.from('notifications').update({ read_status: true }).eq('user_id', profile.id).eq('read_status', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    setUnreadCount(0);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const navLinks = profile
    ? [
        { to: '/marketplace', label: 'Marketplace', icon: Store },
        { to: '/sell', label: 'Sell', icon: Tag },
        { to: '/requests', label: 'Requests', icon: Package },
        { to: '/messages', label: 'Messages', icon: MessageSquare },
        { to: '/favorites', label: 'Favorites', icon: Heart },
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    : [
        { to: '/marketplace', label: 'Marketplace', icon: Store },
        { to: '/impact', label: 'Impact', icon: Leaf },
      ];

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <nav className="container-max px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex-shrink-0">
              <Logo size="md" />
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'text-navy-700 bg-navy-50'
                      : 'text-slate-600 hover:text-navy-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/admin'
                      ? 'text-red-600 bg-red-50'
                      : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <ShieldCheck size={16} />
                  Admin
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              {profile ? (
                <>
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => { setNototOpen(!notifOpen); if (!notifOpen) markAllRead(); }}
                      className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Bell size={20} className="text-slate-600" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 animate-slide-down">
                        <div className="p-3 border-b border-slate-100">
                          <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
                        </div>
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-400">
                            <Bell size={24} className="mx-auto mb-2 text-slate-300" />
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <Link
                              key={n.id}
                              to={n.link || '#'}
                              className={`block p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read_status ? 'bg-navy-50/50' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read_status ? 'bg-navy-500' : 'bg-transparent'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                                  {n.body && <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>}
                                  <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      {profile.profile_image ? (
                        <img src={profile.profile_image} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-500 to-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                          {profile.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 animate-slide-down overflow-hidden">
                        <div className="p-3 border-b border-slate-100">
                          <p className="font-semibold text-sm text-slate-800">{profile.full_name}</p>
                          <p className="text-xs text-slate-500">{profile.email}</p>
                          {profile.verification_status === 'verified' && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
                              <ShieldCheck size={12} /> Verified Student
                            </span>
                          )}
                        </div>
                        <Link to="/profile" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <User size={16} /> Profile
                        </Link>
                        <Link to="/my-listings" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <Package size={16} /> My Listings
                        </Link>
                        <Link to="/swaps" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <Repeat size={16} /> My Swaps
                        </Link>
                        <Link to="/recommendations" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <Sparkles size={16} /> Recommendations
                        </Link>
                        <Link to="/impact" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <Leaf size={16} /> Sustainability
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <ShieldCheck size={16} /> Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-100"
                        >
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-sm">Login</Link>
                  <Link to="/signup" className="btn-primary text-sm">Sign Up</Link>
                </div>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </nav>

        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                  <ShieldCheck size={18} /> Admin
                </Link>
              )}
              {!profile && (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="btn-secondary flex-1 text-sm">Login</Link>
                  <Link to="/signup" className="btn-primary flex-1 text-sm">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {profile && (
        <MobileBottomNav />
      )}
    </>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const links = [
    { to: '/marketplace', icon: Store, label: 'Shop' },
    { to: '/sell', icon: Tag, label: 'Sell' },
    { to: '/messages', icon: MessageSquare, label: 'Chat' },
    { to: '/favorites', icon: Heart, label: 'Saved' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex justify-around items-center">
      {links.map((link) => {
        const active = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${active ? 'text-navy-600' : 'text-slate-400'}`}
          >
            <link.icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
