import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import DriverLayout from './layouts/DriverLayout';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import { LoginPage, SignupPage, VerifyOtpPage, ForgotPasswordPage } from './pages/AuthPages';
import { AboutPage, ContactPage } from './pages/PublicInfoPages';
import { CategoriesPage, VehicleDetailPage, VehicleListingPage } from './pages/VehiclePages';
import { AdminDashboardPage, CrudPage, ReportsPage } from './pages/AdminPages';
import { BookingDetailsPage, MyBookingsPage, ProfilePage, UserDashboardPage } from './pages/UserPages';
import { DriverDashboardPage, DriverTripDetailsPage, DriverTripsPage } from './pages/DriverPages';
import { useAuth } from './store/auth';
import { EmptyState, ErrorBoundary } from './components/ui';

function RequireAuth({ role, children }: { role?: 'ADMIN' | 'USER' | 'CAB_DRIVER'; children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center bg-mist text-sm font-bold text-slate-500">Loading CabXpress</div>;
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'CAB_DRIVER' ? '/driver' : '/user'} replace />;
  return children;
}

function RouteBoundary({ children }: { children: JSX.Element }) {
  const location = useLocation();
  return <ErrorBoundary key={location.pathname} fallback={<EmptyState title="This page needs attention" text="The page could not render correctly. Use the navigation above or return home and try again." />}>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="vehicles" element={<VehicleListingPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="booking" element={<RouteBoundary><BookingPage /></RouteBoundary>} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="verify-otp" element={<VerifyOtpPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<EmptyState title="Page not found" text="Choose a CabXpress page from the navigation above." />} />
      </Route>

      <Route path="user" element={<RequireAuth role="USER"><UserLayout /></RequireAuth>}>
        <Route index element={<UserDashboardPage />} />
        <Route path="bookings" element={<MyBookingsPage />} />
        <Route path="bookings/:id" element={<BookingDetailsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="admin" element={<RequireAuth role="ADMIN"><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<CrudPage title="Manage Users" type="users" />} />
        <Route path="vehicles" element={<CrudPage title="Manage Vehicles" type="vehicles" />} />
        <Route path="categories" element={<CrudPage title="Manage Categories" type="categories" />} />
        <Route path="bookings" element={<CrudPage title="Manage Bookings" type="bookings" />} />
        <Route path="pricing" element={<CrudPage title="Manage Pricing" type="pricing" />} />
        <Route path="cms" element={<CrudPage title="Manage CMS Content" type="cms" />} />
        <Route path="themes" element={<CrudPage title="Manage Themes" type="themes" />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="driver" element={<RequireAuth role="CAB_DRIVER"><DriverLayout /></RequireAuth>}>
        <Route index element={<DriverDashboardPage />} />
        <Route path="trips" element={<DriverTripsPage />} />
        <Route path="trips/:id" element={<DriverTripDetailsPage />} />
      </Route>
    </Routes>
  );
}
