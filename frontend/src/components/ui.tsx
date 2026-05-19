import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Car, Loader2, Search, ShieldCheck, Star } from 'lucide-react';
import { categoryFallbackImage, vehicleImage, Vehicle } from '../api/client';

export function Button({ children, variant = 'primary', className = '', ...props }: any) {
  const styles = variant === 'dark'
    ? 'bg-ink text-white hover:bg-night'
    : variant === 'ghost'
      ? 'bg-transparent text-slate-700 hover:bg-slate-100'
      : variant === 'outline'
        ? 'border border-slate-200 bg-white text-slate-900 hover:border-brand'
        : variant === 'danger'
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-brand text-ink hover:bg-amber-400';
  return <button className={`focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`} {...props}>{children}</button>;
}

export function Section({ children, dark = false, className = '' }: { children: ReactNode; dark?: boolean; className?: string }) {
  return <section className={`${dark ? 'bg-ink text-white' : 'bg-mist text-slate-950'} py-20 ${className}`}><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div></section>;
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.55 }} className={className}>{children}</motion.div>;
}

export function StatCard({ label, value, tone = 'blue' }: { label: string; value: string | number; tone?: 'blue' | 'green' | 'amber' }) {
  const colors = tone === 'green' ? 'bg-emerald/10 text-emerald' : tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-route';
  return <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-4 inline-flex rounded-lg px-3 py-2 text-sm font-bold ${colors}`}>{label}</div><div className="text-3xl font-black text-slate-950">{value}</div></div>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center"><Car className="mx-auto mb-3 text-brand" /><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p></div>;
}

export function LoadingState() {
  return <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-8 text-slate-500"><Loader2 className="animate-spin" size={18} /> Loading CabXpress data</div>;
}

export function SearchBox({ placeholder = 'Search', value, onChange }: { placeholder?: string; value: string; onChange: (value: string) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5"><Search size={18} className="text-slate-400" /><input className="w-full bg-transparent text-sm outline-none" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="block text-sm font-bold text-slate-800"><span>{label}</span><div className="mt-2">{children}</div>{error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}</label>;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function StatusPill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const toneClass = tone === 'success' ? 'bg-emerald/10 text-emerald' : tone === 'warning' ? 'bg-amber-100 text-amber-800' : tone === 'danger' ? 'bg-red-50 text-red-700' : tone === 'info' ? 'bg-blue-50 text-route' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${toneClass}`}>{children}</span>;
}

export function ErrorPanel({ title = 'Something went wrong', text = 'This section could not be loaded. Please retry or return home.', onRetry }: { title?: string; text?: string; onRetry?: () => void }) {
  return <div className="rounded-lg border border-red-100 bg-white p-8 text-center shadow-sm">
    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-red-50 text-xl font-black text-red-700">!</div>
    <h2 className="text-2xl font-black text-slate-950">{title}</h2>
    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{text}</p>
    <div className="mt-5 flex justify-center gap-2">
      {onRetry && <Button onClick={onRetry}>Retry</Button>}
      <a href="/" className="focus-ring inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:border-brand">Go Home</a>
    </div>
  </div>;
}

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <Section><ErrorPanel onRetry={() => this.setState({ hasError: false })} /></Section>;
    }
    return this.props.children;
  }
}

export function VehicleCard({ vehicle, onBook, onOpen }: { vehicle: Vehicle; onBook?: () => void; onOpen?: () => void }) {
  const reviewText = Number(vehicle.reviewCount || 0) > 0 && vehicle.averageRating
    ? vehicle.averageRating.toFixed(2)
    : 'No reviews yet';
  const fallback = categoryFallbackImage(vehicle);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
        <img src={vehicleImage(vehicle)} alt={vehicle.name} onError={(event) => { if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback; }} className="h-full w-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-sm font-semibold text-brandDark">{vehicle.category?.name || 'Cab'}</p><h3 className="text-xl font-black text-slate-950">{vehicle.name}</h3></div>
          <span className="inline-flex max-w-28 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"><Star size={15} fill="currentColor" /> {reviewText}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
          <span className="rounded-lg bg-slate-50 p-2">{vehicle.seats} seats</span>
          <span className="rounded-lg bg-slate-50 p-2">{vehicle.luggageCapacity} bags</span>
          <span className="rounded-lg bg-slate-50 p-2">{vehicle.fuelType}</span>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div><p className="text-xs text-slate-500">From</p><p className="font-black">LKR {vehicle.pricePerKm}/km</p></div>
          <div className="flex gap-2">
            {onOpen && <Button variant="outline" onClick={onOpen}>Details</Button>}
            <Button onClick={onBook}>Book now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrustStrip() {
  return <div className="grid gap-3 sm:grid-cols-3"><div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm"><ShieldCheck className="text-emerald" /> Verified vehicles</div><div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm"><ShieldCheck className="text-emerald" /> Pickup OTP</div><div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm"><ShieldCheck className="text-emerald" /> Transparent fare</div></div>;
}
