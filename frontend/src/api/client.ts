import axios from 'axios';

export const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
});

function normalizeApiBaseUrl(value?: string) {
  if (value?.includes('localhost:8081')) return value.replace('localhost:8081', 'localhost:8080');
  if (value) return value;
  return 'http://localhost:8080/api';
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cabxpress_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.dispatchEvent(new Event('cabxpress:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export type Vehicle = {
  id: number;
  name: string;
  category?: { id: number; name: string };
  brand: string;
  model: string;
  color: string;
  numberPlate: string;
  seats: number;
  luggageCapacity: number;
  fuelType: string;
  transmission: string;
  airConditioned: boolean;
  mainImageUrl?: string;
  imageUrl: string;
  baseFare: number;
  pricePerKm: number;
  rating?: number;
  averageRating?: number | null;
  reviewCount?: number;
  description: string;
  availabilityStatus: string;
  galleryImages?: string[] | string;
  assignedDriver?: UserSummary | null;
};

export type UserSummary = { id: number; name: string; email: string; phone?: string; role?: 'USER' | 'ADMIN' | 'CAB_DRIVER'; verified?: boolean; enabled?: boolean; avatarUrl?: string; rating?: number; assigned?: boolean };

export type BookingDetails = {
  id: number;
  bookingReference: string;
  bookingStatus: string;
  paymentStatus: string;
  pickupOtp?: string;
  pickupLocationName: string;
  dropLocationName: string;
  distanceKm: number;
  durationMinutes: number;
  fareAmount: number;
  createdAt?: string;
  scheduledTime?: string;
  customerName?: string;
  customerPhone?: string;
  vehicle?: {
    id: number;
    name: string;
    categoryName?: string;
    color?: string;
    numberPlate?: string;
    seats?: number;
    luggageCapacity?: number;
    fuelType?: string;
    mainImageUrl?: string;
  };
  driver?: UserSummary | null;
  driverAssignmentStatus?: 'ASSIGNED' | 'PENDING' | string;
};

export const vehicleFallbackImages: Record<string, string> = {
  Economy: '/assets/vehicle-fallbacks/economy-car.webp',
  Business: '/assets/vehicle-fallbacks/business-sedan.webp',
  Family: '/assets/vehicle-fallbacks/family-van.webp',
  'Semi-Luxury': '/assets/vehicle-fallbacks/business-sedan.webp',
  Van: '/assets/vehicle-fallbacks/family-van.webp',
  Luxury: '/assets/vehicle-fallbacks/luxury-sedan.webp',
  'Premium SUV': '/assets/vehicle-fallbacks/suv.webp',
  Cab: '/assets/vehicle-fallbacks/generic-cab.webp'
};

export function apiOrigin() {
  const base = api.defaults.baseURL || 'http://localhost:8080/api';
  return base.replace(/\/api\/?$/, '');
}

export function resolveAssetUrl(url?: string | null) {
  const value = typeof url === 'string' ? url.trim() : '';
  if (!value || /bond|underground|london/i.test(value)) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/')) return `${apiOrigin()}${value}`;
  if (value.startsWith('/assets/')) return value;
  return '';
}

export function getVehicleImage(vehicle?: Partial<Vehicle> | null) {
  const mainImage = resolveAssetUrl(vehicle?.mainImageUrl);
  if (mainImage) return mainImage;
  const imageUrl = resolveAssetUrl(vehicle?.imageUrl);
  if (imageUrl) return imageUrl;
  return categoryFallbackImage(vehicle);
}

export const vehicleImage = getVehicleImage;

export function categoryFallbackImage(vehicle?: Partial<Vehicle> | null) {
  return vehicleFallbackImages[vehicle?.category?.name || 'Cab'] || vehicleFallbackImages.Cab;
}

export function vehicleGallery(vehicle?: Partial<Vehicle> | null) {
  const raw = vehicle?.galleryImages;
  const images = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
  return [getVehicleImage(vehicle), ...images.map(resolveAssetUrl).filter(Boolean).filter((image) => image !== getVehicleImage(vehicle))].slice(0, 4);
}

export const categoryDescriptions: Record<string, string> = {
  Economy: 'Ideal for everyday city rides and solo travel. Compact, fuel-efficient vehicles with the lowest per-kilometre rate.',
  Business: 'Comfortable sedans for airport transfers, meetings, and professional travel with extra space and a smoother ride.',
  Family: 'Spacious vehicles for families, luggage, and weekend trips with added comfort for passengers.',
  'Semi-Luxury': 'A balanced choice with premium comfort at a moderate fare, suitable for longer routes and special plans.',
  Van: 'Best for groups, luggage-heavy airport transfers, and family travel with generous seating capacity.',
  Luxury: 'Premium executive vehicles for VIP transfers, events, and high-comfort travel.',
  'Premium SUV': 'Powerful, spacious SUVs for business, family, and outstation routes with extra road presence.'
};

export const fallbackVehicles: Vehicle[] = [
  { id: 1, name: 'Toyota Prius', category: { id: 1, name: 'Economy' }, brand: 'Toyota', model: 'Prius', color: 'Pearl White', numberPlate: 'CBX-1001', seats: 4, luggageCapacity: 2, fuelType: 'Hybrid', transmission: 'Automatic', airConditioned: true, imageUrl: vehicleFallbackImages.Economy, baseFare: 350, pricePerKm: 110, averageRating: null, reviewCount: 0, description: 'Efficient hybrid sedan for city rides and short airport transfers.', availabilityStatus: 'AVAILABLE' },
  { id: 2, name: 'Suzuki WagonR', category: { id: 1, name: 'Economy' }, brand: 'Suzuki', model: 'WagonR', color: 'Silver', numberPlate: 'CBX-1002', seats: 4, luggageCapacity: 2, fuelType: 'Petrol', transmission: 'Automatic', airConditioned: true, imageUrl: vehicleFallbackImages.Economy, baseFare: 320, pricePerKm: 95, averageRating: null, reviewCount: 0, description: 'Compact, clean, and practical for everyday local travel.', availabilityStatus: 'AVAILABLE' },
  { id: 3, name: 'Toyota Axio', category: { id: 2, name: 'Business' }, brand: 'Toyota', model: 'Axio', color: 'Black', numberPlate: 'CBX-2001', seats: 4, luggageCapacity: 3, fuelType: 'Hybrid', transmission: 'Automatic', airConditioned: true, imageUrl: vehicleFallbackImages.Business, baseFare: 500, pricePerKm: 140, averageRating: null, reviewCount: 0, description: 'Quiet sedan for meetings, hotel transfers, and scheduled rides.', availabilityStatus: 'AVAILABLE' },
  { id: 4, name: 'Mercedes-Benz S-Class', category: { id: 6, name: 'Luxury' }, brand: 'Mercedes-Benz', model: 'S-Class', color: 'Obsidian Black', numberPlate: 'CBX-9001', seats: 4, luggageCapacity: 3, fuelType: 'Petrol', transmission: 'Automatic', airConditioned: true, imageUrl: vehicleFallbackImages.Luxury, baseFare: 1200, pricePerKm: 260, averageRating: null, reviewCount: 0, description: 'Premium executive ride with chauffeur-level comfort.', availabilityStatus: 'AVAILABLE' },
  { id: 5, name: 'Toyota HiAce', category: { id: 5, name: 'Van' }, brand: 'Toyota', model: 'HiAce', color: 'White', numberPlate: 'CBX-5001', seats: 10, luggageCapacity: 8, fuelType: 'Diesel', transmission: 'Manual', airConditioned: true, imageUrl: vehicleFallbackImages.Van, baseFare: 850, pricePerKm: 210, averageRating: null, reviewCount: 0, description: 'Large van for families, teams, and airport luggage.', availabilityStatus: 'AVAILABLE' },
  { id: 6, name: 'Honda Vezel', category: { id: 7, name: 'Premium SUV' }, brand: 'Honda', model: 'Vezel', color: 'Graphite', numberPlate: 'CBX-7001', seats: 4, luggageCapacity: 4, fuelType: 'Hybrid', transmission: 'Automatic', airConditioned: true, imageUrl: vehicleFallbackImages['Premium SUV'], baseFare: 700, pricePerKm: 180, averageRating: null, reviewCount: 0, description: 'Comfort-focused SUV for luggage-heavy and family rides.', availabilityStatus: 'AVAILABLE' },
  { id: 7, name: 'Toyota Vellfire', category: { id: 3, name: 'Family' }, brand: 'Toyota', model: 'Vellfire', color: 'Pearl White', numberPlate: 'CBX-6001', seats: 6, luggageCapacity: 5, fuelType: 'Hybrid', transmission: 'Automatic', airConditioned: true, imageUrl: vehicleFallbackImages.Family, baseFare: 950, pricePerKm: 230, averageRating: null, reviewCount: 0, description: 'Spacious MPV for family airport pickups and comfortable long rides.', availabilityStatus: 'AVAILABLE' },
  { id: 8, name: 'BMW 5 Series', category: { id: 6, name: 'Luxury' }, brand: 'BMW', model: '5 Series', color: 'Carbon Black', numberPlate: 'CBX-9501', seats: 4, luggageCapacity: 3, fuelType: 'Petrol', transmission: 'Automatic', airConditioned: true, imageUrl: vehicleFallbackImages.Luxury, baseFare: 1100, pricePerKm: 245, averageRating: null, reviewCount: 0, description: 'Executive sedan for business travel and premium transfers.', availabilityStatus: 'AVAILABLE' }
];
