import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CarTaxiFront, ChevronDown, LayoutDashboard, LogOut, Menu, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui';
import { ErrorBoundary } from '../components/ui';
import { useAuth } from '../store/auth';
import { NotificationBell } from '../components/NotificationBell';

export function Brand() {
  return <Link to="/" className="flex items-center gap-2 text-xl font-black"><span className="rounded-lg bg-brand p-2 text-ink"><CarTaxiFront size={22} /></span>CabXpress</Link>;
}

export default function PublicLayout() {
  const nav = [['/', 'Home'], ['/vehicles', 'Vehicles'], ['/categories', 'Categories'], ['/booking', 'Book Ride'], ['/about', 'About'], ['/contact', 'Contact']];
  const { user, logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const dashboard = user?.role === 'ADMIN' ? '/admin' : user?.role === 'CAB_DRIVER' ? '/driver' : '/user';

  function signOut() {
    setAccountOpen(false);
    logout();
    navigate('/');
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-mist">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            {nav.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'text-brandDark' : 'hover:text-slate-950'}>{label}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
              <NotificationBell />
              <div className="relative" ref={accountRef}>
                <button onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen} className="focus-ring flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-sm">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-white">{user.name?.charAt(0) || 'C'}</span>
                  <span className="max-w-32 truncate">{user.name}</span>
                  <ChevronDown size={16} />
                </button>
                <div className={`${accountOpen ? 'visible opacity-100' : 'invisible opacity-0'} absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-soft transition`}>
                  <Link onClick={() => setAccountOpen(false)} to={dashboard} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-50"><LayoutDashboard size={16} /> {user.role === 'ADMIN' ? 'Admin Dashboard' : user.role === 'CAB_DRIVER' ? 'Driver Dashboard' : 'User Dashboard'}</Link>
                  {user.role === 'USER' && <Link onClick={() => setAccountOpen(false)} to="/user/bookings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-50"><UserRound size={16} /> My Bookings</Link>}
                  <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={16} /> Logout</button>
                </div>
              </div>
              </>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost">Login</Button></Link>
                <Link to="/signup"><Button>Sign up</Button></Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <>
                <NotificationBell />
                <Link to={dashboard} aria-label={user.role === 'ADMIN' ? 'Admin Dashboard' : user.role === 'CAB_DRIVER' ? 'Driver Dashboard' : 'User Dashboard'} className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-sm font-black text-white">{user.name?.charAt(0) || 'C'}</Link>
                <button aria-label="Logout" onClick={signOut} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-red-600"><LogOut size={18} /></button>
              </>
            ) : (
              <button aria-label="Open navigation" onClick={() => setMobileOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white"><Menu /></button>
            )}
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t border-slate-200 px-4 py-3 md:hidden">
            <div className="grid gap-1 text-sm font-semibold text-slate-700">
              {nav.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-2 ${isActive ? 'bg-ink text-white' : 'hover:bg-slate-100'}`}>{label}</NavLink>)}
              {!user && <NavLink to="/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100">Login</NavLink>}
            </div>
          </nav>
        )}
      </header>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}
