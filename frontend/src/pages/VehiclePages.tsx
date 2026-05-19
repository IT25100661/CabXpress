import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, categoryDescriptions, categoryFallbackImage, fallbackVehicles, vehicleGallery, Vehicle } from '../api/client';
import { Button, EmptyState, ErrorPanel, LoadingState, Section, VehicleCard } from '../components/ui';

export function VehicleListingPage() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const navigate = useNavigate();
  useEffect(() => { api.get('/vehicles/public').then((r) => setVehicles(r.data)).catch(() => setVehicles(fallbackVehicles)); }, []);
  return <Section><div className="mb-8 flex items-end justify-between"><div><h1 className="text-4xl font-black">CabXpress vehicles</h1><p className="mt-2 text-slate-600">Browse verified cabs with detailed specs, comfort features, and transparent pricing.</p></div><Link to="/booking"><Button>Start booking</Button></Link></div>{vehicles === null ? <LoadingState /> : vehicles.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">{vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} onOpen={() => navigate(`/vehicles/${v.id}`)} onBook={() => navigate(`/booking?vehicleId=${v.id}`)} />)}</div> : <EmptyState title="No vehicles available" text="Please check back soon or contact CabXpress support." />}</Section>;
}

export function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [similar, setSimilar] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get(`/vehicles/${id}`).then((r) => {
      if (!active) return;
      setVehicle(r.data);
      setSimilar(fallbackVehicles.filter((item) => item.id !== Number(id)).slice(0, 4));
    }).catch((err) => {
      if (!active) return;
      if (err?.response?.status === 404) setVehicle(null);
      else setError(err?.response?.data?.message || 'Vehicle details could not be loaded.');
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading) return <Section><LoadingState /></Section>;
  if (error) return <Section><ErrorPanel title="Vehicle details unavailable" text={error} onRetry={() => window.location.reload()} /></Section>;
  if (!vehicle) return <Section><EmptyState title="Vehicle not found" text="This vehicle may have been removed or is no longer available." /></Section>;

  const gallery = vehicleGallery(vehicle);
  const fallback = categoryFallbackImage(vehicle);
  return <Section><div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"><div className="overflow-hidden rounded-lg bg-white shadow-soft"><img src={gallery[0] || fallback} alt={vehicle.name} onError={(event) => { if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback; }} className="aspect-[16/10] w-full object-cover" /><div className="grid grid-cols-3 gap-2 p-3">{gallery.slice(1).concat(gallery).slice(0, 3).map((image, i) => <img key={`${image}-${i}`} src={image || fallback} alt={`${vehicle.name} gallery`} onError={(event) => { if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback; }} className="h-24 w-full rounded-lg object-cover" />)}</div></div><div><p className="font-bold text-brandDark">{vehicle.category?.name}</p><h1 className="mt-2 text-5xl font-black">{vehicle.name}</h1><p className="mt-4 text-lg leading-8 text-slate-600">{vehicle.description}</p><p className="mt-3 text-sm font-bold text-slate-500">{vehicle.reviewCount ? `${vehicle.averageRating?.toFixed(2)} average rating from ${vehicle.reviewCount} reviews` : 'No reviews yet.'}</p><div className="mt-6 grid grid-cols-2 gap-3 text-sm">{Object.entries({ Brand: vehicle.brand, Model: vehicle.model, Color: vehicle.color, Plate: vehicle.numberPlate, Seats: vehicle.seats, Fuel: vehicle.fuelType }).map(([k,v]) => <div key={k} className="rounded-lg bg-white p-4 shadow-sm"><p className="text-slate-500">{k}</p><p className="font-bold">{v}</p></div>)}</div><div className="mt-8 rounded-lg bg-ink p-6 text-white"><p className="text-slate-300">Fare information</p><p className="text-3xl font-black text-brand">LKR {vehicle.pricePerKm}/km</p><Link to={`/booking?vehicleId=${vehicle.id}`}><Button className="mt-5 w-full">Book this vehicle</Button></Link></div></div></div><h2 className="mt-16 text-3xl font-black">Similar vehicles</h2><div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">{similar.map((v) => <VehicleCard key={v.id} vehicle={v} onOpen={() => navigate(`/vehicles/${v.id}`)} onBook={() => navigate(`/booking?vehicleId=${v.id}`)} />)}</div></Section>;
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<{ id?: number; name: string; description?: string }[] | null>(null);
  useEffect(() => { api.get('/categories').then((r) => setCategories(Array.isArray(r.data) ? r.data : [])).catch(() => setCategories(Object.entries(categoryDescriptions).map(([name, description]) => ({ name, description })))); }, []);
  const rows = categories || Object.entries(categoryDescriptions).map(([name, description]) => ({ name, description }));
  return <Section><h1 className="text-4xl font-black">Vehicle categories</h1><p className="mt-2 text-slate-600">Choose the right comfort level for your route, passengers, and luggage.</p>{categories === null ? <div className="mt-8"><LoadingState /></div> : <div className="mt-8 grid gap-4 md:grid-cols-3">{rows.map((c) => <div key={c.name} className="rounded-lg bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">{c.name}</h2><p className="mt-2 leading-7 text-slate-600">{c.description || categoryDescriptions[c.name] || 'Verified CabXpress category with transparent pricing.'}</p></div>)}</div>}</Section>;
}
