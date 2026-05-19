import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Car, FileText, Gauge, Home, LayoutDashboard, LogOut, Palette, Tags, Users } from 'lucide-react';
import { Brand } from './PublicLayout';
import { useAuth } from '../store/auth';
import { Button, ErrorBoundary } from '../components/ui';
import { NotificationBell } from '../components/NotificationBell';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const links = [
    ['/admin', LayoutDashboard, 'Dashboard'], ['/admin/users', Users, 'Users'], ['/admin/vehicles', Car, 'Vehicles'],
    ['/admin/categories', Tags, 'Categories'], ['/admin/bookings', BookOpen, 'Bookings'], ['/admin/pricing', Gauge, 'Pricing'],
    ['/admin/cms', FileText, 'CMS Content'], ['/admin/themes', Palette, 'Themes'], ['/admin/reports', BarChart3, 'Reports']
  ];
  function signOut() {
    logout();
    navigate('/');
  }
  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-slate-200 bg-white p-5 lg:min-h-screen">
        <Brand />
        <nav className="mt-8 grid gap-1">
          {links.map(([to, Icon, label]: any) => <NavLink end key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-ink text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={18} />{label}</NavLink>)}
        </nav>
        <Button variant="outline" className="mt-8 w-full" onClick={() => navigate('/')}><Home size={16} /> Home</Button>
        <Button variant="dark" className="mt-3 w-full" onClick={signOut}><LogOut size={16} /> Logout</Button>
      </aside>
      <main className="p-4 sm:p-6 lg:p-8"><div className="mb-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"><div><p className="text-xs font-bold uppercase text-slate-400">Operations</p><p className="font-black text-slate-950">CabXpress Control Center</p></div><div className="flex items-center gap-3"><NotificationBell endpoint="/admin/notifications" /><div className="text-right text-sm"><p className="font-bold">{user?.name}</p><p className="text-slate-500">{user?.email}</p></div></div></div><ErrorBoundary><Outlet /></ErrorBoundary></main>
    </div>
  );
}
