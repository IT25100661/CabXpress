import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, Home, LayoutDashboard, LogOut, User } from 'lucide-react';
import { Brand } from './PublicLayout';
import { Button, ErrorBoundary } from '../components/ui';
import { useAuth } from '../store/auth';
import { NotificationBell } from '../components/NotificationBell';

export default function UserLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const links = [
    ['/user', LayoutDashboard, 'Dashboard'],
    ['/user/bookings', BookOpen, 'My Bookings'],
    ['/user/profile', User, 'Profile']
  ];
  function signOut() {
    logout();
    navigate('/');
  }
  return <div className="min-h-screen bg-mist">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4"><Brand /><nav className="hidden gap-2 text-sm font-semibold md:flex">{links.map(([to, Icon, label]: any) => <NavLink key={to} to={to} end={to === '/user'} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 ${isActive ? 'bg-ink text-white' : 'hover:bg-slate-100'}`}><Icon size={16} /> {label}</NavLink>)}</nav><div className="flex items-center gap-2"><NotificationBell /><span className="hidden text-sm font-bold text-slate-600 sm:inline">{user?.name}</span><Button variant="outline" onClick={() => navigate('/')}><Home size={16} /> Home</Button><Button variant="dark" onClick={signOut}><LogOut size={16} /> Logout</Button></div></div></header>
    <main className="mx-auto max-w-7xl px-4 py-8"><ErrorBoundary><Outlet /></ErrorBoundary></main>
  </div>;
}
