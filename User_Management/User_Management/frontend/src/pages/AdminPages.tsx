import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, categoryFallbackImage, resolveAssetUrl, UserSummary } from '../api/client';
import { Button, Panel, SearchBox, StatCard, StatusPill } from '../components/ui';
import { vehicleFallbackImages, vehicleImage } from '../api/client';

const fallbackRows: Record<string, string[][]> = {
  users: [['1', 'CabXpress Admin', 'admin@cabxpress.test', 'ADMIN', 'Enabled'], ['2', 'Nimal Perera', 'user@cabxpress.test', 'USER', 'Enabled']],
  vehicles: [['1', 'Toyota Prius', 'Economy', 'CBX-1001', 'Available'], ['4', 'Mercedes-Benz S-Class', 'Luxury', 'CBX-9001', 'Available'], ['5', 'Toyota HiAce', 'Van', 'CBX-5001', 'Available']],
  categories: [['1', 'Economy', 'Active'], ['2', 'Business', 'Active'], ['6', 'Luxury', 'Active']],
  bookings: [['1001', 'CBX-24051001', 'Nimal Perera', 'Confirmed', 'Paid'], ['1002', 'CBX-24051002', 'Kavindi Silva', 'Pending', 'Unpaid']],
  pricing: [['1', 'Economy', '350', '110', 'Active'], ['6', 'Luxury', '1200', '260', 'Active']],
  cms: [['1', 'home-hero', 'Book reliable rides in minutes', 'Published'], ['2', 'about', 'About CabXpress', 'Published']],
  themes: [['1', 'CabXpress Premium', '#FDB813', 'Active']]
};

const endpoints: Record<string, string> = {
  users: '/users',
  vehicles: '/vehicles',
  categories: '/categories',
  bookings: '/bookings',
  pricing: '/pricing',
  cms: '/cms/pages',
  themes: '/themes'
};

const listEndpoints: Record<string, string> = {
  ...endpoints,
  categories: '/categories/admin',
  cms: '/cms/pages/admin',
  themes: '/themes/admin'
};

function normalizeRows(type: string, data: any[]): string[][] {
  return data.map((item: any) => {
    if (type === 'vehicles') return [item.id, item.name, item.category?.name || 'Vehicle', item.numberPlate, item.assignedDriver?.name || 'Unassigned', item.availabilityStatus].map(String);
    if (type === 'bookings') return [item.bookingReference, item.customerName || item.user?.name || item.userName || 'Customer', item.vehicle?.name || item.vehicleName || 'Vehicle', item.vehicle?.numberPlate || item.numberPlate || 'Plate pending', item.driver?.name || 'Unassigned', item.bookingStatus, item.paymentStatus, `LKR ${Number(item.fareAmount || item.fare || 0).toLocaleString()}`, item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Created time pending'].map(String);
    if (type === 'pricing') return [item.id, item.category?.name || 'Category', item.baseFare, item.pricePerKm, item.active ? 'Active' : 'Inactive'].map(String);
    if (type === 'cms') return [item.id, item.slug, item.title, 'Published'].map(String);
    if (type === 'themes') return [item.id, item.name, item.primaryColor, item.activeTheme ? 'Active' : 'Inactive'].map(String);
    if (type === 'categories') return [item.id, item.name, item.active === false ? 'Inactive' : 'Active'].map(String);
    return [item.id, item.name, item.email, item.role, item.enabled === false ? 'Disabled' : 'Enabled'].map(String);
  });
}

function defaultForm(type: string) {
  if (type === 'vehicles') return { availabilityStatus: 'AVAILABLE', airConditioned: true, categoryId: 1, seats: 4, luggageCapacity: 2, fuelType: 'Hybrid', transmission: 'Automatic', imageUrl: vehicleFallbackImages.Cab };
  if (type === 'categories') return { active: true };
  if (type === 'pricing') return { categoryId: 1, baseFare: 350, pricePerKm: 110, pricePerMinute: 18, minimumFare: 650, surgeMultiplier: 1, discountPercentage: 0, active: true };
  if (type === 'cms') return { slug: '', title: '', content: '' };
  if (type === 'themes') return { activeTheme: true, primaryColor: '#FDB813', secondaryColor: '#1A1A1A', accentColor: '#0052CC', backgroundColor: '#F9F9F9', surfaceColor: '#FFFFFF', textColor: '#1A1C1C' };
  if (type === 'users') return { role: 'USER', enabled: true, verified: true, password: 'User@12345' };
  if (type === 'bookings') return { vehicleId: 1, pickupLocationName: 'Colombo Fort, Colombo', pickupLatitude: 6.9344, pickupLongitude: 79.8428, dropLocationName: 'Bandaranaike Airport, Katunayake', dropLatitude: 7.1808, dropLongitude: 79.8841, distanceKm: 0, durationMinutes: 0, scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 19), bookingStatus: 'PENDING', paymentStatus: 'UNPAID' };
  return {};
}

function buildPayload(type: string, data: any) {
  if (type === 'vehicles') {
    return {
      ...data,
      category: { id: Number(data.categoryId || data.category?.id || 1) },
      seats: Number(data.seats || 4),
      luggageCapacity: Number(data.luggageCapacity || 2),
      baseFare: Number(data.baseFare || 0),
      pricePerKm: Number(data.pricePerKm || 0),
      pricePerMinute: Number(data.pricePerMinute || 0),
      airConditioned: data.airConditioned !== false,
      mainImageUrl: data.mainImageUrl || data.imageUrl || vehicleFallbackImages.Cab,
      imageUrl: data.mainImageUrl || data.imageUrl || vehicleFallbackImages.Cab,
      galleryImages: String(data.galleryImagesText || data.galleryImages || '').split(/\n|,/).map((item) => item.trim()).filter(Boolean).join(',')
      ,
      assignedDriver: data.assignedDriverId ? { id: Number(data.assignedDriverId) } : null
    };
  }
  if (type === 'pricing') {
    return {
      ...data,
      category: { id: Number(data.categoryId || data.category?.id || 1) },
      baseFare: Number(data.baseFare || 0),
      pricePerKm: Number(data.pricePerKm || 0),
      pricePerMinute: Number(data.pricePerMinute || 0),
      minimumFare: Number(data.minimumFare || 0),
      surgeMultiplier: Number(data.surgeMultiplier || 1),
      discountPercentage: Number(data.discountPercentage || 0),
      active: data.active !== false
    };
  }
  if (type === 'users') {
    return {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role || 'USER',
      enabled: data.enabled !== false,
      verified: data.verified !== false,
      passwordHash: data.password || data.passwordHash || 'User@12345'
    };
  }
  if (type === 'bookings') {
    return {
      vehicleId: Number(data.vehicleId || data.vehicle?.id || 1),
      pickupLocationName: data.pickupLocationName || data.pickup || 'Colombo Fort, Colombo',
      pickupLatitude: Number(data.pickupLatitude || 6.9344),
      pickupLongitude: Number(data.pickupLongitude || 79.8428),
      dropLocationName: data.dropLocationName || data.drop || 'Bandaranaike Airport, Katunayake',
      dropLatitude: Number(data.dropLatitude || 7.1808),
      dropLongitude: Number(data.dropLongitude || 79.8841),
      distanceKm: Number(data.distanceKm || 0),
      durationMinutes: Number(data.durationMinutes || 0),
      scheduledTime: String(data.scheduledTime || new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 19)).replace('Z', '').slice(0, 19),
      bookingStatus: data.bookingStatus || 'PENDING',
      paymentStatus: data.paymentStatus || 'UNPAID',
      driver: data.assignedDriverId ? { id: Number(data.assignedDriverId) } : data.driver
    };
  }
  return data;
}

export function AdminDashboardPage() {
  const revenue = [{ d: 'Mon', v: 18000 }, { d: 'Tue', v: 24000 }, { d: 'Wed', v: 21000 }, { d: 'Thu', v: 28000 }, { d: 'Fri', v: 32000 }];
  const status = [{ name: 'Confirmed', value: 18 }, { name: 'Pending', value: 7 }, { name: 'Completed', value: 31 }];
  return <div><h1 className="text-4xl font-black">Admin dashboard</h1><p className="mt-2 text-slate-600">Operational overview for bookings, vehicles, pricing, and rider support.</p><div className="mt-6 grid gap-4 md:grid-cols-4"><StatCard label="Users" value="42" /><StatCard label="Vehicles" value="18" /><StatCard label="Bookings" value="128" tone="green" /><StatCard label="Revenue" value="LKR 420K" tone="amber" /></div><div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]"><Panel className="p-6"><h2 className="font-black">Revenue trend</h2><ResponsiveContainer width="100%" height={260}><AreaChart data={revenue}><defs><linearGradient id="rev" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#FDB813" stopOpacity={0.5} /><stop offset="1" stopColor="#FDB813" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="d" /><YAxis /><Tooltip /><Area type="monotone" dataKey="v" stroke="#7C5800" fill="url(#rev)" /></AreaChart></ResponsiveContainer></Panel><Panel className="p-6"><h2 className="font-black">Booking status</h2><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={status} dataKey="value" outerRadius={90}>{status.map((_, i) => <Cell key={i} fill={['#10B981', '#FDB813', '#0052CC'][i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Panel></div><div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><CrudTable title="Recent bookings" type="bookings" /><Panel className="p-6"><h2 className="text-2xl font-black">Vehicle status</h2>{['Toyota Prius', 'Toyota Axio', 'Mercedes-Benz S-Class', 'Toyota HiAce'].map((vehicle, i) => <div key={vehicle} className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="font-semibold">{vehicle}</span><StatusPill tone={i === 2 ? 'warning' : 'success'}>{i === 2 ? 'Scheduled' : 'Available'}</StatusPill></div>)}</Panel></div></div>;
}

export function CrudPage({ title, type }: { title: string; type: keyof typeof fallbackRows }) {
  return <div><h1 className="text-4xl font-black">{title}</h1><p className="mt-2 text-slate-600">Search, filter, create, edit, delete, and manage operational records.</p><CrudTable title={title} type={type} /></div>;
}

function CrudTable({ title, type }: { title: string; type: keyof typeof fallbackRows }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [drivers, setDrivers] = useState<UserSummary[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  const loadData = () => {
    api.get(listEndpoints[type])
      .then((r) => Array.isArray(r.data) && setRawRows(r.data))
      .catch(() => setRawRows([]));
  };

  useEffect(() => {
    loadData();
    if (type === 'vehicles' || type === 'bookings') {
      api.get('/users?role=CAB_DRIVER').then((r) => setDrivers(Array.isArray(r.data) ? r.data : [])).catch(() => setDrivers([]));
    }
    if (type === 'vehicles') {
      api.get('/categories/admin').then((r) => setCategories(Array.isArray(r.data) ? r.data : [])).catch(() => setCategories([]));
    }
  }, [type]);

  const handleEdit = (item: any) => {
    setEditItem(item);
    setFormData({ ...item, categoryId: item?.category?.id, assignedDriverId: item?.assignedDriver?.id || item?.driver?.id || '', mainImageUrl: item?.mainImageUrl || item?.imageUrl || '', galleryImagesText: Array.isArray(item?.galleryImages) ? item.galleryImages.join('\n') : String(item?.galleryImages || '').split(',').join('\n') });
    setImageFile(null);
    setFormError('');
    setOpen(true);
  };

  const handleCreate = () => {
    setEditItem(null);
    setFormData(defaultForm(type));
    setImageFile(null);
    setFormError('');
    setOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await api.delete(`${endpoints[type]}/${id}`);
        loadData();
      } catch (err) {
        console.error('Failed to delete', err);
      }
    }
  };

  const handleSave = async () => {
    try {
      setFormError('');
      const payload = buildPayload(type, formData);
      let savedItem;
      if (editItem?.id) {
        const r = await api.put(`${endpoints[type]}/${editItem.id}`, payload);
        savedItem = r.data || editItem;
      } else {
        const r = await api.post(endpoints[type], payload);
        savedItem = r.data;
      }

      if (type === 'vehicles' && imageFile && savedItem?.id) {
        const imgData = new FormData();
        imgData.append('file', imageFile);
        await api.post(`${endpoints[type]}/${savedItem.id}/image`, imgData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save', err);
      setFormError('Failed to save record. Check required fields and try again.');
    }
  };

  const displayRows = useMemo(() => normalizeRows(type, rawRows).map((row, i) => ({ display: row, raw: rawRows[i] })).filter((item) => {
    const haystack = item.display.join(' ').toLowerCase();
    if (!haystack.includes(query.toLowerCase())) return false;
    if (type !== 'bookings') return true;
    if (statusFilter && item.raw?.bookingStatus !== statusFilter) return false;
    if (paymentFilter && item.raw?.paymentStatus !== paymentFilter) return false;
    if (driverFilter === 'assigned' && !item.raw?.driver) return false;
    if (driverFilter === 'unassigned' && item.raw?.driver) return false;
    if (vehicleFilter && String(item.raw?.vehicle?.id || '') !== vehicleFilter) return false;
    return true;
  }), [query, rawRows, type, statusFilter, paymentFilter, driverFilter, vehicleFilter]);

  return <Panel className="mt-6 p-6">
    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="flex gap-2">
        <SearchBox value={query} onChange={setQuery} />
        <Button onClick={handleCreate}>Create</Button>
      </div>
    </div>
    {type === 'bookings' && <div className="mb-5 grid gap-3 md:grid-cols-5">
      <select className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="">All statuses</option>
        {['INITIATED','PENDING_PAYMENT','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','PAYMENT_FAILED'].map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
        <option value="">All payments</option>
        {['UNPAID','PENDING','PAID','FAILED','REFUNDED'].map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold" value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)}>
        <option value="">All driver assignments</option>
        <option value="assigned">Assigned driver</option>
        <option value="unassigned">Unassigned driver</option>
      </select>
      <select className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
        <option value="">All vehicles</option>
        {Array.from(new Map(rawRows.filter((row) => row.vehicle?.id).map((row) => [row.vehicle.id, row.vehicle] as [number, any])).values()).map((vehicle: any) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
      </select>
      <Button variant="outline" onClick={() => { setStatusFilter(''); setPaymentFilter(''); setDriverFilter(''); setVehicleFilter(''); setQuery(''); }}>Clear filters</Button>
    </div>}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        {type === 'bookings' && <thead><tr className="border-b text-xs uppercase text-slate-500">{['Booking reference','Customer','Vehicle','Number plate','Assigned driver','Booking status','Payment status','Fare','Created time','Actions'].map((head) => <th key={head} className="py-3 pr-5">{head}</th>)}</tr></thead>}
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.display.join('-') + row.raw?.id} className={`border-b last:border-0 ${type === 'bookings' && !row.raw?.driver && row.raw?.bookingStatus === 'CONFIRMED' ? 'bg-amber-50' : ''}`}>
              {row.display.map((cell: string, index: number) => (
                <td key={`${cell}-${index}`} className="py-4 pr-5">
                  {type === 'vehicles' && index === 1 ? (
                    <div className="flex min-w-52 items-center gap-3"><img src={vehicleImage(row.raw)} onError={(event) => { event.currentTarget.src = categoryFallbackImage(row.raw); }} className="h-14 w-20 rounded-lg object-cover" /><span className="font-bold">{cell}</span></div>
                  ) : type === 'bookings' && index === 4 && cell === 'Unassigned' ? (
                    <StatusPill tone="warning">Unassigned</StatusPill>
                  ) : type === 'bookings' && (index === 5 || index === 6) ? (
                    <StatusPill tone={cell === 'PAID' || cell === 'CONFIRMED' || cell === 'COMPLETED' ? 'success' : cell.includes('FAILED') || cell === 'CANCELLED' ? 'danger' : 'warning'}>{cell}</StatusPill>
                  ) : index === row.display.length - 1 ? (
                    <StatusPill tone={cell.toLowerCase().includes('paid') || cell.toLowerCase().includes('active') || cell.toLowerCase().includes('available') || cell.toLowerCase().includes('enabled') ? 'success' : 'warning'}>{cell}</StatusPill>
                  ) : cell}
                </td>
              ))}
              <td className="flex gap-2 py-3">
                <Button variant="outline" onClick={() => handleEdit(row.raw)}>{type === 'bookings' && !row.raw?.driver ? 'Assign driver' : 'Edit'}</Button>
                <Button variant="outline" onClick={() => handleDelete(row.raw?.id || row.display[0])}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {!displayRows.length && <p className="rounded-lg bg-slate-50 p-6 text-center text-slate-500">No records match the current filter.</p>}
    
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
        <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-soft max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-black">{editItem ? 'Edit' : 'Create'} {title}</h3>
          <div className="mt-4 grid gap-3">
            {type === 'vehicles' ? (
              <>
                <input className="rounded-lg border p-3" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <select className="rounded-lg border p-3" value={formData.categoryId || ''} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <input className="rounded-lg border p-3" placeholder="Brand" value={formData.brand || ''} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Model" value={formData.model || ''} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Color" value={formData.color || ''} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Number Plate" value={formData.numberPlate || ''} onChange={(e) => setFormData({ ...formData, numberPlate: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="rounded-lg border p-3" placeholder="Seats" type="number" value={formData.seats || ''} onChange={(e) => setFormData({ ...formData, seats: e.target.value })} />
                  <input className="rounded-lg border p-3" placeholder="Luggage" type="number" value={formData.luggageCapacity || ''} onChange={(e) => setFormData({ ...formData, luggageCapacity: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className="rounded-lg border p-3" placeholder="Base fare" type="number" value={formData.baseFare || ''} onChange={(e) => setFormData({ ...formData, baseFare: e.target.value })} />
                  <input className="rounded-lg border p-3" placeholder="Price per km" type="number" value={formData.pricePerKm || ''} onChange={(e) => setFormData({ ...formData, pricePerKm: e.target.value })} />
                </div>
                <input className="rounded-lg border p-3" placeholder="Fuel type" value={formData.fuelType || ''} onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Transmission" value={formData.transmission || ''} onChange={(e) => setFormData({ ...formData, transmission: e.target.value })} />
                <select className="rounded-lg border p-3" value={formData.availabilityStatus || 'AVAILABLE'} onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}>
                  {['AVAILABLE','RESERVED','UNAVAILABLE','IN_TRIP','MAINTENANCE','INACTIVE'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <select className="rounded-lg border p-3" value={formData.assignedDriverId || ''} onChange={(e) => setFormData({ ...formData, assignedDriverId: e.target.value })}>
                  <option value="">No assigned driver</option>
                  {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} ({driver.email})</option>)}
                </select>
                <div className="flex gap-2">
                  <input className="min-w-0 flex-1 rounded-lg border p-3" placeholder="Main image URL" value={formData.mainImageUrl || ''} onChange={(e) => setFormData({ ...formData, mainImageUrl: e.target.value, imageUrl: e.target.value })} />
                  {(formData.mainImageUrl || imageFile) && <Button variant="outline" onClick={() => { setFormData({ ...formData, mainImageUrl: '', imageUrl: '' }); setImageFile(null); }}>Remove</Button>}
                </div>
                <textarea className="h-24 rounded-lg border p-3" placeholder="Gallery image URLs, one per line" value={formData.galleryImagesText || ''} onChange={(e) => setFormData({ ...formData, galleryImagesText: e.target.value })} />
                <textarea className="h-24 rounded-lg border p-3" placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  {[formData.mainImageUrl, ...(formData.galleryImagesText || '').split('\n')].filter(Boolean).slice(0, 3).map((image: string, index: number) => <img key={`${image}-${index}`} src={resolveAssetUrl(image) || vehicleImage(formData)} onError={(event) => { event.currentTarget.src = categoryFallbackImage(formData); }} className="h-20 w-full rounded-lg object-cover" />)}
                  {!formData.mainImageUrl && !formData.galleryImagesText && <img src={vehicleImage(formData)} className="h-20 w-full rounded-lg object-cover" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
                  <input type="file" className="w-full rounded-lg border p-2" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </div>
              </>
            ) : type === 'categories' ? (
              <>
                <input className="rounded-lg border p-3" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <textarea className="h-28 rounded-lg border p-3" placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={formData.active !== false} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} /> Active</label>
              </>
            ) : type === 'pricing' ? (
              <>
                <input className="rounded-lg border p-3" placeholder="Category ID" value={formData.categoryId || formData.category?.id || ''} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Base fare" type="number" value={formData.baseFare || ''} onChange={(e) => setFormData({ ...formData, baseFare: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Price per km" type="number" value={formData.pricePerKm || ''} onChange={(e) => setFormData({ ...formData, pricePerKm: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Price per minute" type="number" value={formData.pricePerMinute || ''} onChange={(e) => setFormData({ ...formData, pricePerMinute: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Minimum fare" type="number" value={formData.minimumFare || ''} onChange={(e) => setFormData({ ...formData, minimumFare: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Surge multiplier" type="number" step="0.01" value={formData.surgeMultiplier || '1.00'} onChange={(e) => setFormData({ ...formData, surgeMultiplier: e.target.value })} />
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={formData.active !== false} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} /> Active</label>
              </>
            ) : type === 'cms' ? (
              <>
                <input className="rounded-lg border p-3" placeholder="Slug" value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                <textarea className="h-32 rounded-lg border p-3" placeholder="Content" value={formData.content || ''} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />
              </>
            ) : type === 'themes' ? (
              <>
                <input className="rounded-lg border p-3" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                {['primaryColor','secondaryColor','accentColor','backgroundColor','surfaceColor','textColor'].map((field) => <input key={field} className="rounded-lg border p-3" placeholder={field} value={formData[field] || ''} onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} />)}
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={formData.activeTheme !== false} onChange={(e) => setFormData({ ...formData, activeTheme: e.target.checked })} /> Active theme</label>
              </>
            ) : type === 'users' ? (
              <>
                <input className="rounded-lg border p-3" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Email" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                <input className="rounded-lg border p-3" placeholder="Phone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                {!editItem && <input className="rounded-lg border p-3" placeholder="Temporary password" type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />}
                <select className="rounded-lg border p-3" value={formData.role || 'USER'} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="CAB_DRIVER">CAB_DRIVER</option>
                </select>
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={formData.enabled !== false} onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })} /> Enabled</label>
                <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={formData.verified !== false} onChange={(e) => setFormData({ ...formData, verified: e.target.checked })} /> Verified</label>
              </>
            ) : type === 'bookings' ? (
              <>
                {!editItem && <input className="rounded-lg border p-3" placeholder="Vehicle ID" type="number" value={formData.vehicleId || ''} onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })} />}
                {!editItem && <input className="rounded-lg border p-3" placeholder="Pickup location" value={formData.pickupLocationName || ''} onChange={(e) => setFormData({ ...formData, pickupLocationName: e.target.value })} />}
                {!editItem && <input className="rounded-lg border p-3" placeholder="Destination" value={formData.dropLocationName || ''} onChange={(e) => setFormData({ ...formData, dropLocationName: e.target.value })} />}
                <input className="rounded-lg border p-3" placeholder="Scheduled time" value={String(formData.scheduledTime || '').replace('T', ' ').slice(0, 19)} onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value.replace(' ', 'T') })} />
                <select className="rounded-lg border p-3" value={formData.bookingStatus || 'PENDING'} onChange={(e) => setFormData({ ...formData, bookingStatus: e.target.value })}>
                  {['INITIATED','PENDING_PAYMENT','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','PAYMENT_FAILED'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <select className="rounded-lg border p-3" value={formData.paymentStatus || 'UNPAID'} onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}>
                  {['UNPAID','PENDING','PAID','FAILED','REFUNDED'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <select className="rounded-lg border p-3" value={formData.assignedDriverId || ''} onChange={(e) => setFormData({ ...formData, assignedDriverId: e.target.value, driver: e.target.value ? { id: Number(e.target.value) } : null })}>
                  <option value="">No assigned driver</option>
                  {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} ({driver.email})</option>)}
                </select>
              </>
            ) : (
              <>
                <input className="rounded-lg border p-3" placeholder="Name or title" value={formData.name || formData.title || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value, title: e.target.value })} />
                <textarea className="h-28 rounded-lg border p-3" placeholder="Notes or description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </>
            )}
          </div>
          {formError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{formError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </div>
    )}
  </Panel>;
}

export function ReportsPage() {
  const popular = [{ c: 'Economy', v: 45 }, { c: 'Luxury', v: 21 }, { c: 'Van', v: 16 }, { c: 'SUV', v: 18 }];
  return <div><h1 className="text-4xl font-black">Reports and analytics</h1><p className="mt-2 text-slate-600">Fleet demand, booking mix, and category performance.</p><Panel className="mt-6 p-6"><ResponsiveContainer width="100%" height={320}><BarChart data={popular}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="c" /><YAxis /><Tooltip /><Bar dataKey="v" fill="#FDB813" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></Panel></div>;
}
