import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BadgeCheck, Car, Check, CheckCircle2, Clock, CreditCard, Loader2, MapPin, Navigation, Phone, Route, ShieldCheck, UserRound, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, BookingDetails, categoryFallbackImage, fallbackVehicles, resolveAssetUrl, vehicleImage, Vehicle } from '../api/client';
import { Button, ErrorPanel, Field, Panel, Section, StatusPill } from '../components/ui';
import { useAuth } from '../store/auth';

type LocationSuggestion = { id?: string; displayName: string; latitude: number; longitude: number; city?: string; provider?: string; raw?: unknown };
type Fare = { baseFare: number; distanceCharge: number; timeCharge: number; surgeAmount: number; discountAmount: number; totalFare: number; distanceKm: number; durationMinutes: number };
type RouteResult = { distanceKm: number; durationMinutes: number; geometry?: string; provider?: string; estimated?: boolean; warning?: string };
type PaymentIntentState = { bookingId?: number; paymentId?: number; clientSecret?: string; transactionReference?: string; amount?: number; currency?: string; status?: string; mockMode?: boolean; booking?: BookingDetails };

const pickupDefault: LocationSuggestion = { displayName: 'Colombo Fort, Colombo', latitude: 6.9344, longitude: 79.8428, city: 'Colombo' };
const dropDefault: LocationSuggestion = { displayName: 'Bandaranaike Airport, Katunayake', latitude: 7.1808, longitude: 79.8841, city: 'Katunayake' };
const publishableKey = String(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '').trim();
const stripePromise = /^pk_(test|live)_/.test(publishableKey) ? loadStripe(publishableKey) : null;

function money(value?: number | string | null) {
  return `LKR ${Math.round(Number(value || 0)).toLocaleString()}`;
}

function localFare(distanceKm: number, durationMinutes: number, vehicle: Vehicle): Fare {
  const baseFare = Number(vehicle.baseFare || 350);
  const distanceCharge = Number(vehicle.pricePerKm || 110) * distanceKm;
  const timeCharge = 22 * durationMinutes;
  const totalFare = Math.round((baseFare + distanceCharge + timeCharge) * 100) / 100;
  return { baseFare, distanceCharge, timeCharge, surgeAmount: 0, discountAmount: 0, totalFare, distanceKm, durationMinutes };
}

function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const started = Date.now();
    const id = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return seconds;
}

function SearchLocation({ label, value, disabled, onSelect }: { label: string; value: LocationSuggestion | null; disabled?: boolean; onSelect: (location: LocationSuggestion | null) => void }) {
  const [query, setQuery] = useState(value?.displayName || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value?.displayName) setQuery(value.displayName);
  }, [value?.displayName]);

  useEffect(() => {
    const controller = new AbortController();
    const id = window.setTimeout(async () => {
      if (!touched || disabled) return;
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get('/maps/search', { params: { query }, signal: controller.signal });
        setSuggestions((Array.isArray(data) ? data : []).map((item: any) => ({
          id: String(item.id || item.displayName || `${item.latitude}-${item.longitude}`),
          displayName: String(item.displayName || item.name || '').trim(),
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          city: item.city,
          provider: item.provider,
          raw: item.raw || item
        })).filter((item: LocationSuggestion) => item.displayName && Number.isFinite(item.latitude) && Number.isFinite(item.longitude)));
        setError('');
      } catch (err: any) {
        if (err?.name !== 'CanceledError') setError(err?.response?.data?.message || 'Location search is temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(id);
      controller.abort();
    };
  }, [query, touched, disabled]);

  return <Field label={label} error={error}>
    <div className="relative">
      <input disabled={disabled} value={query} onChange={(e) => { setTouched(true); setQuery(e.target.value); if (value?.displayName !== e.target.value) onSelect(null); }} className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-route disabled:bg-slate-100" placeholder={`Search ${label.toLowerCase()}`} />
      {touched && suggestions.length > 0 && (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-2 shadow-soft">
          {suggestions.map((item) => <button key={`${item.displayName}-${item.latitude}`} type="button" onClick={() => { onSelect(item); setQuery(item.displayName); setSuggestions([]); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"><b>{item.displayName}</b><br /><span className="text-xs text-slate-500">{item.city || 'Selected location'}</span></button>)}
        </div>
      )}
      {loading && <p className="mt-2 text-xs font-semibold text-slate-500">Searching locations...</p>}
    </div>
  </Field>;
}

function BookingStepper({ step }: { step: number }) {
  const labels = ['Route details', 'Choose vehicle', 'Secure payment', 'Confirmed'];
  return <div className="mb-6 grid gap-2 sm:grid-cols-4">{labels.map((label, index) => {
    const active = step === index + 1;
    const done = step > index + 1;
    return <div key={label} className={`rounded-lg border px-3 py-3 text-sm font-black ${active ? 'border-brand bg-amber-50 text-ink' : done ? 'border-emerald/20 bg-emerald/10 text-emerald' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
      <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-lg bg-white">{done ? <Check size={14} /> : index + 1}</span>{label}
    </div>;
  })}</div>;
}

function DriverBadge({ driver, confirmed = false }: { driver?: Vehicle['assignedDriver'] | BookingDetails['driver'] | null; confirmed?: boolean }) {
  if (!driver) {
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <p className="font-black text-amber-900">Driver assignment pending</p>
      <p className="mt-1 text-amber-800">Admin will be notified to assign a driver.</p>
    </div>;
  }
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-white"><UserRound size={19} /></span>
      <div>
        <p className="font-black">{driver.name}</p>
        <p className="text-xs font-bold text-slate-500">{confirmed ? 'Driver assigned' : 'Driver will be notified after payment confirmation'}</p>
      </div>
    </div>
    <div className="mt-3 grid gap-1 text-sm text-slate-600">
      {driver.phone && <p><Phone size={14} className="inline" /> {driver.phone}</p>}
      {driver.rating && <p>{Number(driver.rating).toFixed(1)} driver rating</p>}
    </div>
  </div>;
}

function CheckoutPreparationCard({ vehicle, fare, elapsedSeconds, onRetry, onBack }: { vehicle: Vehicle; fare: Fare; elapsedSeconds: number; onRetry: () => void; onBack: () => void }) {
  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-brand/40 bg-amber-50 p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="grid h-14 w-14 place-items-center rounded-lg bg-ink text-brand"><Car /></motion.div>
        <div>
          <h2 className="text-2xl font-black">Preparing secure checkout</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">We’re locking your fare and creating a secure payment session.</p>
        </div>
      </div>
      <Loader2 className="animate-spin text-brandDark" size={32} />
    </div>
    <div className="mt-5 grid gap-3 rounded-lg bg-white p-4 text-sm sm:grid-cols-3">
      <p><b>{vehicle.name}</b><br /><span className="text-slate-500">{vehicle.numberPlate}</span></p>
      <p><b>{money(fare.totalFare)}</b><br /><span className="text-slate-500">Backend fare is being locked</span></p>
      <p><b>{elapsedSeconds}s</b><br /><span className="text-slate-500">Secure session setup</span></p>
    </div>
    {elapsedSeconds >= 3 && elapsedSeconds < 15 && <p className="mt-4 rounded-lg bg-white p-3 text-sm font-bold text-slate-700">Still preparing your secure checkout. Please don’t refresh.</p>}
    {elapsedSeconds >= 15 && <div className="mt-4 rounded-lg bg-white p-4">
      <p className="font-black">This is taking longer than expected.</p>
      <div className="mt-3 flex flex-wrap gap-2"><Button onClick={onRetry}>Try again</Button><Button variant="outline" onClick={onBack}>Back to vehicle selection</Button></div>
    </div>}
  </motion.div>;
}

function PaymentSkeleton() {
  return <div className="rounded-lg border border-slate-200 bg-white p-5">
    <div className="flex items-center gap-3"><Loader2 className="animate-spin text-brandDark" /><div><p className="font-black">Loading secure payment form...</p><p className="text-sm text-slate-600">Stripe Elements is preparing encrypted card fields.</p></div></div>
    <div className="mt-5 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
  </div>;
}

function PaymentErrorCard({ title = 'Couldn’t start payment', message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return <div className="rounded-lg border border-red-100 bg-red-50 p-5 text-red-800">
    <div className="flex gap-3"><AlertTriangle /><div><p className="font-black">{title}</p><p className="mt-1 text-sm leading-6">{message}</p></div></div>
    {onRetry && <Button className="mt-4" variant="outline" onClick={onRetry}>Try again</Button>}
  </div>;
}

function PaymentProgressStepper({ activeStep, elapsedSeconds }: { activeStep: number; elapsedSeconds: number }) {
  const steps = ['Verifying card', 'Confirming payment', 'Finalizing booking', 'Generating pickup OTP'];
  return <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
    <p className="font-black text-route">Processing secure payment...</p>
    <p className="mt-1 text-sm text-slate-700">Please keep this page open while we confirm your booking.</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-4">{steps.map((label, index) => <div key={label} className={`rounded-lg border bg-white p-3 text-sm ${index <= activeStep ? 'border-route' : 'border-slate-200 text-slate-500'}`}>
      <motion.div animate={index === activeStep ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ repeat: index === activeStep ? Infinity : 0, duration: 1 }} className={`mb-2 grid h-7 w-7 place-items-center rounded-lg ${index < activeStep ? 'bg-emerald text-white' : index === activeStep ? 'bg-route text-white' : 'bg-slate-100'}`}>{index < activeStep ? <Check size={15} /> : index + 1}</motion.div>
      <b>{label}</b>
    </div>)}</div>
    {elapsedSeconds >= 5 && elapsedSeconds < 20 && <p className="mt-3 text-sm font-semibold text-slate-700">This can take a few moments.</p>}
    {elapsedSeconds >= 20 && <p className="mt-3 text-sm font-semibold text-slate-700">Still working. Please do not retry unless an error appears.</p>}
  </div>;
}

function TrustIndicators() {
  return <div className="grid gap-2 text-sm sm:grid-cols-3">
    {['Secure Stripe test checkout', 'Encrypted payment details', 'CabXpress does not store card details'].map((item) => <div key={item} className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 font-bold text-slate-700"><ShieldCheck size={16} className="text-emerald" /> {item}</div>)}
  </div>;
}

function RideSummary({ pickup, drop, routeInfo, fare, vehicle, booking, paymentIntent, confirming }: { pickup: LocationSuggestion | null; drop: LocationSuggestion | null; routeInfo: RouteResult | null; fare: Fare | null; vehicle: Vehicle | null; booking: BookingDetails | null; paymentIntent?: PaymentIntentState | null; confirming?: boolean }) {
  const summaryVehicle = booking?.vehicle;
  const driver = booking?.driver || vehicle?.assignedDriver || null;
  const total = paymentIntent?.amount || booking?.fareAmount || fare?.totalFare || 0;
  return <Panel className="p-5">
    <h2 className="text-xl font-black">Ride summary</h2>
    <div className="mt-4 space-y-3 text-sm">
      <div><p className="text-slate-500">Pickup</p><p className="font-bold">{booking?.pickupLocationName || pickup?.displayName || 'Pickup not selected'}</p></div>
      <div><p className="text-slate-500">Destination</p><p className="font-bold">{booking?.dropLocationName || drop?.displayName || 'Destination not selected'}</p></div>
      <div className="grid grid-cols-2 gap-3">
        <p><span className="text-slate-500">Distance</span><br /><b>{booking?.distanceKm || routeInfo?.distanceKm || 0} km</b></p>
        <p><span className="text-slate-500">Duration</span><br /><b>{Math.round(booking?.durationMinutes || routeInfo?.durationMinutes || 0)} min</b></p>
      </div>
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-slate-500">Vehicle</p>
        <p className="font-black">{summaryVehicle?.name || vehicle?.name || 'Vehicle not selected'}</p>
        <p className="text-slate-600">{summaryVehicle?.color || vehicle?.color || 'Color pending'} · {summaryVehicle?.numberPlate || vehicle?.numberPlate || 'Plate pending'}</p>
      </div>
      <DriverBadge driver={driver} confirmed={booking?.bookingStatus === 'CONFIRMED'} />
      <div className="flex justify-between border-t pt-4 text-lg font-black"><span>Total fare</span><span>{money(total)}</span></div>
      <div className="flex items-center justify-between"><span className="text-slate-500">Payment status</span><StatusPill tone={booking?.paymentStatus === 'PAID' ? 'success' : confirming ? 'info' : 'warning'}>{booking?.paymentStatus || paymentIntent?.status || 'UNPAID'}</StatusPill></div>
    </div>
  </Panel>;
}

function StripePaymentForm({ transactionReference, amount, confirming, onConfirming, onComplete, onError, onRecovery }: { transactionReference?: string; amount: number; confirming: boolean; onConfirming: (active: boolean) => void; onComplete: (booking: BookingDetails) => void; onError: (message: string) => void; onRecovery: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const elapsed = useElapsed(confirming);
  const activeStep = elapsed < 2 ? 0 : elapsed < 4 ? 1 : elapsed < 6 ? 2 : 3;

  useEffect(() => {
    if (!confirming) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [confirming]);

  async function confirm() {
    if (confirming) return;
    if (!transactionReference) return onError('Payment reference is missing. Please refresh the payment step.');
    onError('');
    onConfirming(true);
    try {
      if (!stripe || !elements) throw new Error('Payment form is still loading.');
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/booking` },
        redirect: 'if_required'
      });
      if (result.error) throw new Error(result.error.message);
      try {
        const confirmed = await api.post('/payments/confirm', { transactionReference, providerStatus: result.paymentIntent?.status || 'requires_confirmation' });
        onComplete(confirmed.data);
      } catch (err: any) {
        onRecovery();
        onError(err?.response?.data?.message || 'Payment received, but booking confirmation is still being finalized.');
      }
    } catch (err: any) {
      onError(err?.response?.data?.message || err?.message || 'Payment could not be confirmed.');
    } finally {
      onConfirming(false);
    }
  }

  return <div className="space-y-4">
    <TrustIndicators />
    {!ready && <PaymentSkeleton />}
    <div className={confirming ? 'pointer-events-none opacity-60' : ''}>
      <PaymentElement onReady={() => setReady(true)} onChange={(event: any) => onError(event?.error?.message || '')} />
    </div>
    {confirming && <PaymentProgressStepper activeStep={activeStep} elapsedSeconds={elapsed} />}
    <Button className="w-full min-h-12 text-base" onClick={confirm} disabled={!stripe || !elements || !ready || confirming}>{confirming ? 'Processing secure payment...' : `Pay securely ${money(amount)}`}</Button>
  </div>;
}

function MockPaymentForm({ transactionReference, amount, confirming, onConfirming, onComplete, onError }: { transactionReference?: string; amount: number; confirming: boolean; onConfirming: (active: boolean) => void; onComplete: (booking: BookingDetails) => void; onError: (message: string) => void }) {
  const elapsed = useElapsed(confirming);
  async function confirm() {
    if (confirming) return;
    if (!transactionReference) return onError('Payment reference is missing. Please refresh the payment step.');
    onError('');
    onConfirming(true);
    try {
      const confirmed = await api.post('/payments/confirm', { transactionReference, providerStatus: 'succeeded' });
      onComplete(confirmed.data);
    } catch (err: any) {
      onError(err?.response?.data?.message || err?.message || 'Payment could not be confirmed.');
    } finally {
      onConfirming(false);
    }
  }
  return <div className="space-y-4">
    <TrustIndicators />
    <div className="rounded-lg border border-emerald/20 bg-emerald/10 p-4"><div className="flex items-center gap-3"><ShieldCheck className="text-emerald" /><div><p className="font-black">Secure local test payment</p><p className="text-sm text-slate-600">Mock payment is enabled for this environment.</p></div></div></div>
    {confirming && <PaymentProgressStepper activeStep={elapsed < 2 ? 0 : elapsed < 4 ? 1 : elapsed < 6 ? 2 : 3} elapsedSeconds={elapsed} />}
    <Button className="w-full min-h-12 text-base" onClick={confirm} disabled={confirming}>{confirming ? 'Processing secure payment...' : `Complete test payment ${money(amount)}`}</Button>
  </div>;
}

function SuccessConfirmationAnimation() {
  return <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald text-white">
    <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.55 }}><CheckCircle2 size={46} /></motion.div>
  </motion.div>;
}

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState<LocationSuggestion | null>(pickupDefault);
  const [drop, setDrop] = useState<LocationSuggestion | null>(dropDefault);
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>(fallbackVehicles);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fare, setFare] = useState<Fare | null>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentState | null>(null);
  const [error, setError] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preparationElapsed = useElapsed(isCreatingPaymentIntent);
  const locked = isCreatingPaymentIntent || isConfirmingPayment;

  useEffect(() => {
    api.get('/vehicles/public').then((r) => {
      if (Array.isArray(r.data) && r.data.length) {
        setVehicles(r.data);
        const requestedVehicleId = Number(params.get('vehicleId'));
        if (requestedVehicleId) {
          const match = r.data.find((item: Vehicle) => item.id === requestedVehicleId);
          if (match) setVehicle(match);
        }
      }
    }).catch(() => null);
  }, [params]);

  const selectedFareRows = useMemo(() => [
    ['Base fare', fare?.baseFare || 0],
    ['Distance', fare?.distanceCharge || 0],
    ['Time', fare?.timeCharge || 0],
    ['Surge', fare?.surgeAmount || 0],
    ['Discount', -(fare?.discountAmount || 0)]
  ], [fare]);

  async function estimate(e?: FormEvent) {
    e?.preventDefault();
    setError('');
    setFare(null);
    if (!params.get('vehicleId')) setVehicle(null);
    if (!pickup || !drop) {
      setError('Select both pickup and destination from the suggestions before continuing.');
      return;
    }
    setRouteLoading(true);
    try {
      const route = await api.post('/maps/route', {
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        dropLatitude: drop.latitude,
        dropLongitude: drop.longitude
      });
      setRouteInfo(route.data);
      setStep(2);
    } catch (err: any) {
      if (err?.response?.status && err.response.status < 500) {
        setError(err?.response?.data?.message || 'Please choose two different valid locations.');
        return;
      }
      const distanceKm = Math.max(1, Math.round(Math.hypot(pickup.latitude - drop.latitude, pickup.longitude - drop.longitude) * 111 * 100) / 100);
      const durationMinutes = Math.max(8, Math.round((distanceKm / 32) * 60));
      setRouteInfo({ distanceKm, durationMinutes, provider: 'HAVERSINE_FALLBACK', estimated: true, warning: err?.response?.data?.message || 'Using an estimated route while live routing is unavailable.' });
      setStep(2);
    } finally {
      setRouteLoading(false);
    }
  }

  async function selectVehicle(nextVehicle: Vehicle) {
    if (locked) return;
    setVehicle(nextVehicle);
    const distanceKm = routeInfo?.distanceKm || 0;
    const durationMinutes = routeInfo?.durationMinutes || 0;
    if (!distanceKm || !durationMinutes) {
      setError('Calculate a route before choosing a vehicle.');
      return;
    }
    try {
      const priced = await api.post('/pricing/calculate', { vehicleId: nextVehicle.id, categoryId: nextVehicle.category?.id, distanceKm, durationMinutes });
      setFare(priced.data);
    } catch {
      setFare(localFare(distanceKm, durationMinutes, nextVehicle));
    }
  }

  async function createBooking() {
    if (isCreatingPaymentIntent || paymentIntent?.transactionReference) return;
    if (!vehicle || !fare || !pickup || !drop || !routeInfo) {
      setError('Choose a vehicle and confirm the fare before continuing to payment.');
      return;
    }
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent('/booking')}`);
      return;
    }
    setError('');
    setRecovery(false);
    setIsCreatingPaymentIntent(true);
    try {
      const created = await api.post('/bookings', {
        vehicleId: vehicle.id,
        pickupLocationName: pickup.displayName,
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        dropLocationName: drop.displayName,
        dropLatitude: drop.latitude,
        dropLongitude: drop.longitude,
        distanceKm: routeInfo.distanceKm,
        durationMinutes: routeInfo.durationMinutes,
        scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 19)
      });
      setBooking(created.data);
      const intent = await api.post('/payments/create-intent', { bookingId: created.data.id });
      setPaymentIntent(intent.data);
      setBooking(intent.data.booking || created.data);
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to create a secure payment session. Please check your route and vehicle selection.');
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  }

  async function checkBookingStatus() {
    if (!booking?.id) return;
    try {
      const { data } = await api.get(`/bookings/${booking.id}`);
      setBooking(data);
      if (data.paymentStatus === 'PAID') {
        setRecovery(false);
        setStep(4);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not check booking status.');
    }
  }

  function completePayment(confirmed: BookingDetails) {
    setBooking(confirmed);
    setPaymentIntent((prev) => prev ? { ...prev, booking: confirmed, status: confirmed.paymentStatus } : prev);
    setStep(4);
  }

  if (error && step === 1 && (!pickup || !drop)) {
    return <Section><ErrorPanel title="Route needs attention" text={error} onRetry={() => setError('')} /></Section>;
  }

  return <Section>
    <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><h1 className="text-4xl font-black">Book a CabXpress ride</h1><p className="mt-2 max-w-2xl leading-7 text-slate-600">Search your route, choose a verified vehicle, review the locked fare, and confirm payment.</p></div>{routeInfo?.warning && <StatusPill tone="warning">{routeInfo.warning}</StatusPill>}</div>
    <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
      <Panel className="p-6">
        <BookingStepper step={step} />

        {step === 1 && <form onSubmit={estimate} className="space-y-5">
          <SearchLocation label="Pickup" value={pickup} disabled={locked} onSelect={setPickup} />
          <SearchLocation label="Destination" value={drop} disabled={locked} onSelect={setDrop} />
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <Button disabled={routeLoading || locked}>{routeLoading ? 'Calculating...' : 'Calculate route'}</Button>
        </form>}

        {step === 2 && <div>
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-2xl font-black">Choose your vehicle</h2><p className="mt-1 text-sm text-slate-600">Select the ride category that fits your passengers and luggage.</p></div><StatusPill tone="info">{routeInfo?.distanceKm} km · {Math.round(routeInfo?.durationMinutes || 0)} min</StatusPill></div>
          <div className="grid gap-4">
            {vehicles.slice(0, 8).map((item) => <button key={item.id} disabled={locked} onClick={() => selectVehicle(item)} className={`rounded-lg border p-4 text-left transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-60 ${vehicle?.id === item.id ? 'border-brand bg-amber-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-4"><img src={vehicleImage(item)} onError={(event) => { const fallback = categoryFallbackImage(item); if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback; }} className="h-24 w-32 rounded-lg object-cover" /><div><p className="text-sm font-bold text-brandDark">{item.category?.name}</p><h3 className="text-xl font-black">{item.name}</h3><p className="mt-1 text-sm text-slate-600">{item.color} · {item.numberPlate}</p><p className="mt-1 text-sm text-slate-600">{item.seats} seats · {item.luggageCapacity} bags · {item.fuelType}</p></div></div><div className="text-left sm:text-right"><p className="text-xs font-bold text-slate-500">{vehicle?.id === item.id && fare ? 'Locked estimate' : 'Estimate after selection'}</p><p className="text-2xl font-black">{vehicle?.id === item.id && fare ? money(fare.totalFare) : 'Select'}</p></div></div>
            </button>)}
          </div>
          {error && !isCreatingPaymentIntent && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <AnimatePresence>{isCreatingPaymentIntent && vehicle && fare && <div className="mt-6"><CheckoutPreparationCard vehicle={vehicle} fare={fare} elapsedSeconds={preparationElapsed} onRetry={() => { setPaymentIntent(null); createBooking(); }} onBack={() => { setIsCreatingPaymentIntent(false); setPaymentIntent(null); }} /></div>}</AnimatePresence>
          {!isCreatingPaymentIntent && error && vehicle && fare && <div className="mt-4"><PaymentErrorCard message={error} onRetry={createBooking} /></div>}
          <div className="mt-6 flex justify-end"><Button onClick={createBooking} disabled={!vehicle || !fare || locked}>{isCreatingPaymentIntent ? 'Preparing secure checkout...' : 'Continue to payment'} <CreditCard size={18} /></Button></div>
        </div>}

        {step === 3 && <div>
          <h2 className="text-2xl font-black">Secure payment</h2>
          <p className="mt-2 leading-7 text-slate-600">The server has locked the fare for this booking before payment confirmation.</p>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-sm text-slate-500">Booking reference</p><p className="text-xl font-black">{booking?.bookingReference}</p></div>
          <div className="mt-5">
            {paymentIntent?.clientSecret && !paymentIntent?.mockMode && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret: paymentIntent.clientSecret }}>
                <StripePaymentForm transactionReference={paymentIntent.transactionReference} amount={Number(paymentIntent.amount || booking?.fareAmount || fare?.totalFare || 0)} confirming={isConfirmingPayment} onConfirming={setIsConfirmingPayment} onComplete={completePayment} onError={setError} onRecovery={() => setRecovery(true)} />
              </Elements>
            ) : paymentIntent?.mockMode ? (
              <MockPaymentForm transactionReference={paymentIntent?.transactionReference} amount={Number(paymentIntent?.amount || booking?.fareAmount || fare?.totalFare || 0)} confirming={isConfirmingPayment} onConfirming={setIsConfirmingPayment} onComplete={completePayment} onError={setError} />
            ) : (
              <PaymentErrorCard title="Payment service is temporarily unavailable" message="Secure card checkout is not configured for this environment." />
            )}
          </div>
          {recovery && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="font-black text-amber-900">Payment received, but booking confirmation is still being finalized.</p><Button className="mt-3" variant="outline" onClick={checkBookingStatus}>Check booking status</Button></div>}
          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </div>}

        {step === 4 && <div className="rounded-lg bg-emerald/10 p-6">
          <SuccessConfirmationAnimation />
          <h2 className="mt-5 text-center text-3xl font-black text-emerald">Ride confirmed</h2>
          <p className="mt-3 text-center leading-7 text-slate-700">Keep your pickup OTP ready and share it only with the assigned driver.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4"><p className="text-xs font-bold text-slate-500">Booking reference</p><p className="font-black">{booking?.bookingReference}</p></div>
            <div className="rounded-lg bg-white p-4"><p className="text-xs font-bold text-slate-500">Pickup OTP</p><p className="text-4xl font-black text-ink">{booking?.pickupOtp}</p></div>
            <div className="rounded-lg bg-white p-4"><p className="text-xs font-bold text-slate-500">Payment status</p><p className="font-black">{booking?.paymentStatus || 'PAID'}</p></div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Panel className="overflow-hidden"><img src={resolveAssetUrl(booking?.vehicle?.mainImageUrl) || (vehicle ? vehicleImage(vehicle) : '')} onError={(event) => { if (vehicle) event.currentTarget.src = categoryFallbackImage(vehicle); }} className="h-44 w-full object-cover" /><div className="p-4"><p className="font-black">{booking?.vehicle?.name || vehicle?.name}</p><p className="text-sm text-slate-600">{booking?.vehicle?.categoryName || vehicle?.category?.name} · {booking?.vehicle?.color || vehicle?.color} · {booking?.vehicle?.numberPlate || vehicle?.numberPlate}</p></div></Panel>
            <Panel className="p-4"><h3 className="font-black">Driver details</h3><div className="mt-3"><DriverBadge driver={booking?.driver || null} confirmed /></div><p className="mt-3 text-sm font-bold text-slate-600">{booking?.driver ? 'Driver has been notified' : 'Driver assignment pending — admin has been notified'}</p></Panel>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Button variant="dark" onClick={() => navigate('/user/bookings')}>View my bookings</Button><Button variant="outline" onClick={() => navigate('/')}>Back to home</Button></div>
        </div>}
      </Panel>

      <aside className="space-y-4">
        <Panel className="overflow-hidden bg-ink p-5 text-white">
          <h2 className="flex items-center gap-2 text-xl font-black"><Route /> Route preview</h2>
          <div className="route-grid mt-5 h-72 rounded-lg border border-white/10 p-5">
            <div className="flex h-full flex-col justify-between">
              <span className="flex w-max max-w-full items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-ink"><MapPin size={16} /> {pickup?.displayName || 'Pickup not selected'}</span>
              <span className="self-center rounded-lg bg-brand px-4 py-2 text-sm font-black text-ink">{routeInfo ? `${routeInfo.distanceKm} km · ${Math.round(routeInfo.durationMinutes)} min` : 'Route not calculated'}</span>
              <span className="flex w-max max-w-full items-center gap-2 rounded-lg bg-route px-3 py-2 text-sm font-bold text-white"><Navigation size={16} /> {drop?.displayName || 'Destination not selected'}</span>
            </div>
          </div>
        </Panel>
        {fare && vehicle ? <Panel className="p-5">
          <h2 className="text-xl font-black">Fare breakdown</h2>
          <div className="mt-4 space-y-3">{selectedFareRows.map(([label, value]) => <div key={label} className="flex justify-between text-sm"><span className="text-slate-600">{label}</span><b>LKR {Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</b></div>)}</div>
          <div className="mt-5 flex justify-between border-t pt-4 text-xl font-black"><span>Total</span><span>{money(paymentIntent?.amount || booking?.fareAmount || fare?.totalFare)}</span></div>
        </Panel> : <Panel className="p-5"><h2 className="text-xl font-black">Fare breakdown</h2><p className="mt-2 text-sm leading-6 text-slate-600">Exact fare appears after you calculate a route and select a vehicle.</p></Panel>}
        {vehicle ? <Panel className="p-5">
          <h2 className="text-xl font-black">Selected vehicle</h2>
          <div className="mt-4 flex items-start gap-4"><img src={vehicleImage(vehicle)} onError={(event) => { const fallback = categoryFallbackImage(vehicle); if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback; }} alt={vehicle.name} className="h-24 w-32 rounded-lg object-cover" /><div><p className="font-black">{vehicle.name}</p><p className="text-sm font-bold text-brandDark">{vehicle.category?.name}</p><p className="text-sm text-slate-600">{vehicle.color} · {vehicle.numberPlate}</p><p className="text-sm text-slate-600"><Users size={14} className="inline" /> {vehicle.seats} seats · {vehicle.luggageCapacity} bags · {vehicle.fuelType}</p><p className="mt-1 text-xs font-bold text-slate-500"><Clock size={14} className="inline" /> Pickup in 12-18 min</p></div></div>
          <div className="mt-4"><DriverBadge driver={vehicle.assignedDriver || null} confirmed={step === 4} /></div>
        </Panel> : <Panel className="p-5"><h2 className="text-xl font-black">Selected vehicle</h2><p className="mt-2 text-sm text-slate-600">No vehicle selected yet.</p></Panel>}
        {(step >= 3 || isCreatingPaymentIntent) && <RideSummary pickup={pickup} drop={drop} routeInfo={routeInfo} fare={fare} vehicle={vehicle} booking={booking} paymentIntent={paymentIntent} confirming={isConfirmingPayment || isCreatingPaymentIntent} />}
      </aside>
    </div>
  </Section>;
}
