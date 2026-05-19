import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, CreditCard, Heart, MapPin, Navigation, UserRound } from 'lucide-react';
import { api, BookingDetails } from '../api/client';
import { Button, EmptyState, Panel, StatCard, StatusPill } from '../components/ui';
import { useAuth } from '../store/auth';

type BookingSummary = { id: number; bookingReference: string; pickup: string; drop: string; fare: number; bookingStatus: string; paymentStatus: string; vehicleName: string; numberPlate: string; pickupOtp: string; scheduledTime?: string };

const fallbackBookings: BookingSummary[] = [
  { id: 1001, bookingReference: 'CBX-24051001', pickup: 'Colombo Fort', drop: 'Bandaranaike Airport', fare: 8450, bookingStatus: 'CONFIRMED', paymentStatus: 'PAID', vehicleName: 'Toyota Axio', numberPlate: 'CBX-2001', pickupOtp: '824611' },
  { id: 1002, bookingReference: 'CBX-24051002', pickup: 'Nugegoda', drop: 'Galle Face', fare: 2180, bookingStatus: 'PENDING', paymentStatus: 'UNPAID', vehicleName: 'Toyota Prius', numberPlate: 'CBX-1001', pickupOtp: '541233' }
];

function useBookings() {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/bookings/my-bookings').then((r) => setBookings((Array.isArray(r.data) ? r.data : []).map(normalizeBooking))).catch(() => setBookings(fallbackBookings)).finally(() => setLoading(false));
  }, []);
  return { bookings, loading };
}

function normalizeBooking(item: BookingDetails | any): BookingSummary {
  return {
    id: item.id,
    bookingReference: item.bookingReference,
    pickup: item.pickup || item.pickupLocationName,
    drop: item.drop || item.dropLocationName,
    fare: Number(item.fare ?? item.fareAmount ?? 0),
    bookingStatus: item.bookingStatus,
    paymentStatus: item.paymentStatus,
    vehicleName: item.vehicleName || item.vehicle?.name || 'Vehicle pending',
    numberPlate: item.numberPlate || item.vehicle?.numberPlate || 'Plate pending',
    pickupOtp: item.pickupOtp || '',
    scheduledTime: item.scheduledTime
  };
}

export function UserDashboardPage() {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const upcoming = bookings[0] || fallbackBookings[0];
  const paid = bookings.filter((b) => b.paymentStatus === 'PAID').length;
  return <div>
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="text-4xl font-black">Good day, {user?.name || 'Customer'}</h1><p className="mt-2 text-slate-600">Your rides, payments, and pickup details in one place.</p></div><Link to="/booking"><Button>Book another ride</Button></Link></div>
    <div className="mt-6 grid gap-4 md:grid-cols-3"><StatCard label="Total rides" value={bookings.length || 2} /><StatCard label="Paid rides" value={paid || 1} tone="green" /><StatCard label="Favorite routes" value="3" tone="amber" /></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel className="bg-ink p-6 text-white"><p className="text-sm font-bold text-slate-300">Upcoming ride</p><h2 className="mt-2 text-3xl font-black">{upcoming.pickup} to {upcoming.drop}</h2><div className="mt-6 grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-slate-400">Vehicle</p><p className="font-bold">{upcoming.vehicleName}</p></div><div><p className="text-xs text-slate-400">Plate</p><p className="font-bold">{upcoming.numberPlate}</p></div><div><p className="text-xs text-slate-400">OTP</p><p className="text-2xl font-black text-brand">{upcoming.pickupOtp}</p></div></div><Link to={`/user/bookings/${upcoming.id}`}><Button className="mt-6">View booking</Button></Link></Panel>
      <Panel className="p-6"><h2 className="text-2xl font-black">Ride timeline</h2>{[['Booking created', Calendar], ['Payment status updated', CreditCard], ['Pickup OTP issued', CheckCircle2], ['Ready for pickup', MapPin]].map(([label, Icon]: any) => <div key={label} className="mt-5 flex gap-4"><Icon className="text-brandDark" /><div><p className="font-bold">{label}</p><p className="text-sm text-slate-500">CabXpress keeps this ride record available in your account.</p></div></div>)}</Panel>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.5fr]"><Panel className="p-6"><h2 className="text-2xl font-black">Recent bookings</h2><BookingTable bookings={bookings.length ? bookings : fallbackBookings} /></Panel><Panel className="p-6"><h2 className="text-2xl font-black">Favorite routes</h2>{['Home to Airport', 'Office to Colombo Fort', 'Nugegoda to Galle Face'].map((route) => <div key={route} className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3"><Heart className="text-brandDark" size={18} /><span className="font-semibold">{route}</span></div>)}</Panel></div>
  </div>;
}

export function MyBookingsPage() {
  const { bookings, loading } = useBookings();
  return <div><h1 className="text-4xl font-black">My bookings</h1><p className="mt-2 text-slate-600">Track upcoming rides, payment status, vehicle details, and pickup OTPs.</p><Panel className="mt-6 p-6">{loading ? <p className="text-slate-500">Loading bookings...</p> : bookings.length ? <BookingTable bookings={bookings} /> : <EmptyState title="No bookings yet" text="Book your first CabXpress ride to see it here." />}</Panel></div>;
}

function BookingTable({ bookings }: { bookings: BookingSummary[] }) {
  return <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="py-3">Reference</th><th>Route</th><th>Vehicle</th><th>Fare</th><th>Status</th><th></th></tr></thead><tbody>{bookings.map((b) => <tr key={b.id} className="border-b last:border-0"><td className="py-4 font-bold">{b.bookingReference}</td><td>{b.pickup} to {b.drop}</td><td>{b.vehicleName}</td><td>LKR {Number(b.fare).toLocaleString()}</td><td><StatusPill tone={b.bookingStatus === 'CONFIRMED' ? 'success' : 'warning'}>{b.bookingStatus}</StatusPill></td><td><Link to={`/user/bookings/${b.id}`}><Button variant="outline">View</Button></Link></td></tr>)}</tbody></table></div>;
}

export function BookingDetailsPage() {
  const { id } = useParams();
  const { bookings } = useBookings();
  const booking = useMemo(() => bookings.find((b) => b.id === Number(id)) || fallbackBookings.find((b) => b.id === Number(id)) || fallbackBookings[0], [bookings, id]);
  return <div><h1 className="text-4xl font-black">{booking.bookingReference}</h1><p className="mt-2 text-slate-600">{booking.pickup} to {booking.drop}</p><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]"><Panel className="p-6"><h2 className="text-2xl font-black">Ride timeline</h2>{[['Booking created', Calendar], ['Payment confirmed', CreditCard], ['Pickup OTP generated', CheckCircle2], ['Driver arrives at pickup', Navigation]].map(([label, Icon]: any) => <div key={label} className="mt-5 flex gap-4"><Icon className="text-brandDark" /><div><p className="font-bold">{label}</p><p className="text-sm text-slate-500">Status recorded for this CabXpress booking.</p></div></div>)}</Panel><Panel className="bg-ink p-6 text-white"><p className="text-slate-300">Pickup OTP</p><p className="mt-2 text-5xl font-black text-brand">{booking.pickupOtp}</p><div className="mt-6 space-y-3 text-sm"><p><b>Vehicle:</b> {booking.vehicleName}</p><p><b>Plate:</b> {booking.numberPlate}</p><p><b>Fare:</b> LKR {Number(booking.fare).toLocaleString()}</p><p><b>Payment:</b> {booking.paymentStatus}</p></div></Panel></div></div>;
}

export function ProfilePage() {
  const { user } = useAuth();
  return <div><h1 className="text-4xl font-black">Profile</h1><p className="mt-2 text-slate-600">Keep your contact details ready for confirmations and pickup updates.</p><Panel className="mt-6 max-w-xl p-6"><div className="mb-5 flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-lg bg-ink text-xl font-black text-white"><UserRound /></span><div><p className="font-black">{user?.name}</p><p className="text-sm text-slate-500">{user?.email}</p></div></div><label className="block font-bold">Name<input className="mt-2 w-full rounded-lg border p-3" defaultValue={user?.name} /></label><label className="mt-4 block font-bold">Email<input className="mt-2 w-full rounded-lg border p-3" defaultValue={user?.email} /></label><label className="mt-4 block font-bold">Phone<input className="mt-2 w-full rounded-lg border p-3" defaultValue={user?.phone || ''} /></label><Button className="mt-5">Save profile</Button></Panel></div>;
}
