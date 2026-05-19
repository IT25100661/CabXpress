import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Clock, Home, LogOut, Route } from 'lucide-react';
import { Brand } from './PublicLayout';
import { Button, ErrorBoundary } from '../components/ui';
import { useAuth } from '../store/auth';
import { NotificationBell } from '../components/NotificationBell';

export default function DriverLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  function signOut() {
    logout();
    navigate('/');
  }
  return <div className="min-h-screen bg-slate-950 text-white">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="text-white"><Brand /></div>
        <nav className="hidden gap-2 text-base font-bold md:flex">
          <NavLink end to="/driver" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-4 py-3 ${isActive ? 'bg-brand text-ink' : 'bg-white/10 text-white hover:bg-white/15'}`}><Home size={18} /> Dashboard</NavLink>
          <NavLink to="/driver/trips" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-4 py-3 ${isActive ? 'bg-brand text-ink' : 'bg-white/10 text-white hover:bg-white/15'}`}><Route size={18} /> Trips</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <NotificationBell endpoint="/driver/notifications" />
          <div className="hidden text-right sm:block"><p className="font-black">{user?.name}</p><p className="text-sm text-slate-300">CabXpress Driver</p></div>
          <Button variant="outline" onClick={signOut}><LogOut size={18} /> Logout</Button>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-6"><ErrorBoundary><Outlet /></ErrorBoundary></main>
  </div>;
}
