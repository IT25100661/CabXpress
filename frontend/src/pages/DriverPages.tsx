import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, MapPinned, Navigation, Phone, Route } from 'lucide-react';
import { api } from '../api/client';
import { Button, EmptyState, Panel, StatusPill } from '../components/ui';

type Trip = {
  id: number;
  bookingReference: string;
  pickupLocationName: string;
  dropLocationName: string;
  scheduledTime?: string;
  bookingStatus: string;
  customerName?: string;
  customerPhone?: string;
  user?: { name: string; phone?: string };
  vehicle?: { name: string; numberPlate: string; color?: string };
};

function TripCard({ trip, onChanged }: { trip: Trip; onChanged: () => void }) {
  const [confirmAction, setConfirmAction] = useState<'start' | 'complete' | null>(null);
  const [busy, setBusy] = useState(false);

  async function runAction() {
    if (!confirmAction) return;
    setBusy(true);
    try {
      await api.post(`/driver/bookings/${trip.id}/${confirmAction === 'start' ? 'start' : 'complete'}`);
      setConfirmAction(null);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const canStart = trip.bookingStatus === 'CONFIRMED';
  const canComplete = trip.bookingStatus === 'IN_PROGRESS';
  return <Panel className="overflow-hidden border-white/10 bg-white text-slate-950">
    <div className="grid gap-5 p-5 md:grid-cols-[1fr_0.7fr]">
      <div>
        <div className="flex flex-wrap items-center gap-3"><h2 className="text-3xl font-black">{trip.bookingReference}</h2><StatusPill tone={canComplete ? 'info' : canStart ? 'success' : trip.bookingStatus === 'CANCELLED' ? 'danger' : 'neutral'}>{trip.bookingStatus}</StatusPill></div>
        <div className="mt-5 grid gap-4 text-lg">
          <div className="flex gap-3"><MapPinned className="mt-1 text-brandDark" /><div><p className="text-sm font-bold text-slate-500">Pickup</p><p className="font-black">{trip.pickupLocationName}</p></div></div>
          <div className="flex gap-3"><Navigation className="mt-1 text-route" /><div><p className="text-sm font-bold text-slate-500">Destination</p><p className="font-black">{trip.dropLocationName}</p></div></div>
        </div>
      </div>
      <div className="rounded-lg bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-500">Customer</p>
        <p className="text-2xl font-black">{trip.customerName || trip.user?.name || 'Customer'}</p>
        {(trip.customerPhone || trip.user?.phone) && <a href={`tel:${trip.customerPhone || trip.user?.phone}`} className="mt-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-emerald px-4 text-lg font-black text-white"><Phone /> Call Customer</a>}
        <div className="mt-4 grid gap-2 text-sm">
          <p><b>Vehicle:</b> {trip.vehicle?.name || 'Assigned vehicle'}</p>
          <p><b>Plate:</b> {trip.vehicle?.numberPlate || 'Not set'}</p>
          <p><b>Color:</b> {trip.vehicle?.color || 'Not set'}</p>
          <p><b>Scheduled:</b> {trip.scheduledTime ? new Date(trip.scheduledTime).toLocaleString() : 'Now'}</p>
        </div>
      </div>
    </div>
    <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-4">
      {canStart && <Button className="min-h-16 text-lg" onClick={() => setConfirmAction('start')}><Route /> Start Trip</Button>}
      {canComplete && <Button className="min-h-16 bg-emerald text-lg text-white hover:bg-emerald" onClick={() => setConfirmAction('complete')}><CheckCircle2 /> Finish Trip</Button>}
      <Button variant="outline" className="min-h-16 text-lg" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.dropLocationName)}`, '_blank')}><Navigation /> View Route</Button>
      <Button variant="outline" className="min-h-16 text-lg"><AlertTriangle /> Report Issue</Button>
    </div>
    {confirmAction && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-slate-950 shadow-soft">
        <h3 className="text-2xl font-black">{confirmAction === 'start' ? 'Start this trip now?' : 'Finish this trip?'}</h3>
        <p className="mt-2 text-slate-600">This will update the booking status and notify CabXpress.</p>
        <div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button><Button onClick={runAction} disabled={busy}>{busy ? 'Updating...' : 'Confirm'}</Button></div>
      </div>
    </div>}
  </Panel>;
}

export function DriverDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    api.get('/driver/dashboard').then((r) => setData(r.data)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);
  const activeTrip = data?.activeTrip;
  return <div>
    <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><h1 className="text-4xl font-black">CabXpress Driver</h1><p className="mt-2 text-lg text-slate-300">Large controls for assigned trips and pickup updates.</p></div><div className="rounded-lg bg-white/10 px-4 py-3 text-lg font-black"><Clock className="mr-2 inline" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
    {loading ? <div className="rounded-lg bg-white/10 p-8 text-center font-bold">Loading assigned trips...</div> : activeTrip ? <TripCard trip={activeTrip} onChanged={load} /> : <EmptyState title="No active assigned trip" text="Confirmed trips assigned to you will appear here." />}
    <DriverTripsPage compact />
  </div>;
}

export function DriverTripsPage({ compact = false }: { compact?: boolean }) {
  const [upcoming, setUpcoming] = useState<Trip[]>([]);
  const [history, setHistory] = useState<Trip[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    api.get('/driver/trips/upcoming').then((r) => setUpcoming(Array.isArray(r.data) ? r.data : [])).catch(() => setUpcoming([]));
    api.get('/driver/trips/history').then((r) => setHistory(Array.isArray(r.data) ? r.data : [])).catch(() => setHistory([]));
  }, []);
  return <div className="mt-8 grid gap-6 lg:grid-cols-2">
    <Panel className="bg-white p-5 text-slate-950"><h2 className="text-2xl font-black">Upcoming trips</h2>{upcoming.length ? upcoming.map((trip) => <button key={trip.id} onClick={() => navigate(`/driver/trips/${trip.id}`)} className="mt-4 block w-full rounded-lg bg-slate-50 p-4 text-left hover:bg-amber-50"><p className="font-black">{trip.bookingReference}</p><p className="mt-1 text-sm text-slate-600">{trip.pickupLocationName} to {trip.dropLocationName}</p><p className="mt-1 text-sm font-bold text-slate-700">{trip.vehicle?.name} · {trip.vehicle?.numberPlate}</p></button>) : <p className="mt-4 rounded-lg bg-slate-50 p-5 text-center font-semibold text-slate-500">No upcoming trips.</p>}</Panel>
    <Panel className="bg-white p-5 text-slate-950"><h2 className="text-2xl font-black">Completed trips</h2>{history.length ? history.slice(0, compact ? 3 : 20).map((trip) => <div key={trip.id} className="mt-4 rounded-lg bg-slate-50 p-4"><p className="font-black">{trip.bookingReference}</p><p className="mt-1 text-sm text-slate-600">{trip.dropLocationName}</p></div>) : <p className="mt-4 rounded-lg bg-slate-50 p-5 text-center font-semibold text-slate-500">No completed trips yet.</p>}</Panel>
  </div>;
}

export function DriverTripDetailsPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  useEffect(() => { api.get(`/driver/trips/${id}`).then((r) => setTrip(r.data)); }, [id]);
  if (!trip) return <div className="rounded-lg bg-white/10 p-8 text-center font-bold">Loading trip...</div>;
  return <TripCard trip={trip} onChanged={() => api.get(`/driver/trips/${id}`).then((r) => setTrip(r.data))} />;
}
